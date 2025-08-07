"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {Send, Trash2, MessageSquare, Loader2, Database, ArrowRightFromLine, Bot} from "lucide-react";
import { auth } from "@/firebase";
import { getIdToken } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";
import { TChatMessage, TUserMessage } from "@/types/global";
import { TChatHistory } from "@/hooks/utils/common-Types";

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

export type TChatbotAIModel = {
  name: string;
  available: boolean;
  provider?: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<TChatbotMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<TChatbotChatHistory[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isAIResponding, setIsAIResponding] = useState<boolean>(false);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [isClearingChat, setIsClearingChat] = useState<boolean>(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [isChatbotExpanded, setIsChatbotExpanded] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4o-mini");
  const [availableModels, setAvailableModels] = useState<Array<{name: string, provider: string}>>([]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef<boolean>(true);

  // Auto-scroll to bottom when messages change
  const scrollToBottomImmediate = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Enhanced scroll function with smooth option
  const scrollToBottomSmooth = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const getAuthToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated");
    return await getIdToken(currentUser);
  };

  const fetchAvailableModels = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/models`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.models) {
          const models = data.models
            .filter((model: TChatbotAIModel) => model.available)
            .map((model: TChatbotAIModel) => ({
              name: model.name,
              provider: getProviderName(model.name)
            }));
          setAvailableModels(models);
        }
      }
    } catch (error) {
      console.error("Error fetching available models:", error);
      // Set default models if API fails
      setAvailableModels([
        { name: "gpt-4o-mini", provider: "OpenAI" },
        { name: "mistral-large-latest", provider: "Mistral" }
      ]);
    }
  };

  const getProviderName = (modelName: string): string => {
    if (modelName.startsWith('gpt-')) return 'OpenAI';
    if (modelName.startsWith('mistral-')) return 'Mistral';
    return 'Unknown';
  };

  const generateChatTitle = (firstMessage: string) => {
    if (!firstMessage) return "New Chat";
    return firstMessage.length > 30
      ? firstMessage.substring(0, 30) + "..."
      : firstMessage;
  };

  const fetchChatHistory = async () => {
    try {
      setLoadingHistory(true);
      const token = await getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/history`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          createInitialChat();
          return;
        }
        throw new Error("Failed to fetch chat history");
      }

      const data = await response.json();
      const conversations = data.data?.conversations || data.conversations || [];

      if (conversations.length === 0) {
        createInitialChat();
        return;
      }

      console.log("Processing conversations:", conversations);
      
      const chatHistoryArray = conversations.map((conversation: TChatMessage) => {
        console.log("Processing conversation:", {
          conversationId: conversation.conversationId,
          title: conversation.title,
          messageCount: conversation.messages?.length || 0,
          messages: conversation.messages
        });
        
        return {
          id: conversation.conversationId,
          title:
            conversation.title ||
            generateChatTitle(conversation.messages[0]?.message),
          lastMessage:
            conversation.messages[conversation.messages.length - 1]?.message || "",
          timestamp:
            conversation.messages[conversation.messages.length - 1]?.timestamp ||
            conversation.updatedAt,
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
        };
      });
      
      console.log("Processed chat history array:", chatHistoryArray);

      setChatHistory(chatHistoryArray);

      if (chatHistoryArray.length > 0 && !activeChatId) {
        const firstChat = chatHistoryArray[0];
        setActiveChatId(firstChat.id);
        setMessages(firstChat.messages);
        // Auto-scroll to bottom when loading first chat
        setTimeout(() => scrollToBottomSmooth(), 200);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      createInitialChat();
    } finally {
      setLoadingHistory(false);
      setIsInitialLoad(false);
    }
  };

  const createInitialChat = () => {
    const welcomeMsg: TChatbotMessage = {
      id: uuidv4(),
      text:
        "Hello! I'm your AI assistant with access to your CRM data. I can help you with:\n\n• Finding specific contacts or companies\n• Analyzing your contact data\n• Suggesting follow-up actions\n• Managing tags and organization\n• Tracking activities and interactions\n\nWhat would you like to know about your CRM?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const newChatId = uuidv4();
    const newChat: TChatbotChatHistory = {
      id: newChatId,
      title: "New Chat",
      lastMessage: welcomeMsg.text,
      timestamp: new Date().toISOString(),
      hasCRMContext: true,
      messages: [welcomeMsg],
    };

    setChatHistory([newChat]);
    setActiveChatId(newChatId);
    setMessages([welcomeMsg]);
  };

  const sendMessageToAPI = async (messageText: string, conversationId: string) => {
    const token = await getAuthToken();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/chat/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          message: messageText, 
          conversation_id: conversationId,
          modelName: selectedModel 
        }),
      }
    );

    if (!response.ok) throw new Error("Failed to send message");

    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) throw new Error("No response body reader available");

    let aiMessage = '';
    const aiMessageId = uuidv4();
    setStreamingMessageId(aiMessageId);

    // Add initial empty AI message
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

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        aiMessage += chunk;

        // Update the streaming message in real-time
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, text: aiMessage }
              : msg
          )
        );
        
        // Auto-scroll during streaming
        scrollToBottomImmediate();
      }

      // Update chat history with final complete message
      setMessages((prev) => {
        const newMessages = prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, text: aiMessage }
            : msg
        );
        updateChatHistory(activeChatId!, newMessages);
        return newMessages;
      });

    } catch (error) {
      console.error('Error reading stream:', error);
      throw error;
    } finally {
      setStreamingMessageId(null);
    }

    return aiMessage;
  };

  const clearChat = async () => {
    if (!activeChatId) return;

    try {
      setIsClearingChat(true);
      const token = await getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversation/${activeChatId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setChatHistory((prev) =>
          prev.filter((chat) => chat.id !== activeChatId)
        );

        const remainingChats = chatHistory.filter(
          (chat) => chat.id !== activeChatId
        );

        if (remainingChats.length > 0) {
          const firstChat = remainingChats[0];
          setActiveChatId(firstChat.id);
          setMessages(firstChat.messages);
        } else {
          createInitialChat();
        }
      } else {
        throw new Error("Failed to delete conversation");
      }
    } catch (error) {
      console.error("Error clearing chat:", error);
    } finally {
      setIsClearingChat(false);
    }
  };

  const updateChatHistory = (chatId: string, newMessages: TChatbotMessage[]) => {
    setChatHistory((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: newMessages,
              lastMessage: newMessages[newMessages.length - 1]?.text || "",
              timestamp: new Date().toISOString(),
              title:
                chat.title === "New Chat" && newMessages.length > 1
                  ? generateChatTitle(
                      newMessages.find((msg) => msg.isUser)?.text || "New Chat"
                    )
                  : chat.title,
            }
          : chat
      )
    );
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: TChatbotMessage = {
      id: uuidv4(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => {
      const newMessages = [...prev, userMessage];
      updateChatHistory(activeChatId!, newMessages);
      return newMessages;
    });

    // Auto-scroll after adding user message
    setTimeout(() => scrollToBottomSmooth(), 50);

    const currentInput = inputMessage;
    setInputMessage("");
    setIsAIResponding(true);

    try {
      await sendMessageToAPI(currentInput, activeChatId!);
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Add error message if streaming failed
      const errorMessage: TChatbotMessage = {
        id: uuidv4(),
        text: "Sorry, I encountered an error while processing your message. Please try again.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => {
        const newMessages = [...prev, errorMessage];
        updateChatHistory(activeChatId!, newMessages);
        return newMessages;
      });
    } finally {
      setIsAIResponding(false);
    }
  };

  const startNewChat = () => {
    const welcomeMsg: TChatbotMessage = {
      id: uuidv4(),
      text:
        "Hello! I'm your AI assistant with access to your CRM data. How can I help you today?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const newChatId = uuidv4();
    const newChat: TChatbotChatHistory = {
      id: newChatId,
      title: "New Chat",
      lastMessage: welcomeMsg.text,
      timestamp: new Date().toISOString(),
      hasCRMContext: true,
      messages: [welcomeMsg],
    };

    setChatHistory((prev) => [newChat, ...prev]);
    setActiveChatId(newChatId);
    setMessages([welcomeMsg]);
    // Auto-scroll to bottom when starting new chat
    setTimeout(() => scrollToBottomSmooth(), 100);
  };

  const switchChat = (chatId: string) => {
    const chat = chatHistory.find((c) => c.id === chatId);
    if (chat) {
      setActiveChatId(chatId);
      setMessages(chat.messages);
      // Auto-scroll to bottom when switching chats
      setTimeout(() => scrollToBottomSmooth(), 100);
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      fetchChatHistory();
      fetchAvailableModels();
    }
  }, []);

  // Auto-scroll when chat is opened
  useEffect(() => {
    if (isChatbotOpen && messages.length > 0) {
      setTimeout(() => scrollToBottomSmooth(), 300);
    }
  }, [isChatbotOpen]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (!isInitialMount.current) {
      scrollToBottomSmooth();
    }
    isInitialMount.current = false;
  }, [messages]);

  // Auto-scroll when AI starts responding
  useEffect(() => {
    if (isAIResponding) {
      scrollToBottomSmooth();
    }
  }, [isAIResponding]);

  // Auto-scroll when streaming message updates
  useEffect(() => {
    if (streamingMessageId) {
      scrollToBottomImmediate();
    }
  }, [streamingMessageId]);

  if (isInitialLoad) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading chat history...</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isChatbotOpen && (
        <div className="w-[90vw] max-w-md h-[80vh] bg-white border rounded-lg shadow-lg flex overflow-hidden flex-col sm:flex-row">
          {isChatbotExpanded && (
            <aside className="w-full sm:w-35 bg-slate-100 border-r flex flex-col">
              <div className="p-4 border-b">
                <Button onClick={startNewChat} className="w-full">
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
                      onClick={() => switchChat(chat.id)}
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
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Button onClick={() => setIsChatbotExpanded(!isChatbotExpanded)} size="icon">
                  <ArrowRightFromLine className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold truncate">
                  {chatHistory.find((c) => c.id === activeChatId)?.title || "Chat"}
                </h2>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                disabled={isClearingChat}
              >
                {isClearingChat ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Clear Chat
              </Button>
            </div>

            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
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

            <div className="p-4 border-t">
              {/* Model Selector */}
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
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Ask something..."
                    disabled={isAIResponding}
                    className="flex-1"
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isAIResponding}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-row w-full justify-end mt-2">
        <Button onClick={() => setIsChatbotOpen(!isChatbotOpen)}>
          <Bot className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Chat; 