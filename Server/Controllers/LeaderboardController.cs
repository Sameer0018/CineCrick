using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CineCrick.Data;
using CineCrick.DTOs;

namespace CineCrick.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaderboardController : ControllerBase
{
    private readonly CineCrickContext _context;

    public LeaderboardController(CineCrickContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetLeaderboard([FromQuery] string period = "all-time")
    {
        var periodLower = period.ToLower();
        if (periodLower != "weekly" && periodLower != "monthly" && periodLower != "all-time")
        {
            periodLower = "all-time";
        }

        // Perform a database join to fetch the score, user details, and active streak
        var list = await _context.LeaderboardScores
            .Where(s => s.PeriodType == periodLower)
            .Join(_context.Users,
                score => score.UserId,
                user => user.Id,
                (score, user) => new { score, user })
            .Join(_context.Streaks,
                combined => combined.user.Id,
                streak => streak.UserId,
                (combined, streak) => new { combined.score, combined.user, streak })
            .OrderByDescending(x => x.score.Score)
            .ThenByDescending(x => x.streak.CurrentStreak)
            .Take(50)
            .ToListAsync();

        var dtos = list.Select((x, index) => new LeaderboardItemDto(
            Rank: index + 1,
            Email: x.user.Email,
            Score: x.score.Score,
            CurrentStreak: x.streak.CurrentStreak
        )).ToList();

        return Ok(dtos);
    }
}
