'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import { BookOpen, AlertCircle, Search, Calendar, User, ArrowRight, X, Heart, Share2 } from 'lucide-react';

interface TriviaCard {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  category: string;
}

export default function TriviaPage() {
  const [feed, setFeed] = useState<TriviaCard[]>([]);
  const [filteredFeed, setFilteredFeed] = useState<TriviaCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTheme, setSelectedTheme] = useState<string>('All'); // 'All', 'Cricket', 'Bollywood'
  
  // Detail Modal state
  const [selectedPost, setSelectedPost] = useState<TriviaCard | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({});

  useEffect(() => {
    apiRequest('/api/trivia/feed')
      .then((data) => {
        setFeed(data);
        setFilteredFeed(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching trivia:', err);
        setLoading(false);
      });
  }, []);

  // Filter logic
  useEffect(() => {
    let result = feed;

    // Search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query) ||
          post.category.toLowerCase().includes(query)
      );
    }

    // Theme filter
    if (selectedTheme !== 'All') {
      result = result.filter((post) => {
        const cat = post.category.toLowerCase();
        if (selectedTheme === 'Cricket') {
          return cat === 'ipl moments' || cat === 'family connections';
        } else if (selectedTheme === 'Bollywood') {
          return cat === 'owner trivia' || cat === 'movie secrets' || cat === 'awards & records';
        }
        return true;
      });
    }

    // Specific category filter
    if (selectedCategory !== 'All') {
      result = result.filter((post) => post.category === selectedCategory);
    }

    setFilteredFeed(result);
  }, [searchQuery, selectedCategory, selectedTheme, feed]);

  const handleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedPosts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getThemeForCategory = (category: string): 'Cricket' | 'Bollywood' | 'Crossover' => {
    const cat = category.toLowerCase();
    if (cat === 'ipl moments' || cat === 'family connections') return 'Cricket';
    if (cat === 'movie secrets' || cat === 'awards & records') return 'Bollywood';
    return 'Crossover';
  };

  const getTagStyle = (category: string) => {
    const theme = getThemeForCategory(category);
    if (theme === 'Cricket') {
      return 'border-blue-500/20 text-blue-400 bg-blue-950/20';
    } else if (theme === 'Bollywood') {
      return 'border-purple-500/20 text-purple-400 bg-purple-950/20';
    }
    return 'border-orange-500/20 text-orange-400 bg-orange-950/20';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-[#1B2236] rounded-lg" />
          <div className="h-4 w-96 bg-[#1B2236] rounded-md" />
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-96 bg-[#1B2236] rounded-2xl" />
            ))}
          </div>
          <div className="w-full lg:w-1/4 h-80 bg-[#1B2236] rounded-2xl" />
        </div>
      </div>
    );
  }

  const allCategories = ['All', ...Array.from(new Set(feed.map((post) => post.category)))];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Blog Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <BookOpen className="h-3.5 w-3.5" /> CineCrick Chronicles
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Blog & Crossover Stories
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Explore the fascinating connection trivia, historical crossover matches, and behind-the-scenes actor-owner stories bridging Indian Cricket and Bollywood.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search stories & trivia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1B2236] border border-slate-800 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm transition-all"
          />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Blog Post Grid (75%) */}
        <div className="w-full lg:w-3/4 space-y-6">
          {/* Mobile Category scroll tabs */}
          <div className="flex lg:hidden overflow-x-auto gap-2 pb-3 scrollbar-thin scrollbar-thumb-slate-800">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedTheme('All');
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border shrink-0 transition-all ${
                  selectedCategory === cat && selectedTheme === 'All'
                    ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                    : 'border-slate-800 bg-[#1B2236] text-slate-300 hover:text-white'
                }`}
              >
                {cat === 'All' ? 'All Stories' : cat}
              </button>
            ))}
          </div>

          {filteredFeed.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredFeed.map((post) => {
                const isLiked = !!likedPosts[post.id];
                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="group bg-[#1B2236] border border-slate-800/80 rounded-2xl overflow-hidden shadow-md flex flex-col hover:-translate-y-1 hover:shadow-xl hover:border-slate-700/60 transition-all duration-300 cursor-pointer"
                  >
                    {/* Blog Card Image */}
                    <div className="h-48 w-full overflow-hidden relative bg-slate-950">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                      
                      {/* Floating Theme Ribbon */}
                      <span className={`absolute top-4 left-4 inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${getTagStyle(post.category)}`}>
                        {post.category}
                      </span>
                    </div>

                    {/* Blog Card Content */}
                    <div className="p-5 flex flex-col flex-grow justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> July 2026
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> CineCrick Editors
                          </span>
                        </div>
                        <h2 className="text-lg font-extrabold text-white group-hover:text-blue-400 transition-colors leading-snug">
                          {post.title}
                        </h2>
                        <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                          {post.content}
                        </p>
                      </div>

                      {/* Card Footer Interaction Row */}
                      <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                        <span className="text-blue-500 hover:text-blue-400 font-extrabold text-sm inline-flex items-center gap-1 transition-all">
                          Read now <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        
                        <div className="flex items-center gap-3 text-slate-400">
                          <button
                            onClick={(e) => handleLike(post.id, e)}
                            className={`p-1.5 rounded-full hover:bg-slate-800/80 transition-colors ${
                              isLiked ? 'text-red-500' : 'hover:text-white'
                            }`}
                            title={isLiked ? "Unlike Story" : "Like Story"}
                          >
                            <Heart className={`h-4.5 w-4.5 ${isLiked ? 'fill-red-500' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#1B2236] border border-slate-800/80 rounded-2xl p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
              <AlertCircle className="h-12 w-12 text-amber-500 animate-float" />
              <div className="space-y-2">
                <h3 className="font-extrabold text-white text-lg">No stories match your filters</h3>
                <p className="text-sm text-gray-400 font-medium">
                  Try clearing your search query or choosing another category from the sidebar.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedTheme('All');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Reset Filters & Search
              </button>
            </div>
          )}
        </div>

        {/* Right: Sidebar Filtration (25%) */}
        <div className="w-full lg:w-1/4 space-y-6 hidden lg:block shrink-0">
          <div className="bg-[#1B2236] border border-slate-800/80 rounded-2xl p-6 space-y-6 sticky top-24">
            {/* Primary Theme Filters */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                Thematic Filters
              </h3>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: 'All', label: '🎬 All Crossover Stories' },
                  { id: 'Cricket', label: '🏏 Cricket Focus' },
                  { id: 'Bollywood', label: '🎥 Bollywood Focus' },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setSelectedTheme(theme.id);
                      setSelectedCategory('All');
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between ${
                      selectedTheme === theme.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-900/40 text-slate-300 hover:bg-slate-900/80 hover:text-white'
                    }`}
                  >
                    <span>{theme.label}</span>
                    {selectedTheme === theme.id && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-slate-800" />

            {/* Specific Categories */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                Categories
              </h3>
              <div className="flex flex-col gap-1">
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedTheme('All');
                    }}
                    className={`w-full px-3.5 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                      selectedCategory === cat && selectedTheme === 'All'
                        ? 'text-blue-400 font-extrabold bg-blue-950/20 border-l-2 border-blue-500 pl-2.5'
                        : 'text-slate-400 hover:text-white pl-2 hover:bg-slate-900/20'
                    }`}
                  >
                    {cat === 'All' ? 'Latest Stories' : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Story Detail Reader Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#1B2236] border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-8">
            {/* Modal Image banner */}
            <div className="h-64 sm:h-72 w-full relative bg-slate-950">
              <img
                src={selectedPost.imageUrl}
                alt={selectedPost.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B2236] via-[#1b2236]/30 to-transparent" />
              
              {/* Floating Theme Ribbon */}
              <span className={`absolute top-6 left-6 inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${getTagStyle(selectedPost.category)}`}>
                {selectedPost.category}
              </span>

              {/* Close Button */}
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-950/50 hover:bg-slate-950 border border-slate-800/80 text-gray-400 hover:text-white transition-all cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> July 2026
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> Written by CineCrick Editors
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug">
                  {selectedPost.title}
                </h2>
              </div>

              <div className="text-slate-300 text-sm sm:text-base leading-relaxed space-y-4 font-light whitespace-pre-line border-t border-slate-800 pt-4">
                {selectedPost.content}
              </div>

              {/* Crossover connection badge in modal */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-orange-500 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                  🎬
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Crossover Connection Info</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    This story is verified to involve connections found in our cricketer and movie archive.
                  </p>
                </div>
              </div>

              {/* Modal footer interaction */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                <button
                  onClick={(e) => handleLike(selectedPost.id, e)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    likedPosts[selectedPost.id]
                      ? 'border-red-500/20 text-red-500 bg-red-950/20'
                      : 'border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Heart className={`h-4.5 w-4.5 ${likedPosts[selectedPost.id] ? 'fill-red-500' : ''}`} />
                  {likedPosts[selectedPost.id] ? 'Liked!' : 'Like Story'}
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + `/trivia?id=${selectedPost.id}`);
                    alert("Story link copied to clipboard!");
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                >
                  <Share2 className="h-4.5 w-4.5" />
                  Share Story
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
