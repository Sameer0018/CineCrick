'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';
import { Film, Calendar, ArrowRight } from 'lucide-react';

interface MovieItem {
  title: string;
  slug: string;
  posterUrl: string;
  roleType: string;
  releaseYear: number;
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/directory/movies')
      .then((data) => {
        setMovies(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching movies:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center sm:text-left space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
          <Film className="h-8 w-8 text-purple-500" /> Cricket Movies
        </h1>
        <p className="text-sm text-gray-400 font-medium">Explore cinematic features, documentaries, and biopics focused on cricket.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-[#1B2236] border border-card-border rounded-2xl h-80" />
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <Link
              key={movie.slug}
              href={`/movies/${movie.slug}`}
              className="group bg-[#1B2236] border border-card-border hover:border-purple-500/40 rounded-2xl overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl flex flex-col"
            >
              {/* Poster Cover */}
              <div className="relative aspect-[3/4] overflow-hidden bg-[#0F1523] border-b border-card-border">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Movie info */}
              <div className="p-4 space-y-2 flex-grow flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-purple-400 transition-colors line-clamp-2">
                    {movie.title}
                  </h3>
                  <div className="flex items-center text-xs text-gray-400 gap-1">
                    <Calendar className="h-3.5 w-3.5 text-purple-400" />
                    <span>{movie.releaseYear}</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-card-border/50 flex items-center justify-between text-xs font-bold text-purple-400 group-hover:text-purple-300">
                  <span>View Details</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-[#1B2236] border border-card-border p-12 rounded-2xl text-center text-gray-400">
          No cricket movies found in the database.
        </div>
      )}
    </div>
  );
}
