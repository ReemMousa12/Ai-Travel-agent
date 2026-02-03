import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import type { User } from '../lib/auth';
import { apiClient } from '../lib/api';
import type { ChatMessage } from '../lib/api';

interface ChatProps {
  user: User;
}

export default function Chat({ user }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionId = useRef(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadChatHistory();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadChatHistory() {
    try {
      const history = await apiClient.getChatHistory(user.id, sessionId.current);
      
      if (history.length > 0) {
        setMessages(history.map(h => ({ role: h.role as 'user' | 'assistant' | 'system', content: h.content })));
      } else {
        // Add welcome message if no history
        setMessages([{
          role: 'assistant',
          content: "Hello! I'm your AI travel assistant. I can help you plan trips, search for flights, find hotels, get travel tips, and more. What would you like to explore today? ✈️",
        }]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([{
        role: 'assistant',
        content: "Hello! I'm your AI travel assistant. I can help you plan trips, search for flights, find hotels, get travel tips, and more. What would you like to explore today? ✈️",
      }]);
    } finally {
      // Chat history loaded
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      // Extract name from email (before @)
      const userName = user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      const response = await apiClient.sendChatMessage(userMessage, user.id, userName);
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="h-[calc(100vh-16rem)] flex flex-col animate-fade-in">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-primary-500 to-secondary-500'
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}
              >
                {message.role === 'user' ? (
                  <UserIcon size={20} className="text-white" />
                ) : (
                  <Bot size={20} className="text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[70%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white'
                    : 'glass'
                }`}
              >
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  message.role === 'user' ? 'text-white' : 'text-slate-700'
                }`}>
                  {message.content}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="flex gap-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 rounded-full bg-slate-400"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 rounded-full bg-slate-400"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 rounded-full bg-slate-400"
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onSubmit={sendMessage}
        className="p-6 glass rounded-t-3xl"
      >
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about travel..."
            disabled={isTyping}
            className="input-modern flex-1"
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || isTyping}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTyping ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
