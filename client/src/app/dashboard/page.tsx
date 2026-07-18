'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Flame, Trophy, Award, Calendar, HelpCircle, User, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Badge {
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface QuizHistoryItem {
  date: string;
  question: string;
  isCorrect: boolean;
}

interface DashboardData {
  currentStreak: number;
  longestStreak: number;
  rank: number;
  totalPoints: number;
  badges: Badge[];
  quizHistory: QuizHistoryItem[];
}

export default function DashboardPage() {
  const { isLoggedIn, email } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    apiRequest('/api/dashboard/me')
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching dashboard data:', err);
        setLoading(false);
      });
  }, [isLoggedIn]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 animate-pulse space-y-6">
        <div className="h-10 w-48 bg-[#1B2236] rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[#1B2236] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Header Profiler */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-br from-[#1B2236] to-[#121829] border border-card-border p-6 rounded-3xl gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-orange-500/10 rounded-full border border-orange-500/30 text-orange-500">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{email?.split('@')[0]}</h1>
            <p className="text-xs text-gray-400 font-semibold">{email}</p>
          </div>
        </div>
        
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F1523] border border-card-border rounded-xl text-xs text-gray-300">
          <Calendar className="h-4 w-4 text-orange-500" />
          <span>Active Buff Since 2026</span>
        </div>
      </div>

      {/* Onboarding Explanation Tooltip */}
      <section className="bg-orange-950/20 border border-orange-500/20 p-5 rounded-2xl space-y-2">
        <h3 className="font-bold text-orange-400 text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-float" /> Streak Rules & Gamification
        </h3>
        <p className="text-xs text-orange-200/80 leading-relaxed font-medium">
          Answer exactly **one daily quiz question** to keep your streak alive. Answering correctly awards 30 points, while participation alone awards 10 points and extends your streak statistics. Missing a calendar day resets your streak to 0!
        </p>
      </section>

      {/* Core Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Streak */}
        <div className="bg-[#1B2236] border border-card-border p-5 rounded-2xl text-center space-y-1 relative overflow-hidden group shadow-md">
          <div className="absolute top-0 right-0 w-12 h-12 bg-orange-500/10 rounded-full blur-lg" />
          <Flame className="h-8 w-8 text-orange-500 fill-orange-500 mx-auto animate-float" />
          <span className="text-[10px] text-gray-500 font-bold uppercase block pt-1">Current Streak</span>
          <div className="text-2xl font-black text-white">{data.currentStreak} Days</div>
        </div>

        {/* Longest Streak */}
        <div className="bg-[#1B2236] border border-card-border p-5 rounded-2xl text-center space-y-1 relative overflow-hidden group shadow-md">
          <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-full blur-lg" />
          <Flame className="h-8 w-8 text-amber-500 fill-amber-500 mx-auto" />
          <span className="text-[10px] text-gray-500 font-bold uppercase block pt-1">Longest Streak</span>
          <div className="text-2xl font-black text-white">{data.longestStreak} Days</div>
        </div>

        {/* Global Rank */}
        <div className="bg-[#1B2236] border border-card-border p-5 rounded-2xl text-center space-y-1 relative overflow-hidden group shadow-md">
          <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-500/10 rounded-full blur-lg" />
          <Trophy className="h-8 w-8 text-yellow-500 mx-auto" />
          <span className="text-[10px] text-gray-500 font-bold uppercase block pt-1">All-time Rank</span>
          <div className="text-2xl font-black text-white">#{data.rank} Rank</div>
        </div>

        {/* Total Points */}
        <div className="bg-[#1B2236] border border-card-border p-5 rounded-2xl text-center space-y-1 relative overflow-hidden group shadow-md">
          <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-full blur-lg" />
          <Award className="h-8 w-8 text-blue-500 mx-auto" />
          <span className="text-[10px] text-gray-500 font-bold uppercase block pt-1">Total Score</span>
          <div className="text-2xl font-black text-white">{data.totalPoints} Points</div>
        </div>
      </section>

      {/* Badges Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" /> Unlockable Badges
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.badges.map((badge) => (
            <div
              key={badge.name}
              className={`p-4 rounded-2xl border flex items-center space-x-4 shadow-md transition-all ${
                badge.unlocked
                  ? 'bg-[#1B2236] border-card-border'
                  : 'bg-[#1B2236]/30 border-card-border/40 opacity-55'
              }`}
            >
              <div className="text-3xl shrink-0 p-2 bg-[#0F1523] rounded-xl border border-card-border">
                {badge.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-white text-sm">{badge.name}</h4>
                  {badge.unlocked && (
                    <span className="px-1.5 py-0.5 rounded-full bg-green-950/20 border border-green-500/30 text-green-500 text-[9px] font-bold uppercase">
                      Unlocked
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 font-semibold leading-relaxed mt-0.5">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Attempt History */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-purple-500" /> Quiz History (Last 10)
        </h3>
        
        {data.quizHistory.length > 0 ? (
          <div className="bg-[#1B2236] border border-card-border rounded-2xl overflow-hidden shadow-md divide-y divide-card-border/50">
            {data.quizHistory.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 text-xs sm:text-sm font-semibold">
                <div className="space-y-1 pr-4 min-w-0">
                  <div className="text-white truncate">{item.question}</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 border ${
                  item.isCorrect
                    ? 'border-green-500 text-green-400 bg-green-950/20'
                    : 'border-red-500 text-red-400 bg-red-950/20'
                }`}>
                  {item.isCorrect ? 'Correct' : 'Incorrect'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1B2236] border border-card-border p-8 rounded-2xl text-center text-sm text-gray-400">
            You haven't participated in any quizzes yet. Head over to the{' '}
            <Link href="/quiz" className="text-orange-500 underline font-bold">Quiz Page</Link> to start!
          </div>
        )}
      </section>
    </div>
  );
}
