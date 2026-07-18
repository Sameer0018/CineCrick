using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CineCrick.Data;
using CineCrick.Models;
using CineCrick.DTOs;
using CineCrick.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using System.Threading.Tasks;
using System;
using System.Linq;
using System.Collections.Generic;

namespace CineCrick.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ConversationsController : ControllerBase
{
    private readonly CineCrickContext _context;
    private readonly IHubContext<ChatHub> _hubContext;

    public ConversationsController(CineCrickContext context, IHubContext<ChatHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    private int GetCurrentUserId()
    {
        var nameIdentifier = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(nameIdentifier, out var id) ? id : 0;
    }

    private bool IsMessageProfane(string body)
    {
        var badWords = new[] { "abuse", "kill", "suicide", "hate", "spam", "scam", "nude", "porn", "die", "harass", "threat", "idiot", "stupid" };
        var cleanBody = body.ToLower();
        return badWords.Any(word => cleanBody.Contains(word));
    }

    [HttpGet]
    public async Task<IActionResult> GetConversations()
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var participations = await _context.ConversationParticipants
            .Include(cp => cp.Conversation)
            .ThenInclude(c => c!.Messages)
            .Where(cp => cp.UserId == userId && cp.LeftAt == null)
            .ToListAsync();

        var dtos = new List<ConversationSummaryDto>();

        foreach (var p in participations)
        {
            var conversation = p.Conversation;
            if (conversation == null) continue;

            // Get partner details
            var partner = await _context.ConversationParticipants
                .Include(cp => cp.User)
                .FirstOrDefaultAsync(cp => cp.ConversationId == conversation.Id && cp.UserId != userId);

            if (partner == null) continue;

            // Check reveal state
            bool isRevealed = p.IdentityRevealed && partner.IdentityRevealed;
            string revealState = "none";
            if (isRevealed) revealState = "revealed";
            else if (p.IdentityRevealed) revealState = "requested_by_me";
            else if (partner.IdentityRevealed) revealState = "requested_by_them";

            // Partner details based on reveal state
            var partnerAlias = partner.Alias;
            string? partnerRealName = isRevealed ? (partner.User?.Email.Split('@')[0] ?? "Partner") : null;
            string? partnerRealAvatar = isRevealed ? $"https://api.dicebear.com/7.x/bottts/svg?seed={partner.User?.Email}" : null;

            // Last message details
            var lastMessage = conversation.Messages
                .Where(m => !m.IsFlagged || m.SenderUserId == userId)
                .OrderByDescending(m => m.SentAt)
                .FirstOrDefault();

            // Unread count
            var unreadCount = conversation.Messages
                .Count(m => m.SentAt > p.LastReadAt && m.SenderUserId != userId && !m.IsFlagged);

            dtos.Add(new ConversationSummaryDto(
                Id: conversation.Id,
                TopicTitle: await _context.Topics.Where(t => t.Id == conversation.TopicId).Select(t => t.Title).FirstOrDefaultAsync() ?? "Anonymous Topic",
                PartnerAlias: partnerAlias,
                PartnerRealName: partnerRealName,
                PartnerRealAvatar: partnerRealAvatar,
                LastMessageBody: lastMessage?.Body,
                LastMessageTime: lastMessage?.SentAt,
                UnreadCount: unreadCount,
                RevealState: revealState
            ));
        }

        return Ok(dtos.OrderByDescending(d => d.LastMessageTime ?? DateTime.MinValue));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetConversationDetails(int id)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var conversation = await _context.Conversations
            .Include(c => c.Messages)
            .Include(c => c.Participants)
            .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (conversation == null) return NotFound();

        var myParticipation = conversation.Participants.FirstOrDefault(p => p.UserId == userId && p.LeftAt == null);
        if (myParticipation == null) return Forbid();

        var partner = conversation.Participants.FirstOrDefault(p => p.UserId != userId);
        if (partner == null) return BadRequest(new { message = "Partner participant not found." });

        // Update last read timestamp
        myParticipation.LastReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Check reveal state
        bool isRevealed = myParticipation.IdentityRevealed && partner.IdentityRevealed;
        string revealState = "none";
        if (isRevealed) revealState = "revealed";
        else if (myParticipation.IdentityRevealed) revealState = "requested_by_me";
        else if (partner.IdentityRevealed) revealState = "requested_by_them";

        var partnerAlias = partner.Alias;
        string? partnerRealName = isRevealed ? (partner.User?.Email.Split('@')[0] ?? "Partner") : null;
        string? partnerRealAvatar = isRevealed ? $"https://api.dicebear.com/7.x/bottts/svg?seed={partner.User?.Email}" : null;

        var messagesDto = conversation.Messages
            .Where(m => !m.IsFlagged || m.SenderUserId == userId)
            .OrderBy(m => m.SentAt)
            .Select(m => {
                var senderAlias = m.SenderUserId == userId ? "Me" : partnerAlias;
                return new MessageResponseDto(
                    Id: m.Id,
                    Body: m.Body,
                    SentAt: m.SentAt,
                    SenderAlias: senderAlias,
                    IsFlagged: m.IsFlagged,
                    SenderUserId: m.SenderUserId
                );
            }).ToList();

        var topic = await _context.Topics.FindAsync(conversation.TopicId);

        var details = new ConversationDetailDto(
            Id: conversation.Id,
            TopicTitle: topic?.Title ?? "Anonymous Chat",
            TopicCategory: topic?.Category ?? "General",
            Status: conversation.Status,
            PartnerAlias: partnerAlias,
            PartnerRealName: partnerRealName,
            PartnerRealAvatar: partnerRealAvatar,
            RevealState: revealState,
            Messages: messagesDto
        );

        return Ok(details);
    }

