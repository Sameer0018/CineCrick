namespace CineCrick.DTOs;

public record RegisterRequest(string Email, string Password);
public record LoginRequest(string Email, string Password);
public record GoogleAuthRequest(string Token, string Email, string Name);
public record AuthResponse(string AccessToken, string RefreshToken, string Email, bool IsAdmin);

public record DirectoryItemDto(
    string Type, // "cricketer", "actor", "movie"
    string Name, // or Title for movies
    string Slug,
    string PhotoUrl,
    string Subtitle,
    string TagColor // "orange", "blue", "purple"
);

public record CricketerProfileDto(
    string Name,
    string Slug,
    string PhotoUrl,
    string Bio,
    string IplTeam,
    Dictionary<string, string> Stats,
    List<LinkedMovieDto> Movies
);

public record ActorProfileDto(
    string Name,
    string Slug,
    string PhotoUrl,
    string Bio,
    string IplTeam,
    List<LinkedMovieDto> MovieAppearances // Movies associated with cricketers, or where the actor is listed
);

public record MovieDetailsDto(
    string Title,
    string Slug,
    string PosterUrl,
    int ReleaseYear,
    string Plot,
    List<CastMemberDto> Cast,
    List<LinkedCricketerDto> RelatedCricketers
);

public record LinkedMovieDto(string Title, string Slug, string PosterUrl, string RoleType, int ReleaseYear);
public record LinkedCricketerDto(string Name, string Slug, string PhotoUrl, string RoleType);
public record CastMemberDto(string Name, string Character);

public record TriviaFeedDto(
    int Id,
    string Title,
    string Content,
    string ImageUrl,
    string Category
);

public record QuizQuestionDto(
    int Id,
    string Question,
    List<string> Options,
    string Category
);

public record QuizAnswerRequest(int QuestionId, int SelectedOption);
public record QuizAnswerResponse(
    bool IsCorrect,
    int CorrectOption,
    string FunFact,
    int CurrentStreak,
    int LongestStreak
);

public record DashboardMeResponse(
    int CurrentStreak,
    int LongestStreak,
    int Rank,
    int TotalPoints,
    List<BadgeDto> Badges,
    List<QuizAttemptHistoryDto> QuizHistory
);

public record BadgeDto(string Name, string Description, string Icon, bool Unlocked);
public record QuizAttemptHistoryDto(DateTime Date, string Question, bool IsCorrect);

public record LeaderboardItemDto(
    int Rank,
    string Email,
    int Score,
    int CurrentStreak
);
