'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Search, Flame, LogOut, ShieldAlert, User, Film, HelpCircle, Trophy, MessageSquare } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export const Navbar = () => {
  const { isLoggedIn, email, isAdmin, streak, logout } = useAuth();
  const { unreadCount } = useChat();
  const router = useRouter();

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/?focus=true');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-card-border bg-[#0F1523]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-extrabold tracking-wider bg-gradient-to-r from-orange-500 via-amber-400 to-blue-500 bg-clip-text text-transparent">
                CineCrick
              </span>
            </Link>
          </div>

          {/* Navigation Links - Desktop only */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="text-gray-300 hover:text-orange-400 transition-colors">Directory</Link>
            <Link href="/movies" className="text-gray-300 hover:text-purple-400 transition-colors">Movies</Link>
            <Link href="/trivia" className="text-gray-300 hover:text-blue-400 transition-colors">Trivia Feed</Link>
            <Link href="/quiz" className="text-gray-300 hover:text-amber-400 transition-colors font-semibold flex items-center gap-1">
              <HelpCircle className="h-4 w-4" /> Daily Quiz
            </Link>
            <Link href="/leaderboard" className="text-gray-300 hover:text-yellow-400 transition-colors flex items-center gap-1">
              <Trophy className="h-4 w-4" /> Leaderboard
            </Link>
            <Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search Button */}
            <button 
              onClick={handleSearchClick}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-card-bg transition-all"
              title="Search Directory"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Streak Flame (only if logged in) */}
            {isLoggedIn && (
              <div 
                className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-orange-950/40 border border-orange-500/30 text-orange-500 animate-float cursor-pointer hover:bg-orange-950/60 transition-all"
                onClick={() => router.push('/dashboard')}
                title="Your Streak!"
              >
                <Flame className="h-5 w-5 fill-orange-500 text-orange-500" />
                <span className="font-extrabold text-sm">{streak}</span>
              </div>
            )}

            {/* Authenticated Controls */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Admin Dashboard */}
                {isAdmin && (
                  <Link 
                    href="/admin" 
                    className="p-2 rounded-full text-amber-500 hover:text-amber-400 hover:bg-card-bg transition-all"
                    title="Admin Console"
                  >
                    <ShieldAlert className="h-5 w-5" />
                  </Link>
                )}

                {/* Anonymous Chat link */}
                <Link 
                  href="/chat/mine" 
                  className="relative p-2 rounded-full text-gray-400 hover:text-white hover:bg-card-bg transition-all"
                  title="My Chats"
                >
                  <MessageSquare className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white leading-none">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* Dashboard Profile */}
                <Link 
                  href="/dashboard" 
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-card-bg border border-card-border hover:border-gray-500 transition-all text-xs font-semibold text-gray-300"
                  title="My Dashboard"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline max-w-[100px] truncate">{email?.split('@')[0]}</span>
                </Link>

                {/* Logout */}
                <button 
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                  className="p-2 rounded-full text-red-400 hover:text-red-300 hover:bg-card-bg transition-all"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3.5 py-1.5 text-sm font-semibold text-white shadow-md hover:from-orange-600 hover:to-amber-600 transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
