'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import { MessageSquare, Calendar, ChevronRight, User, Eye } from 'lucide-react';

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

export default function MyChatsPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, authLoading, router]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest('/api/conversations');
      setConversations(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchConversations();
    }
  }, [isLoggedIn]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    
    // If today, return time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getRevealLabel = (state: string) => {
    switch (state) {
      case 'revealed':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-950/40 border border-green-500/20 px-2 py-0.5 rounded-full"><Eye className="h-3 w-3" /> Identity Revealed</span>;
      case 'requested_by_me':
        return <span className="text-[10px] text-orange-400 font-semibold bg-orange-950/30 border border-orange-500/20 px-2 py-0.5 rounded-full">Reveal Pending Approval</span>;
      case 'requested_by_them':
        return <span className="text-[10px] text-amber-400 font-bold bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">Partner Wants to Reveal</span>;
      default:
        return null;
    }
  };

  if (authLoading || !isLoggedIn) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-orange-500" /> Active Chats
          </h1>
          <p className="text-sm text-gray-400 mt-1">Your anonymous matches and active discussions.</p>
        </div>
        <button 
          onClick={() => router.push('/chat')}
          className="rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2 text-sm font-bold text-white transition-colors"
        >
          Find New Match
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-[35vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-card-border bg-[#121A2E]/20 p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-white">No active chats yet</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto mb-6">
            Browse open topics on the feed to start chatting with other crossover fans!
          </p>
          <button
            onClick={() => router.push('/chat')}
            className="rounded-lg border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-5 py-2 text-sm font-bold transition-all"
          >
            Browse Topics Feed →
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-card-border bg-[#121A2E]/30 overflow-hidden divide-y divide-card-border">
          {conversations.map((chat) => (
            <div
              key={chat.id}
              onClick={() => router.push(`/chat/${chat.id}`)}
              className="flex items-center justify-between p-5 hover:bg-[#16223E]/50 transition-all cursor-pointer group"
            >
              {/* Left Profile and Text */}
              <div className="flex items-center space-x-4 min-w-0 flex-grow">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {chat.partnerRealAvatar ? (
                    <img 
                      src={chat.partnerRealAvatar} 
                      alt={chat.partnerRealName || 'Partner'} 
                      className="h-12 w-12 rounded-full border-2 border-green-500 p-0.5 bg-[#0B0F19]" 
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full border border-card-border bg-[#0B0F19] flex items-center justify-center text-gray-400">
                      <User className="h-6 w-6" />
                    </div>
                  )}
                  {chat.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-red-600 text-[10px] font-extrabold text-white leading-none border-2 border-[#121A2E]">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>

                {/* Message Details */}
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-base text-white group-hover:text-orange-400 transition-colors">
                      {chat.partnerRealName || chat.partnerAlias}
                    </span>
                    {getRevealLabel(chat.revealState)}
                  </div>
                  
                  {/* Topic Title */}
                  <div className="text-xs text-gray-400 font-medium truncate mb-1">
                    Re: {chat.topicTitle}
                  </div>

                  {/* Last Message snippet */}
                  <div className="text-sm text-gray-400 truncate">
                    {chat.lastMessageBody || <span className="italic text-gray-600">No messages yet</span>}
                  </div>
                </div>
              </div>

              {/* Right Chevron & Timestamp */}
              <div className="flex flex-col items-end space-y-2 ml-4 flex-shrink-0">
                <span className="text-xs text-gray-500 font-medium">
                  {formatDate(chat.lastMessageTime)}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-white transition-all transform group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
