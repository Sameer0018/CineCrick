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
public class SafetyController : ControllerBase
{
    private readonly CineCrickContext _context;

    public SafetyController(CineCrickContext context)
    {
        _context = context;
    }

    private int GetCurrentUserId()
    {
        var nameIdentifier = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(nameIdentifier, out var id) ? id : 0;
    }

    [HttpPost("report")]
    public async Task<IActionResult> ReportUser([FromBody] ReportRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var conversation = await _context.Conversations.FindAsync(request.ConversationId);
        if (conversation == null)
        {
            return BadRequest(new { message = "Conversation not found." });
        }

        var report = new Report
        {
            ReporterUserId = userId,
            ReportedUserId = request.ReportedUserId,
            ConversationId = request.ConversationId,
            Reason = request.Reason,
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.Reports.Add(report);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Report submitted successfully. Administrators will review the conversation." });
    }

    [HttpPost("block")]
    public async Task<IActionResult> BlockUser([FromBody] BlockRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        if (userId == request.BlockedUserId)
        {
            return BadRequest(new { message = "You cannot block yourself." });
        }

        var alreadyBlocked = await _context.Blocks
            .AnyAsync(b => b.BlockerUserId == userId && b.BlockedUserId == request.BlockedUserId);

        if (alreadyBlocked)
        {
            return BadRequest(new { message = "User is already blocked." });
        }

        var block = new Block
        {
            BlockerUserId = userId,
            BlockedUserId = request.BlockedUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Blocks.Add(block);

        // Terminate any active chats between blocker and blocked user
        var activeConversations = await _context.Conversations
            .Include(c => c.Participants)
            .Where(c => c.Status == "active" && 
                       c.Participants.Any(p => p.UserId == userId && p.LeftAt == null) && 
                       c.Participants.Any(p => p.UserId == request.BlockedUserId && p.LeftAt == null))
            .ToListAsync();

        foreach (var conv in activeConversations)
        {
            conv.Status = "ended";
            foreach (var part in conv.Participants)
            {
                if (part.LeftAt == null)
                {
                    part.LeftAt = DateTime.UtcNow;
                }
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "User blocked successfully. Active chats with this user have been terminated." });
    }

    [HttpDelete("block/{blockedUserId}")]
    public async Task<IActionResult> UnblockUser(int blockedUserId)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var block = await _context.Blocks
            .FirstOrDefaultAsync(b => b.BlockerUserId == userId && b.BlockedUserId == blockedUserId);

        if (block == null)
        {
            return NotFound(new { message = "Block relationship not found." });
        }

        _context.Blocks.Remove(block);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User unblocked successfully." });
    }

    [HttpGet("blocks")]
    public async Task<IActionResult> GetMyBlocks()
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized();

        var blocksList = await _context.Blocks
            .Include(b => b.BlockedUser)
            .Where(b => b.BlockerUserId == userId)
            .ToListAsync();

        var dtos = blocksList.Select(b => new BlockResponseDto(
            BlockedUserId: b.BlockedUserId,
            Email: b.BlockedUser?.Email ?? "Anonymous User",
            CreatedAt: b.CreatedAt
        )).ToList();

        return Ok(dtos);
    }
}
