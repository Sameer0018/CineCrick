'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    // SEO Fix: Intrusive Interstitial Penalty Prevention
    // Replaced 2.5s timer with scroll-depth trigger to ensure we don't block content on initial load, especially on mobile.
    const hasSeenPopup = localStorage.getItem('hasSeenSignupPopup');

    if (!hasSeenPopup) {
      const handleScroll = () => {
        // Trigger popup only after user shows intent by scrolling
        if (window.scrollY > 300) { 
          setIsOpen(true);
          window.removeEventListener('scroll', handleScroll);
        }
      };
      
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const closePopup = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenSignupPopup', 'true');
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !agreed) {
      return;
    }
    // Placeholder for actual signup API call
    console.log('Signed up with username:', username);
    closePopup();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-[850px] bg-white rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex flex-col md:flex-row min-h-[450px] animate-in zoom-in-95 duration-500">

        {/* Close Button */}
        <button
          onClick={closePopup}
          className="absolute top-4 right-4 md:-top-3 md:-right-3 md:translate-x-0 md:translate-y-0 w-8 h-8 md:w-10 md:h-10 bg-black text-white flex items-center justify-center rounded shadow-lg hover:bg-gray-800 transition-colors z-20"
          aria-label="Close popup"
        >
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Left Image Section */}
        <div className="hidden md:block w-full md:w-1/2 relative rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none overflow-hidden min-h-[250px] md:min-h-full">
          <img
            src="https://res.cloudinary.com/diad73kp1/image/upload/v1784442873/ChatGPT_Image_Jul_19_2026_12_00_02_PM_ugb9rp.png"
            alt="Join our community of data science and developer professionals"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Right Form Section - Added Missing Form Elements with Semantic HTML */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create an Account</h2>
          <p className="text-gray-600 mb-6">Join to access exclusive content and tutorials.</p>
          
          <form onSubmit={handleSubscribe} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex items-center">
              <input
                id="agreed"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <label htmlFor="agreed" className="ml-2 block text-sm text-gray-900">
                I agree to the Terms of Service
              </label>
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Sign Up
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
