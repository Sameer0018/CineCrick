'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import { Ban, Trash2, ShieldAlert } from 'lucide-react';

interface BlockedUser {
  blockedUserId: number;
  email: string;
  createdAt: string;
}

export default function BlockedUsersPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const router = useRouter();

  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, authLoading, router]);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest('/api/safety/blocks');
      setBlocks(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load blocked users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchBlocks();
    }
  }, [isLoggedIn]);

  const handleUnblock = async (blockedUserId: number) => {
    if (!window.confirm('Are you sure you want to unblock this user? they will be able to match with you on the chat feed again.')) return;

    try {
      setError(null);
      await apiRequest(`/api/safety/block/${blockedUserId}`, {
        method: 'DELETE'
      });
      fetchBlocks();
    } catch (err: any) {
      setError(err.message || 'Failed to unblock user.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Ban className="h-8 w-8 text-red-500" /> Blocked Users
        </h1>
        <p className="text-sm text-gray-400 mt-1">Manage users you have blocked from contacting you.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {blocks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-card-border bg-[#121A2E]/20 p-12 text-center">
          <Ban className="mx-auto h-12 w-12 text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-white">No blocked users</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            You haven't blocked anyone yet. If you block a user during a chat, they will show up here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-card-border bg-[#121A2E]/30 overflow-hidden divide-y divide-card-border">
          {blocks.map((block) => (
            <div key={block.blockedUserId} className="flex items-center justify-between p-5">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full border border-red-500/20 bg-red-950/20 flex items-center justify-center text-red-500">
                  <ShieldAlert className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{block.email}</h3>
                  <p className="text-[10px] text-gray-400">Blocked on {new Date(block.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <button
                onClick={() => handleUnblock(block.blockedUserId)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-700 hover:border-red-500 hover:bg-red-950/20 px-3.5 py-2 text-xs font-bold text-gray-400 hover:text-red-400 transition-all"
              >
                <Trash2 className="h-4 w-4" /> Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
