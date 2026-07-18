'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock Google popup states
  const [showGoogleMock, setShowGoogleMock] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      login(response.accessToken, response.refreshToken, response.email, response.isAdmin);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !googleEmail.includes('@')) {
      alert('Please enter a valid Google email.');
      return;
    }

    try {
      setLoading(true);
      setShowGoogleMock(false);
      
      const response = await apiRequest('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ 
          token: 'MOCK_GOOGLE_ID_TOKEN_123456', 
          email: googleEmail, 
          name: googleEmail.split('@')[0] 
        }),
      });

      login(response.accessToken, response.refreshToken, response.email, response.isAdmin);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google Auth simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 flex flex-col justify-center min-h-[70vh] space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-sm text-gray-400 font-medium">
          {isRegister ? 'Join CineCrick to track streaks and rank on leaderboards.' : 'Sign in to answer today\'s daily trivia.'}
        </p>
      </div>

      <div className="bg-[#1B2236] border border-card-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-xl font-semibold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#0F1523] border border-card-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#0F1523] border border-card-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-850 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {isRegister ? 'Sign Up' : 'Sign In'} <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-card-border"></div>
          <span className="flex-shrink mx-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Or continue with</span>
          <div className="flex-grow border-t border-card-border"></div>
        </div>

        <button
          onClick={() => setShowGoogleMock(true)}
          className="w-full py-3 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <GoogleIcon className="h-5 w-5" />
          Sign in with Google
        </button>

        <div className="text-center text-xs font-semibold text-gray-400">
          {isRegister ? 'Already have an account?' : 'Don\'t have an account yet?'}{' '}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-orange-500 hover:underline font-extrabold cursor-pointer"
          >
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 font-semibold">
        By continuing, you agree to CineCrick's{' '}
        <Link href="/terms" className="underline hover:text-white">Terms & Privacy</Link>.
      </div>

      {/* Simulated Google popup modal */}
      {showGoogleMock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1B2236] border border-card-border p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl relative">
            <div className="text-center space-y-1">
              <GoogleIcon className="h-8 w-8 mx-auto" />
              <h3 className="font-extrabold text-white text-lg">Simulated Google Auth</h3>
              <p className="text-xs text-gray-400 font-medium">Enter a mock Google account email to log in instantly.</p>
            </div>

            <form onSubmit={handleGoogleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="googleuser@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#0F1523] border border-card-border rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleMock(false)}
                  className="flex-1 py-2.5 bg-card-bg border border-card-border hover:bg-card-bg/85 rounded-lg text-xs font-semibold text-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Confirm Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
