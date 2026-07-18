using System;
using System.Collections.Generic;

namespace CineCrick.DTOs;

public record CreateTopicRequest(string Title, string Category, List<string> Tags);

public record TopicResponseDto(
    int Id,
    string CreatorAlias,
    string Title,
    string Category,
    List<string> Tags,
    DateTime ExpiresAt,
    DateTime CreatedAt,
    string Status
);

public record JoinTopicResponseDto(int ConversationId, string Alias);

public record MessageResponseDto(
    int Id,
    string Body,
    DateTime SentAt,
    string SenderAlias,
    bool IsFlagged,
    int SenderUserId
);

public record ConversationDetailDto(
    int Id,
    string TopicTitle,
    string TopicCategory,
    string Status,
    string PartnerAlias,
    string? PartnerRealName,
    string? PartnerRealAvatar,
    string RevealState, // "none", "requested_by_me", "requested_by_them", "revealed"
    List<MessageResponseDto> Messages
);

public record ConversationSummaryDto(
    int Id,
    string TopicTitle,
    string PartnerAlias,
    string? PartnerRealName,
    string? PartnerRealAvatar,
    string? LastMessageBody,
    DateTime? LastMessageTime,
    int UnreadCount,
    string RevealState
);

public record ReportRequest(int ConversationId, int ReportedUserId, string Reason);

public record BlockRequest(int BlockedUserId);

public record BlockResponseDto(int BlockedUserId, string Email, DateTime CreatedAt);
