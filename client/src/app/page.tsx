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
      <section className="relative overflow-hidden rounded-3xl bg-[#0B1120] border border-slate-800/80 p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        {/* Left-aligned text (60%) */}
        <div className="w-full lg:w-[60%] flex flex-col items-start text-left space-y-6 z-10">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/60 text-slate-300 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F97316]"></span>
            </span>
            Built for Cricket × Cinema Fans
          </div>

          {/* Headline */}
          <h1 className="text-[34px] sm:text-5xl lg:text-[56px] font-black text-white leading-[1.15] tracking-tight">
            Know Your Cricket-Cinema <span className="italic text-[#F97316] font-extrabold">Connections</span>
          </h1>

          {/* Subtext */}
          <p className="text-slate-300 text-base lg:text-[18px] leading-relaxed max-w-xl">
            CineCrick is a searchable archive of Indian cricketers, actor-owners, and the movies that connect them — daily trivia, real stats, and a growing community-verified database.
          </p>

          {/* CTA Row */}
          <div className="flex flex-wrap gap-4 items-center pt-2">
            <button
              onClick={handleExploreClick}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-orange-500/10 hover:-translate-y-0.5 cursor-pointer text-sm sm:text-base"
            >
              Explore Directory <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 px-6 py-3.5 border border-slate-700 bg-slate-900/40 text-slate-200 hover:bg-slate-800/80 hover:text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 text-sm sm:text-base"
            >
              {quizAttempted ? 'View Streak Info' : "Play Today's Quiz"}
            </Link>
          </div>
        </div>

        {/* Right-aligned large icon graphic (40%) */}
        <div className="w-full lg:w-[40%] flex justify-center lg:justify-end items-center relative z-10">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
            {/* Background outer glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-orange-500/10 rounded-full filter blur-3xl opacity-70 animate-pulse" />
            
            {/* Graphic SVG */}
            <svg
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full max-w-[280px] sm:max-w-[320px] h-auto drop-shadow-[0_0_30px_rgba(249,115,22,0.25)] animate-float"
            >
              <defs>
                <linearGradient id="hybridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
                <radialGradient id="outerGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F97316" stopOpacity="0.15" />
                  <stop offset="60%" stopColor="#3B82F6" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#0B1120" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Background Glow */}
              <circle cx="100" cy="100" r="90" fill="url(#outerGlow)" />

              {/* Outer Film Reel Sprockets ring */}
              <circle cx="100" cy="100" r="85" stroke="url(#hybridGradient)" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.6" />
              <circle cx="100" cy="100" r="75" stroke="url(#hybridGradient)" strokeWidth="1" opacity="0.3" />

              {/* Film Reel Inner Cutouts */}
              <circle cx="100" cy="45" r="12" stroke="url(#hybridGradient)" strokeWidth="1.5" fill="#0B1120" fillOpacity="0.6" />
              <circle cx="100" cy="155" r="12" stroke="url(#hybridGradient)" strokeWidth="1.5" fill="#0B1120" fillOpacity="0.6" />
              <circle cx="45" cy="100" r="12" stroke="url(#hybridGradient)" strokeWidth="1.5" fill="#0B1120" fillOpacity="0.6" />
              <circle cx="155" cy="100" r="12" stroke="url(#hybridGradient)" strokeWidth="1.5" fill="#0B1120" fillOpacity="0.6" />

              {/* Cricket seam curved lines */}
              {/* Left seam */}
              <path d="M 68 35 C 90 60, 90 140, 68 165" stroke="url(#hybridGradient)" strokeWidth="2.5" strokeDasharray="3 3" />
              <path d="M 65 37 C 87 61, 87 139, 65 163" stroke="url(#hybridGradient)" strokeWidth="1" opacity="0.4" />
              
              {/* Right seam */}
              <path d="M 132 35 C 110 60, 110 140, 132 165" stroke="url(#hybridGradient)" strokeWidth="2.5" strokeDasharray="3 3" />
              <path d="M 135 37 C 113 61, 113 139, 135 163" stroke="url(#hybridGradient)" strokeWidth="1" opacity="0.4" />

              {/* Center Reel core & Spokes */}
              <circle cx="100" cy="100" r="22" stroke="url(#hybridGradient)" strokeWidth="2" fill="#0B1120" />
              <circle cx="100" cy="100" r="8" stroke="url(#hybridGradient)" strokeWidth="1" fill="url(#hybridGradient)" />

              {/* Spokes/Stitches radiating from center */}
              <line x1="100" y1="78" x2="100" y2="57" stroke="url(#hybridGradient)" strokeWidth="1.5" opacity="0.8" />
              <line x1="100" y1="122" x2="100" y2="143" stroke="url(#hybridGradient)" strokeWidth="1.5" opacity="0.8" />
              <line x1="78" y1="100" x2="57" y2="100" stroke="url(#hybridGradient)" strokeWidth="1.5" opacity="0.8" />
              <line x1="122" y1="100" x2="143" y2="100" stroke="url(#hybridGradient)" strokeWidth="1.5" opacity="0.8" />

              {/* Angled Spokes */}
              <line x1="84" y1="84" x2="68" y2="68" stroke="url(#hybridGradient)" strokeWidth="1" opacity="0.5" />
              <line x1="116" y1="84" x2="132" y2="68" stroke="url(#hybridGradient)" strokeWidth="1" opacity="0.5" />
              <line x1="84" y1="116" x2="68" y2="132" stroke="url(#hybridGradient)" strokeWidth="1" opacity="0.5" />
              <line x1="116" y1="116" x2="132" y2="132" stroke="url(#hybridGradient)" strokeWidth="1" opacity="0.5" />
            </svg>
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
