'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Search, SlidersHorizontal, Flame, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';
import { FilterDrawer } from '../components/FilterDrawer';

interface DirectoryItem {
  type: 'cricketer' | 'actor' | 'movie';
  name: string;
  slug: string;
  photoUrl: string;
  subtitle: string;
  tagColor: string;
}

function HomeContent() {
  const { isLoggedIn } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['cricketer', 'actor', 'movie']);
  const [items, setItems] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [quizAttempted, setQuizAttempted] = useState(false);
  
  // Dynamic database statistics state
  const [stats, setStats] = useState({ cricketers: 0, actors: 0, movies: 0, connections: 0 });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch dynamic connection statistics from PostgreSQL
  useEffect(() => {
    apiRequest('/api/directory/stats')
      .then((data) => {
        if (data) {
          setStats({
            cricketers: data.cricketers || 0,
            actors: data.actors || 0,
            movies: data.movies || 0,
            connections: data.connections || 0
          });
        }
      })
      .catch(() => {});
  }, []);

  // Focus search input if ?focus=true is present
  useEffect(() => {
    if (searchParams.get('focus') === 'true' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchParams]);

  // Fetch today's quiz status to show appropriate CTA
  useEffect(() => {
    if (isLoggedIn) {
      apiRequest('/api/quiz/today')
        .then((res) => {
          if (res && res.alreadyAnswered) {
            setQuizAttempted(true);
          }
        })
        .catch(() => {});
    }
  }, [isLoggedIn]);

  // Fetch directory list
  const fetchDirectory = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/api/directory?search=${encodeURIComponent(search)}&filter=${selectedTypes.join(',')}`);
      setItems(data);
    } catch (err) {
      console.error('Error fetching directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchDirectory();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, selectedTypes]);

  const handleApplyFilters = (types: string[]) => {
    setSelectedTypes(types);
  };

  const handleClearFilters = () => {
    setSelectedTypes(['cricketer', 'actor', 'movie']);
  };

  const handleExploreClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-[40px] bg-[#090b14] p-8 sm:p-12 lg:p-20 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16 min-h-[550px] shadow-2xl">
        {/* Deep Space Background Effects */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Glowing nebulas */}
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#FF6B6B]/10 rounded-full blur-[120px]" />
            <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] bg-[#4ECDC4]/15 rounded-full blur-[120px]" />
            <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-purple-500/15 rounded-full blur-[120px]" />
            
            {/* Tiny stars */}
            <div className="absolute top-[15%] left-[30%] w-1 h-1 bg-white rounded-full opacity-60 shadow-[0_0_10px_white]" />
            <div className="absolute top-[45%] left-[10%] w-1.5 h-1.5 bg-white rounded-full opacity-40 shadow-[0_0_10px_white]" />
            <div className="absolute top-[25%] right-[35%] w-1 h-1 bg-white rounded-full opacity-80 shadow-[0_0_10px_white]" />
            <div className="absolute bottom-[35%] left-[40%] w-2 h-2 bg-white rounded-full opacity-30 shadow-[0_0_15px_white]" />
            <div className="absolute bottom-[20%] right-[25%] w-1 h-1 bg-white rounded-full opacity-50 shadow-[0_0_10px_white]" />
            <div className="absolute bottom-[10%] right-[10%] w-3 h-3 bg-white/20 rounded-full blur-[2px]" />
            <div className="absolute top-[10%] left-[5%] w-2 h-2 bg-white/20 rounded-full blur-[1px]" />
        </div>

        {/* Left Content */}
        <div className="w-full lg:w-[50%] flex flex-col items-start text-left space-y-6 z-10">
          
          <h1 className="text-[44px] sm:text-5xl lg:text-[64px] font-black leading-[1.05] tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7A7A] to-[#FF9E73]">
              Find Your People.
            </span>
            <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7A7A] to-[#FF9E73]">
              Start Talking.
            </span>
          </h1>

          <p className="text-slate-200 text-base lg:text-[19px] leading-relaxed max-w-md font-medium">
            Join thousands discussing movies, cricket, travel, memes and everything in between.
          </p>

          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-7 h-1.5 rounded-full bg-[#FF7A7A]" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <span className="text-xs text-slate-500 font-semibold ml-2">(2 sc)</span>
          </div>

          <div className="w-full max-w-md bg-[#131627]/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 text-center mt-6 shadow-2xl relative overflow-hidden">
            {/* Subtle inner top highlight */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-500/50 to-transparent" />
            <h3 className="text-white font-bold text-[17px] flex items-center justify-center gap-2 mb-1.5">
              <span className="text-xl">🎁</span> Sign up today
            </h3>
            <p className="text-slate-300 text-[15px] font-medium leading-snug">
              Play Today's Trivia Challenge.<br/>
              Win exciting rewards.
            </p>
          </div>

          <div className="w-full max-w-md flex flex-col gap-3 mt-4">
            <button 
              onClick={handleExploreClick}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#4ECDC4] text-white font-extrabold text-[15px] shadow-[0_0_20px_rgba(255,107,107,0.3)] hover:opacity-90 hover:scale-[1.01] transition-all tracking-wide cursor-pointer"
            >
              [ Start Chatting Free ]
            </button>
            <Link href="/quiz" className="w-full flex">
              <button className="w-full py-4 rounded-full border-[1.5px] border-slate-600 bg-transparent text-slate-300 font-extrabold text-[15px] hover:bg-slate-800/60 hover:text-white transition-all tracking-wide cursor-pointer">
                [ Explore Trending ]
              </button>
            </Link>
          </div>
        </div>

        {/* Right Content - Illustration Graphic */}
        <div className="w-full lg:w-[50%] flex justify-center items-center relative z-10 mt-16 lg:mt-0">
          <div className="relative w-full max-w-[450px] aspect-square flex items-center justify-center">
            {/* Portal Glow */}
            <div className="absolute inset-2 bg-gradient-to-tr from-purple-600/30 via-[#0B1120]/50 to-blue-500/30 rounded-full blur-xl border border-slate-700/30" />
            
            {/* Emojis and Icons */}
            <div className="absolute top-[8%] left-[22%] text-3xl animate-[bounce_4s_infinite]" style={{ animationDelay: '0s' }}>😍</div>
            <div className="absolute top-[18%] right-[15%] text-2xl animate-[bounce_5s_infinite]" style={{ animationDelay: '1s' }}>✈️</div>
            <div className="absolute top-[35%] right-[4%] text-4xl animate-[bounce_3s_infinite]" style={{ animationDelay: '2s' }}>🏆</div>
            <div className="absolute bottom-[25%] right-[12%] text-3xl rotate-45 animate-[bounce_4s_infinite]" style={{ animationDelay: '0.5s' }}>🎤</div>
            <div className="absolute bottom-[2%] left-[45%] text-5xl animate-[bounce_5s_infinite]" style={{ animationDelay: '1.5s' }}>🍿</div>
            <div className="absolute bottom-[22%] left-[8%] text-4xl -rotate-45 animate-[bounce_3.5s_infinite]" style={{ animationDelay: '0.8s' }}>🏏</div>
            <div className="absolute top-[40%] -left-[2%] text-4xl animate-[bounce_4s_infinite]" style={{ animationDelay: '2.5s' }}>🎬</div>
            <div className="absolute top-[25%] right-[28%] text-2xl animate-[bounce_3s_infinite]" style={{ animationDelay: '1.2s' }}>⭐</div>
            <div className="absolute bottom-[35%] right-[30%] text-2xl animate-[bounce_4.5s_infinite]" style={{ animationDelay: '0.3s' }}>⭐</div>
            
            {/* Small Chat Bubble */}
            <div className="absolute top-[22%] left-[5%] bg-white rounded-xl rounded-bl-sm px-4 py-2.5 shadow-xl z-20 flex gap-1.5 items-center animate-pulse">
                <span className="w-2 h-2 bg-slate-400 rounded-full" />
                <span className="w-2 h-2 bg-slate-400 rounded-full" />
                <span className="w-2 h-2 bg-slate-400 rounded-full" />
            </div>

            {/* Chat Bubble 2 (emojis) */}
            <div className="absolute top-[42%] right-[2%] bg-white rounded-full px-4 py-2 shadow-xl z-20 flex gap-1 items-center transform rotate-6">
                <span className="text-lg">🤪 😜 😝</span>
            </div>

            {/* Center Boy Image */}
            <div className="relative z-10 w-[95%] h-[95%] rounded-full overflow-hidden flex items-end justify-center">
              <img src="/hero-illustration.png" alt="Happy user on phone" className="w-full h-full object-cover relative z-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]" />
            </div>
            
          </div>
        </div>
      </section>

      {/* Authenticity Live Counter Bar */}
      <div className="w-full bg-[#111827]/40 border border-slate-800/80 rounded-2xl py-3.5 px-6 flex items-center justify-center gap-2 text-slate-300 text-xs sm:text-sm font-semibold shadow-inner">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>
          {stats.connections > 0 
            ? `${stats.connections} Verified Crossover Connections` 
            : "Loading Connection Database..."}
        </span>
        <span className="text-slate-600 px-1.5">·</span>
        <span className="text-slate-400 font-medium">
          {stats.cricketers > 0 
            ? `${stats.cricketers} Cricketers & ${stats.actors} Actors Indexed` 
            : "Connecting to Database..."}
        </span>
      </div>

      {/* Search + Filters Section */}
      <section className="sticky top-[65px] z-30 py-3 bg-[#0F1523]/95 backdrop-blur-sm border-b border-card-border/50">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search cricketers, owners, movies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#1B2236] border border-card-border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-all text-sm shadow-inner"
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className={`px-4 py-3 rounded-xl border flex items-center gap-2 text-sm font-semibold transition-all ${
              selectedTypes.length < 3
                ? 'border-orange-500 bg-orange-950/20 text-orange-400'
                : 'border-card-border bg-[#1B2236] text-gray-300 hover:text-white hover:bg-card-bg'
            }`}
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span className="hidden sm:inline">Filters</span>
            {selectedTypes.length < 3 && (
              <span className="bg-orange-500 text-white rounded-full text-[10px] w-4.5 h-4.5 flex items-center justify-center">
                {selectedTypes.length}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Directory Grid */}
      <section className="space-y-4">
        <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <span>Results ({items.length})</span>
          {selectedTypes.length < 3 && (
            <button 
              onClick={handleClearFilters}
              className="text-orange-500 hover:text-orange-400 text-xs normal-case font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-[#1B2236] border border-card-border rounded-2xl p-5 flex items-center space-x-4 h-28" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const profileLink = item.type === 'cricketer' 
                ? `/player/${item.slug}` 
                : item.type === 'actor' 
                  ? `/actor/${item.slug}` 
                  : `/movies/${item.slug}`;

              const tagBorderColor = item.tagColor === 'orange' 
                ? 'border-orange-500 text-orange-400 bg-orange-950/20' 
                : item.tagColor === 'blue' 
                  ? 'border-blue-500 text-blue-400 bg-blue-950/20' 
                  : 'border-purple-500 text-purple-400 bg-purple-950/20';

              const hoverGlow = item.type === 'cricketer' 
                ? 'hover:border-orange-500/40' 
                : item.type === 'actor' 
                  ? 'hover:border-blue-500/40' 
                  : 'hover:border-purple-500/40';

              return (
                <Link
                  key={`${item.type}-${item.slug}`}
                  href={profileLink}
                  className={`bg-[#1B2236] border border-card-border rounded-2xl p-5 flex items-center space-x-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${hoverGlow}`}
                >
                  <img
                    src={item.photoUrl}
                    alt={item.name}
                    className={`object-cover bg-[#0F1523] border border-card-border shrink-0 ${
                      item.type === 'movie' 
                        ? 'w-14 h-20 rounded-lg' 
                        : 'w-16 h-16 rounded-full'
                    }`}
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${tagBorderColor}`}>
                      {item.type}
                    </span>
                    <h3 className="font-bold text-white text-base truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#1B2236] border border-card-border rounded-2xl p-10 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
            <AlertTriangle className="h-12 w-12 text-amber-500 animate-float" />
            <div className="space-y-2">
              <h3 className="font-extrabold text-white text-lg">No matches found</h3>
              <p className="text-sm text-gray-400 font-medium">
                No results found for <span className="text-white font-semibold">"{search}"</span>. Try checking spelling or search for another term!
              </p>
            </div>
            <button
              onClick={() => {
                setSearch('');
                setSelectedTypes(['cricketer', 'actor', 'movie']);
              }}
              className="px-4 py-2 bg-card-bg border border-card-border rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-colors"
            >
              Reset Search & Filters
            </button>
          </div>
        )}
      </section>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedTypes={selectedTypes}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
