'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Users, MessageCircle, Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '@/contexts/socket-context';
import { useUserProfile } from '@/hooks/apis/user-service';
import { use_all_users } from '@/hooks/apis/notification-service';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessage {
  id: string;
  message: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  teamCode?: string;
}

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState<'team' | 'direct'>('team');
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    isConnected, 
    sendTeamMessage, 
    sendDirectMessage, 
    teamMessages, 
    directMessages 
  } = useSocket();
  
  const { data: userProfile } = useUserProfile();
  const { data: usersData } = use_all_users(1, 100);
  
  const users = usersData?.data || [];
  const teamMembers = users.filter(user => 
    user.teamCode === userProfile?.teamCode && user.uid !== userProfile?.uid
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [teamMessages, directMessages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    if (activeTab === 'team' && userProfile?.teamCode) {
      sendTeamMessage(message, userProfile.teamCode);
    } else if (activeTab === 'direct' && selectedUser) {
      sendDirectMessage(message, selectedUser);
    }

    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentMessages = activeTab === 'team' ? teamMessages : directMessages;

  // Don't show chat for individual users
  if (userProfile?.role === 'individual') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat Not Available</h3>
            <p className="text-gray-600">
              Chat functionality is only available for team members and admins.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Team Chat</h1>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">Disconnected</span>
            </>
          )}
        </div>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Messages</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'team' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('team')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Team Chat
                {teamMessages.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {teamMessages.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant={activeTab === 'direct' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('direct')}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Direct Messages
                {directMessages.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {directMessages.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
          
          {activeTab === 'direct' && (
            <div className="mt-4">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select a team member to chat with</option>
                {teamMembers.map((user) => (
                  <option key={user.uid} value={user.uid}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col min-h-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
            {currentMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.senderId === userProfile?.uid ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.senderId === userProfile?.uid
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border'
                    }`}
                  >
                    {msg.senderId !== userProfile?.uid && (
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {msg.senderName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-gray-600">
                          {msg.senderName}
                        </span>
                      </div>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${
                      msg.senderId === userProfile?.uid ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                activeTab === 'team' 
                  ? 'Type a message to your team...' 
                  : selectedUser 
                    ? 'Type a direct message...'
                    : 'Select a user first...'
              }
              disabled={!isConnected || (activeTab === 'direct' && !selectedUser)}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || !isConnected || (activeTab === 'direct' && !selectedUser)}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      {activeTab === 'team' && teamMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {teamMembers.map((member) => (
                <div key={member.uid} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {member.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{member.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
