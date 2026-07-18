'use client';

import React from 'react';
import { ShieldCheck, Lock, Mail, Users } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto py-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2">
          <ShieldCheck className="h-8 w-8 text-blue-500" /> Terms & Privacy
        </h1>
        <p className="text-sm text-gray-400 font-medium">Clear information regarding your data and privacy.</p>
      </div>

      <div className="space-y-6">
        <section className="bg-[#1B2236] border border-card-border p-6 rounded-2xl space-y-3 shadow-md">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-400" /> Data Collection
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed font-light">
            When you register an account or log in via Google OAuth, we collect your email address. This email is used strictly as a unique identifier to save your quiz answers, active streak statistics, and leaderboard rankings.
          </p>
        </section>

        <section className="bg-[#1B2236] border border-card-border p-6 rounded-2xl space-y-3 shadow-md">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-400" /> Information Security
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed font-light">
            We store password hashes using BCrypt cryptography. We do not store plain-text passwords or share your email with third-party advertising services.
          </p>
        </section>

        <section className="bg-[#1B2236] border border-card-border p-6 rounded-2xl space-y-3 shadow-md">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" /> User Responsibilities
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed font-light">
            By creating an account, you agree to participate fairly. Scripted quiz answering or automated attempts to manipulate the leaderboards will result in username resets.
          </p>
        </section>
      </div>
    </div>
  );
}
