using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CineCrick.Data;
using CineCrick.Models;
using CineCrick.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Threading.Tasks;
using System;
using System.Linq;
using System.Collections.Generic;

namespace CineCrick.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TopicsController : ControllerBase
{
    private readonly CineCrickContext _context;

    public TopicsController(CineCrickContext context)
    {
        _context = context;
    }

    private int GetCurrentUserId()
    {
        var nameIdentifier = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(nameIdentifier, out var id) ? id : 0;
    }

    [HttpPost]
    public async Task<IActionResult> CreateTopic([FromBody] CreateTopicRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Category))
        {
            return BadRequest(new { message = "Title and Category are required." });
        }

        // Rate Limit Check: max 5 topics per hour
        var oneHourAgo = DateTime.UtcNow.AddHours(-1);
        var recentCount = await _context.Topics
            .CountAsync(t => t.CreatorUserId == userId && t.CreatedAt >= oneHourAgo);

        if (recentCount >= 5)
        {
            return StatusCode(429, new { message = "Rate limit exceeded. You can create at most 5 topics per hour." });
        }

        var topic = new Topic
        {
            CreatorUserId = userId,
            Title = request.Title,
            Category = request.Category,
            Status = "open",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };

        _context.Topics.Add(topic);
        await _context.SaveChangesAsync();

        // Process interest tags
        if (request.Tags != null && request.Tags.Any())
        {
            foreach (var tagName in request.Tags)
            {
                var cleanName = tagName.Trim().ToLower();
                if (string.IsNullOrEmpty(cleanName)) continue;

                var tag = await _context.InterestTags.FirstOrDefaultAsync(t => t.Name == cleanName);
                if (tag == null)
                {
                    tag = new InterestTag { Name = cleanName };
                    _context.InterestTags.Add(tag);
                    await _context.SaveChangesAsync();
                }

                _context.TopicTags.Add(new TopicTag
                {
                    TopicId = topic.Id,
                    TagId = tag.Id
                });
            }
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Topic created successfully.", topicId = topic.Id });
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetOpenTopics([FromQuery] string? tag, [FromQuery] string? category)
    {
        var userId = GetCurrentUserId();

        // Fetch blocked users list to exclude their topics (if logged in)
        var blockedUserIds = new List<int>();
        if (userId > 0)
        {
            blockedUserIds = await _context.Blocks
                .Where(b => b.BlockerUserId == userId || b.BlockedUserId == userId)
                .Select(b => b.BlockerUserId == userId ? b.BlockedUserId : b.BlockerUserId)
                .ToListAsync();
        }

        var query = _context.Topics
            .Include(t => t.TopicTags)
            .ThenInclude(tt => tt.Tag)
            .Where(t => t.Status == "open" && t.ExpiresAt > DateTime.UtcNow && t.CreatorUserId != userId && !blockedUserIds.Contains(t.CreatorUserId));

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(t => t.Category.ToLower() == category.ToLower());
        }

        if (!string.IsNullOrEmpty(tag))
        {
            var cleanTag = tag.Trim().ToLower();
            query = query.Where(t => t.TopicTags.Any(tt => tt.Tag != null && tt.Tag.Name == cleanTag));
        }

        var topicsList = await query
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var dtos = topicsList.Select(t => new TopicResponseDto(
            Id: t.Id,
            CreatorAlias: "Anonymous Creator",
            Title: t.Title,
            Category: t.Category,
            Tags: t.TopicTags.Where(tt => tt.Tag != null).Select(tt => tt.Tag!.Name).ToList(),
            ExpiresAt: t.ExpiresAt,
            CreatedAt: t.CreatedAt,
            Status: t.Status
        )).ToList();

        return Ok(dtos);
    }

    [HttpPost("{id}/join")]
    public async Task<IActionResult> JoinTopic(int id)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var topic = await _context.Topics.FindAsync(id);
        if (topic == null || topic.Status != "open" || topic.ExpiresAt <= DateTime.UtcNow)
        {
            return BadRequest(new { message = "This topic is no longer active or open for matching." });
        }

        if (topic.CreatorUserId == userId)
        {
            return BadRequest(new { message = "You cannot join your own topic." });
        }

        // Check if user is blocked by creator, or blocks the creator
        var hasBlock = await _context.Blocks
            .AnyAsync(b => (b.BlockerUserId == userId && b.BlockedUserId == topic.CreatorUserId) ||
                           (b.BlockerUserId == topic.CreatorUserId && b.BlockedUserId == userId));
        if (hasBlock)
        {
            return BadRequest(new { message = "Connection not allowed due to user block constraints." });
        }

        // Check active conversations rate limit
        var activeConversationsCount = await _context.ConversationParticipants
            .CountAsync(cp => cp.UserId == userId && cp.LeftAt == null && cp.Conversation != null && cp.Conversation.Status == "active");
        if (activeConversationsCount >= 10)
        {
            return BadRequest(new { message = "You have reached the maximum number of 10 active chats. Leave an active chat to join another." });
        }

        // Close topic
        topic.Status = "matched";

        // Create new Conversation
        var conversation = new Conversation
        {
            TopicId = topic.Id,
            CreatedAt = DateTime.UtcNow,
            Status = "active"
        };
        _context.Conversations.Add(conversation);
        await _context.SaveChangesAsync();

        // Generate aliases
        var rand = new Random();
        var creatorAlias = $"Guest{rand.Next(1000, 9999)}";
        var joinerAlias = $"Guest{rand.Next(1000, 9999)}";
        while (creatorAlias == joinerAlias)
        {
            joinerAlias = $"Guest{rand.Next(1000, 9999)}";
        }

        // Add Participants
        var pCreator = new ConversationParticipant
        {
            ConversationId = conversation.Id,
            UserId = topic.CreatorUserId,
            Alias = creatorAlias,
            JoinedAt = DateTime.UtcNow
        };
        
        var pJoiner = new ConversationParticipant
        {
            ConversationId = conversation.Id,
            UserId = userId,
            Alias = joinerAlias,
            JoinedAt = DateTime.UtcNow
        };

        _context.ConversationParticipants.AddRange(pCreator, pJoiner);
        await _context.SaveChangesAsync();

        return Ok(new JoinTopicResponseDto(conversation.Id, joinerAlias));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> CloseTopic(int id)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var topic = await _context.Topics.FindAsync(id);
        if (topic == null) return NotFound();

        if (topic.CreatorUserId != userId)
        {
            return Forbid();
        }

        topic.Status = "closed";
        await _context.SaveChangesAsync();

        return Ok(new { message = "Topic closed early by creator." });
    }
}