    [HttpPost("{id}/messages")]
    public async Task<IActionResult> SendMessage(int id, [FromBody] string body)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var conversation = await _context.Conversations
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (conversation == null || conversation.Status != "active")
        {
            return BadRequest(new { message = "Conversation is not active." });
        }

        var senderParticipant = conversation.Participants.FirstOrDefault(p => p.UserId == userId && p.LeftAt == null);
        if (senderParticipant == null) return Forbid();

        var recipient = conversation.Participants.FirstOrDefault(p => p.UserId != userId);
        if (recipient == null) return BadRequest(new { message = "Recipient not found." });

        // Safety block verification
        var hasBlock = await _context.Blocks
            .AnyAsync(b => (b.BlockerUserId == userId && b.BlockedUserId == recipient.UserId) ||
                           (b.BlockerUserId == recipient.UserId && b.BlockedUserId == userId));
        if (hasBlock)
        {
            return BadRequest(new { message = "Messages are blocked between participants." });
        }

        bool isFlagged = IsMessageProfane(body);

        var message = new Message
        {
            ConversationId = conversation.Id,
            SenderUserId = userId,
            Body = body,
            SentAt = DateTime.UtcNow,
            IsFlagged = isFlagged,
            FlagReason = isFlagged ? "Automated moderation flag: contains sensitive/blocked vocabulary." : null
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        // Update sender's LastReadAt so they don't count their own message as unread
        senderParticipant.LastReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var messageDto = new MessageResponseDto(
            Id: message.Id,
            Body: message.Body,
            SentAt: message.SentAt,
            SenderAlias: senderParticipant.Alias,
            IsFlagged: message.IsFlagged,
            SenderUserId: userId
        );

        if (isFlagged)
        {
            // Message under review notification (only to sender)
            await _hubContext.Clients.User(userId.ToString()).SendAsync("message:flagged", new { messageId = message.Id, reason = message.FlagReason });
            return BadRequest(new { message = "Your message was flagged for automated moderation review and was not delivered." });
        }

        // Live WebSocket Broadcast to both in SignalR room
        await _hubContext.Clients.Group($"conversation_{id}").SendAsync("message:new", messageDto);

        // Fetch unread count for recipient
        var partnerParticipation = conversation.Participants.FirstOrDefault(p => p.UserId != userId);
        if (partnerParticipation != null)
        {
            var unreadCount = await _context.Messages
                .CountAsync(m => m.ConversationId == id && m.SentAt > partnerParticipation.LastReadAt && m.SenderUserId != partnerParticipation.UserId && !m.IsFlagged);
            
            // Push unread update live to recipient's navbar/dashboard
            await _hubContext.Clients.User(recipient.UserId.ToString()).SendAsync("unread:update", new { conversationId = id, unreadCount });
        }

        return Ok(messageDto);
    }

    [HttpPost("{id}/leave")]
    public async Task<IActionResult> LeaveConversation(int id)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var conversation = await _context.Conversations
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (conversation == null) return NotFound();

        var myParticipation = conversation.Participants.FirstOrDefault(p => p.UserId == userId && p.LeftAt == null);
        if (myParticipation == null) return BadRequest(new { message = "You are not an active participant in this chat." });

