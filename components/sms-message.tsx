"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Sparkles,
  Loader2,
  Search,
  User, 
  Phone,
  Mail,
  Check,
  X,
} from "lucide-react";
import { useContacts } from "@/hooks/apis/contact-service";
import { use_generate_messages, use_send_message } from "@/hooks/apis/message-service";
import { toast } from "sonner";
import type { TContact, TMessageHistory } from "@/types/global";
import type { TGeneratedMessage } from "@/hooks/apis/message-service";

// ============================================================================
// SMS MESSAGE COMPONENT SPECIFIC TYPES
// ============================================================================
 
type TSMSMessageProps = {
  className?: string;
}

export default function SMSMessage({ className }: TSMSMessageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [generatedMessages, setGeneratedMessages] = useState<TGeneratedMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<{ contactId: string; message: TMessageHistory } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Hooks
  const { data: contactsData } = useContacts('', 1, 1000, '');
  const generateMessagesMutation = use_generate_messages();
  const sendMessageMutation = use_send_message();

  const contacts = contactsData?.contacts || [];

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter((contact: TContact) => 
      contact.name.toLowerCase().includes(query) ||
      contact.phone.toLowerCase().includes(query) ||
      (contact.email && contact.email.toLowerCase().includes(query))
    );
  }, [contacts, searchQuery]);

  // Handle contact selection
  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  // Handle select all filtered contacts
  const handleSelectAll = () => {
    const filteredIds = filteredContacts.map((contact: TContact) => contact._id);
    setSelectedContacts(filteredIds);
  };

  // Handle deselect all
  const handleDeselectAll = () => {
    setSelectedContacts([]);
  };

  // Handle message generation
  const handleGenerateMessages = async () => {
    if (!prompt.trim() || selectedContacts.length === 0) {
      toast.error("Please enter a prompt and select at least one contact");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateMessagesMutation.mutateAsync({
        prompt: prompt.trim(),
        contactIds: selectedContacts,
        model: "gpt-4o-mini",
      });
      setGeneratedMessages(result.results);
      toast.success(result.message || "Messages generated successfully!");
    } catch (error) {
      toast.error("Error generating messages");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle message sending
  const handleSendMessage = async (contactId: string, message: TMessageHistory) => {
    // Prevent multiple clicks
    if (isSending) {
      return;
    }
    
    setIsSending(true);
    
    try {
      const result = await sendMessageMutation.mutateAsync({
        messageContent: message.messageContent,
        contactIds: [contactId],
        prompt: message.prompt,
      });
      const sendResult = result.results[0];
      if (sendResult.messageId) {
        toast.success(`Message sent to ${sendResult.contactName}!`);
        setSelectedMessage(null);
        setGeneratedMessages([]);
        setPrompt("");
        setSelectedContacts([]);
      } else {
        toast.error(sendResult.message || "Failed to send message");
      }
    } catch (error) {
      toast.error("Error sending message");
    } finally {
      setIsSending(false);
    }
  };

  // Handle generate more versions
  const handleGenerateMore = async (contactId: string) => {
    setIsGenerating(true);
    try {
      const result = await generateMessagesMutation.mutateAsync({
        prompt: prompt.trim(),
        contactIds: [contactId],
        model: "gpt-4o-mini",
      });
      const newResult = result.results[0];
      setGeneratedMessages(prev => 
        prev.map(item => 
          item.contactId === contactId ? newResult : item
        )
      );
      toast.success(result.message || "More message versions generated!");
    } catch (error) {
      toast.error("Error generating more versions");
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className} id="wt-sms-contacts-btn">
          <MessageSquare className="h-4 w-4 mr-2" />
          SMS Messages
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Generate SMS Messages
          </DialogTitle>
          <DialogDescription>
            Select contacts and generate personalized SMS messages using AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Contacts ({selectedContacts.length} selected)
                  {searchQuery && (
                    <Badge variant="secondary" className="text-xs">
                      Filtered
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAll}
                    className="text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeselectAll}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contacts by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Contact List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                {filteredContacts.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    {searchQuery ? (
                      <div>
                        <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No contacts found matching "{searchQuery}"</p>
                        <p className="text-xs mt-1">Try a different search term</p>
                      </div>
                    ) : (
                      <div>
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No contacts available</p>
                      </div>
                    )}
                  </div>
                ) : (
                  filteredContacts.map((contact: TContact) => {
                    const isSelected = selectedContacts.includes(contact._id);
                    return (
                      <div
                        key={contact._id}
                        className={`relative p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200 shadow-sm' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleContactToggle(contact._id)}
                      >
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id={contact._id}
                            checked={isSelected}
                            onCheckedChange={() => handleContactToggle(contact._id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-gray-500" />
                              <Label 
                                htmlFor={contact._id} 
                                className="text-sm font-medium cursor-pointer truncate"
                              >
                                {contact.name}
                              </Label>
                              {isSelected && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <div className="space-y-1">
                              {contact.phone && (
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Phone className="h-3 w-3" />
                                  <span className="truncate">{contact.phone}</span>
                                </div>
                              )}
                              {contact.email && (
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate">{contact.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {searchQuery && filteredContacts.length > 0 && (
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  Showing {filteredContacts.length} of {contacts.length} contacts
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prompt Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Message Prompt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g., Tell Priya about tomorrow's onboarding call at 4 PM"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="mt-2 text-xs text-gray-500">
                Be specific about what you want to communicate. The AI will use contact information and previous interactions to personalize the message.
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleGenerateMessages}
              disabled={!prompt.trim() || selectedContacts.length === 0 || isGenerating}
              className="w-full max-w-md"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Messages...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Messages
                </>
              )}
            </Button>
          </div>

          {/* Generated Messages */}
          {generatedMessages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Generated Messages</h3>
              {generatedMessages.map((result) => (
                <Card key={result.contactId}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {result.contactName} ({result.phoneNumber})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.message ? (
                      <div className="space-y-3">
                        {result.messages.map((message, index) => (
                          <div
                            key={message._id}
                            className="p-4 border rounded-lg bg-gray-50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <Badge variant="secondary">
                                Version {index + 1}
                              </Badge>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSendMessage(result.contactId, message)}
                                  disabled={isSending}
                                >
                                  {isSending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGenerateMore(result.contactId)}
                                  disabled={isGenerating}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm">{message.messageContent}</p>
                            {message.metadata && (
                              <div className="mt-2 text-xs text-gray-500">
                                Generated in {message.metadata.generationTime}ms using {message.metadata.aiModel}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-red-500">
                        Error: {result.message}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}