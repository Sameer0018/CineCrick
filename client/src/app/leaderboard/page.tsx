'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import { Trophy, Flame, Loader2, Award } from 'lucide-react';

interface LeaderboardItem {
  rank: number;
  email: string;
  score: number;
  currentStreak: number;
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all-time'>('all-time');
  const [list, setList] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/api/leaderboard?period=${period}`);
      setList(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  return (
    <div className="space-y-8 max-w-2xl mx-auto py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2 font-sans">
          <Trophy className="h-8 w-8 text-yellow-500 animate-float" /> Global Leaderboard
        </h1>
        <p className="text-sm text-gray-400 font-medium">Compete with cricket and cinema buffs worldwide.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#1B2236] border border-card-border p-1 rounded-xl">
        {(['weekly', 'monthly', 'all-time'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setPeriod(tab)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              period === tab
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-[#1B2236] border border-card-border rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Loading rankings...</span>
          </div>
        ) : list.length > 0 ? (
          <div className="divide-y divide-card-border/50">
            {list.map((item) => {
              let rankStyle = 'text-gray-400';
              let badgeEmoji = null;

              if (item.rank === 1) {
                rankStyle = 'text-yellow-500 text-lg font-black';
                badgeEmoji = '🥇';
              } else if (item.rank === 2) {
                rankStyle = 'text-gray-300 text-lg font-black';
                badgeEmoji = '🥈';
              } else if (item.rank === 3) {
                rankStyle = 'text-amber-600 text-lg font-black';
                badgeEmoji = '🥉';
              }

              return (
                <div
                  key={`${item.email}-${item.rank}`}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-card-bg/30 transition-colors"
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className={`w-8 font-bold text-center shrink-0 ${rankStyle}`}>
                      {badgeEmoji || item.rank}
                    </div>

                    <div className="min-w-0">
                      <div className="font-extrabold text-white text-sm sm:text-base truncate">
                        {item.email.split('@')[0]}
                      </div>
                      <div className="text-[10px] text-gray-500 font-semibold uppercase truncate">
                        {item.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    {item.currentStreak > 0 && (
                      <div className="flex items-center space-x-0.5 text-orange-500" title="Active Streak">
                        <Flame className="h-4 w-4 fill-orange-500" />
                        <span className="text-xs font-black">{item.currentStreak}</span>
                      </div>
                    )}

                    <div className="text-right">
                      <div className="text-sm sm:text-base font-black text-white bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                        {item.score} pts
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400 space-y-2">
            <Award className="h-10 w-10 mx-auto text-gray-500" />
            <p className="text-sm font-semibold">No scores logged for this period yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
