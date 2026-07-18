using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CineCrick.Data;
using CineCrick.DTOs;

namespace CineCrick.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TriviaController : ControllerBase
{
    private readonly CineCrickContext _context;

    public TriviaController(CineCrickContext context)
    {
        _context = context;
    }

    [HttpGet("feed")]
    public async Task<IActionResult> GetTriviaFeed()
    {
        var triviaCards = await _context.TriviaCards.ToListAsync();
        var feed = triviaCards.Select(tc => new TriviaFeedDto(
            Id: tc.Id,
            Title: tc.Title,
            Content: tc.Content,
            ImageUrl: tc.ImageUrl,
            Category: tc.Category
        )).ToList();

        return Ok(feed);
    }
}
