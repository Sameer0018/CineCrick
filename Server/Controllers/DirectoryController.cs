using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CineCrick.Data;
using CineCrick.DTOs;
using System.Text.Json;

namespace CineCrick.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DirectoryController : ControllerBase
{
    private readonly CineCrickContext _context;

    public DirectoryController(CineCrickContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetDirectory([FromQuery] string? search, [FromQuery] string? filter)
    {
        var items = new List<DirectoryItemDto>();
        var searchTerm = search?.Trim().ToLower() ?? "";
        
        // Parse filters
        var filterList = filter?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(f => f.ToLower()).ToList() ?? new List<string> { "cricketer", "actor", "movie" };
            
        if (!filterList.Any())
        {
            filterList = new List<string> { "cricketer", "actor", "movie" };
        }

        // 1. Cricketers
        if (filterList.Contains("cricketer"))
        {
            var query = _context.Cricketers.AsQueryable();
            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(c => c.Name.ToLower().Contains(searchTerm));
            }

            var cricketersList = await query.ToListAsync();
            items.AddRange(cricketersList.Select(c => new DirectoryItemDto(
                Type: "cricketer",
                Name: c.Name,
                Slug: c.Slug,
                PhotoUrl: c.PhotoUrl,
                Subtitle: c.IplTeam == "None" || string.IsNullOrEmpty(c.IplTeam) ? "Indian Cricketer" : $"{c.IplTeam} Player",
                TagColor: "orange"
            )));
        }

        // 2. Actors
        if (filterList.Contains("actor"))
        {
            var query = _context.Actors.AsQueryable();
            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(a => a.Name.ToLower().Contains(searchTerm));
            }

            var actorsList = await query.ToListAsync();
            items.AddRange(actorsList.Select(a => new DirectoryItemDto(
                Type: "actor",
                Name: a.Name,
                Slug: a.Slug,
                PhotoUrl: a.PhotoUrl,
                Subtitle: $"{a.IplTeam} Co-owner",
                TagColor: "blue"
            )));
        }

        // 3. Movies
        if (filterList.Contains("movie"))
        {
            var query = _context.Movies.AsQueryable();
            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(m => m.Title.ToLower().Contains(searchTerm));
            }

