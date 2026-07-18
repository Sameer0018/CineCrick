'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Home, Film, HelpCircle, BookOpen, User, MessageSquare } from 'lucide-react';

export const BottomNav = () => {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Movies', href: '/movies', icon: Film },
    { label: 'Quiz', href: '/quiz', icon: HelpCircle },
    ...(isLoggedIn ? [{ label: 'Chats', href: '/chat/mine', icon: MessageSquare }] : []),
    { label: 'Trivia', href: '/trivia', icon: BookOpen },
    { label: 'Profile', href: isLoggedIn ? '/dashboard' : '/login', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-[#121A2E]/95 border-t border-card-border backdrop-blur-md flex items-center justify-around px-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-0.5 transition-all ${
              isActive 
                ? 'text-orange-500 font-bold scale-105' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
