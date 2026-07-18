using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CineCrick.Data;
using CineCrick.Models;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json;

namespace CineCrick.Controllers;

[Authorize(Roles = "admin")]
[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly CineCrickContext _context;

    public AdminController(CineCrickContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetAdminStats()
    {
        var cricketersCount = await _context.Cricketers.CountAsync();
        var actorsCount = await _context.Actors.CountAsync();
        var moviesCount = await _context.Movies.CountAsync();
        var triviaCount = await _context.TriviaCards.CountAsync();
        var quizzesCount = await _context.QuizQuestions.CountAsync();
        var usersCount = await _context.Users.CountAsync();
        var reportsCount = await _context.Reports.CountAsync(r => r.Status == "pending");

        return Ok(new
        {
            Cricketers = cricketersCount,
            Actors = actorsCount,
            Movies = moviesCount,
            Trivia = triviaCount,
            Quizzes = quizzesCount,
            Users = usersCount,
            Reports = reportsCount
        });
    }

    // --- CRICKETERS CRUD ---
    [HttpGet("cricketers")]
    public async Task<IActionResult> GetCricketers() => Ok(await _context.Cricketers.ToListAsync());

    [HttpPost("cricketers")]
    public async Task<IActionResult> CreateCricketer([FromBody] Cricketer cricketer)
    {
        _context.Cricketers.Add(cricketer);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetCricketers), new { id = cricketer.Id }, cricketer);
    }

    [HttpPut("cricketers/{id}")]
    public async Task<IActionResult> UpdateCricketer(int id, [FromBody] Cricketer cricketer)
    {
        if (id != cricketer.Id) return BadRequest();
        _context.Entry(cricketer).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("cricketers/{id}")]
    public async Task<IActionResult> DeleteCricketer(int id)
    {
        var cr = await _context.Cricketers.FindAsync(id);
        if (cr == null) return NotFound();
        _context.Cricketers.Remove(cr);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // --- ACTORS CRUD ---
    [HttpGet("actors")]
    public async Task<IActionResult> GetActors() => Ok(await _context.Actors.ToListAsync());

    [HttpPost("actors")]
    public async Task<IActionResult> CreateActor([FromBody] Actor actor)
    {
        _context.Actors.Add(actor);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetActors), new { id = actor.Id }, actor);
    }

    [HttpPut("actors/{id}")]
    public async Task<IActionResult> UpdateActor(int id, [FromBody] Actor actor)
    {
        if (id != actor.Id) return BadRequest();
        _context.Entry(actor).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("actors/{id}")]
    public async Task<IActionResult> DeleteActor(int id)
    {
        var ac = await _context.Actors.FindAsync(id);
        if (ac == null) return NotFound();
        _context.Actors.Remove(ac);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // --- MOVIES CRUD ---
    [HttpGet("movies")]
    public async Task<IActionResult> GetMovies() => Ok(await _context.Movies.ToListAsync());

    [HttpPost("movies")]
    public async Task<IActionResult> CreateMovie([FromBody] Movie movie)
    {
        _context.Movies.Add(movie);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetMovies), new { id = movie.Id }, movie);
    }

    [HttpPut("movies/{id}")]
    public async Task<IActionResult> UpdateMovie(int id, [FromBody] Movie movie)
    {
        if (id != movie.Id) return BadRequest();
        _context.Entry(movie).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("movies/{id}")]
    public async Task<IActionResult> DeleteMovie(int id)
    {
        var mv = await _context.Movies.FindAsync(id);
        if (mv == null) return NotFound();
        _context.Movies.Remove(mv);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // --- QUIZZES CRUD ---
    [HttpGet("quizzes")]
    public async Task<IActionResult> GetQuizzes() => Ok(await _context.QuizQuestions.ToListAsync());

    [HttpPost("quizzes")]
    public async Task<IActionResult> CreateQuiz([FromBody] QuizQuestion quiz)
    {
        _context.QuizQuestions.Add(quiz);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetQuizzes), new { id = quiz.Id }, quiz);
    }

    [HttpPut("quizzes/{id}")]
    public async Task<IActionResult> UpdateQuiz(int id, [FromBody] QuizQuestion quiz)
    {
        if (id != quiz.Id) return BadRequest();
        _context.Entry(quiz).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("quizzes/{id}")]
    public async Task<IActionResult> DeleteQuiz(int id)
    {
        var qz = await _context.QuizQuestions.FindAsync(id);
        if (qz == null) return NotFound();
        _context.QuizQuestions.Remove(qz);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // --- TRIVIA CRUD ---
    [HttpGet("trivia")]
    public async Task<IActionResult> GetTrivia() => Ok(await _context.TriviaCards.ToListAsync());

    [HttpPost("trivia")]
    public async Task<IActionResult> CreateTrivia([FromBody] TriviaCard trivia)
    {
        _context.TriviaCards.Add(trivia);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTrivia), new { id = trivia.Id }, trivia);
    }

    [HttpPut("trivia/{id}")]
    public async Task<IActionResult> UpdateTrivia(int id, [FromBody] TriviaCard trivia)
    {
        if (id != trivia.Id) return BadRequest();
        _context.Entry(trivia).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("trivia/{id}")]
    public async Task<IActionResult> DeleteTrivia(int id)
    {
        var tr = await _context.TriviaCards.FindAsync(id);
        if (tr == null) return NotFound();
        _context.TriviaCards.Remove(tr);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.AuthProvider,
                u.CreatedAt,
                u.IsAdmin
            })
            .ToListAsync();
        return Ok(users);
    }

    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _context.Users
            .Select(u => new { u.Id, u.Email, u.AuthProvider, u.CreatedAt, u.IsAdmin })
            .FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] User user)
    {
        if (string.IsNullOrWhiteSpace(user.Email)) return BadRequest("Email is required.");
        var existingUser = await _context.Users.AnyAsync(u => u.Email.ToLower() == user.Email.ToLower());
        if (existingUser) return BadRequest("Email is already registered.");

        user.Email = user.Email.ToLower();
        if (!string.IsNullOrEmpty(user.PasswordHash))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
        }
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetUsers), new { id = user.Id }, new { user.Id, user.Email, user.AuthProvider, user.CreatedAt, user.IsAdmin });
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] User user)
    {
        if (id != user.Id) return BadRequest();
        var existing = await _context.Users.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Email = user.Email.ToLower();
        existing.IsAdmin = user.IsAdmin;
        existing.AuthProvider = user.AuthProvider;
        if (!string.IsNullOrEmpty(user.PasswordHash) && !user.PasswordHash.StartsWith("$2a$"))
        {
            existing.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
        }
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // --- CRICKETER MOVIE LINKS CRUD ---
    [HttpGet("connections")]
    public async Task<IActionResult> GetConnections() => Ok(await _context.CricketerMovieLinks.ToListAsync());

    [HttpGet("connections/{cricketerId}/{movieId}")]
    public async Task<IActionResult> GetConnection(int cricketerId, int movieId)
    {
        var link = await _context.CricketerMovieLinks.FindAsync(cricketerId, movieId);
        if (link == null) return NotFound();
        return Ok(link);
    }

    [HttpPost("connections")]
    public async Task<IActionResult> CreateConnection([FromBody] CricketerMovieLink link)
    {
        _context.CricketerMovieLinks.Add(link);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetConnections), new { cricketerId = link.CricketerId, movieId = link.MovieId }, link);
    }

    [HttpPut("connections/{cricketerId}/{movieId}")]
    public async Task<IActionResult> UpdateConnection(int cricketerId, int movieId, [FromBody] CricketerMovieLink link)
    {
        if (cricketerId != link.CricketerId || movieId != link.MovieId) return BadRequest();
        _context.Entry(link).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("connections/{cricketerId}/{movieId}")]
    public async Task<IActionResult> DeleteConnection(int cricketerId, int movieId)
    {
        var link = await _context.CricketerMovieLinks.FindAsync(cricketerId, movieId);
        if (link == null) return NotFound();
        _context.CricketerMovieLinks.Remove(link);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // --- USER QUIZ ATTEMPTS CRUD ---
    [HttpGet("attempts")]
    public async Task<IActionResult> GetAttempts() => Ok(await _context.UserQuizAttempts.ToListAsync());

    [HttpGet("attempts/{id}")]
    public async Task<IActionResult> GetAttempt(int id)
    {
        var attempt = await _context.UserQuizAttempts.FindAsync(id);
        if (attempt == null) return NotFound();
        return Ok(attempt);
    }

    [HttpPost("attempts")]
    public async Task<IActionResult> CreateAttempt([FromBody] UserQuizAttempt attempt)
    {
        _context.UserQuizAttempts.Add(attempt);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAttempts), new { id = attempt.Id }, attempt);
    }

    [HttpPut("attempts/{id}")]
    public async Task<IActionResult> UpdateAttempt(int id, [FromBody] UserQuizAttempt attempt)
    {
        if (id != attempt.Id) return BadRequest();
        _context.Entry(attempt).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("attempts/{id}")]
    public async Task<IActionResult> DeleteAttempt(int id)
    {
        var attempt = await _context.UserQuizAttempts.FindAsync(id);
        if (attempt == null) return NotFound();
        _context.UserQuizAttempts.Remove(attempt);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // --- STREAKS CRUD ---
    [HttpGet("streaks")]
    public async Task<IActionResult> GetStreaks() => Ok(await _context.Streaks.ToListAsync());

    [HttpGet("streaks/{id}")]
    public async Task<IActionResult> GetStreak(int id)
    {
        var streak = await _context.Streaks.FindAsync(id);
        if (streak == null) return NotFound();
        return Ok(streak);
    }

    [HttpPost("streaks")]
    public async Task<IActionResult> CreateStreak([FromBody] Streak streak)
    {
        _context.Streaks.Add(streak);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetStreaks), new { id = streak.Id }, streak);
    }

    [HttpPut("streaks/{id}")]
    public async Task<IActionResult> UpdateStreak(int id, [FromBody] Streak streak)
    {
        if (id != streak.Id) return BadRequest();
        _context.Entry(streak).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("streaks/{id}")]
    public async Task<IActionResult> DeleteStreak(int id)
    {
        var streak = await _context.Streaks.FindAsync(id);
        if (streak == null) return NotFound();
        _context.Streaks.Remove(streak);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // --- LEADERBOARD SCORES CRUD ---
    [HttpGet("scores")]
    public async Task<IActionResult> GetScores() => Ok(await _context.LeaderboardScores.ToListAsync());

    [HttpGet("scores/{id}")]
    public async Task<IActionResult> GetScore(int id)
    {
        var score = await _context.LeaderboardScores.FindAsync(id);
        if (score == null) return NotFound();
        return Ok(score);
    }

    [HttpPost("scores")]
    public async Task<IActionResult> CreateScore([FromBody] LeaderboardScore score)
    {
        _context.LeaderboardScores.Add(score);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetScores), new { id = score.Id }, score);
    }

    [HttpPut("scores/{id}")]
    public async Task<IActionResult> UpdateScore(int id, [FromBody] LeaderboardScore score)
    {
        if (id != score.Id) return BadRequest();
        _context.Entry(score).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("scores/{id}")]
    public async Task<IActionResult> DeleteScore(int id)
    {
        var score = await _context.LeaderboardScores.FindAsync(id);
        if (score == null) return NotFound();
        _context.LeaderboardScores.Remove(score);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // --- MODERATION REPORTS ---
    [HttpGet("reports")]
    public async Task<IActionResult> GetReports([FromQuery] string? status)
    {
        var query = _context.Reports
            .Include(r => r.ReporterUser)
            .Include(r => r.ReportedUser)
            .Include(r => r.Conversation)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status.ToLower() == status.ToLower());
        }

        var reports = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new {
                r.Id,
                r.Reason,
                r.Status,
                r.CreatedAt,
                ReporterEmail = r.ReporterUser != null ? r.ReporterUser.Email : "Anonymous",
                ReportedEmail = r.ReportedUser != null ? r.ReportedUser.Email : "Anonymous",
                ReportedUserId = r.ReportedUserId,
                r.ConversationId
            })
            .ToListAsync();

        return Ok(reports);
    }

    [HttpPost("reports/{id}/action")]
    public async Task<IActionResult> ActionReport(int id, [FromQuery] string actionType)
    {
        var report = await _context.Reports
            .Include(r => r.ReportedUser)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (report == null) return NotFound();

        var typeLower = actionType.ToLower();
        if (typeLower != "ban" && typeLower != "warn" && typeLower != "dismiss")
        {
            return BadRequest("Invalid action type. Choose warn, ban, or dismiss.");
        }

        if (typeLower == "ban" && report.ReportedUser != null)
        {
            report.ReportedUser.IsBanned = true;
            report.Status = "actioned";
        }
        else if (typeLower == "warn")
        {
            report.Status = "actioned";
        }
        else if (typeLower == "dismiss")
        {
            report.Status = "reviewed";
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = $"Report action '{typeLower}' processed successfully." });
    }

    [AllowAnonymous]
    [HttpPost("seed")]
    public IActionResult ForceSeed()
    {
        DbSeeder.Seed(_context);
        return Ok(new { message = "Database re-seeded successfully." });
    }
}

