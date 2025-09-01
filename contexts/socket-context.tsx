'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';
import { useUserProfile } from '@/hooks/apis/user-service';

interface ChatMessage {
  id: string;
  message: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  teamCode?: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendTeamMessage: (message: string, teamCode: string) => void;
  sendDirectMessage: (message: string, recipientId: string) => void;
  teamMessages: ChatMessage[];
  directMessages: ChatMessage[];
  joinTeam: (teamCode: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [teamMessages, setTeamMessages] = useState<ChatMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<ChatMessage[]>([]);
  
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();

  useEffect(() => {
    if (!user) return;

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const newSocket = io(BACKEND_URL, {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to Socket.IO server');
      
      // Join with user ID
      newSocket.emit('join', user.uid);
      
      // Join team if user has one
      if (userProfile?.teamCode) {
        newSocket.emit('join_team', userProfile.teamCode);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from Socket.IO server');
    });

    // Listen for team messages
    newSocket.on('receive_team_message', (message: ChatMessage) => {
      setTeamMessages(prev => [...prev, message]);
    });

    // Listen for direct messages
    newSocket.on('receive_direct_message', (message: ChatMessage) => {
      setDirectMessages(prev => [...prev, message]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, userProfile?.teamCode]);

  const sendTeamMessage = (message: string, teamCode: string) => {
    if (socket && user && userProfile) {
      socket.emit('send_team_message', {
        message,
        senderId: user.uid,
        senderName: userProfile.name || user.displayName || 'Unknown',
        teamCode
      });
      
      // Add to local state immediately
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        message,
        senderId: user.uid,
        senderName: userProfile.name || user.displayName || 'Unknown',
        timestamp: new Date().toISOString(),
        teamCode
      };
      setTeamMessages(prev => [...prev, newMessage]);
    }
  };

  const sendDirectMessage = (message: string, recipientId: string) => {
    if (socket && user && userProfile) {
      socket.emit('send_direct_message', {
        message,
        senderId: user.uid,
        senderName: userProfile.name || user.displayName || 'Unknown',
        recipientId
      });
      
      // Add to local state immediately
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        message,
        senderId: user.uid,
        senderName: userProfile.name || user.displayName || 'Unknown',
        timestamp: new Date().toISOString()
      };
      setDirectMessages(prev => [...prev, newMessage]);
    }
  };

  const joinTeam = (teamCode: string) => {
    if (socket) {
      socket.emit('join_team', teamCode);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        sendTeamMessage,
        sendDirectMessage,
        teamMessages,
        directMessages,
        joinTeam,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
