'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '../../../lib/api';
import { ArrowLeft, Award, Film } from 'lucide-react';

interface LinkedMovie {
  title: string;
  slug: string;
  posterUrl: string;
  roleType: string;
  releaseYear: number;
}

interface CricketerProfile {
  name: string;
  slug: string;
  photoUrl: string;
  bio: string;
  iplTeam: string;
  stats: Record<string, string>;
  movies: LinkedMovie[];
}

export default function CricketerProfilePage() {
  const { slug } = useParams();
  const router = useRouter();

  const [profile, setProfile] = useState<CricketerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;

    apiRequest(`/api/directory/player/${slug}`)
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching player profile:', err);
        setError('Cricketer profile not found.');
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-10 animate-pulse">
        <div className="h-6 w-20 bg-[#1B2236] rounded-lg" />
        <div className="flex flex-col md:flex-row items-center gap-8 bg-[#1B2236] border border-card-border rounded-3xl p-8 h-80" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="text-4xl">🏏❌</div>
        <h2 className="text-2xl font-bold text-white">Profile Not Found</h2>
        <p className="text-sm text-gray-400">{error || 'The requested cricketer details could not be loaded.'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-xs font-semibold text-white transition-colors"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Directory
      </button>

      {/* Main Profile Card */}
      <section className="bg-gradient-to-br from-[#1B2236] to-[#121829] border border-card-border rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />

        <img 
          src={profile.photoUrl} 
          alt={profile.name} 
          className="w-40 h-40 rounded-full object-cover border-4 border-orange-500/30 glow-orange"
        />

        <div className="space-y-4 flex-1 text-center md:text-left">
          <div className="space-y-1">
            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-extrabold uppercase border border-orange-500 text-orange-400 bg-orange-950/20">
              Cricketer
            </span>
            <h1 className="text-3xl font-extrabold text-white">{profile.name}</h1>
            <p className="text-sm text-gray-400 font-medium">
              IPL Franchise: <span className="text-orange-400 font-bold">{profile.iplTeam}</span>
            </p>
          </div>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light">
            {profile.bio}
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Award className="h-5 w-5 text-orange-500" /> Career Milestones
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(profile.stats).map(([label, value]) => (
            <div key={label} className="bg-[#1B2236] border border-card-border p-4 rounded-2xl text-center space-y-1.5 shadow-md">
              <span className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
              <div className="text-xl sm:text-2xl font-black text-white bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Movie Crossovers Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Film className="h-5 w-5 text-purple-500" /> Cinema Crossovers
        </h3>
        
        {profile.movies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.movies.map((movie) => (
              <Link 
                key={movie.slug}
                href={`/movies/${movie.slug}`}
                className="bg-[#1B2236] border border-card-border hover:border-purple-500/40 p-4 rounded-2xl flex items-center space-x-4 shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <img 
                  src={movie.posterUrl} 
                  alt={movie.title} 
                  className="w-12 h-18 rounded-lg object-cover bg-[#0F1523] border border-card-border shrink-0"
                />
                <div className="space-y-1 flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm truncate">{movie.title}</h4>
                  <p className="text-xs text-purple-400 font-bold">
                    Crossover: <span className="underline decoration-dotted">{movie.roleType}</span>
                  </p>
                  <p className="text-[10px] text-gray-400">Release Year: {movie.releaseYear}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-[#1B2236] border border-card-border p-6 rounded-2xl text-center text-sm text-gray-400">
            No movie or cameo appearances listed yet for {profile.name}.
          </div>
        )}
      </section>
    </div>
  );
}
