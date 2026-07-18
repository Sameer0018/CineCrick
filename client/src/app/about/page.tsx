'use client';

import React from 'react';
import { Info, HelpCircle, Flame, Database } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto py-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2">
          <Info className="h-8 w-8 text-orange-500" /> About CineCrick
        </h1>
        <p className="text-sm text-gray-400 font-medium">The ultimate trivia crossover of Indian Cricket & Cinema.</p>
      </div>

      <section className="bg-[#1B2236] border border-card-border p-6 rounded-2xl space-y-4 shadow-md">
        <h3 className="font-bold text-white text-lg flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-orange-500" /> What is CineCrick?
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed font-light">
          CineCrick is a gamified discovery platform that maps the rich connections between Indian cricket and regional or Bollywood cinema. Whether it's biopics like <span className="text-purple-400 font-semibold">83</span>, cricketer cameos in films, or celebrity IPL ownership (like Shah Rukh Khan's KKR or Preity Zinta's Punjab Kings), we bring you all the facts in a unified directory.
        </p>
      </section>

      <section className="bg-[#1B2236] border border-card-border p-6 rounded-2xl space-y-4 shadow-md">
        <h3 className="font-bold text-white text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" /> Daily Quiz & Streaks
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed font-light">
          We release exactly **one trivia question every calendar day**. Answering the quiz keeps your streak active!
        </p>
        <ul className="text-xs text-gray-400 list-disc list-inside space-y-1.5 font-medium pl-2">
          <li>Streak extends on participation, regardless of whether your answer is right or wrong.</li>
          <li>Missing a full day (based on Server time) resets your active streak back to 0.</li>
          <li>Earn 10 points for participating, and an extra 20 points for answering correctly!</li>
        </ul>
      </section>

      <section className="bg-[#1B2236]/50 border border-dashed border-card-border p-6 rounded-2xl space-y-3">
        <h3 className="font-bold text-white text-sm flex items-center gap-2 uppercase tracking-wider text-gray-400">
          <Database className="h-4 w-4" /> Data & Licensing Disclaimer
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          CineCrick utilizes search parameters and profiles compiled from public resources, sports news outlets, film databases (IMDb), and IPL registry sheets. This platform is constructed purely for educational trivia and entertainment purposes. All trademarks, logos, and images belong to their respective owners.
        </p>
      </section>
    </div>
  );
}
