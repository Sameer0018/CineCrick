using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CineCrick.Data;
using CineCrick.DTOs;
using CineCrick.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace CineCrick.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly CineCrickContext _context;

    public DashboardController(CineCrickContext context)
    {
        _context = context;
    }

    private int GetCurrentUserId()
    {
        var nameIdentifier = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(nameIdentifier, out var id) ? id : 0;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyDashboard()
    {
        var userId = GetCurrentUserId();

        // 1. Fetch Streak
        var streak = await _context.Streaks.FirstOrDefaultAsync(s => s.UserId == userId);
        var currentStreak = streak?.CurrentStreak ?? 0;
        var longestStreak = streak?.LongestStreak ?? 0;

        // Verify if streak is broken (since last played is older than yesterday)
        if (streak?.LastPlayedDate != null)
        {
            var today = DateTime.UtcNow.Date;
            var daysDiff = (today - streak.LastPlayedDate.Value.Date).TotalDays;
            if (daysDiff > 1)
            {
                // Streak is broken! Update in DB
                streak.CurrentStreak = 0;
                await _context.SaveChangesAsync();
                currentStreak = 0;
            }
        }

        // 2. Fetch Score (All-time)
        var allTimeScoreObj = await _context.LeaderboardScores
            .FirstOrDefaultAsync(s => s.UserId == userId && s.PeriodType == "all-time");
        var totalScore = allTimeScoreObj?.Score ?? 0;

        // 3. Calculate Rank (All-time)
        var rank = 1;
        if (allTimeScoreObj != null)
        {
            rank += await _context.LeaderboardScores
                .CountAsync(s => s.PeriodType == "all-time" && s.Score > totalScore);
        }

        // 4. Fetch Quiz History
        var attempts = await _context.UserQuizAttempts
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.AnsweredAt)
            .Take(10)
            .ToListAsync();

        var historyDtos = new List<QuizAttemptHistoryDto>();
        foreach (var att in attempts)
        {
            var question = await _context.QuizQuestions.FindAsync(att.QuestionId);
            historyDtos.Add(new QuizAttemptHistoryDto(
                Date: att.AnsweredAt,
                Question: question?.Question ?? "Daily Quiz Question",
                IsCorrect: att.IsCorrect
            ));
        }

        // 5. Construct Badges
        var attemptsCount = await _context.UserQuizAttempts.CountAsync(a => a.UserId == userId);
        var correctCount = await _context.UserQuizAttempts.CountAsync(a => a.UserId == userId && a.IsCorrect);

        var badges = new List<BadgeDto>
        {
            new BadgeDto(
                Name: "First Steps",
                Description: "Completed your first daily quiz question.",
                Icon: "🚀",
                Unlocked: attemptsCount >= 1
            ),
            new BadgeDto(
                Name: "Triple Threat",
                Description: "Maintained a 3-day quiz participation streak.",
                Icon: "🔥",
                Unlocked: longestStreak >= 3
            ),
            new BadgeDto(
                Name: "Silver Score",
                Description: "Accumulated over 100 total quiz points.",
                Icon: "🥈",
                Unlocked: totalScore >= 100
            ),
            new BadgeDto(
                Name: "Clean Sheet",
                Description: "Answered at least 5 questions correctly.",
                Icon: "🎯",
                Unlocked: correctCount >= 5
            )
        };

        var response = new DashboardMeResponse(
            CurrentStreak: currentStreak,
            LongestStreak: longestStreak,
            Rank: rank,
            TotalPoints: totalScore,
            Badges: badges,
            QuizHistory: historyDtos
        );

        return Ok(response);
    }
}
