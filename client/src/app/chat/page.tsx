'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { MessageSquarePlus, Tag, Calendar, Sparkles, Filter, Hash, Search } from 'lucide-react';

interface Topic {
  id: number;
  title: string;
  category: string;
  tags: string[];
  expiresAt: string;
  createdAt: string;
  status: string;
}

export default function ChatFeedPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const router = useRouter();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Composer state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Movies');
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');

  const categories = ['Movies', 'Cricket', 'Daily Crossover', 'Hobbies', 'Trivia Chat', 'General'];

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, authLoading, router]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = '/api/topics?status=open';
      if (selectedCategory !== 'all') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (selectedTag.trim()) {
        url += `&tag=${encodeURIComponent(selectedTag.trim())}`;
      }
      const data = await apiRequest(url);
      setTopics(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load topics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchTopics();
    }
  }, [isLoggedIn, selectedCategory, selectedTag]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await apiRequest('/api/topics', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          category,
          tags
        })
      });

      setTitle('');
      setTagsInput('');
      setSuccessMsg('Topic posted successfully to the feed!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchTopics();
    } catch (err: any) {
      setError(err.message || 'Failed to post topic. Rate limits may apply.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinTopic = async (topicId: number) => {
    try {
      const data = await apiRequest(`/api/topics/${topicId}/join`, {
        method: 'POST'
      });
      // Redirects to conversation details page
      router.push(`/chat/${data.conversationId}`);
    } catch (err: any) {
      setError(err.message || 'Could not join conversation.');
    }
  };

  const getHoursLeft = (expiresAtStr: string) => {
    const hours = Math.ceil((new Date(expiresAtStr).getTime() - Date.now()) / (1000 * 60 * 60));
    return hours > 0 ? `${hours}h left` : 'Expiring soon';
  };

  if (authLoading || !isLoggedIn) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Create Topic & Filter Panel */}
      <div className="lg:col-span-1 space-y-6">
        {/* Tweet-like Topic Composer */}
        <div className="rounded-2xl border border-card-border bg-[#121A2E]/50 p-6 backdrop-blur-md">
          <h2 className="text-xl font-bold tracking-tight text-white mb-4 flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-orange-500" /> Post a Chat Topic
          </h2>

          <form onSubmit={handleCreateTopic} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Title / Thought</label>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={140}
                placeholder="What crossover topic or interest do you want to talk about anonymously? (e.g. Dhoni cameos in films)"
                rows={3}
                className="w-full rounded-lg border border-card-border bg-[#0B0F19] p-3 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
              />
              <div className="text-right text-[10px] text-gray-500 mt-1">{title.length}/140</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-[#0B0F19] p-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tags (Comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="dhoni, aamir, bollywood, sports"
                className="w-full rounded-lg border border-card-border bg-[#0B0F19] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {successMsg && (
              <p className="text-sm text-green-400 font-semibold">{successMsg}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-sm font-bold text-white hover:from-orange-600 hover:to-amber-600 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-950/20"
            >
              {submitting ? 'Posting...' : 'Post Anonymously'}
            </button>
          </form>
        </div>

        {/* Filters Panel */}
        <div className="rounded-2xl border border-card-border bg-[#121A2E]/30 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" /> Filter Feed
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-[#0B0F19] p-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Search Tag</label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  placeholder="Filter by interest tag"
                  className="w-full rounded-lg border border-card-border bg-[#0B0F19] pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                />
                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              </div>
            </div>

            {(selectedCategory !== 'all' || selectedTag) && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedTag('');
                }}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Open Topics Feed */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="text-amber-400 h-6 w-6 animate-pulse" /> Discover Open Chats
          </h1>
          <button 
            onClick={fetchTopics}
            className="text-xs bg-card-bg border border-card-border hover:border-gray-500 px-3 py-1.5 rounded-lg text-gray-300 transition-all"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-[30vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : topics.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-card-border bg-[#121A2E]/20 p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-white">No open topics found</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
              Nobody is looking to chat in this category right now. Be the first to start a conversation!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((topic) => (
              <div 
                key={topic.id}
                className="flex flex-col justify-between rounded-xl border border-card-border bg-card-bg/40 hover:bg-card-bg/70 p-5 transition-all hover:scale-[1.01] duration-200"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-blue-950/50 text-blue-400 border border-blue-500/20">
                      {topic.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {getHoursLeft(topic.expiresAt)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white line-clamp-3 mb-3 hover:text-orange-400 transition-colors">
                    {topic.title}
                  </h3>

                  {topic.tags && topic.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {topic.tags.map(t => (
                        <span key={t} className="inline-flex items-center text-[10px] font-medium text-gray-400 bg-[#0F1523] px-2 py-0.5 rounded-full">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleJoinTopic(topic.id)}
                  className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Match & Chat
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
