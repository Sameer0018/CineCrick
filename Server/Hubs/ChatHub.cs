using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using CineCrick.Data;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CineCrick.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly CineCrickContext _context;

    public ChatHub(CineCrickContext context)
    {
        _context = context;
    }

    private int GetCurrentUserId()
    {
        var nameIdentifier = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(nameIdentifier, out var id) ? id : 0;
    }

    public async Task JoinConversation(int conversationId)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return;

        // Verify participant
        var isParticipant = await _context.ConversationParticipants
            .AnyAsync(cp => cp.ConversationId == conversationId && cp.UserId == userId && cp.LeftAt == null);

        if (isParticipant)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
            
            // Broadcast participant joined event (status update)
            await Clients.Group($"conversation_{conversationId}").SendAsync("participant:joined", new { conversationId, userId });
        }
    }

    public async Task LeaveConversation(int conversationId)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return;

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
        await Clients.Group($"conversation_{conversationId}").SendAsync("participant:left", new { conversationId, userId });
    }

    public async Task SendTypingState(int conversationId, bool isTyping)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return;

        var aliasObj = await _context.ConversationParticipants
            .Where(cp => cp.ConversationId == conversationId && cp.UserId == userId)
            .Select(cp => cp.Alias)
            .FirstOrDefaultAsync();

        if (aliasObj != null)
        {
            var eventName = isTyping ? "typing:start" : "typing:stop";
            await Clients.GroupExcept($"conversation_{conversationId}", Context.ConnectionId)
                .SendAsync(eventName, new { conversationId, alias = aliasObj });
        }
    }
}
