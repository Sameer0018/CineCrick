'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '../../../lib/api';
import { ArrowLeft, User, Users, Calendar, Video } from 'lucide-react';

interface CastMember {
  name: string;
  character: string;
}

interface RelatedCricketer {
  name: string;
  slug: string;
  photoUrl: string;
  roleType: string;
}

interface MovieDetails {
  title: string;
  slug: string;
  posterUrl: string;
  releaseYear: number;
  plot: string;
  cast: CastMember[];
  relatedCricketers: RelatedCricketer[];
}

export default function MovieDetailPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;

    apiRequest(`/api/directory/movies/${slug}`)
      .then((data) => {
        setMovie(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching movie details:', err);
        setError('Movie details not found.');
        setLoading(false);
      });
  }, [slug]);

  const getActorSlug = (name: string) => {
    // Generate a simple slug matching our seed slugs for actors like "preity-zinta", "shah-rukh-khan"
    const lowerName = name.toLowerCase();
    if (lowerName.includes('shah rukh khan')) return 'shah-rukh-khan';
    if (lowerName.includes('preity zinta')) return 'preity-zinta';
    if (lowerName.includes('juhi chawla')) return 'juhi-chawla';
    if (lowerName.includes('abhishek bachchan')) return 'abhishek-bachchan';
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-10 animate-pulse">
        <div className="h-6 w-20 bg-[#1B2236] rounded-lg" />
        <div className="flex flex-col md:flex-row items-center gap-8 bg-[#1B2236] border border-card-border rounded-3xl p-8 h-96" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="text-4xl">🎬❌</div>
        <h2 className="text-2xl font-bold text-white">Movie Not Found</h2>
        <p className="text-sm text-gray-400">{error || 'The requested movie details could not be loaded.'}</p>
        <button
          onClick={() => router.push('/movies')}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-xs font-semibold text-white transition-colors"
        >
          Back to Movies
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
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Main Movie Poster + Plot Card */}
      <section className="bg-gradient-to-br from-[#1B2236] to-[#121829] border border-card-border rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />

        <img 
          src={movie.posterUrl} 
          alt={movie.title} 
          className="w-48 h-64 rounded-2xl object-cover bg-[#0F1523] border border-card-border shrink-0 shadow-lg glow-purple"
        />

        <div className="space-y-4 flex-grow text-center md:text-left min-w-0">
          <div className="space-y-1">
            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-extrabold uppercase border border-purple-500 text-purple-400 bg-purple-950/20">
              Cricket Movie
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight break-words">{movie.title}</h1>
            <div className="flex items-center justify-center md:justify-start text-sm text-gray-400 gap-1.5 font-medium">
              <Calendar className="h-4 w-4 text-purple-400" />
              <span>Released in {movie.releaseYear}</span>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Plot Summary</h4>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light">
              {movie.plot}
            </p>
          </div>
        </div>
      </section>

      {/* Crossover Cricketers Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Video className="h-5 w-5 text-orange-500" /> Cricketers Connected
        </h3>
        
        {movie.relatedCricketers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {movie.relatedCricketers.map((cricketer) => (
              <Link 
                key={cricketer.slug}
                href={`/player/${cricketer.slug}`}
                className="bg-[#1B2236] border border-card-border hover:border-orange-500/40 p-4 rounded-2xl flex items-center space-x-4 shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <img 
                  src={cricketer.photoUrl} 
                  alt={cricketer.name} 
                  className="w-12 h-12 rounded-full object-cover bg-[#0F1523] border border-card-border shrink-0"
                />
                <div className="space-y-1 flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm truncate">{cricketer.name}</h4>
                  <p className="text-xs text-orange-400 font-bold">
                    Crossover Link: <span className="underline decoration-dotted">{cricketer.roleType}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-[#1B2236] border border-card-border p-6 rounded-2xl text-center text-sm text-gray-400">
            No specific real cricketer cameo/biopic linked in database yet.
          </div>
        )}
      </section>

      {/* Star Cast Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" /> Star Cast & Owners
        </h3>
        
        {movie.cast.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {movie.cast.map((member, i) => {
              const actorSlug = getActorSlug(member.name);
              const CastContent = (
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className={`font-bold text-xs truncate ${actorSlug ? 'text-blue-400 group-hover:text-blue-300 underline' : 'text-white'}`}>
                      {member.name}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate">as {member.character}</div>
                  </div>
                </div>
              );

              return actorSlug ? (
                <Link
                  key={i}
                  href={`/actor/${actorSlug}`}
                  className="group bg-[#1B2236] border border-card-border hover:border-blue-500/40 p-4 rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-0.5"
                >
                  {CastContent}
                </Link>
              ) : (
                <div 
                  key={i}
                  className="bg-[#1B2236] border border-card-border p-4 rounded-2xl shadow-md"
                >
                  {CastContent}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#1B2236] border border-card-border p-6 rounded-2xl text-center text-sm text-gray-400">
            Cast details not listed.
          </div>
        )}
      </section>
    </div>
  );
}
