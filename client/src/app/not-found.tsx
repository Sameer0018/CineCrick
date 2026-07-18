'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto py-10 flex flex-col justify-center min-h-[70vh]">
      <div className="bg-[#1B2236] border border-card-border rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
        <div className="text-5xl">🏏🎬❓</div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">404 — Page Missed!</h2>
          <p className="text-sm text-gray-400 font-medium">
            Looks like this route went for a duck. Here is a quick crossover trivia fact instead:
          </p>
        </div>

        <div className="p-5 bg-[#0F1523] border border-card-border rounded-2xl text-left space-y-2">
          <div className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">CineCrick Fact</div>
          <p className="text-xs text-gray-300 leading-relaxed font-light">
            Did you know? MS Dhoni was once a railway ticket collector at Kharagpur railway station, and Sushant Singh Rajput lived with him to capture his helicopter shot accent and posture.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-md transition-all gap-1.5 text-sm cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Safety (Home)
          </Link>
        </div>
      </div>
    </div>
  );
}
