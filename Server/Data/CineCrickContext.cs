using Microsoft.EntityFrameworkCore;
using CineCrick.Models;

namespace CineCrick.Data;

public class CineCrickContext : DbContext
{
    public CineCrickContext(DbContextOptions<CineCrickContext> options) : base(options)
    {
    }

    public DbSet<Cricketer> Cricketers => Set<Cricketer>();
    public DbSet<Actor> Actors => Set<Actor>();
    public DbSet<Movie> Movies => Set<Movie>();
    public DbSet<CricketerMovieLink> CricketerMovieLinks => Set<CricketerMovieLink>();
    public DbSet<TriviaCard> TriviaCards => Set<TriviaCard>();
    public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserQuizAttempt> UserQuizAttempts => Set<UserQuizAttempt>();
    public DbSet<Streak> Streaks => Set<Streak>();
    public DbSet<LeaderboardScore> LeaderboardScores => Set<LeaderboardScore>();
    
    // Chat System DbSets
    public DbSet<Topic> Topics => Set<Topic>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ConversationParticipant> ConversationParticipants => Set<ConversationParticipant>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<Block> Blocks => Set<Block>();
    public DbSet<InterestTag> InterestTags => Set<InterestTag>();
    public DbSet<TopicTag> TopicTags => Set<TopicTag>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure compound key for CricketerMovieLink
        modelBuilder.Entity<CricketerMovieLink>()
            .HasKey(cml => new { cml.CricketerId, cml.MovieId });

        modelBuilder.Entity<CricketerMovieLink>()
            .HasOne(cml => cml.Cricketer)
            .WithMany(c => c.CricketerMovieLinks)
            .HasForeignKey(cml => cml.CricketerId);

        modelBuilder.Entity<CricketerMovieLink>()
            .HasOne(cml => cml.Movie)
            .WithMany(m => m.CricketerMovieLinks)
            .HasForeignKey(cml => cml.MovieId);

        // Chat System Configurations
        modelBuilder.Entity<ConversationParticipant>()
            .HasKey(cp => new { cp.ConversationId, cp.UserId });

        modelBuilder.Entity<ConversationParticipant>()
            .HasOne(cp => cp.Conversation)
            .WithMany(c => c.Participants)
            .HasForeignKey(cp => cp.ConversationId);

        modelBuilder.Entity<ConversationParticipant>()
            .HasOne(cp => cp.User)
            .WithMany()
            .HasForeignKey(cp => cp.UserId);

        modelBuilder.Entity<Block>()
            .HasKey(b => new { b.BlockerUserId, b.BlockedUserId });

        modelBuilder.Entity<Block>()
            .HasOne(b => b.BlockerUser)
            .WithMany()
            .HasForeignKey(b => b.BlockerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Block>()
            .HasOne(b => b.BlockedUser)
            .WithMany()
            .HasForeignKey(b => b.BlockedUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Report>()
            .HasOne(r => r.ReporterUser)
            .WithMany()
            .HasForeignKey(r => r.ReporterUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Report>()
            .HasOne(r => r.ReportedUser)
            .WithMany()
            .HasForeignKey(r => r.ReportedUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TopicTag>()
            .HasKey(tt => new { tt.TopicId, tt.TagId });

        modelBuilder.Entity<TopicTag>()
            .HasOne(tt => tt.Topic)
            .WithMany(t => t.TopicTags)
            .HasForeignKey(tt => tt.TopicId);

        modelBuilder.Entity<TopicTag>()
            .HasOne(tt => tt.Tag)
            .WithMany(t => t.TopicTags)
            .HasForeignKey(tt => tt.TagId);

        // Unique constraints
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Cricketer>()
            .HasIndex(c => c.Slug)
            .IsUnique();

        modelBuilder.Entity<Actor>()
            .HasIndex(a => a.Slug)
            .IsUnique();

        modelBuilder.Entity<Movie>()
            .HasIndex(m => m.Slug)
            .IsUnique();
    }
}
