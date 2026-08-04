'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { Bot, Send, X, Sparkles, User, Trash2, Copy, RefreshCw, MessageSquare } from 'lucide-react';

interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  content: string;
  timestamp?: Date;
  failed?: boolean;
}

const SESSION_ID = 'main_drawer_session';

const QUICK_ACTIONS = [
  'What is my complaint status?',
  'Where is the nearest hospital?',
  'How do I report a new incident?',
  'What are the emergency numbers?',
];

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export const AIChatDrawer: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && user && messages.length === 0) {
      setMessages([
        {
          role: 'model',
          content: `Hello **${user.full_name}**! 👋 I am **CityMind AI**, your Ashmora Smart City assistant.\n\nI can help you with:\n• Complaint status & tracking\n• Nearest hospital, police & fire stations\n• How to register incidents\n• Emergency hotlines & city services\n\nHow can I assist you today?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userText = text.trim();
    setInputMsg('');
    const userMsg: ChatMessage = { role: 'user', content: userText, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await apiClient.post('/chat/message', {
        message: userText,
        session_id: SESSION_ID,
      });

      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            content: res.data.data.content,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: '⚠️ Connection glitch detected. Please retry your message.',
          timestamp: new Date(),
          failed: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(inputMsg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMsg);
    }
  };

  const handleCopyMessage = (content: string, idx: number) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleClearConversation = () => {
    setMessages([
      {
        role: 'model',
        content: `Session cleared. Hello ${user?.full_name}, how can I assist you?`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleRetry = (content: string) => {
    // Find last user message before this failure and retry it
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) sendMessage(lastUser.content);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-full shadow-2xl shadow-cyan-900/50 flex items-center justify-center transition-all transform hover:scale-110 glow-blue"
        title="Open CityMind AI Assistant"
        aria-label="Open CityMind AI Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-7 h-7" />}
      </button>

      {/* Chat Drawer */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-96 h-[560px] glass-panel rounded-2xl border border-cyan-500/30 shadow-2xl flex flex-col overflow-hidden"
          style={{ animation: 'slideUpFade 0.2s ease-out' }}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white leading-none">CityMind AI</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-mono">Online — Ashmora OS v2.0</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearConversation}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                title="Clear conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/60 scroll-smooth">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="max-w-[78%]">
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-tr-none'
                        : msg.failed
                        ? 'bg-rose-950/60 border border-rose-800 text-rose-300 rounded-tl-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                  <div className="flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {msg.timestamp && (
                      <span className="text-[9px] text-slate-600 font-mono">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <button
                      onClick={() => handleCopyMessage(msg.content, idx)}
                      className="p-0.5 text-slate-600 hover:text-cyan-400 transition"
                      title="Copy message"
                    >
                      {copied === idx ? (
                        <span className="text-[9px] text-emerald-400 font-mono">Copied!</span>
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    {msg.failed && (
                      <button
                        onClick={() => handleRetry(msg.content)}
                        className="p-0.5 text-rose-400 hover:text-rose-300 transition"
                        title="Retry"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-center gap-2 justify-start">
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="px-3 py-2 bg-slate-900/80 border-t border-slate-800/50 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => sendMessage(action)}
                  disabled={loading}
                  className="shrink-0 px-2.5 py-1.5 bg-slate-800 hover:bg-cyan-900/60 border border-slate-700 hover:border-cyan-600 text-[10px] text-slate-300 hover:text-cyan-300 rounded-lg transition whitespace-nowrap"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about hospitals, complaint status, traffic..."
              disabled={loading}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !inputMsg.trim()}
              className="px-3.5 py-2 bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};
