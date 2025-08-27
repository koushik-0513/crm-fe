"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {Send, Trash2, MessageSquare, Loader2, Database, ArrowRightFromLine, Bot} from "lucide-react";
import { auth } from "@/firebase";
import { v4 as uuidv4 } from "uuid";
import { TChatMessage, TUserMessage, TAIModel } from "@/types/global";
import { useChatHistory, useDeleteConversation,sendChatMessageStream } from "@/hooks/apis/chat-service";
import { useAvailableModels } from "@/hooks/apis/ai-service";

export type TChatbotMessage = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export type TChatbotChatHistory = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  hasCRMContext: boolean;
  messages: TChatbotMessage[];
}

// Constants
const WELCOME_MESSAGE = "Hello! I'm your AI assistant with access to your CRM data. I can help you with:\n\n• Finding specific contacts or companies\n• Analyzing your contact data\n• Suggesting follow-up actions\n• Managing tags and organization\n• Tracking activities and interactions\n\nWhat would you like to know about your CRM?";

// Helper Components
const ChatSidebar = ({ 
  isExpanded, 
  loadingHistory, 
  chatHistory, 
  activeChatId, 
  onNewChat, 
  onSwitchChat 
}: {
  isExpanded: boolean;
  loadingHistory: boolean;
  chatHistory: TChatbotChatHistory[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSwitchChat: (chatId: string) => void;
}) => {
  if (!isExpanded) return null;

  return (
    <aside className="w-full sm:w-35 bg-slate-100 border-r flex flex-col">
      <div className="p-4 border-b">
        <Button onClick={onNewChat} className="w-full">
          <MessageSquare className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loadingHistory ? (
          <div className="p-4 text-center text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          </div>
        ) : (
          chatHistory.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSwitchChat(chat.id)}
              className={`p-3 mb-2 rounded cursor-pointer ${
                activeChatId === chat.id
                  ? "bg-blue-100 border border-blue-200"
                  : "hover:bg-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{chat.title}</span>
                {chat.hasCRMContext && (
                  <Database className="h-3 w-3 text-green-600" />
                )}
              </div>
              <div className="text-xs text-slate-600 truncate">{chat.lastMessage}</div>
              <div className="text-xs text-slate-500">
                {new Date(chat.timestamp).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

const ChatHeader = ({ 
  onToggleExpanded, 
  currentChatTitle, 
  onDeleteChat, 
  isClearing 
}: {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  currentChatTitle: string;
  onDeleteChat: () => void;
  isClearing: boolean;
}) => (
  <div className="p-4 border-b flex justify-between items-center">
    <div className="flex items-center space-x-2">
      <Button onClick={onToggleExpanded} size="icon">
        <ArrowRightFromLine className="h-4 w-4" />
      </Button>
    </div>

    <div className="flex items-center space-x-2">
      <h2 className="text-lg font-semibold truncate">
        {currentChatTitle}
      </h2>
    </div>

    <Button
      variant="outline"
      size="sm"
      onClick={onDeleteChat}
      disabled={isClearing}
    >
      {isClearing ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4 mr-2" />
      )}
      Delete Chat
    </Button>
  </div>
);

const ChatMessages = ({ 
  messages, 
  streamingMessageId, 
  isAIResponding 
}: {
  messages: TChatbotMessage[];
  streamingMessageId: string | null;
  isAIResponding: boolean;
}) => (
  <div className="flex-1 overflow-y-auto p-4 space-y-4">
    {messages.map((message) => (
      <div
        key={message.id}
        className={`flex ${
          message.isUser ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`max-w-[80%] px-4 py-2 rounded-lg ${
            message.isUser
              ? "bg-blue-500 text-white"
              : "bg-slate-100 text-slate-900"
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">
            {message.text}
            {streamingMessageId === message.id && (
              <span className="inline-block w-2 h-4 bg-slate-400 ml-1 animate-pulse"></span>
            )}
          </div>
          <div className="text-xs mt-1 text-right text-slate-500">
            {message.timestamp}
          </div>
        </div>
      </div>
    ))}

    {isAIResponding && !streamingMessageId && (
      <div className="flex justify-start">
        <div className="bg-slate-100 text-slate-900 px-4 py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
            <span className="text-sm">AI is analyzing your CRM data...</span>
          </div>
        </div>
      </div>
    )}
  </div>
);

const ChatInput = ({ 
  inputMessage, 
  setInputMessage, 
  onSendMessage, 
  isAIResponding, 
  selectedModel, 
  setSelectedModel, 
  availableModels 
}: {
  inputMessage: string;
  setInputMessage: (value: string) => void;
  onSendMessage: () => void;
  isAIResponding: boolean;
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  availableModels: Array<{name: string, provider: string}>;
}) => (
  <div className="p-4 border-t">
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-slate-700">AI Model:</span>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((model) => (
              <SelectItem key={model.name} value={model.name}>
                <div className="flex items-center space-x-2">
                  <span className="text-xs">{model.name}</span>
                  <span className="text-xs text-slate-500">({model.provider})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
    
    <div className="flex space-x-2">
      <div className="flex-1">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
          placeholder="Ask something..."
          disabled={isAIResponding}
          className="flex-1"
        />
      </div>
      <Button
        onClick={onSendMessage}
        disabled={!inputMessage.trim() || isAIResponding}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

const ChatInterface = ({ 
  isExpanded, 
  onToggleExpanded, 
  currentChatTitle, 
  onDeleteChat, 
  isClearing, 
  messages, 
  streamingMessageId, 
  isAIResponding, 
  inputMessage, 
  setInputMessage, 
  onSendMessage, 
  selectedModel, 
  setSelectedModel, 
  availableModels 
}: {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  currentChatTitle: string;
  onDeleteChat: () => void;
  isClearing: boolean;
  messages: TChatbotMessage[];
  streamingMessageId: string | null;
  isAIResponding: boolean;
  inputMessage: string;
  setInputMessage: (value: string) => void;
  onSendMessage: () => void;
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  availableModels: Array<{name: string, provider: string}>;
}) => (
  <div className="flex-1 flex flex-col">
    <ChatHeader 
      isExpanded={isExpanded}
      onToggleExpanded={onToggleExpanded}
      currentChatTitle={currentChatTitle}
      onDeleteChat={onDeleteChat}
      isClearing={isClearing}
    />
    
    <ChatMessages 
      messages={messages}
      streamingMessageId={streamingMessageId}
      isAIResponding={isAIResponding}
    />
    
    <ChatInput 
      inputMessage={inputMessage}
      setInputMessage={setInputMessage}
      onSendMessage={onSendMessage}
      isAIResponding={isAIResponding}
      selectedModel={selectedModel}
      setSelectedModel={setSelectedModel}
      availableModels={availableModels}
    />
  </div>
);

const Chat = () => {
  const [messages, setMessages] = useState<TChatbotMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isAIResponding, setIsAIResponding] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [isChatbotExpanded, setIsChatbotExpanded] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4o-mini");

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef<boolean>(true);
  const hasInitialized = useRef<boolean>(false);

  // TanStack Query hooks
  const { 
    data: chatHistoryData, 
    isLoading: loadingHistory
  } = useChatHistory();
  
  const { 
    data: availableModelsData, 
    isLoading: loadingModels  
  } = useAvailableModels();
  
  const deleteConversationMutation = useDeleteConversation();

  // Memoized helper functions
  const getProviderName = useCallback((modelName: string): string => {
    if (modelName.startsWith('gpt-')) return 'OpenAI';
    if (modelName.startsWith('mistral-')) return 'Mistral';
    return 'Unknown';
  }, []);

  const generateChatTitle = useCallback((firstMessage: string) => {
    if (!firstMessage) return "New Chat";
    return firstMessage.length > 30
      ? firstMessage.substring(0, 30) + "..."
      : firstMessage;
  }, []);

  // Create welcome message function (single source of truth)
  const createWelcomeMessage = useCallback((): TChatbotMessage => ({
    id: uuidv4(),
    text: WELCOME_MESSAGE,
    isUser: false,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }), []);

  // Memoized chat history processing
  const processedChatHistory = useMemo(() => {
    if (!chatHistoryData || chatHistoryData.length === 0) {
      return [];
    }

    return chatHistoryData.map((conversation: TChatMessage) => ({
      id: conversation.conversationId,
      title: conversation.title || generateChatTitle(conversation.messages[0]?.message),
      lastMessage: conversation.messages[conversation.messages.length - 1]?.message || "",
      timestamp: (() => {
        const lastMessageTimestamp = conversation.messages[conversation.messages.length - 1]?.timestamp;
        if (lastMessageTimestamp) {
          return typeof lastMessageTimestamp === 'string' 
            ? lastMessageTimestamp 
            : new Date(lastMessageTimestamp).toISOString();
        }
        if (conversation.updatedAt) {
          return new Date(conversation.updatedAt).toISOString();
        }
        return new Date().toISOString();
      })(),
      hasCRMContext: conversation.hasCRMContext || false,
      messages: conversation.messages.map((msg: TUserMessage) => ({
        id: uuidv4(),
        text: msg.message,
        isUser: msg.sender === "user",
        timestamp: msg.timestamp
          ? new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
      })),
    }));
  }, [chatHistoryData, generateChatTitle]);

  // Memoized available models
  const availableModels = useMemo(() => {
    if (!availableModelsData) return [];
    
    return availableModelsData
      .filter((model: TAIModel) => model.available)
      .map((model: TAIModel) => ({
        name: model.name,
        provider: getProviderName(model.name)
      }));
  }, [availableModelsData, getProviderName]);

  // Auto-scroll functions
  const scrollToBottomImmediate = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  const scrollToBottomSmooth = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Initialize chat when data is loaded
  useEffect(() => {
    if (processedChatHistory.length > 0 && !activeChatId) {
      const firstChat = processedChatHistory[0];
      setActiveChatId(firstChat.id);
      setMessages(firstChat.messages);
      setTimeout(() => scrollToBottomSmooth(), 200);
    } else if (processedChatHistory.length === 0 && !activeChatId) {
      createInitialChat();
    }
  }, [processedChatHistory, activeChatId, scrollToBottomSmooth]);

  // Set initial load state
  useEffect(() => {
    if (!loadingHistory && !loadingModels) {
      setIsInitialLoad(false);
    }
  }, [loadingHistory, loadingModels]);

  const createInitialChat = useCallback(() => {
    const welcomeMsg = createWelcomeMessage();
    const newChatId = uuidv4();
    setActiveChatId(newChatId);
    setMessages([welcomeMsg]);
  }, [createWelcomeMessage]);

  const sendMessageToAPI = useCallback(async (messageText: string, conversationId: string) => {
    try {
      let aiMessage = '';
      const aiMessageId = uuidv4();
      setStreamingMessageId(aiMessageId);

      const initialAiMessage: TChatbotMessage = {
        id: aiMessageId,
        text: '',
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, initialAiMessage]);

      aiMessage = await sendChatMessageStream(
        messageText,
        conversationId,
        selectedModel,
        (chunk: string) => {
          aiMessage += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, text: aiMessage }
                : msg
            )
          );
          scrollToBottomImmediate();
        }
      );

      setMessages((prev) => {
        const newMessages = prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, text: aiMessage }
            : msg
        );
        return newMessages;
      });

      return aiMessage;
    } catch (error) {
      console.error('Error reading stream:', error);
      throw error;
    } finally {
      setStreamingMessageId(null);
    }
  }, [selectedModel, scrollToBottomImmediate]);

  const deleteChat = useCallback(async () => {
    if (!activeChatId) return;

    try {
      await deleteConversationMutation.mutateAsync(activeChatId);
      
      const remainingChats = processedChatHistory.filter(
        (chat) => chat.id !== activeChatId
      );

      if (remainingChats.length > 0) {
        const firstChat = remainingChats[0];
        setActiveChatId(firstChat.id);
        setMessages(firstChat.messages);
      } else {
        createInitialChat();
      }
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  }, [activeChatId, processedChatHistory, deleteConversationMutation, createInitialChat]);

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !activeChatId) return;

    const userMessage: TChatbotMessage = {
      id: uuidv4(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setTimeout(() => scrollToBottomSmooth(), 50);

    const currentInput = inputMessage;
    setInputMessage("");
    setIsAIResponding(true);

    try {
      await sendMessageToAPI(currentInput, activeChatId);
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      const errorMessage: TChatbotMessage = {
        id: uuidv4(),
        text: "Sorry, I encountered an error while processing your message. Please try again.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAIResponding(false);
    }
  }, [inputMessage, activeChatId, sendMessageToAPI, scrollToBottomSmooth]);

  const startNewChat = useCallback(() => {
    const welcomeMsg = createWelcomeMessage();
    const newChatId = uuidv4();
    setActiveChatId(newChatId);
    setMessages([welcomeMsg]);
    setTimeout(() => scrollToBottomSmooth(), 100);
  }, [createWelcomeMessage, scrollToBottomSmooth]);

  const switchChat = useCallback((chatId: string) => {
    const chat = processedChatHistory.find((c) => c.id === chatId);
    if (chat) {
      setActiveChatId(chatId);
      setMessages(chat.messages);
      setTimeout(() => scrollToBottomSmooth(), 100);
    }
  }, [processedChatHistory, scrollToBottomSmooth]);

  // Initialize on mount
  useEffect(() => {
    if (auth.currentUser && !hasInitialized.current) {
      hasInitialized.current = true;
    }
  }, []);

  // Auto-scroll effects
  useEffect(() => {
    if (isChatbotOpen && messages.length > 0) {
      setTimeout(() => scrollToBottomSmooth(), 300);
    }
  }, [isChatbotOpen, messages.length, scrollToBottomSmooth]);

  useEffect(() => {
    if (!isInitialMount.current) {
      scrollToBottomSmooth();
    }
    isInitialMount.current = false;
  }, [messages, scrollToBottomSmooth]);

  useEffect(() => {
    if (isAIResponding) {
      scrollToBottomSmooth();
    }
  }, [isAIResponding, scrollToBottomSmooth]);

  useEffect(() => {
    if (streamingMessageId) {
      scrollToBottomImmediate();
    }
  }, [streamingMessageId, scrollToBottomImmediate]);

  if (isInitialLoad) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading chat history...</span>
      </div>
    );
  }

  const currentChat = processedChatHistory.find((c) => c.id === activeChatId);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isChatbotOpen && (
        <div className="w-[90vw] max-w-md h-[80vh] bg-white border rounded-lg shadow-lg flex overflow-hidden flex-col sm:flex-row">
          <ChatSidebar 
            isExpanded={isChatbotExpanded}
            loadingHistory={loadingHistory}
            chatHistory={processedChatHistory}
            activeChatId={activeChatId}
            onNewChat={startNewChat}
            onSwitchChat={switchChat}
          />
          
          <ChatInterface 
            isExpanded={isChatbotExpanded}
            onToggleExpanded={() => setIsChatbotExpanded(!isChatbotExpanded)}
            currentChatTitle={currentChat?.title || "Chat"}
            onDeleteChat={deleteChat}
            isClearing={deleteConversationMutation.isPending}
            messages={messages}
            streamingMessageId={streamingMessageId}
            isAIResponding={isAIResponding}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            onSendMessage={sendMessage}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            availableModels={availableModels}
          />
        </div>
      )}

      <div className="flex flex-row w-full justify-end mt-2" id="wt-chat-nav-link">
        <Button onClick={() => setIsChatbotOpen(!isChatbotOpen)}>
          <Bot className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Chat; 