            var moviesList = await query.ToListAsync();
            items.AddRange(moviesList.Select(m => new DirectoryItemDto(
                Type: "movie",
                Name: m.Title,
                Slug: m.Slug,
                PhotoUrl: m.PosterUrl,
                Subtitle: $"Cricket Movie ({m.ReleaseYear})",
                TagColor: "purple"
            )));
        }

        return Ok(items);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetPublicStats()
    {
        var cricketersCount = await _context.Cricketers.CountAsync();
        var actorsCount = await _context.Actors.CountAsync();
        var moviesCount = await _context.Movies.CountAsync();
        var connectionsCount = await _context.CricketerMovieLinks.CountAsync();
        
        return Ok(new
        {
            Cricketers = cricketersCount,
            Actors = actorsCount,
            Movies = moviesCount,
            Connections = connectionsCount
        });
    }

    [HttpGet("player/{slug}")]
    public async Task<IActionResult> GetPlayerProfile(string slug)
    {
        var cricketer = await _context.Cricketers
            .Include(c => c.CricketerMovieLinks)
            .ThenInclude(cml => cml.Movie)
            .FirstOrDefaultAsync(c => c.Slug == slug);

        if (cricketer == null)
        {
            return NotFound(new { message = $"Cricketer with slug '{slug}' not found." });
        }

        var stats = new Dictionary<string, string>();
        try
        {
            stats = JsonSerializer.Deserialize<Dictionary<string, string>>(cricketer.StatsJson) ?? new();
        }
        catch {}

        var movies = cricketer.CricketerMovieLinks
            .Where(cml => cml.Movie != null)
            .Select(cml => new LinkedMovieDto(
                Title: cml.Movie!.Title,
                Slug: cml.Movie.Slug,
                PosterUrl: cml.Movie.PosterUrl,
                RoleType: cml.RoleType,
                ReleaseYear: cml.Movie.ReleaseYear
            )).ToList();

        var profile = new CricketerProfileDto(
            Name: cricketer.Name,
            Slug: cricketer.Slug,
            PhotoUrl: cricketer.PhotoUrl,
            Bio: cricketer.Bio,
            IplTeam: cricketer.IplTeam,
            Stats: stats,
            Movies: movies
        );

        return Ok(profile);
    }

    [HttpGet("actor/{slug}")]
    public async Task<IActionResult> GetActorProfile(string slug)
    {
        var actor = await _context.Actors.FirstOrDefaultAsync(a => a.Slug == slug);
        if (actor == null)
        {
            return NotFound(new { message = $"Actor/Owner with slug '{slug}' not found." });
        }

        // Find linked movies by scanning CastJson in movies
        var allMovies = await _context.Movies.ToListAsync();
        var movieAppearances = new List<LinkedMovieDto>();

        foreach (var movie in allMovies)
        {
            try
            {
                var castList = JsonSerializer.Deserialize<List<Dictionary<string, string>>>(movie.CastJson);
                if (castList != null && castList.Any(c => c.TryGetValue("name", out var actorName) && actorName.ToLower() == actor.Name.ToLower()))
                {
                    var role = castList.First(c => c["name"].ToLower() == actor.Name.ToLower()).GetValueOrDefault("character", "Self");
                    movieAppearances.Add(new LinkedMovieDto(
                        Title: movie.Title,
                        Slug: movie.Slug,
                        PosterUrl: movie.PosterUrl,
                        RoleType: role,
                        ReleaseYear: movie.ReleaseYear
                    ));
                }
            }
            catch {}
        }

        var profile = new ActorProfileDto(
            Name: actor.Name,
            Slug: actor.Slug,
            PhotoUrl: actor.PhotoUrl,
            Bio: actor.Bio,
            IplTeam: actor.IplTeam,
            MovieAppearances: movieAppearances
        );

        return Ok(profile);
    }

    [HttpGet("movies")]
    public async Task<IActionResult> GetMovies()
    {
        var movies = await _context.Movies.ToListAsync();
        var items = movies.Select(m => new LinkedMovieDto(
            Title: m.Title,
            Slug: m.Slug,
            PosterUrl: m.PosterUrl,
            RoleType: "Cricket Feature",
            ReleaseYear: m.ReleaseYear
        )).ToList();

        return Ok(items);
    }

    [HttpGet("movies/{slug}")]
    public async Task<IActionResult> GetMovieDetails(string slug)
    {
        var movie = await _context.Movies
            .Include(m => m.CricketerMovieLinks)
            .ThenInclude(cml => cml.Cricketer)
            .FirstOrDefaultAsync(m => m.Slug == slug);

        if (movie == null)
        {
            return NotFound(new { message = $"Movie with slug '{slug}' not found." });
        }

        var cast = new List<CastMemberDto>();
        try
        {
            var rawCast = JsonSerializer.Deserialize<List<Dictionary<string, string>>>(movie.CastJson);
            if (rawCast != null)
            {
                cast = rawCast.Select(c => new CastMemberDto(
                    Name: c.GetValueOrDefault("name", "Unknown"),
                    Character: c.GetValueOrDefault("character", "Unknown")
                )).ToList();
            }
        }
        catch {}

        var relatedCricketers = movie.CricketerMovieLinks
            .Where(cml => cml.Cricketer != null)
            .Select(cml => new LinkedCricketerDto(
                Name: cml.Cricketer!.Name,
                Slug: cml.Cricketer.Slug,
                PhotoUrl: cml.Cricketer.PhotoUrl,
                RoleType: cml.RoleType
            )).ToList();

        var details = new MovieDetailsDto(
            Title: movie.Title,
            Slug: movie.Slug,
            PosterUrl: movie.PosterUrl,
            ReleaseYear: movie.ReleaseYear,
            Plot: movie.Plot,
            Cast: cast,
            RelatedCricketers: relatedCricketers
        );

        return Ok(details);
    }
}
