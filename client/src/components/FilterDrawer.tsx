'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTypes: string[];
  onApply: (types: string[]) => void;
  onClear: () => void;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  selectedTypes,
  onApply,
  onClear,
}) => {
  const [tempTypes, setTempTypes] = useState<string[]>([]);

  useEffect(() => {
    setTempTypes(selectedTypes);
  }, [selectedTypes, isOpen]);

  if (!isOpen) return null;

  const toggleType = (type: string) => {
    if (tempTypes.includes(type)) {
      setTempTypes(tempTypes.filter((t) => t !== type));
    } else {
      setTempTypes([...tempTypes, type]);
    }
  };

  const handleApply = () => {
    onApply(tempTypes);
    onClose();
  };

  const handleClear = () => {
    setTempTypes(['cricketer', 'actor', 'movie']);
    onClear();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative z-10 w-full sm:max-w-md bg-[#1B2236] border-t sm:border border-card-border rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-card-border">
          <h3 className="text-lg font-bold text-white">Filter Directory</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-card-bg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters Body */}
        <div className="py-6 space-y-4">
          <p className="text-sm text-gray-400">Select content types to display in the directory:</p>
          
          <div className="flex flex-col space-y-3">
            {/* Cricketer Option */}
            <button
              onClick={() => toggleType('cricketer')}
              className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                tempTypes.includes('cricketer')
                  ? 'border-orange-500 bg-orange-950/20 text-orange-400 font-semibold'
                  : 'border-card-border bg-[#0F1523]/50 text-gray-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">🏏</span>
                <div>
                  <div className="text-sm font-semibold">Cricketers</div>
                  <div className="text-xs text-gray-500 font-normal">Indian national team & IPL players</div>
                </div>
              </div>
              {tempTypes.includes('cricketer') && <Check className="h-5 w-5 text-orange-500" />}
            </button>

            {/* Actor/Owner Option */}
            <button
              onClick={() => toggleType('actor')}
              className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                tempTypes.includes('actor')
                  ? 'border-blue-500 bg-blue-950/20 text-blue-400 font-semibold'
                  : 'border-card-border bg-[#0F1523]/50 text-gray-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">🎭</span>
                <div>
                  <div className="text-sm font-semibold">Actors / Owners</div>
                  <div className="text-xs text-gray-500 font-normal">Bollywood stars & IPL team owners</div>
                </div>
              </div>
              {tempTypes.includes('actor') && <Check className="h-5 w-5 text-blue-500" />}
            </button>

            {/* Movie Option */}
            <button
              onClick={() => toggleType('movie')}
              className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                tempTypes.includes('movie')
                  ? 'border-purple-500 bg-purple-950/20 text-purple-400 font-semibold'
                  : 'border-card-border bg-[#0F1523]/50 text-gray-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">🎬</span>
                <div>
                  <div className="text-sm font-semibold">Movies</div>
                  <div className="text-xs text-gray-500 font-normal">Cricket-related cinema releases</div>
                </div>
              </div>
              {tempTypes.includes('movie') && <Check className="h-5 w-5 text-purple-500" />}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center space-x-3 pt-4 border-t border-card-border">
          <button
            onClick={handleClear}
            className="flex-1 py-2.5 rounded-lg border border-card-border hover:bg-card-bg text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-sm font-semibold text-white transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
