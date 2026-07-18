using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CineCrick.Models;

public class Cricketer
{
    [Key]
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public required string PhotoUrl { get; set; }
    public string StatsJson { get; set; } = "{}"; // JSON containing stats like runs, wickets, matches, etc.
    public required string Bio { get; set; }
    public string IplTeam { get; set; } = "";
    
    public ICollection<CricketerMovieLink> CricketerMovieLinks { get; set; } = new List<CricketerMovieLink>();
}

public class Actor
{
    [Key]
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public required string PhotoUrl { get; set; }
    public required string IplTeam { get; set; } // Name of team owned, e.g. "Kolkata Knight Riders"
    public required string Bio { get; set; }
}

public class Movie
{
    [Key]
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Slug { get; set; }
    public required string PosterUrl { get; set; }
    public int ReleaseYear { get; set; }
    public required string Plot { get; set; }
    public string CastJson { get; set; } = "[]"; // JSON list of actors/cast members
    
    public ICollection<CricketerMovieLink> CricketerMovieLinks { get; set; } = new List<CricketerMovieLink>();
}

public class CricketerMovieLink
{
    public int CricketerId { get; set; }
    public Cricketer? Cricketer { get; set; }
    
    public int MovieId { get; set; }
    public Movie? Movie { get; set; }
    
    public required string RoleType { get; set; } // cameo/ad/biopic/etc.
}

public class TriviaCard
{
    [Key]
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Content { get; set; }
    public required string ImageUrl { get; set; }
    public required string Category { get; set; }
}

public class QuizQuestion
{
    [Key]
    public int Id { get; set; }
    public required DateTime Date { get; set; } // Date representing the day of the quiz
    public required string Question { get; set; }
    public required string OptionsJson { get; set; } // JSON array of 4 options
    public int CorrectOption { get; set; } // 0-3 index
    public required string Category { get; set; }
}

public class User
{
    [Key]
    public int Id { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string AuthProvider { get; set; } // "email" or "google"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsAdmin { get; set; } = false;
    public bool IsBanned { get; set; } = false;
    public bool AgeVerified { get; set; } = false;
}

public class UserQuizAttempt
{
    [Key]
    public int Id { get; set; }
    public int UserId { get; set; }
    public int QuestionId { get; set; }
    public bool IsCorrect { get; set; }
    public DateTime AnsweredAt { get; set; }
}

public class Streak
{
    [Key]
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public DateTime? LastPlayedDate { get; set; } // Null if never played
}

public class LeaderboardScore
{
    [Key]
    public int Id { get; set; }
    public int UserId { get; set; }
    public required string PeriodType { get; set; } // "weekly", "monthly", "all-time"
    public int Score { get; set; }
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;
}
