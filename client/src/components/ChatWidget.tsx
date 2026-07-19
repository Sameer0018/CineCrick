'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { apiRequest } from '../lib/api';
import {
  MessageSquare, X, ArrowLeft, Send, Sparkles, User, Eye, Ban, ShieldAlert, Plus, LogOut, ChevronRight, AlertCircle
} from 'lucide-react';

interface ConversationSummary {
  id: number;
  topicTitle: string;
  partnerAlias: string;
  partnerRealName: string | null;
  partnerRealAvatar: string | null;
  lastMessageBody: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
  revealState: string;
}

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

interface Topic {
  id: number;
  title: string;
  category: string;
  tags: string[];
  expiresAt: string;
  createdAt: string;
  status: string;
}

export const ChatWidget = () => {
  const { isLoggedIn, email, loading: authLoading } = useAuth();
  const { unreadCount, connection, refreshUnreadCount } = useChat();
  const router = useRouter();

  // Widget visibility
  const [isOpen, setIsOpen] = useState(false);

  // Views: 'list' | 'room' | 'feed'
  const [activeView, setActiveView] = useState<'list' | 'room' | 'feed'>('list');
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);

  // Authenticated State data
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentChat, setCurrentChat] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [openTopics, setOpenTopics] = useState<Topic[]>([]);

  // Input states
  const [inputText, setInputText] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicCategory, setTopicCategory] = useState('Movies');
  const [topicTags, setTopicTags] = useState('');

  // Status & errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignupToaster, setShowSignupToaster] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConversations = async () => {
    try {
      const data = await apiRequest('/api/conversations');
      setConversations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOpenTopics = async () => {
    try {
      const data = await apiRequest('/api/topics?status=open');
      setOpenTopics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChatDetails = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest(`/api/conversations/${id}`);
      setCurrentChat(data);
      setMessages(data.messages || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load chat.');
    } finally {
      setLoading(false);
    }
  };

  // Poll conversations & topics list when open
  useEffect(() => {
    if (isOpen) {
      if (isLoggedIn) {
        if (activeView === 'list') {
          fetchConversations();
        } else if (activeView === 'feed') {
          fetchOpenTopics();
        }
      } else {
        // Fetch open topics for guest preview list
        fetchOpenTopics();
      }
    }
  }, [isLoggedIn, isOpen, activeView]);

  // Scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping, isOpen, selectedConvId]);

  // Bind WebSocket listeners inside widget for active chat
  useEffect(() => {
    if (!connection || !selectedConvId || !isOpen || activeView !== 'room') return;

    connection.invoke('JoinConversation', selectedConvId).catch(() => { });

    const handleNewMessage = (msg: Message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setPartnerTyping(false);
    };

    const handleTypingStart = (data: { conversationId: number; alias: string }) => {
      if (data.conversationId === selectedConvId) setPartnerTyping(true);
    };

    const handleTypingStop = (data: { conversationId: number; alias: string }) => {
      if (data.conversationId === selectedConvId) setPartnerTyping(false);
    };

    const handleRevealAccepted = (data: { conversationId: number; users: any[] }) => {
      if (data.conversationId === selectedConvId) {
        const partnerInfo = data.users.find(u => u.realName && u.realName !== currentChat?.partnerRealName);
        setCurrentChat(prev => {
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

    const handleParticipantLeft = (data: { conversationId: number }) => {
      if (data.conversationId === selectedConvId) {
        setCurrentChat(prev => prev ? { ...prev, status: 'ended' } : null);
        setError('Participant left chat.');
      }
    };

    connection.on('message:new', handleNewMessage);
    connection.on('typing:start', handleTypingStart);
    connection.on('typing:stop', handleTypingStop);
    connection.on('reveal:accepted', handleRevealAccepted);
    connection.on('participant:left', handleParticipantLeft);

    return () => {
      connection.invoke('LeaveConversation', selectedConvId).catch(() => { });
      connection.off('message:new', handleNewMessage);
      connection.off('typing:start', handleTypingStart);
      connection.off('typing:stop', handleTypingStop);
      connection.off('reveal:accepted', handleRevealAccepted);
      connection.off('participant:left', handleParticipantLeft);
    };
  }, [connection, selectedConvId, isOpen, activeView, currentChat]);

  // Handle typing state broadcast
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!connection || !selectedConvId) return;

    connection.invoke('SendTypingState', selectedConvId, true).catch(() => { });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      connection.invoke('SendTypingState', selectedConvId, false).catch(() => { });
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvId) return;

    try {
      const text = inputText.trim();
      setInputText('');
      await apiRequest(`/api/conversations/${selectedConvId}/messages`, {
        method: 'POST',
        body: JSON.stringify(text)
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send.');
    }
  };

  const handleJoinTopic = async (topicId: number) => {
    try {
      setLoading(true);
      const data = await apiRequest(`/api/topics/${topicId}/join`, { method: 'POST' });
      setSelectedConvId(data.conversationId);
      setActiveView('room');
      fetchChatDetails(data.conversationId);
    } catch (err: any) {
      setError(err.message || 'Could not join match.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim()) return;

    try {
      setLoading(true);
      const tags = topicTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      await apiRequest('/api/topics', {
        method: 'POST',
        body: JSON.stringify({ title: topicTitle.trim(), category: topicCategory, tags })
      });
      setTopicTitle('');
      setTopicTags('');
      setActiveView('feed');
      fetchOpenTopics();
    } catch (err: any) {
      setError(err.message || 'Failed to create topic.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReveal = async () => {
    if (!selectedConvId) return;
    try {
      await apiRequest(`/api/conversations/${selectedConvId}/reveal-request`, { method: 'POST' });
      fetchChatDetails(selectedConvId);
    } catch (err: any) {
      setError(err.message || 'Reveal request failed.');
    }
  };

  const handleLeaveChat = async () => {
    if (!selectedConvId || !window.confirm('Leave this chat?')) return;
    try {
      await apiRequest(`/api/conversations/${selectedConvId}/leave`, { method: 'POST' });
      setActiveView('list');
      fetchConversations();
    } catch (err: any) {
      setError(err.message || 'Failed to leave.');
    }
  };

  const openRoom = (convId: number) => {
    setSelectedConvId(convId);
    setActiveView('room');
    fetchChatDetails(convId);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* 1. Chat Widget Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[380px] h-[500px] border border-card-border bg-[#121A2E]/95 rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden backdrop-blur-md">
          {/* Header */}
          <div className="bg-[#16223E]/90 p-4 border-b border-card-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {activeView !== 'list' && isLoggedIn && (
                <button
                  onClick={() => {
                    setActiveView('list');
                    fetchConversations();
                  }}
                  className="p-1 rounded text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <span className="font-extrabold text-sm text-white tracking-wide uppercase flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-orange-500 animate-pulse" /> CineCrick AI & Match Chat
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Area */}
          <div className="flex-grow overflow-y-auto p-4 flex flex-col bg-[#0B0F19]/40">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-2 text-xs text-red-400 mb-3 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> {error}
                <button onClick={() => setError(null)} className="ml-auto text-xs font-bold">×</button>
              </div>
            )}

            {/* A. If not signed in (Guest welcome screen) */}
            {!isLoggedIn ? (
              <div className="flex-grow flex flex-col justify-between min-h-0 relative">
                {/* Scrollable messenger-style list */}
                <div className="flex-grow overflow-y-auto space-y-0.5">
                  {/* Header */}
                  <div className="px-1 pb-3">
                    <h3 className="text-sm font-extrabold text-white tracking-wide">Messages</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">People sharing ideas right now</p>
                  </div>

                  {/* Contact-style rows */}
                  {(() => {
                    const seedProfiles = [
                      { name: "Ravi Sharma", initials: "RS", color: "from-blue-500 to-cyan-500", status: "active", time: "now", idea: "Going tomorrow on a road trip, need Bollywood sports movie recommendations!", category: "Movies" },
                      { name: "Priya Menon", initials: "PM", color: "from-purple-500 to-pink-500", status: "active", time: "2m", idea: "Let's talk about MS Dhoni's cameo scenes in movies.", category: "Cricket" },
                      { name: "Arjun Kapoor", initials: "AK", color: "from-orange-500 to-red-500", status: "offline", time: "15m", idea: "Lagaan vs 83: which had a better cricket training arc?", category: "General" },
                      { name: "Sneha Patel", initials: "SP", color: "from-green-500 to-emerald-500", status: "active", time: "1h", idea: "Anyone watched Jersey? The Telugu original vs Hindi remake discussion.", category: "Movies" },
                      { name: "Vikram Singh", initials: "VS", color: "from-amber-500 to-yellow-500", status: "offline", time: "3h", idea: "Best cricket commentary moments that deserve a movie adaptation!", category: "Cricket" },
                    ];

                    // If real topics exist, merge them with seed profiles
                    const displayItems = openTopics.length > 0
                      ? openTopics.slice(0, 5).map((t, i) => ({
                        ...seedProfiles[i % seedProfiles.length],
                        idea: t.title,
                        category: t.category,
                      }))
                      : seedProfiles;

                    return displayItems.map((person, i) => (
                      <div
                        key={i}
                        onClick={() => setShowSignupToaster(true)}
                        className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-[#16223E]/50 transition-all cursor-pointer group"
                      >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${person.color} flex items-center justify-center text-white text-xs font-extrabold shadow-md`}>
                            {person.initials}
                          </div>
                          {person.status === 'active' && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-[#121A2E]" />
                          )}
                        </div>

                        {/* Name + Preview */}
                        <div className="min-w-0 flex-grow">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                              {person.name}
                            </span>
                            <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">
                              {person.status === 'active' ? (
                                <span className="text-green-400 font-semibold">Active now</span>
                              ) : (
                                person.time
                              )}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5 leading-snug">
                            {person.idea}
                          </p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Bottom banner */}
                <div className="pt-3 border-t border-card-border/50 flex-shrink-0">
                  <button
                    onClick={() => setShowSignupToaster(true)}
                    className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-orange-950/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Share Your Own Idea
                  </button>
                </div>

                {/* Sign Up Toaster Overlay */}
                {showSignupToaster && (
                  <div className="absolute inset-0 bg-[#0B0F19]/95 z-50 flex flex-col items-center justify-center p-6 text-center rounded-xl" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                    <button
                      onClick={() => setShowSignupToaster(false)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <div className="h-14 w-14 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white mb-4 animate-bounce">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-extrabold text-white">Join the Conversation!</h3>
                    <p className="text-xs text-gray-400 mt-2 max-w-[240px] leading-relaxed">
                      Sign up to match anonymously, share your own trip ideas, movie discussions &amp; more!
                    </p>
                    <div className="w-full space-y-2 mt-6">
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          router.push('/login');
                        }}
                        className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-orange-950/20"
                      >
                        Sign In / Sign Up
                      </button>
                      <button
                        onClick={() => setShowSignupToaster(false)}
                        className="w-full text-xs text-gray-400 hover:text-white py-1"
                      >
                        Keep Browsing
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* B. If signed in, render dynamic views */
              <>
                {/* 1. VIEW: Chats List */}
                {activeView === 'list' && (
                  <div className="flex-grow flex flex-col space-y-4">
                    {/* Floating Composer Trigger */}
                    <div className="flex justify-between gap-2 border-b border-card-border pb-3 flex-shrink-0">
                      <button
                        onClick={() => setActiveView('feed')}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Discover Matches
                      </button>
                      <button
                        onClick={() => setActiveView('feed')} // Opens feed where they can compose
                        className="bg-card-bg border border-card-border hover:border-gray-500 text-gray-300 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Post Topic
                      </button>
                    </div>

                    {/* Chats List */}
                    <div className="flex-grow space-y-2 overflow-y-auto">
                      {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[200px] text-center text-gray-500">
                          <MessageSquare className="h-10 w-10 text-gray-700 mb-2" />
                          <p className="text-xs">No active chats yet.</p>
                          <button
                            onClick={() => setActiveView('feed')}
                            className="text-xs text-orange-400 hover:underline font-semibold mt-1"
                          >
                            Browse Open Topics
                          </button>
                        </div>
                      ) : (
                        conversations.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => openRoom(c.id)}
                            className="flex items-center space-x-3 p-3 rounded-lg bg-[#16223E]/30 hover:bg-[#16223E]/70 border border-card-border/30 hover:border-card-border transition-all cursor-pointer group"
                          >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              {c.partnerRealAvatar ? (
                                <img src={c.partnerRealAvatar} alt="" className="h-9 w-9 rounded-full border border-green-500 bg-[#0B0F19]" />
                              ) : (
                                <div className="h-9 w-9 rounded-full border border-card-border bg-[#0B0F19] flex items-center justify-center text-gray-500">
                                  <User className="h-4.5 w-4.5" />
                                </div>
                              )}
                              {c.unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white border border-[#121A2E]">
                                  {c.unreadCount}
                                </span>
                              )}
                            </div>

                            {/* Message detail */}
                            <div className="min-w-0 flex-grow">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs text-white truncate group-hover:text-orange-400 transition-colors">
                                  {c.partnerRealName || c.partnerAlias}
                                </span>
                                {c.revealState === 'revealed' && <Eye className="h-3 w-3 text-green-400" />}
                              </div>
                              <div className="text-[10px] text-gray-400 truncate">Re: {c.topicTitle}</div>
                              <div className="text-[11px] text-gray-500 truncate mt-0.5">{c.lastMessageBody || 'No messages yet'}</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-white" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 2. VIEW: Active Chat Room */}
                {activeView === 'room' && currentChat && (
                  <div className="flex-grow flex flex-col h-full min-h-0 justify-between">
                    {/* Sub-Header actions */}
                    <div className="flex items-center justify-between border-b border-card-border/50 pb-2 mb-2 text-xs flex-shrink-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-white text-xs truncate max-w-[130px]">{currentChat.partnerAlias}</span>
                        {currentChat.revealState === 'revealed' && <span className="text-[9px] bg-green-950/40 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 font-bold">REVEALED</span>}
                      </div>

                      <div className="flex items-center space-x-1">
                        {currentChat.status === 'active' && currentChat.revealState !== 'revealed' && (
                          <button
                            onClick={handleRequestReveal}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${currentChat.revealState === 'requested_by_me'
                                ? 'border-orange-500/20 text-orange-400 bg-orange-950/30'
                                : currentChat.revealState === 'requested_by_them'
                                  ? 'border-amber-500 text-amber-400 bg-amber-950/40 animate-pulse'
                                  : 'border-card-border hover:border-gray-500 text-gray-300'
                              }`}
                          >
                            {currentChat.revealState === 'requested_by_them' ? 'Accept Reveal' : 'Reveal Info'}
                          </button>
                        )}
                        <button onClick={handleLeaveChat} className="p-1 rounded text-red-500 hover:bg-card-bg" title="Leave Chat">
                          <LogOut className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Message Log */}
                    <div className="flex-grow overflow-y-auto space-y-2 mb-3 bg-[#0B0F19]/20 p-2 rounded-xl border border-card-border/20">
                      {messages.map((m) => {
                        const isMe = m.senderAlias === 'Me';
                        return (
                          <div key={m.id} className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                            <div className={`p-2.5 rounded-xl text-xs ${isMe ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-none'
                                : 'bg-[#16223E] text-gray-100 rounded-bl-none border border-card-border/50'
                              } ${m.isFlagged ? 'border-dashed border-red-500 bg-red-950/20 text-red-400' : ''}`}>
                              {m.isFlagged ? 'Held for moderation review' : m.body}
                            </div>
                            <span className="text-[8px] text-gray-500 mt-0.5 px-0.5">
                              {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                      {partnerTyping && (
                        <div className="text-[10px] text-gray-500 italic mr-auto px-1">Typing...</div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Send box */}
                    <div className="flex-shrink-0">
                      {currentChat.status !== 'active' ? (
                        <div className="text-center text-[10px] text-gray-500 italic py-1 border border-card-border bg-[#0B0F19]/30 rounded">
                          Chat has ended.
                        </div>
                      ) : (
                        <form onSubmit={handleSendMessage} className="flex gap-1.5">
                          <input
                            type="text"
                            value={inputText}
                            onChange={handleInputChange}
                            placeholder="Type a message..."
                            className="flex-grow rounded-lg border border-card-border bg-[#0B0F19] px-3 py-1.5 text-xs text-white focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!inputText.trim()}
                            className="rounded-lg bg-orange-500 px-3 text-xs font-bold text-white transition-colors"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. VIEW: Feed & Composer */}
                {activeView === 'feed' && (
                  <div className="flex-grow flex flex-col h-full min-h-0 space-y-4">
                    {/* Create New Topic Composer */}
                    <form onSubmit={handleCreateTopic} className="bg-[#121A2E]/80 border border-card-border p-3.5 rounded-xl space-y-2.5 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-white uppercase">Post New Topic</span>
                        <select
                          value={topicCategory}
                          onChange={(e) => setTopicCategory(e.target.value)}
                          className="text-[10px] bg-[#0B0F19] border border-card-border text-gray-300 rounded p-1"
                        >
                          <option value="Movies">Movies</option>
                          <option value="Cricket">Cricket</option>
                          <option value="Hobbies">Hobbies</option>
                          <option value="General">General</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={topicTitle}
                        onChange={(e) => setTopicTitle(e.target.value)}
                        placeholder="What are you interested in? (e.g. Dhoni in movies)"
                        className="w-full rounded-lg border border-card-border bg-[#0B0F19] px-3 py-1.5 text-xs text-white focus:outline-none"
                        required
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={topicTags}
                          onChange={(e) => setTopicTags(e.target.value)}
                          placeholder="tags (dhoni, movies)"
                          className="flex-grow rounded-lg border border-card-border bg-[#0B0F19] px-3 py-1 text-[10px] text-white focus:outline-none"
                        />
                        <button type="submit" className="bg-orange-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-lg">
                          Post
                        </button>
                      </div>
                    </form>

                    {/* Open match feed */}
                    <div className="flex-grow space-y-2 overflow-y-auto min-h-0">
                      <h4 className="text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">Open Discover Feed</h4>
                      {openTopics.length === 0 ? (
                        <div className="text-center py-8 text-xs text-gray-500 italic">
                          No open topics. Be the first to post!
                        </div>
                      ) : (
                        openTopics.map((topic) => (
                          <div
                            key={topic.id}
                            className="p-3 bg-[#16223E]/20 border border-card-border/50 rounded-lg flex flex-col justify-between"
                          >
                            <div>
                              <span className="text-[9px] font-bold text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-500/20">{topic.category}</span>
                              <p className="text-xs text-white font-extrabold mt-1.5 line-clamp-2">{topic.title}</p>
                            </div>
                            <button
                              onClick={() => handleJoinTopic(topic.id)}
                              className="mt-2.5 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 rounded text-[10px] flex items-center justify-center gap-1"
                            >
                              <Sparkles className="h-3 w-3" /> Match & Chat
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. Floating Circular Icon */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && isLoggedIn) {
            setActiveView('list');
            fetchConversations();
          }
        }}
        className="relative h-14 w-14 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition-all duration-200"
      >
        <MessageSquare className="h-6 w-6" />
        {isLoggedIn && unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
