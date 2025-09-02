
"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import alvinBotImage from "./images/alvinbot.png";
import alvinIconBlue from "./images/alvin-icon-blue.png";
import alvinIconWhite from "./images/alvin-icon-white.png";
import logoWhite from "./images/alvin-logo-white.png";
import logoDark from "./images/alvin-logo-dark.png";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Send, ShieldAlert, Trash2, Sun, Moon, Info, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  escalateToDepartment,
  getTopicSuggestions,
} from "@/app/actions";
import type { Message } from "@/lib/types";
import { ChatMessage } from "@/components/chat-message";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { ChatWidget } from "@/components/chat-widget";

const allSuggestedTopics = [
  {
    category: "Attendance & Time‑Off Policies",
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
      "Non‑Disclosure and Intellectual Property Rights Agreement"
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

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [theme, setTheme] = useState("light");
  // Flash screen and tutorial removed
  const [typingText, setTypingText] = useState("");
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  // Flash screen effect removed

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);
  
  useEffect(() => {
    const localTheme = localStorage.getItem("theme");
    if (localTheme) {
      setTheme(localTheme);
      document.documentElement.classList.toggle("dark", localTheme === "dark");
    }
  }, []);

  // Tutorial intro removed

  // Typing effect
  useEffect(() => {
    const texts = ["Hi! I'm\nAlvin"];
    const currentText = texts[currentTextIndex];
    
    if (isTyping && typingText.length < currentText.length) {
      const timer = setTimeout(() => {
        setTypingText(currentText.slice(0, typingText.length + 1));
      }, 100);
      return () => clearTimeout(timer);
    } else if (isTyping && typingText.length === currentText.length) {
      const timer = setTimeout(() => {
        setIsTyping(false);
        setTimeout(() => {
          // Loop back to the beginning
          setTimeout(() => {
            setCurrentTextIndex(0);
            setTypingText("");
            setIsTyping(true);
          }, 2000);
        }, 1000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [typingText, currentTextIndex, isTyping]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };


  const sendQuery = async (query: string, topic: string | null = null) => {
    console.log('sendQuery called with:', { query, topic, currentTopic });
    if (isLoading) return;

    // Update current topic if a new topic is provided
    if (topic && topic.trim() !== '') {
      setCurrentTopic(topic);
    }
    const topicForAI = topic || currentTopic;

    // Hide suggestions from previous messages
    const messagesWithoutSuggestions = messages.map(({ suggestions, ...rest }) => rest);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };
    setMessages([...messagesWithoutSuggestions, userMessage]);
    setIsLoading(true);

    try {
      // Prepare conversation history (excluding the current user message and system messages)
      const conversationHistory = messagesWithoutSuggestions
        .filter(msg => msg.role !== 'system') // Exclude system messages
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      


      // Send topic and conversation history to the API
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: query, 
          topic: topicForAI,
          conversationHistory 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      const aiResponse = data.text;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: "There was a problem with your request.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    const currentInput = input;
    setInput("");
    await sendQuery(currentInput);
  };

  const handleTopicClick = async (categoryName: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setCurrentTopic(categoryName);

    // Find the category and get all its topics
    const category = allSuggestedTopics.find(cat => cat.category === categoryName);
    const topicsList = category ? category.topics.join(', ') : '';

    const introMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `Great! I'm now focused on **${categoryName}**. I can help you with questions about: **${topicsList}**. What would you like to know?`,
    };

    setMessages([introMessage]);

    try {
      console.log('Getting topic suggestions for:', categoryName);
      
      // Try server action first
      let suggestions: string[] = [];
      let methodUsed = 'server_action';
      try {
        console.log('Attempting server action for suggestions...');
        suggestions = await getTopicSuggestions(categoryName);
        console.log('✅ Success: Received suggestions from server action:', suggestions);
      } catch (serverActionError) {
        console.error('❌ Server action failed, trying API route:', serverActionError);
        methodUsed = 'api_route';
        
                  // Fallback to API route
          try {
            console.log('Attempting API route for suggestions...');
            const response = await fetch('/api/v1/suggestions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ categoryName }),
            });
            
            if (response.ok) {
              const data = await response.json();
              suggestions = data.suggestions || [];
              console.log('✅ Success: Received suggestions from API route:', suggestions);
            } else {
              const errorData = await response.json();
              console.error('❌ API route failed with status:', response.status, errorData);
              throw new Error(`API route failed: ${response.status}`);
            }
          } catch (apiError) {
            console.error('❌ API route also failed:', apiError);
            methodUsed = 'fallback';
            // Use fallback suggestions
            suggestions = [
              `What are the key points of ${categoryName}?`,
              `How does ${categoryName} apply to employees?`,
              `What are the requirements for ${categoryName}?`
            ];
            console.log('✅ Using fallback suggestions:', suggestions);
          }
      }
      
      console.log(`🎯 Final result: ${suggestions.length} suggestions generated using ${methodUsed}`);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === introMessage.id ? { ...msg, suggestions } : msg
        )
      );
    } catch (error) {
      console.error('Error getting topic suggestions:', error);
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: "Could not load topic suggestions.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setCurrentTopic(null);
    setCurrentPage(1);
    setShowAllTopics(false);
    toast({
      title: "Chat Cleared",
      description: "Your conversation history has been cleared.",
      duration: 1500, // 1.5 seconds
    });
  };

  // startTour function removed

  // const handleEscalate = async () => {
  //   if (isLoading || messages.length === 0) {
  //     toast({
  //       variant: "destructive",
  //       title: "Escalation Failed",
  //       description: "Cannot escalate an empty chat.",
  //     });
  //     return;
  //   }

  //   setIsLoading(true);
  //   try {
  //     const escalationResponse = await escalateToDepartment(messages);
  //     const systemMessage: Message = {
  //       id: Date.now().toString(),
  //       role: "system",
  //       content: escalationResponse,
  //     };
  //     setMessages((prev) => [...prev, systemMessage]);
  //   } catch (error) {
  //     toast({
  //       variant: "destructive",
  //       title: "Oh no! Something went wrong.",
  //       description: "There was a problem with the escalation request.",
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const greeting = "Hello! I'm here to help you with HR policy questions.";

  function stripGreeting(text: string) {
    // Remove common AI greetings
    return text.replace(/^hello[.! ]*i am an hr policy assistant.*?(\n|$)/i, '').trim();
  }

  return (
    <>
      {/* Flash screen UI removed */}
      
      <main className="flex h-screen bg-white font-body overflow-hidden">
        <Toaster />

        {/* ChatWidget Component */}
        <ChatWidget />
      </main>
    </>
  );
}
