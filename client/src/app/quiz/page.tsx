'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Flame, HelpCircle, Share2, Sparkles, Check, X } from 'lucide-react';
import Link from 'next/link';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  category: string;
}

export default function QuizPage() {
  const { isLoggedIn, updateStreak } = useAuth();
  const router = useRouter();

  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [correctOption, setCorrectOption] = useState(-1);

  // Active quiz states
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; left: string; color: string; delay: string; duration: string }[]>([]);
  const [funFact, setFunFact] = useState('');
  const [pointsEarned, setPointsEarned] = useState(0);

  // Streak update stats
  const [resultStreak, setResultStreak] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    apiRequest('/api/quiz/today')
      .then((res) => {
        if (res.alreadyAnswered) {
          setAlreadyPlayed(true);
          setWasCorrect(res.wasCorrect);
          setCorrectOption(res.correctOption);
        } else {
          setQuestion(res);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching today\'s quiz:', err);
        setLoading(false);
      });
  }, [isLoggedIn]);

  const handleOptionSelect = async (idx: number) => {
    if (submitted || !question) return;
    setSelectedIdx(idx);
    
    try {
      const data = await apiRequest('/api/quiz/answer', {
        method: 'POST',
        body: JSON.stringify({ questionId: question.id, selectedOption: idx })
      });

      setSubmitted(true);
      setCorrectOption(data.correctOption);
      setWasCorrect(data.isCorrect);
      setFunFact(data.funFact);
      setResultStreak(data.currentStreak);
      setPointsEarned(10 + (data.isCorrect ? 20 : 0));

      // Sync streak in top Navbar context
      updateStreak(data.currentStreak, data.longestStreak);

      if (data.isCorrect) {
        triggerConfettiParticles();
      } else {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch (err) {
      console.error('Error submitting quiz answer:', err);
    }
  };

  const triggerConfettiParticles = () => {
    const colors = ['#F97316', '#3B82F6', '#A855F7', '#10B981', '#F43F5E', '#FBBF24'];
    const particles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: `${Math.random() * 1.5}s`,
      duration: `${2 + Math.random() * 2}s`
    }));
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 4500);
  };

  const handleShare = () => {
    const shareText = `🏏 CineCrick Daily Trivia 🔥\nStreak: ${resultStreak || 'Active'} days!\nPlay daily crossover trivia at: ${window.location.origin}`;
    navigator.clipboard.writeText(shareText)
      .then(() => alert('Streak score copied to clipboard! Share it with friends.'))
      .catch(() => alert('Failed to copy to clipboard.'));
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto py-20 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-[#1B2236] mx-auto rounded-lg" />
        <div className="h-40 w-full bg-[#1B2236] rounded-3xl" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 w-full bg-[#1B2236] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Not Logged In State
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-10 flex flex-col justify-center min-h-[70vh]">
        <div className="bg-[#1B2236] border border-card-border rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl animate-float" />
          <Flame className="h-16 w-16 text-orange-500 fill-orange-500 mx-auto animate-pulse-ring rounded-full p-2" />
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Daily Trivia Locked</h2>
            <p className="text-sm text-gray-400 font-medium">
              Join the daily quiz loop to build your participation streak, earn points, and rank on the leaderboards!
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              Sign In to Play
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Already Played Today State
  if (alreadyPlayed) {
    return (
      <div className="max-w-md mx-auto py-10 flex flex-col justify-center min-h-[70vh]">
        <div className="bg-[#1B2236] border border-card-border rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl" />
          <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center border-4 ${
            wasCorrect ? 'border-green-500 bg-green-950/20 text-green-500' : 'border-red-500 bg-red-950/20 text-red-500'
          }`}>
            {wasCorrect ? <Check className="h-8 w-8" /> : <X className="h-8 w-8" />}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white font-sans">Already Played Today!</h2>
            <p className="text-sm text-gray-400 font-medium">
              {wasCorrect ? "You nailed today's trivia!" : "You missed the correct answer, but your streak is safe!"}
            </p>
          </div>

          <div className="p-4 bg-[#0F1523] border border-card-border rounded-2xl flex items-center justify-around">
            <div className="text-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Points Earned</span>
              <div className="text-xl font-extrabold text-white">+{wasCorrect ? 30 : 10}</div>
            </div>
            <div className="h-8 border-l border-card-border" />
            <div className="text-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Status</span>
              <div className={`text-sm font-extrabold uppercase ${wasCorrect ? 'text-green-500' : 'text-red-500'}`}>
                {wasCorrect ? 'Correct' : 'Incorrect'}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 font-medium">
            Trivia resets at **00:00 UTC**. Come back tomorrow for the next challenge!
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <Share2 className="h-4 w-4" /> Share Score
            </button>
            <Link
              href="/dashboard"
              className="flex-1 py-2.5 bg-card-bg border border-card-border text-gray-300 font-semibold rounded-xl hover:text-white transition-all flex items-center justify-center text-xs"
            >
              My Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-4 space-y-6 relative min-h-[80vh] flex flex-col justify-center overflow-hidden">
      {/* Render Confetti Particles if Correct */}
      {confetti.map((c) => (
        <span
          key={c.id}
          className="animate-confetti"
          style={{
            left: c.left,
            backgroundColor: c.color,
            animationDelay: c.delay,
            animationDuration: c.duration,
          }}
        />
      ))}

      {/* Category header */}
      <div className="text-center space-y-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="h-3.5 w-3.5" /> {question?.category}
        </span>
      </div>

      {/* Question Card */}
      <div className={`bg-[#1B2236] border border-card-border rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all ${
        isShaking ? 'animate-shake border-red-500/60' : ''
      }`}>
        <h2 className="text-xl sm:text-2xl font-black text-white text-center leading-snug">
          {question?.question}
        </h2>
      </div>

      {/* Options Stack */}
      <div className="space-y-3">
        {question?.options.map((opt, idx) => {
          let optionStyle = 'border-card-border bg-[#1B2236] text-gray-300 hover:border-gray-500';
          
          if (submitted) {
            if (idx === correctOption) {
              optionStyle = 'border-green-500 bg-green-950/30 text-green-400 font-bold scale-102';
            } else if (idx === selectedIdx) {
              optionStyle = 'border-red-500 bg-red-950/30 text-red-400 font-bold';
            } else {
              optionStyle = 'border-card-border bg-[#1B2236]/40 text-gray-500 cursor-not-allowed';
            }
          }

          return (
            <button
              key={idx}
              disabled={submitted}
              onClick={() => handleOptionSelect(idx)}
              className={`w-full p-4 rounded-2xl border text-left text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
            >
              <span>{opt}</span>
              {submitted && idx === correctOption && <Check className="h-5 w-5 text-green-500 shrink-0" />}
              {submitted && idx === selectedIdx && idx !== correctOption && <X className="h-5 w-5 text-red-500 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Post-Submission Fun Fact Display */}
      {submitted && (
        <div className="bg-[#1B2236] border border-card-border p-6 rounded-3xl space-y-4 shadow-xl animate-in fade-in duration-500">
          <div className="flex items-center gap-2 text-xs font-extrabold text-orange-400 uppercase tracking-widest">
            <Sparkles className="h-4 w-4" /> Crossover Fact
          </div>
          <p className="text-sm text-gray-300 leading-relaxed font-light">{funFact}</p>

          <div className="pt-4 border-t border-card-border flex items-center justify-between">
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="h-6 w-6 fill-orange-500 animate-float" />
              <span className="text-lg font-black">{resultStreak} Days Streak</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Points Earned</span>
              <div className="text-sm font-black text-white">+{pointsEarned} Points</div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleShare}
              className="flex-grow py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <Share2 className="h-4 w-4" /> Share Score
            </button>
            <Link
              href="/dashboard"
              className="py-3 px-4 bg-card-bg border border-card-border text-gray-300 font-semibold rounded-xl hover:text-white transition-all text-xs"
            >
              My Profile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