        myParticipation.LeftAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // SignalR left event
        await _hubContext.Clients.Group($"conversation_{id}").SendAsync("participant:left", new { conversationId = id, userId });

        // If everyone has left, set status to ended
        var activeParticipants = conversation.Participants.Count(p => p.LeftAt == null);
        if (activeParticipants == 0)
        {
            conversation.Status = "ended";
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "You left the conversation successfully." });
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetTotalUnreadCount()
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var participations = await _context.ConversationParticipants
            .Include(cp => cp.Conversation)
            .ThenInclude(c => c!.Messages)
            .Where(cp => cp.UserId == userId && cp.LeftAt == null && cp.Conversation != null && cp.Conversation.Status == "active")
            .ToListAsync();

        var total = 0;
        foreach (var p in participations)
        {
            total += p.Conversation!.Messages
                .Count(m => m.SentAt > p.LastReadAt && m.SenderUserId != userId && !m.IsFlagged);
        }

        return Ok(new { count = total });
    }

    [HttpPost("{id}/reveal-request")]
    public async Task<IActionResult> RequestReveal(int id)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var conversation = await _context.Conversations
            .Include(c => c.Participants)
            .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (conversation == null || conversation.Status != "active")
        {
            return BadRequest(new { message = "Active conversation not found." });
        }

        var myParticipation = conversation.Participants.FirstOrDefault(p => p.UserId == userId && p.LeftAt == null);
        if (myParticipation == null) return Forbid();

        var partner = conversation.Participants.FirstOrDefault(p => p.UserId != userId);
        if (partner == null) return BadRequest(new { message = "Partner details not found." });

        myParticipation.IdentityRevealed = true;
        await _context.SaveChangesAsync();

        if (partner.IdentityRevealed)
        {
            // Both accepted! SignalR notify to reload details
            await _hubContext.Clients.Group($"conversation_{id}").SendAsync("reveal:accepted", new {
                conversationId = id,
                users = new[] {
                    new { userId = userId, realName = myParticipation.User?.Email.Split('@')[0], avatar = $"https://api.dicebear.com/7.x/bottts/svg?seed={myParticipation.User?.Email}" },
                    new { userId = partner.UserId, realName = partner.User?.Email.Split('@')[0], avatar = $"https://api.dicebear.com/7.x/bottts/svg?seed={partner.User?.Email}" }
                }
            });
        }
        else
        {
            // Requested by me
            await _hubContext.Clients.Group($"conversation_{id}").SendAsync("reveal:requested", new { conversationId = id, requestedBy = userId });
        }

        return Ok(new { message = "Identity reveal request submitted." });
    }

    [HttpPost("{id}/reveal-respond")]
    public async Task<IActionResult> RespondReveal(int id, [FromBody] bool accept)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var conversation = await _context.Conversations
            .Include(c => c.Participants)
            .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (conversation == null || conversation.Status != "active")
        {
            return BadRequest(new { message = "Active conversation not found." });
        }

        var myParticipation = conversation.Participants.FirstOrDefault(p => p.UserId == userId && p.LeftAt == null);
        if (myParticipation == null) return Forbid();

        var partner = conversation.Participants.FirstOrDefault(p => p.UserId != userId);
        if (partner == null) return BadRequest(new { message = "Partner details not found." });

        if (accept)
        {
            myParticipation.IdentityRevealed = true;
            await _context.SaveChangesAsync();

            if (partner.IdentityRevealed)
            {
                // Trigger mutual reveal SignalR event
                await _hubContext.Clients.Group($"conversation_{id}").SendAsync("reveal:accepted", new {
                    conversationId = id,
                    users = new[] {
                        new { userId = userId, realName = myParticipation.User?.Email.Split('@')[0], avatar = $"https://api.dicebear.com/7.x/bottts/svg?seed={myParticipation.User?.Email}" },
                        new { userId = partner.UserId, realName = partner.User?.Email.Split('@')[0], avatar = $"https://api.dicebear.com/7.x/bottts/svg?seed={partner.User?.Email}" }
                    }
                });
            }
        }
        else
        {
            // Declined reveal, notify group
            myParticipation.IdentityRevealed = false;
            partner.IdentityRevealed = false; // Reset request
            await _context.SaveChangesAsync();

            await _hubContext.Clients.Group($"conversation_{id}").SendAsync("reveal:declined", new { conversationId = id });
        }

        return Ok(new { message = "Identity reveal response processed." });
    }
}
