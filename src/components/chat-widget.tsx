"use client";

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Bot, Send, X, Loader2, Trash2, Expand, User, Sun, Moon } from 'lucide-react';
import type { Message } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import alvinAvatar from '@/app/images/alvin-avatar.png';
import alvinIconWhite from '@/app/images/alvin-icon-white.png';
import { ChatMessage } from './chat-message';

interface ChatWidgetProps {
  isEmbedded?: boolean;
  // other props like apiBase, suggestionsBase, theme can be passed through rest
}
export function ChatWidget({ isEmbedded = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTopics, setShowTopics] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>(undefined);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]); // <-- new state
  const [theme, setTheme] = useState('light');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const smallChatScrollRef = useRef<HTMLDivElement>(null);
  const expandedModalScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const productionSuggestedTopics = [
    {
      category: "Attendance & Time-Off Policies",
      topics: [
        "Perfect Attendance Policy",
        "Service Incentive Leave Policy", 
        "Policy on Absences and Leave Application",
        "Overtime Policy & Guidelines"
      ]
    },
    {
      category: "Conduct & Confidentiality",
      topics: [
        "The Company Code of Conduct",
        "Confidentiality of Proprietary Information and Materials",
        "Confidentiality of Client Information",
        "Non-Disclosure and Intellectual Property Rights Agreement"
      ]
    },
    {
      category: "Operational Procedures & Guidelines",
      topics: [
        "Hybrid Work Arrangement Policy",
        "Amendment on No Mobile Phone & Shared Locker Policy",
        "Amendment on Cleanliness and Upkeep",
        "EDT Common Inquiry Questions",
        "Proper Submission of Selfies",
        "Metrics for Daily QA"
      ]
    }
  ];

  // Flatten all topics from all categories
  const allTopics = productionSuggestedTopics.flatMap(cat => cat.topics);

  useEffect(() => {
    if (smallChatScrollRef.current) {
      const scrollElement = smallChatScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (expandedModalScrollRef.current) {
      const scrollElement = expandedModalScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200; 
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [inputValue]);
  
  const sendMessageWithTopic = async (messageText: string, topicOverride?: string) => {
    if (!messageText.trim()) return;
    setSuggestedQuestions([]); // Hide suggestions immediately

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setShowTopics(false);

    try {
      // Convert messages to conversation history format for API
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Use the topic override if provided, otherwise use selected topic
      const currentTopic = topicOverride || selectedTopic;
      
      // Log the message and topic being sent
      console.log('📤 Sending to AI:', { message: messageText, topic: currentTopic });
      console.log('🎯 Selected Topic State:', selectedTopic);
      console.log('🎯 Topic Override:', topicOverride);

      // Send to the same API endpoint used by the main page
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText, 
          topic: currentTopic,
          conversationHistory 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      const aiResponse = data.text;

      const botMessage: Message = { id: crypto.randomUUID(), role: 'assistant', content: aiResponse };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to get a response from the bot. Please try again.",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText: string) => {
    setSuggestedQuestions([]); // Hide suggestions immediately
    await sendMessageWithTopic(messageText);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleTopicSelect = async (topic: string) => {
    setShowTopics(false);
    setIsLoading(true);
    setSuggestedQuestions([]);
    setSelectedTopic(topic);

    // Add bot intro message using the topic
    const botMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Great! I'm now focused on **${topic}**. I can help you with questions about this policy. What would you like to know?`
    };
    setMessages(prev => [...prev, botMessage]);

    // Fetch suggested questions from API using the topic
    try {
      const response = await fetch('/api/v1/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryName: topic })
      });
      if (response.ok) {
        const data = await response.json();
        setSuggestedQuestions(data.suggestions || []);
      } else {
        setSuggestedQuestions([]);
      }
    } catch (e) {
      setSuggestedQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowTopics(true);
    setSelectedTopic(undefined);
  };

  // Helper to determine if suggestions should be shown
  const shouldShowSuggestions = suggestedQuestions.length > 0 && !messages.some(m => m.role === 'user') && !isLoading;

  return (
    <div>
      {/* Overlay for mobile when chat is open */}
      {(isOpen || isExpanded) && <div className="fixed inset-0 bg-black/30 md:hidden" onClick={() => { setIsOpen(false); setIsExpanded(false); }} />}
      
      {/* Expanded Modal View */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
           <div className="w-full max-w-5xl h-[80vh] flex flex-row rounded-2xl border-border bg-card overflow-hidden">
             {/* Left Panel: Chat */}
             <div className="w-4/5 flex flex-col">
               <Card className="h-full flex flex-col shadow-none rounded-none border-0">
                <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950 dark:to-slate-950 shadow-sm text-blue-900 dark:text-white">
                <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot />
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg font-semibold text-blue-900 dark:text-white">Alvin Helpdesk</CardTitle>
              </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-900 dark:text-white hover:bg-blue-100 dark:hover:bg-blue-900/40 group transition"
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                      {theme === 'dark'
                        ? <Sun className="h-5 w-5" />
                        : <Moon className="h-5 w-5 group-hover:text-blue-700 transition" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-red-600/80 transition" onClick={clearChat}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700/60 group transition"
                      onClick={() => setIsExpanded(false)}
                    >
                      <X className="h-5 w-5 group-hover:text-blue-700 dark:group-hover:text-white transition" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 flex flex-col min-h-0">
                  <ScrollArea className="flex-1 h-full" ref={expandedModalScrollRef}>
                    <div className="space-y-6 p-6">
                      {messages.map((message) => (
                        <div key={message.id}>
                          <ChatMessage
                            message={message}
                            theme={theme}
                          />
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex items-start gap-3 justify-start animate-in fade-in duration-300">
                          <Avatar className="h-8 w-8 border">
                            <AvatarFallback className="bg-card">
                              <Bot className="h-5 w-5"/>
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-card text-card-foreground border rounded-lg px-4 py-3 flex items-center shadow-sm">
                            <span className="text-sm">Thinking</span>
                            <span className="animate-pulse ml-1">.</span>
                            <span className="animate-pulse delay-150">.</span>
                            <span className="animate-pulse delay-300">.</span>
                          </div>
                        </div>
                      )}
                       
                      {showTopics && !isLoading && (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-muted-foreground">
                          <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold font-headline text-foreground mb-1 sm:mb-2 md:mb-3">
                            Ask me anything...
                          </h3>
                          <p className="text-xs sm:text-sm md:text-base mb-3 sm:mb-4 md:mb-6 text-foreground px-2 sm:px-4">
                            Choose a category below or type your question directly
                          </p>
                          <div className="topic-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 w-full max-w-3xl mx-auto px-1 sm:px-2 md:px-4">
                            {productionSuggestedTopics.map((category, index) => (
                              <div
                                key={category.category}
                                className="group cursor-pointer"
                                onClick={() => handleTopicSelect(category.category)}
                              >
                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-lg transition-all duration-300 rounded-md p-1 sm:p-1.5 md:p-2 lg:p-3 h-full relative overflow-hidden group">
                                  {/* Moving light beam on edges only - hover effect */}
                                  <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-0">
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-shimmer-x"></div>
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-shimmer-x delay-500"></div>
                                    <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-shimmer-y"></div>
                                    <div className="absolute top-0 right-0 w-0.5 h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-shimmer-y delay-1000"></div>
                                  </div>
                                  <div className="flex flex-col items-center text-center space-y-0.5 sm:space-y-1 md:space-y-1.5">
                                    {/* Category Icon */}
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                                      <span className="text-white font-bold text-xs sm:text-sm md:text-base">
                                        {index + 1}
                                      </span>
                                    </div>
                                    
                                    {/* Category Title */}
                                    <h3 className="font-medium text-gray-800 dark:text-gray-200 text-xs sm:text-sm md:text-base lg:text-lg leading-tight px-0.5">
                                      {category.category}
                                    </h3>
                                    
                                    {/* Topic Count */}
                                    <div className="flex items-center space-x-0.5 sm:space-x-1">
                                      <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-blue-500 rounded-full"></div>
                                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                        {category.topics.length} topics
                                      </span>
                                    </div>
                                    
                                    {/* Hover Effect */}
                                    <div className="w-full h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {messages.length > 0 && suggestedQuestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {suggestedQuestions.map((q, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              onClick={() => sendMessage(q)}
                              className="text-xs hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:border-blue-600 dark:hover:text-blue-300"
                            >
                              {q}
                            </Button>
                          ))}
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter className="p-4 border-t">
                  <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
                    <Textarea
                      ref={textareaRef}
                      name="message"
                      placeholder="Type a message..."
                      className="flex-1 resize-none overflow-y-auto min-h-[48px] max-h-[96px] py-2 px-3 text-sm rounded-md dark-scrollbar"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage(inputValue);
                          setInputValue('');
                        }
                      }}
                      disabled={isLoading}
                      autoComplete="off"
                    />
                    <Button type="submit" size="icon" variant="default" disabled={isLoading || !inputValue.trim()} className="h-8 w-8 ml-2 p-0 flex items-center justify-center">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardFooter>
               </Card>
             </div>
             {/* Right Panel: Branding */}
             <div className="w-1/3 text-white flex flex-col items-center justify-start p-8 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                    <Image 
                        src={alvinAvatar.src} 
                        alt="Alvin Avatar"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
                <div className='flex flex-col items-center text-center relative'>
                    <h2 className="text-4xl font-bold mb-2 text-blue-300">Alvin</h2>
                    <p className="text-2xl mb-8">AI Helpdesk</p>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Chat Widget */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-4">
        <div className={cn(
          "transition-all duration-300 ease-in-out transform", 
          isOpen && !isExpanded ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}>
          <Card
            className={cn(
              "w-[calc(100vw-32px)] sm:w-[380px] h-[60vh] sm:h-[550px] flex flex-col rounded-2xl border-border",
              isEmbedded && 'bg-transparent'
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between bg-primary text-primary-foreground p-4 rounded-t-2xl">
              <div className="flex items-center gap-1 min-w-0">
                <Avatar className="bg-transparent border-none shadow-none">
                  <AvatarFallback className="bg-transparent p-0 text-white">
                    <img src={alvinIconWhite.src} alt="Alvin Bot" className="h-8 w-8 object-contain" />
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg font-semibold text-white self-center">Alvin Helpdesk</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-900 dark:text-white hover:bg-blue-100 dark:hover:bg-blue-900/40 group transition"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark'
                    ? <Sun className="h-5 w-5" />
                    : <Moon className="h-5 w-5 group-hover:text-blue-700 transition" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-blue-700/80 transition"
                  onClick={() => setIsExpanded(true)}
                >
                  <Expand className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-red-600/80 transition"
                  onClick={clearChat}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-gray-700/80 transition"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col min-h-0">
                {showTopics && !isLoading && (
                    <div
                      className={cn(
                        'flex flex-col items-center justify-center min-h-[60vh] text-center px-4 pb-48',
                        !isEmbedded && 'bg-white dark:bg-[#181f2a] text-black dark:text-white'
                      )}
                    >
                        <h1 className="text-xl font-bold text-black dark:text-white break-words leading-snug">Ask me anything...</h1>
                        <p className="text-xs text-gray-600 dark:text-gray-300 pb-8 break-words">Choose a category below or type your question directly</p>
                        <div className="flex flex-col gap-2 w-full max-w-md mx-auto">
                            {productionSuggestedTopics.map((category, index) => (
                            <div
                                key={category.category}
                                className="group cursor-pointer"
                                onClick={() => handleTopicSelect(category.category)}
                            >
                                <div className="bg-gray-100 dark:bg-[#232b3b] border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 rounded-lg p-2 text-left relative overflow-hidden group">
                                <div className="flex items-center gap-2 relative z-10 min-w-0">
                                    <div className="w-5 h-5 bg-blue-600 dark:bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-bold text-xs">{index + 1}</span>
                                    </div>
                                    <div>
                                    <h3 className="font-semibold text-black dark:text-white text-xs line-clamp-1">{category.category}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-xs line-clamp-1">• {category.topics.length} topics</p>
                                    </div>
                                </div>
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                )}
              <ScrollArea className="flex-1 h-full" ref={smallChatScrollRef}>
                <div className="space-y-6 p-4">
                  {messages.map((message) => (
                    <div key={message.id}>
                      <ChatMessage
                        message={message}
                        theme={theme}
                      />
                    </div>
                  ))}
                  {isLoading && (
                     <div className="flex items-start gap-3 justify-start animate-in fade-in duration-300">
                        <Avatar className="h-8 w-8 border">
                           <AvatarFallback className="bg-card">
                              <Bot className="h-5 w-5"/>
                           </AvatarFallback>
                        </Avatar>
                        <div className="bg-card text-card-foreground border rounded-lg px-4 py-3 flex items-center shadow-sm">
                            <span className="text-sm">Thinking</span>
                            <span className="animate-pulse ml-1">.</span>
                            <span className="animate-pulse delay-150">.</span>
                            <span className="animate-pulse delay-300">.</span>
                        </div>
                    </div>
                  )}
                  {messages.length > 0 && suggestedQuestions.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-2 px-2">
                      {suggestedQuestions.map((q, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="whitespace-normal break-words text-xs px-3 py-1 max-w-[70%]"
                          onClick={() => sendMessage(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
                <Textarea
                  ref={textareaRef}
                  name="message"
                  placeholder="Type a message..."
                  className="flex-1 resize-none overflow-y-auto min-h-[48px] max-h-[96px] py-2 px-3 text-sm rounded-md dark-scrollbar"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(inputValue);
                      setInputValue('');
                    }
                  }}
                  disabled={isLoading}
                  autoComplete="off"
                />
                <Button type="submit" size="icon" variant="default" disabled={isLoading || !inputValue.trim()} className="h-8 w-8 ml-2 p-0 flex items-center justify-center">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>

        <button
          aria-label="Open Chat"
          className={cn(
            "group relative flex items-center justify-end rounded-full w-16 h-16 transition-all duration-300 ease-in-out focus:outline-none",
            isOpen ? "hidden" : "block",
            "hover:w-[280px] hover:bg-muted"
          )}
          onClick={() => setIsOpen(true)}
        >
          <div className="absolute left-0 top-0 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-300 ease-in-out group-hover:left-0">
            <img src={alvinIconWhite.src} alt="Alvin Bot" className="h-8 w-8 object-contain" />
          </div>
          <div className="pr-8 pl-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 max-w-xs">
            <p className="text-sm text-muted-foreground truncate group-hover:whitespace-normal">
              how can I assist you today?
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
