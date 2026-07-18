'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../../../context/ChatContext';
import { apiRequest } from '../../../lib/api';
import { 
  ArrowLeft, Send, ShieldAlert, Ban, LogOut, Eye, EyeOff, User, Sparkles, X, AlertCircle
} from 'lucide-react';

interface Message {
  id: number;
  body: string;
  sentAt: string;
  senderAlias: string;
  isFlagged: boolean;
  senderUserId: number;
}

interface ConversationDetail {
  id: number;
  topicTitle: string;
  topicCategory: string;
  status: string;
  partnerAlias: string;
  partnerRealName: string | null;
  partnerRealAvatar: string | null;
  revealState: string;
  messages: Message[];
}

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { connection } = useChat();

  const conversationIdStr = params?.conversationId;
  const conversationId = parseInt(Array.isArray(conversationIdStr) ? conversationIdStr[0] : conversationIdStr || '0', 10);

  const [chatDetails, setChatDetails] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);

  // Modal States
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('harassment');
  const [reportText, setReportText] = useState('');
  const [reporting, setReporting] = useState(false);

  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, authLoading, router]);

  const fetchChatDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest(`/api/conversations/${conversationId}`);
      setChatDetails(data);
      setMessages(data.messages || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load conversation detail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && conversationId > 0) {
      fetchChatDetails();
    }
  }, [isLoggedIn, conversationId]);

  // Join SignalR Hub Group & Bind Listeners
  useEffect(() => {
    if (!connection || conversationId <= 0) return;

    // Join room group
    connection.invoke('JoinConversation', conversationId)
      .catch(err => console.error('JoinConversation invocation error: ', err));

    // Handle new message
    const handleNewMessage = (msg: Message) => {
      setMessages(prev => {
        // Prevent duplicate appending
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Clear partner typing state
      setPartnerTyping(false);
    };

    // Handle message moderation flags
    const handleMessageFlagged = (data: { messageId: number; reason: string }) => {
      setError(`Your last message was flagged: ${data.reason}`);
      setTimeout(() => setError(null), 5000);
    };

    // Handle partner typing state
    const handleTypingStart = (data: { conversationId: number; alias: string }) => {
      if (data.conversationId === conversationId) {
        setPartnerTyping(true);
      }
    };

    const handleTypingStop = (data: { conversationId: number; alias: string }) => {
      if (data.conversationId === conversationId) {
        setPartnerTyping(false);
      }
    };

    // Handle reveal flow updates
    const handleRevealRequested = (data: { conversationId: number; requestedBy: number }) => {
      if (data.conversationId === conversationId) {
        setChatDetails(prev => {
          if (!prev) return null;
          return {
            ...prev,
            revealState: 'requested_by_them'
          };
        });
      }
    };

    const handleRevealAccepted = (data: { conversationId: number; users: any[] }) => {
      if (data.conversationId === conversationId) {
        // Find partner's updated real info
        const partnerInfo = data.users.find(u => u.realName && u.realName !== chatDetails?.partnerRealName);
        setChatDetails(prev => {
          if (!prev) return null;
          return {
            ...prev,
            revealState: 'revealed',
            partnerRealName: partnerInfo?.realName || prev.partnerRealName,
            partnerRealAvatar: partnerInfo?.avatar || prev.partnerRealAvatar
          };
        });
      }
    };

    const handleRevealDeclined = (data: { conversationId: number }) => {
      if (data.conversationId === conversationId) {
        setChatDetails(prev => {
          if (!prev) return null;
          return {
            ...prev,
            revealState: 'none'
          };
        });
        setError('Identity reveal request declined by partner.');
        setTimeout(() => setError(null), 4000);
      }
    };

    const handleParticipantLeft = (data: { conversationId: number; userId: number }) => {
      if (data.conversationId === conversationId) {
        setChatDetails(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'ended'
          };
        });
        setError('The other participant left the conversation.');
      }
    };

    connection.on('message:new', handleNewMessage);
    connection.on('message:flagged', handleMessageFlagged);
    connection.on('typing:start', handleTypingStart);
    connection.on('typing:stop', handleTypingStop);
    connection.on('reveal:requested', handleRevealRequested);
    connection.on('reveal:accepted', handleRevealAccepted);
    connection.on('reveal:declined', handleRevealDeclined);
    connection.on('participant:left', handleParticipantLeft);

    return () => {
      connection.invoke('LeaveConversation', conversationId).catch(() => {});
      connection.off('message:new', handleNewMessage);
      connection.off('message:flagged', handleMessageFlagged);
      connection.off('typing:start', handleTypingStart);
      connection.off('typing:stop', handleTypingStop);
      connection.off('reveal:requested', handleRevealRequested);
      connection.off('reveal:accepted', handleRevealAccepted);
      connection.off('reveal:declined', handleRevealDeclined);
      connection.off('participant:left', handleParticipantLeft);
    };
  }, [connection, conversationId, chatDetails]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  // Handle typing state broadcast
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!connection || conversationId <= 0) return;

    // Send typing:start
    connection.invoke('SendTypingState', conversationId, true).catch(() => {});

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Set timeout to send typing:stop after 1.5 seconds of silence
    typingTimeoutRef.current = setTimeout(() => {
      connection.invoke('SendTypingState', conversationId, false).catch(() => {});
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      const text = inputText.trim();
      setInputText('');

      // Send typing:stop immediately
      if (connection) {
        connection.invoke('SendTypingState', conversationId, false).catch(() => {});
      }

      await apiRequest(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(text)
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send message.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleLeaveChat = async () => {
    if (!window.confirm('Are you sure you want to leave this chat? You will lose access to the conversation.')) return;
    try {
      await apiRequest(`/api/conversations/${conversationId}/leave`, {
        method: 'POST'
      });
      router.push('/chat/mine');
    } catch (err: any) {
      setError(err.message || 'Failed to leave conversation.');
    }
  };

  const handleBlockUser = async () => {
    if (!chatDetails) return;
    if (!window.confirm(`Are you sure you want to block this user? This will instantly terminate your chat and prevent any future matches with them.`)) return;
    try {
      // Find partner ID in database
      const data = await apiRequest(`/api/conversations/${conversationId}`);
      const partner = data.revealState !== 'none' || true; // Server handles parsing partner participant ID internally in Block safety
      // Since safety needs partner ID, let's call GET /api/conversations/:id which reveals details, or server blocks based on details
      // Wait, safety/block endpoint takes { BlockedUserId }
      // To get the partner's UserId, let's look at messages or detail responses
      const partnerUserId = messages.find(m => m.senderAlias !== 'Me')?.senderUserId;
      if (!partnerUserId) {
        setError('Could not identify participant to block.');
        return;
      }

      await apiRequest('/api/safety/block', {
        method: 'POST',
        body: JSON.stringify({ BlockedUserId: partnerUserId })
      });

      router.push('/chat/mine');
    } catch (err: any) {
      setError(err.message || 'Failed to block user.');
    }
  };

  const handleRevealSubmit = async (accept: boolean = true) => {
    try {
      setRevealing(true);
      if (chatDetails?.revealState === 'requested_by_them') {
        // Accept or decline
        await apiRequest(`/api/conversations/${conversationId}/reveal-respond`, {
          method: 'POST',
          body: JSON.stringify(accept)
        });
      } else {
        // Propose reveal
        await apiRequest(`/api/conversations/${conversationId}/reveal-request`, {
          method: 'POST'
        });
      }
      setShowRevealModal(false);
      fetchChatDetails();
    } catch (err: any) {
      setError(err.message || 'Identity reveal request failed.');
    } finally {
      setRevealing(false);
    }
  };

  const handleReportUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const partnerUserId = messages.find(m => m.senderAlias !== 'Me')?.senderUserId;
    if (!partnerUserId) {
      setError('Could not identify participant to report.');
      return;
    }

    try {
      setReporting(true);
      await apiRequest('/api/safety/report', {
        method: 'POST',
        body: JSON.stringify({
          ConversationId: conversationId,
          ReportedUserId: partnerUserId,
          Reason: `${reportReason}: ${reportText}`
        })
      });

      setShowReportModal(false);
      setReportText('');
      setError('Report filed successfully. Thank you for keeping CineCrick safe.');
      setTimeout(() => setError(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to file report.');
    } finally {
      setReporting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (error && !chatDetails) {
    return (
      <div className="max-w-md mx-auto text-center mt-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Oops! Connection Lost</h2>
        <p className="text-sm text-gray-400">{error}</p>
        <button 
          onClick={() => router.push('/chat/mine')}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
        >
          Back to Chats
        </button>
      </div>
    );
  }

  if (!chatDetails) return null;

  const isChatEnded = chatDetails.status !== 'active';
  const partnerName = chatDetails.partnerRealName || chatDetails.partnerAlias;

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-12rem)] border border-card-border bg-[#121A2E]/30 rounded-2xl overflow-hidden backdrop-blur-md">
      {/* 1. Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-card-border bg-[#121A2E]/70 flex-shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <button 
            onClick={() => router.push('/chat/mine')}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-card-bg transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          {chatDetails.partnerRealAvatar ? (
            <img 
              src={chatDetails.partnerRealAvatar} 
              alt={partnerName} 
              className="h-10 w-10 rounded-full border border-green-500 bg-[#0B0F19]" 
            />
          ) : (
            <div className="h-10 w-10 rounded-full border border-card-border bg-[#0B0F19] flex items-center justify-center text-gray-400">
              <User className="h-5.5 w-5.5" />
            </div>
          )}

          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-white truncate flex items-center gap-1.5">
              {partnerName}
              {chatDetails.revealState === 'revealed' && <Eye className="h-3.5 w-3.5 text-green-400" />}
            </h2>
            <p className="text-[10px] text-gray-400 truncate max-w-[200px]">Re: {chatDetails.topicTitle}</p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Identity Reveal Control */}
          {!isChatEnded && (
            <button
              onClick={() => setShowRevealModal(true)}
              className={`p-2 rounded-full transition-all ${
                chatDetails.revealState === 'revealed'
                  ? 'text-green-400 bg-green-950/20'
                  : chatDetails.revealState === 'requested_by_them'
                  ? 'text-amber-400 bg-amber-950/40 border border-amber-500/20 animate-pulse'
                  : 'text-gray-400 hover:text-white hover:bg-card-bg'
              }`}
              title="Reveal Identity"
            >
              {chatDetails.revealState === 'revealed' ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          )}

          {/* Report Icon */}
          <button 
            onClick={() => setShowReportModal(true)}
            className="p-2 rounded-full text-gray-400 hover:text-amber-400 hover:bg-card-bg transition-all"
            title="Report User"
          >
            <ShieldAlert className="h-5 w-5" />
          </button>

          {/* Block Icon */}
          <button 
            onClick={handleBlockUser}
            className="p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-card-bg transition-all"
            title="Block User"
          >
            <Ban className="h-5 w-5" />
          </button>

          {/* Leave/End Chat */}
          <button 
            onClick={handleLeaveChat}
            className="p-2 rounded-full text-red-500 hover:text-red-400 hover:bg-card-bg transition-all"
            title="Leave Conversation"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 2. Message area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#0B0F19]/40">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="text-center my-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-950/30 border border-blue-500/10 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            Match created • Category: {chatDetails.topicCategory}
          </span>
          <p className="text-xs text-gray-500 italic mt-2">"{chatDetails.topicTitle}"</p>
        </div>

        {messages.map((msg) => {
          const isMe = msg.senderAlias === 'Me';
          return (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              <div 
                className={`p-3 rounded-2xl text-sm ${
                  isMe 
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-none' 
                    : 'bg-[#16223E] text-gray-100 rounded-bl-none border border-card-border'
                } ${msg.isFlagged ? 'border-dashed border-red-500 bg-red-950/20 text-red-400' : ''}`}
              >
                {msg.isFlagged ? (
                  <span className="italic flex items-center gap-1.5 text-xs text-red-400 font-medium">
                    <AlertCircle className="h-4 w-4" /> Message held for moderation review
                  </span>
                ) : (
                  msg.body
                )}
              </div>
              <div className="flex items-center gap-1 text-[9px] text-gray-500 mt-1 font-medium px-1">
                <span>{isMe ? 'Me' : chatDetails.partnerAlias}</span>
                <span>•</span>
                <span>{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          );
        })}

        {/* Partner Typing Indicator */}
        {partnerTyping && (
          <div className="flex items-center space-x-2 mr-auto bg-[#16223E]/50 border border-card-border/50 px-3 py-2.5 rounded-full rounded-bl-none text-xs text-gray-400 animate-pulse">
            <span className="font-bold">{chatDetails.partnerAlias} is typing</span>
            <div className="flex space-x-1">
              <span className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Bar */}
      <div className="p-4 border-t border-card-border bg-[#121A2E]/70 flex-shrink-0">
        {isChatEnded ? (
          <div className="text-center text-xs text-gray-500 py-2 bg-[#0B0F19]/50 rounded-lg border border-card-border italic">
            This chat has ended because a participant left.
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Send message to ${partnerName}...`}
              className="flex-grow rounded-lg border border-card-border bg-[#0B0F19] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>

      {/* 4. Modals */}
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-card-border bg-[#121A2E] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-card-border pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                <ShieldAlert className="h-5 w-5 text-amber-500" /> Report Anonymously
              </h3>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReportUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-lg border border-card-border bg-[#0B0F19] p-2.5 text-sm text-white focus:outline-none"
                >
                  <option value="harassment">Harassment / Abusive Language</option>
                  <option value="spam">Spam / Advertising</option>
                  <option value="inappropriate">Inappropriate/Adult Content</option>
                  <option value="other">Other / Violation of Rules</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Details (Optional)</label>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Provide any additional context for administrators..."
                  rows={3}
                  className="w-full rounded-lg border border-card-border bg-[#0B0F19] p-3 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reporting}
                  className="rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white transition-colors"
                >
                  {reporting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Identity Reveal Modal */}
      {showRevealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-card-border bg-[#121A2E] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-card-border pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-5 w-5 text-amber-400" /> Mutual Identity Reveal
              </h3>
              <button 
                onClick={() => setShowRevealModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                To protect privacy, identity reveal is **mutual opt-in only**. Both of you must request/agree to reveal before your real names and profile avatars are exposed.
              </p>
              <div className="bg-[#0B0F19]/50 border border-card-border/50 p-4 rounded-xl text-xs text-gray-400">
                <strong>Reveal Status:</strong> {
                  chatDetails.revealState === 'none' 
                    ? 'No requests sent.' 
                    : chatDetails.revealState === 'requested_by_me'
                    ? 'You requested to reveal. Waiting for partner.'
                    : chatDetails.revealState === 'requested_by_them'
                    ? `${partnerName} wants to reveal their identity to you.`
                    : 'Identities successfully revealed!'
                }
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRevealModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
              >
                Close
              </button>

              {chatDetails.revealState === 'requested_by_them' ? (
                <>
                  <button
                    disabled={revealing}
                    onClick={() => handleRevealSubmit(false)}
                    className="rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 text-xs font-bold transition-all"
                  >
                    Decline
                  </button>
                  <button
                    disabled={revealing}
                    onClick={() => handleRevealSubmit(true)}
                    className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 text-xs font-bold text-white transition-colors"
                  >
                    Accept & Reveal
                  </button>
                </>
              ) : chatDetails.revealState === 'none' ? (
                <button
                  disabled={revealing}
                  onClick={() => handleRevealSubmit(true)}
                  className="rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-bold text-white transition-colors"
                >
                  Request Identity Reveal
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
