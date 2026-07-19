'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import { apiRequest, API_BASE_URL } from '../lib/api';

interface ChatContextType {
  unreadCount: number;
  connection: HubConnection | null;
  refreshUnreadCount: () => Promise<void>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoggedIn } = useAuth();
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshUnreadCount = async () => {
    if (!isLoggedIn) return;
    try {
      const data = await apiRequest('/api/conversations/unread-count');
      setUnreadCount(data.count);
    } catch (err) {
      console.error('Failed to get unread count:', err);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !token) {
      if (connection) {
        connection.stop();
        setConnection(null);
      }
      setUnreadCount(0);
      return;
    }

    // Fetch initial unread count
    refreshUnreadCount();

    // Setup SignalR connection
    const newConnection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/ws/conversations`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    newConnection.start()
      .then(() => {
        console.log('Connected to Chat Hub');
        setConnection(newConnection);
      })
      .catch(err => console.error('SignalR Hub Connection Error: ', err));

    return () => {
      newConnection.stop();
    };
  }, [isLoggedIn, token]);

  useEffect(() => {
    if (!connection) return;

    // Listen for unread count updates
    const handleUnreadUpdate = () => {
      refreshUnreadCount();
    };

    connection.on('unread:update', handleUnreadUpdate);

    return () => {
      connection.off('unread:update', handleUnreadUpdate);
    };
  }, [connection]);

  return (
    <ChatContext.Provider value={{ unreadCount, connection, refreshUnreadCount, setUnreadCount }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
