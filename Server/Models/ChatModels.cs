using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CineCrick.Models;

public class Topic
{
    [Key]
    public int Id { get; set; }
    
    public int CreatorUserId { get; set; }
    
    [ForeignKey("CreatorUserId")]
    public User? CreatorUser { get; set; }
    
    public required string Title { get; set; }
    public required string Category { get; set; }
    
    public string Status { get; set; } = "open"; // open, matched, closed, expired
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);
    
    public int MaxParticipants { get; set; } = 2;
    
    public ICollection<TopicTag> TopicTags { get; set; } = new List<TopicTag>();
}

public class Conversation
{
    [Key]
    public int Id { get; set; }
    
    public int TopicId { get; set; }
    
    [ForeignKey("TopicId")]
    public Topic? Topic { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "active"; // active, ended
    
    public ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}

public class ConversationParticipant
{
    public int ConversationId { get; set; }
    public Conversation? Conversation { get; set; }
    
    public int UserId { get; set; }
    public User? User { get; set; }
    
    public required string Alias { get; set; }
    public bool IdentityRevealed { get; set; } = false;
    
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastReadAt { get; set; } = DateTime.UtcNow;
    public DateTime? LeftAt { get; set; }
}

public class Message
{
    [Key]
    public int Id { get; set; }
    
    public int ConversationId { get; set; }
    
    [ForeignKey("ConversationId")]
    public Conversation? Conversation { get; set; }
    
    public int SenderUserId { get; set; }
    
    [ForeignKey("SenderUserId")]
    public User? SenderUser { get; set; }
    
    public required string Body { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    
    public bool IsFlagged { get; set; } = false;
    public string? FlagReason { get; set; }
}

public class Report
{
    [Key]
    public int Id { get; set; }
    
    public int ReporterUserId { get; set; }
    
    [ForeignKey("ReporterUserId")]
    public User? ReporterUser { get; set; }
    
    public int ReportedUserId { get; set; }
    
    [ForeignKey("ReportedUserId")]
    public User? ReportedUser { get; set; }
    
    public int ConversationId { get; set; }
    
    [ForeignKey("ConversationId")]
    public Conversation? Conversation { get; set; }
    
    public required string Reason { get; set; }
    public string Status { get; set; } = "pending"; // pending, reviewed, actioned
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Block
{
    public int BlockerUserId { get; set; }
    public User? BlockerUser { get; set; }
    
    public int BlockedUserId { get; set; }
    public User? BlockedUser { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class InterestTag
{
    [Key]
    public int Id { get; set; }
    public required string Name { get; set; }
    
    public ICollection<TopicTag> TopicTags { get; set; } = new List<TopicTag>();
}

public class TopicTag
{
    public int TopicId { get; set; }
    public Topic? Topic { get; set; }
    
    public int TagId { get; set; }
    public InterestTag? Tag { get; set; }
}
