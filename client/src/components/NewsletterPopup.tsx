'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the popup
    const hasSeenPopup = localStorage.getItem('hasSeenSignupPopup');

    // For development/testing purposes, if you want it to show every time, 
    // comment out the next line. Otherwise, it only shows on first visit.
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2500); // Show after 2.5 seconds
      return () => clearTimeout(timer);
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
        <div className="w-full md:w-[98%] relative rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none overflow-hidden min-h-[250px] md:min-h-full">
          <img
            src="https://res.cloudinary.com/diad73kp1/image/upload/v1784442873/ChatGPT_Image_Jul_19_2026_12_00_02_PM_ugb9rp.png"
            alt="Sign Up"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>



      </div>
    </div>
  );
}
