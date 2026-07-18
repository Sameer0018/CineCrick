using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CineCrick.Data;
using CineCrick.Models;
using CineCrick.DTOs;
using CineCrick.Services;

namespace CineCrick.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly CineCrickContext _context;
    private readonly TokenService _tokenService;

    public AuthController(CineCrickContext context, TokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required." });
        }

        var existingUser = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (existingUser)
        {
            return BadRequest(new { message = "Email is already registered." });
        }

        var user = new User
        {
            Email = request.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            AuthProvider = "email",
            IsAdmin = false
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Create initial streak
        var streak = new Streak
        {
            UserId = user.Id,
            CurrentStreak = 0,
            LongestStreak = 0,
            LastPlayedDate = null
        };
        _context.Streaks.Add(streak);
        await _context.SaveChangesAsync();

        var token = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        return Ok(new AuthResponse(token, refreshToken, user.Email, user.IsAdmin));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (user == null || user.AuthProvider != "email" || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (user.IsBanned)
        {
            return StatusCode(403, new { message = "Your account has been banned due to safety/policy violations." });
        }

        var token = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        return Ok(new AuthResponse(token, refreshToken, user.Email, user.IsAdmin));
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleAuthRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Google authentication failed: Email is missing." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (user == null)
        {
            // Register Google user automatically
            user = new User
            {
                Email = request.Email.ToLower(),
                PasswordHash = "", // No password for Google OAuth
                AuthProvider = "google",
                IsAdmin = false
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create initial streak
            var streak = new Streak
            {
                UserId = user.Id,
                CurrentStreak = 0,
                LongestStreak = 0,
                LastPlayedDate = null
            };
            _context.Streaks.Add(streak);
            await _context.SaveChangesAsync();
        }

        if (user.IsBanned)
        {
            return StatusCode(403, new { message = "Your account has been banned due to safety/policy violations." });
        }

        var token = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        return Ok(new AuthResponse(token, refreshToken, user.Email, user.IsAdmin));
    }
}
