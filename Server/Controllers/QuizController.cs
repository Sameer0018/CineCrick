using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CineCrick.Data;
using CineCrick.Models;
using CineCrick.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text.Json;

namespace CineCrick.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class QuizController : ControllerBase
{
    private readonly CineCrickContext _context;

    public QuizController(CineCrickContext context)
    {
        _context = context;
    }

    private int GetCurrentUserId()
    {
        var nameIdentifier = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(nameIdentifier, out var id) ? id : 0;
    }

    [HttpGet("today")]
    public async Task<IActionResult> GetTodayQuiz()
    {
        var userId = GetCurrentUserId();
        var today = DateTime.UtcNow.Date;

        // Check if user already answered today
        var alreadyAnswered = await _context.UserQuizAttempts
            .AnyAsync(a => a.UserId == userId && a.AnsweredAt.Date == today);

        if (alreadyAnswered)
        {
            // Fetch correct details so frontend can show completed state nicely
            var attempt = await _context.UserQuizAttempts
                .FirstOrDefaultAsync(a => a.UserId == userId && a.AnsweredAt.Date == today);
            
            var questionRef = await _context.QuizQuestions.FindAsync(attempt?.QuestionId);

            return Ok(new { 
                alreadyAnswered = true, 
                wasCorrect = attempt?.IsCorrect ?? false,
                correctOption = questionRef?.CorrectOption ?? 0
            });
        }

        // Get question for today
        var question = await _context.QuizQuestions.FirstOrDefaultAsync(q => q.Date.Date == today);
        
        // If not found, use a fallback question using DayOfYear % TotalQuestions
        if (question == null)
        {
            var count = await _context.QuizQuestions.CountAsync();
            if (count == 0)
            {
                return NotFound(new { message = "No quiz questions available." });
            }

            var dayOfYear = DateTime.UtcNow.DayOfYear;
            var index = dayOfYear % count;
            var allQuestions = await _context.QuizQuestions.OrderBy(q => q.Id).ToListAsync();
            question = allQuestions[index];
        }

        List<string> options = new();
        try
        {
            options = JsonSerializer.Deserialize<List<string>>(question.OptionsJson) ?? new();
        }
        catch {}

        var dto = new QuizQuestionDto(
            Id: question.Id,
            Question: question.Question,
            Options: options,
            Category: question.Category
        );

        return Ok(dto);
    }

    [HttpPost("answer")]
    public async Task<IActionResult> SubmitAnswer([FromBody] QuizAnswerRequest request)
    {
        var userId = GetCurrentUserId();
        var today = DateTime.UtcNow.Date;

        // 1. Check if user already answered today
        var alreadyAnswered = await _context.UserQuizAttempts
            .AnyAsync(a => a.UserId == userId && a.AnsweredAt.Date == today);

        if (alreadyAnswered)
        {
            return BadRequest(new { message = "You have already answered today's quiz!" });
        }

        // 2. Fetch the question
        var question = await _context.QuizQuestions.FindAsync(request.QuestionId);
        if (question == null)
        {
            return NotFound(new { message = "Question not found." });
        }

        bool isCorrect = (request.SelectedOption == question.CorrectOption);

        // 3. Log attempt
        var attempt = new UserQuizAttempt
        {
            UserId = userId,
            QuestionId = question.Id,
            IsCorrect = isCorrect,
            AnsweredAt = DateTime.UtcNow
        };
        _context.UserQuizAttempts.Add(attempt);

        // 4. Update Streak
        var streak = await _context.Streaks.FirstOrDefaultAsync(s => s.UserId == userId);
        if (streak == null)
        {
            streak = new Streak { UserId = userId, CurrentStreak = 0, LongestStreak = 0 };
            _context.Streaks.Add(streak);
        }

        // Evaluate streak rules:
        // participation counts, regardless of correctness
        if (streak.LastPlayedDate == null)
        {
            streak.CurrentStreak = 1;
        }
        else
        {
            var daysDiff = (today - streak.LastPlayedDate.Value.Date).TotalDays;
            if (daysDiff <= 1)
            {
                // Played today or yesterday, extend streak
                if (daysDiff == 1)
                {
                    streak.CurrentStreak += 1;
                }
            }
            else
            {
                // Missed a day, reset streak to 1 (since they are playing today)
                streak.CurrentStreak = 1;
            }
        }

        streak.LastPlayedDate = today;
        if (streak.CurrentStreak > streak.LongestStreak)
        {
            streak.LongestStreak = streak.CurrentStreak;
        }

        // 5. Update Leaderboard score
        // We award 10 points for participation and an extra 20 points if correct
        int pointsAwarded = 10 + (isCorrect ? 20 : 0);

        var leaderboardPeriods = new[] { "weekly", "monthly", "all-time" };
        foreach (var period in leaderboardPeriods)
        {
            var lbScore = await _context.LeaderboardScores
                .FirstOrDefaultAsync(l => l.UserId == userId && l.PeriodType == period);

            if (lbScore == null)
            {
                lbScore = new LeaderboardScore
                {
                    UserId = userId,
                    PeriodType = period,
                    Score = pointsAwarded,
                    LastUpdatedAt = DateTime.UtcNow
                };
                _context.LeaderboardScores.Add(lbScore);
            }
            else
            {
                lbScore.Score += pointsAwarded;
                lbScore.LastUpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();

        // Get a fun fact based on the question
        var funFact = "Did you know? MS Dhoni was once a railway ticket collector at Kharagpur railway station before hitting it big in national cricket.";
        if (question.Category == "IPL Ownership" || question.Question.Contains("Kolkata"))
        {
            funFact = "Did you know? Shah Rukh Khan bought Kolkata Knight Riders in 2008 for about $75.09 million and it is now valued at over $1.1 billion!";
        }
        else if (question.Category == "Cameos" || question.Question.Contains("Patiala"))
        {
            funFact = "Did you know? Harbhajan Singh is not the only player in Patiala House—it also featured cameos from Shaun Tait, Herschelle Gibbs, and Nasser Hussain!";
        }
        else if (question.Category == "Movies" || question.Question.Contains("83"))
        {
            funFact = "Did you know? Ranveer Singh literally lived with Kapil Dev for 10 days at his home in Delhi to capture his mannerisms, accent, and unique walking style!";
        }

        var response = new QuizAnswerResponse(
            IsCorrect: isCorrect,
            CorrectOption: question.CorrectOption,
            FunFact: funFact,
            CurrentStreak: streak.CurrentStreak,
            LongestStreak: streak.LongestStreak
        );

        return Ok(response);
    }
}
