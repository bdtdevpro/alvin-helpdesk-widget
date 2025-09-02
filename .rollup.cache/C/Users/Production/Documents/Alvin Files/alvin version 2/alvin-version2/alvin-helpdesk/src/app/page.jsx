"use client";
import { __rest } from "tslib";
import { useState, useRef, useEffect } from "react";
import { getTopicSuggestions, } from "@/app/actions";
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
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [showAllTopics, setShowAllTopics] = useState(false);
    const [currentTopic, setCurrentTopic] = useState(null);
    const [theme, setTheme] = useState("light");
    const [showTour, setShowTour] = useState(false);
    const [typingText, setTypingText] = useState("");
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(true);
    const [showFlashScreen, setShowFlashScreen] = useState(true);
    const messagesEndRef = useRef(null);
    useEffect(() => {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);
    useEffect(() => {
        const localTheme = localStorage.getItem("theme");
        if (localTheme) {
            setTheme(localTheme);
            document.documentElement.classList.toggle("dark", localTheme === "dark");
        }
    }, []);
    // Flash screen effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowFlashScreen(false);
        }, 3000); // Show for 3 seconds
        return () => clearTimeout(timer);
    }, []);
    // Auto-start tour on first visit
    useEffect(() => {
        const hasSeenTour = sessionStorage.getItem("alvin-helpdesk-tour-completed");
        if (!hasSeenTour) {
            // Wait for flash screen to finish (3 seconds) plus a small buffer
            const timer = setTimeout(() => {
                startTour();
            }, 3500); // 3 seconds for flash screen + 0.5 seconds buffer
            return () => clearTimeout(timer);
        }
    }, []);
    // Typing effect
    useEffect(() => {
        const texts = ["Hi! I'm\nAlvin"];
        const currentText = texts[currentTextIndex];
        if (isTyping && typingText.length < currentText.length) {
            const timer = setTimeout(() => {
                setTypingText(currentText.slice(0, typingText.length + 1));
            }, 100);
            return () => clearTimeout(timer);
        }
        else if (isTyping && typingText.length === currentText.length) {
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
    const sendQuery = async (query, topic = null) => {
        console.log('sendQuery called with:', { query, topic, currentTopic });
        if (isLoading)
            return;
        // Update current topic if a new topic is provided
        if (topic && topic.trim() !== '') {
            setCurrentTopic(topic);
        }
        const topicForAI = topic || currentTopic;
        // Hide suggestions from previous messages
        const messagesWithoutSuggestions = messages.map((_a) => {
            var { suggestions } = _a, rest = __rest(_a, ["suggestions"]);
            return rest;
        });
        const userMessage = {
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
            const aiMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: aiResponse,
            };
            setMessages((prev) => [...prev, aiMessage]);
        }
        catch (error) {
            toast({
                variant: "destructive",
                title: "Oh no! Something went wrong.",
                description: "There was a problem with your request.",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim())
            return;
        const currentInput = input;
        setInput("");
        await sendQuery(currentInput);
    };
    const handleTopicClick = async (categoryName) => {
        if (isLoading)
            return;
        setIsLoading(true);
        setCurrentTopic(categoryName);
        // Find the category and get all its topics
        const category = allSuggestedTopics.find(cat => cat.category === categoryName);
        const topicsList = category ? category.topics.join(', ') : '';
        const introMessage = {
            id: Date.now().toString(),
            role: "assistant",
            content: `Great! I'm now focused on **${categoryName}**. I can help you with questions about: **${topicsList}**. What would you like to know?`,
        };
        setMessages([introMessage]);
        try {
            console.log('Getting topic suggestions for:', categoryName);
            // Try server action first
            let suggestions = [];
            let methodUsed = 'server_action';
            try {
                console.log('Attempting server action for suggestions...');
                suggestions = await getTopicSuggestions(categoryName);
                console.log('✅ Success: Received suggestions from server action:', suggestions);
            }
            catch (serverActionError) {
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
                    }
                    else {
                        const errorData = await response.json();
                        console.error('❌ API route failed with status:', response.status, errorData);
                        throw new Error(`API route failed: ${response.status}`);
                    }
                }
                catch (apiError) {
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
            setMessages((prev) => prev.map((msg) => msg.id === introMessage.id ? Object.assign(Object.assign({}, msg), { suggestions }) : msg));
        }
        catch (error) {
            console.error('Error getting topic suggestions:', error);
            toast({
                variant: "destructive",
                title: "Oh no! Something went wrong.",
                description: "Could not load topic suggestions.",
            });
        }
        finally {
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
    const startTour = async () => {
        const introJs = (await import('intro.js')).default;
        const intro = introJs();
        intro.setOptions({
            steps: [
                {
                    title: 'Welcome to Alvin HelpDesk!',
                    intro: 'Let me show you around our HR assistance system. This tour will help you understand how to use all the features effectively.',
                    position: 'bottom'
                },
                {
                    element: '.chat-header',
                    title: 'Chat Interface',
                    intro: 'This is your main chat area where you can ask questions about HR policies, benefits, and procedures. The AI assistant will provide helpful responses based on company policies.',
                    position: 'bottom'
                },
                {
                    element: '.topic-cards',
                    title: 'Topic Categories',
                    intro: 'Choose from these predefined HR topics to focus your conversation. Each category contains specific policies and guidelines you can ask about.',
                    position: 'top'
                },
                {
                    element: '.chat-input',
                    title: 'Ask Questions',
                    intro: 'Type your HR-related questions here and press Enter or click the send button. You can ask about policies, procedures, benefits, and more.',
                    position: 'top'
                },
                {
                    element: '.theme-toggle',
                    title: 'Theme Toggle',
                    intro: 'Switch between light and dark themes for comfortable viewing. Your preference will be automatically saved.',
                    position: 'bottom'
                },
                {
                    element: '.info-button',
                    title: 'Help & Information',
                    intro: 'Click here to access detailed help information, feature guides, and important disclaimers about using the AI assistant.',
                    position: 'bottom'
                },
                {
                    element: '.clear-chat',
                    title: 'Clear Chat',
                    intro: 'Use this button to start a fresh conversation or switch to a different topic. This helps maintain privacy by removing conversation history.',
                    position: 'bottom'
                },
                {
                    title: 'You\'re All Set! 🎉',
                    intro: 'You now know how to use Alvin HelpDesk effectively. Feel free to start asking questions or explore the different topic categories. Remember, for complex issues, always verify information with the HR department.',
                    position: 'bottom'
                }
            ],
            showProgress: true,
            showBullets: true,
            showStepNumbers: true,
            exitOnOverlayClick: false,
            exitOnEsc: true,
            nextLabel: 'Next →',
            prevLabel: '← Previous',
            skipLabel: 'Skip Tour',
            doneLabel: 'Got it!',
            tooltipClass: 'customTooltip',
            highlightClass: 'customHighlight',
            scrollToElement: false,
            disableInteraction: false,
            overlayOpacity: 0.85
        });
        intro.oncomplete(() => {
            setShowTour(false);
            sessionStorage.setItem("alvin-helpdesk-tour-completed", "true");
            toast({
                title: "Tour Completed!",
                description: "You're ready to use Alvin HelpDesk effectively.",
                duration: 2000,
            });
        });
        // Force icon colors during tutorial
        intro.onbeforechange((targetElement) => {
            const currentStep = intro.currentStep();
            // Reset all icons to default colors
            document.querySelectorAll('.theme-toggle svg, .info-button svg, .clear-chat svg').forEach(svg => {
                const svgElement = svg;
                svgElement.style.color = '';
                svgElement.style.fill = '';
                svgElement.style.stroke = '';
            });
            // Set specific icons to white based on current step
            if (currentStep === 4) { // Theme Toggle step (0-indexed)
                document.querySelectorAll('.theme-toggle svg').forEach(svg => {
                    const svgElement = svg;
                    // svgElement.style.color = 'white';
                    // svgElement.style.fill = 'white';
                    svgElement.style.stroke = 'white';
                });
                // Force tooltip positioning for theme toggle step
                setTimeout(() => {
                    const tooltip = document.querySelector('.introjs-tooltip');
                    if (tooltip) {
                        console.log('Forcing tooltip position for theme toggle step');
                        tooltip.style.setProperty('position', 'fixed', 'important');
                        tooltip.style.setProperty('top', '150px', 'important');
                        tooltip.style.setProperty('left', '630px', 'important');
                        tooltip.style.setProperty('right', 'auto', 'important');
                        tooltip.style.setProperty('bottom', 'auto', 'important');
                        tooltip.style.setProperty('margin', '0', 'important');
                        tooltip.style.setProperty('transform', 'none', 'important');
                        tooltip.style.setProperty('z-index', '999999', 'important');
                    }
                }, 200);
            }
            else if (currentStep === 5) { // Info Button step
                document.querySelectorAll('.info-button svg').forEach(svg => {
                    const svgElement = svg;
                    svgElement.style.setProperty('stroke', '#ffffff', 'important'); // Only change stroke color with !important
                });
            }
            else if (currentStep === 6) { // Clear Chat step
                document.querySelectorAll('.clear-chat svg').forEach(svg => {
                    const svgElement = svg;
                    svgElement.style.setProperty('stroke', '#ffffff', 'important'); // Only change stroke color with !important
                });
            }
            return true;
        });
        intro.onexit(() => {
            setShowTour(false);
            sessionStorage.setItem("alvin-helpdesk-tour-completed", "true");
        });
        intro.start();
        setShowTour(true);
    };
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
    function stripGreeting(text) {
        // Remove common AI greetings
        return text.replace(/^hello[.! ]*i am an hr policy assistant.*?(\n|$)/i, '').trim();
    }
    return (<>
      {/* Flash Screen */}
      {showFlashScreen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-950 to-black">
          <div className="text-center">
            <img src="/alvin-moving-unscreen.gif" alt="Alvin Moving" className="mx-auto mb-4 h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48 lg:h-56 lg:w-56"/>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
              Alvin HelpDesk
            </h1>
            <p className="text-blue-300 text-sm sm:text-base md:text-lg">
              Loading...
            </p>
          </div>
        </div>)}
      
      <main className="flex h-screen bg-white font-body overflow-hidden">
        <Toaster />

        {/* ChatWidget Component */}
        <ChatWidget />
      </main>
    </>);
}
//# sourceMappingURL=page.jsx.map