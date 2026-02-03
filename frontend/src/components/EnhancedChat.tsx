import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Send, Bot, User as UserIcon, Loader2, Sparkles, MapPin, Calendar, DollarSign } from 'lucide-react';
import type { User } from '../lib/auth';
import { apiClient } from '../lib/api';
import type { ChatMessage } from '../lib/api';

interface ChatProps {
  user: User;
  initialMessage?: string;
}

export default function EnhancedChat({ user, initialMessage }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAutoSubmitted = useRef(false);

  useEffect(() => {
    loadChatHistory();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (initialMessage && messages.length > 0 && !hasAutoSubmitted.current && !isTyping) {
      hasAutoSubmitted.current = true;
      setInput(initialMessage);
      // Auto-submit after a brief delay
      setTimeout(() => {
        handleAutoSubmit(initialMessage);
      }, 500);
    }
  }, [initialMessage, messages.length, isTyping]);

  async function handleAutoSubmit(message: string) {
    if (!message.trim() || isTyping) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsTyping(true);

    try {
      const response = await apiClient.sendChatMessage(message, user.id, user.email);
      const assistantMessage = response.message || response.reply;

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
      // Chat history saving disabled
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment." 
      }]);
    } finally {
      setIsTyping(false);
    }
  }

  async function loadChatHistory() {
    // Chat history disabled - using session-based messages only
    setMessages([{
      role: 'assistant',
      content: "🌍 Welcome to your AI Travel Assistant! I'm here to help you discover amazing destinations, plan unforgettable trips, find the best deals, and create memories that last a lifetime.\n\nWhat adventure shall we plan today?",
    }]);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const userName = user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      const response = await apiClient.sendChatMessage(userMessage, user.id, userName);
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  const quickActions = [
    { icon: MapPin, label: "Find Destinations", prompt: "Show me trending travel destinations" },
    { icon: Calendar, label: "Plan Trip", prompt: "Help me plan a weekend getaway" },
    { icon: DollarSign, label: "Find Deals", prompt: "What are the best travel deals right now?" },
    { icon: Sparkles, label: "Surprise Me", prompt: "Suggest an unexpected destination for adventure" },
  ];

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col bg-white rounded-lg shadow-lg">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50">\n        {/* Welcome message with quick actions */}
        {messages.length === 1 && (
          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(action.prompt);
                      inputRef.current?.focus();
                    }}
                    className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Icon size={18} className="text-blue-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{action.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-blue-600'
                    : 'bg-gray-700'
                }`}
              >
                {message.role === 'user' ? (
                  <UserIcon size={16} className="text-white" />
                ) : (
                  <Bot size={16} className="text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[75%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={sendMessage} className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about destinations, hotels, trips..."
            disabled={isTyping}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none text-sm disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            {isTyping ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span className="hidden sm:inline text-sm">Thinking</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span className="hidden sm:inline text-sm">Send</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
