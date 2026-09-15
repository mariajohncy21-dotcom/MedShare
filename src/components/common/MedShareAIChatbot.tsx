import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ChatMessage } from '../../types';
import { api } from '../../services/api';
import {
  MessageCircle, X, Send, Bot, User, Trash2, Loader2,
  HeartPulse, AlertTriangle, Zap, ChevronDown,
} from 'lucide-react';

const QUICK_SUGGESTIONS: Record<string, string[]> = {
  PATIENT: [
    'How do I find a medicine near me?',
    'How does reservation work?',
    'How do I use image search?',
    'What is the 15-minute hold?',
    'How do I cancel a reservation?',
  ],
  PHARMACY: [
    'How do I add new stock?',
    'How do I respond to a hospital request?',
    'How does bulk upload work?',
    'What is partial acceptance?',
    'How do I manage reservations?',
  ],
  HOSPITAL: [
    'How do I request medicine from a pharmacy?',
    'How does smart allocation work?',
    'How do I manage patient records?',
    'How do I bulk upload inventory?',
    'How do I handle emergency requests?',
  ],
  ADMIN: [
    'How do I verify a pharmacy?',
    'How do I suspend an organization?',
    'How does the shortage monitor work?',
    'How do I read audit logs?',
    'How do I manage the medicine catalog?',
  ],
};

export const MedShareAIChatbot: React.FC = () => {
  const { currentUser, isAuthenticated } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const role = currentUser?.role || 'PATIENT';
  const suggestions = QUICK_SUGGESTIONS[role] || QUICK_SUGGESTIONS.PATIENT;

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello${currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}! 👋 I'm **MedShare AI**, your medicine availability assistant.\n\nI can help you with:\n• Finding medicines and nearby sources\n• Understanding reservations and requests\n• Navigating the MedShare platform\n• Hospital-pharmacy coordination\n\n> ⚕️ **Medical Disclaimer**: I provide platform guidance only. For medical advice, diagnoses, or prescriptions, always consult a qualified healthcare professional.`,
        timestamp: new Date(),
      };
      setMessages([welcome]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    if (!isAuthenticated) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '🔒 Please **sign in** to use MedShare AI. The chatbot is available to authenticated users only.',
        timestamp: new Date(),
        error: true,
      };
      setMessages(prev => [...prev, errMsg]);
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    const loadingMsg: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.ai.chat(trimmed);
      setMessages(prev =>
        prev.map(m =>
          m.loading
            ? { ...m, content: res.reply, loading: false }
            : m
        )
      );
    } catch (err: any) {
      setMessages(prev =>
        prev.map(m =>
          m.loading
            ? {
                ...m,
                content: err.message?.includes('401')
                  ? '🔒 Session expired. Please sign in again to use MedShare AI.'
                  : 'MedShare AI is temporarily unavailable. Please try again shortly.',
                loading: false,
                error: true,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setTimeout(() => {
      const welcome: ChatMessage = {
        id: 'welcome-new',
        role: 'assistant',
        content: `Chat cleared. How can I help you with MedShare?\n\n> ⚕️ For medical advice, please consult a qualified healthcare professional.`,
        timestamp: new Date(),
      };
      setMessages([welcome]);
    }, 100);
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^• (.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="color:#1d4ed8;font-size:14px;line-height:1.5">•</span><span>$1</span></div>')
      .replace(/^> (.+)$/gm, '<div style="border-left:3px solid #e2e8f0;padding:6px 10px;margin:8px 0;background:#f8fafc;border-radius:0 6px 6px 0;font-size:11.5px;color:#64748b">$1</div>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 54, height: 54, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1d4ed8, #0d9488)',
          border: 'none', cursor: 'pointer', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(29,78,216,0.4)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(29,78,216,0.5)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(29,78,216,0.4)';
        }}
        title="MedShare AI Assistant"
      >
        {isOpen ? <X style={{ width: 22, height: 22 }} /> : <MessageCircle style={{ width: 22, height: 22 }} />}
        {!isOpen && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            width: 16, height: 16, borderRadius: '50%',
            background: '#10b981', border: '2px solid #fff',
            animation: 'pulse 2s infinite',
          }} />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 999,
          width: 380, maxHeight: 580, minHeight: 400,
          background: '#fff', borderRadius: 20,
          boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'Inter, system-ui, sans-serif',
          overflow: 'hidden',
          animation: 'slideUp 0.2s ease',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1d4ed8, #0d9488)',
            padding: '16px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <HeartPulse style={{ width: 18, height: 18, color: '#fff' }} />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: 14, color: '#fff', margin: 0 }}>MedShare AI</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                    Your medicine availability assistant
                  </p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={clearChat} title="Clear chat" style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
                width: 30, height: 30, borderRadius: 8, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
              <button onClick={() => setIsOpen(false)} style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
                width: 30, height: 30, borderRadius: 8, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>

          {/* Medical disclaimer banner */}
          <div style={{
            background: '#fffbeb', borderBottom: '1px solid #fde68a',
            padding: '7px 14px',
            display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
          }}>
            <AlertTriangle style={{ width: 12, height: 12, color: '#d97706', flexShrink: 0 }} />
            <p style={{ fontSize: 10.5, color: '#92400e', margin: 0, lineHeight: 1.4 }}>
              Not a medical tool. For health advice, consult a doctor.
            </p>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 14px',
            display: 'flex', flexDirection: 'column', gap: 10,
            scrollbarWidth: 'thin',
          }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 8, alignItems: 'flex-start',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    background: 'linear-gradient(135deg, #eff6ff, #f0fdfa)',
                    border: '1px solid #bfdbfe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 2,
                  }}>
                    <Bot style={{ width: 13, height: 13, color: '#1d4ed8' }} />
                  </div>
                )}
                <div style={{
                  maxWidth: '80%',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #1d4ed8, #1e40af)'
                    : msg.error ? '#fef2f2' : '#f8fafc',
                  color: msg.role === 'user' ? '#fff'
                    : msg.error ? '#dc2626' : '#0f172a',
                  padding: '9px 12px', borderRadius: msg.role === 'user'
                    ? '14px 14px 4px 14px'
                    : '14px 14px 14px 4px',
                  fontSize: 12.5, lineHeight: 1.6,
                  border: msg.role === 'assistant'
                    ? msg.error ? '1px solid #fecaca' : '1px solid #e2e8f0'
                    : 'none',
                  boxShadow: msg.role === 'user' ? '0 2px 8px rgba(29,78,216,0.2)' : 'none',
                }}>
                  {msg.loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                      <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite', color: '#1d4ed8' }} />
                      <span style={{ color: '#64748b', fontSize: 12 }}>MedShare AI is thinking…</span>
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  )}
                </div>
                {msg.role === 'user' && (
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    background: 'linear-gradient(135deg, #1d4ed8, #0d9488)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 11, fontWeight: 800, marginTop: 2,
                  }}>
                    {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length <= 1 && (
            <div style={{
              padding: '6px 12px 8px', borderTop: '1px solid #f1f5f9',
              flexShrink: 0,
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Quick suggestions
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {suggestions.slice(0, 4).map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    style={{
                      background: '#f1f5f9', border: '1px solid #e2e8f0',
                      borderRadius: 99, padding: '4px 10px',
                      fontSize: 11, color: '#475569', cursor: 'pointer',
                      fontWeight: 500, transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#eff6ff';
                      e.currentTarget.style.color = '#1d4ed8';
                      e.currentTarget.style.borderColor = '#bfdbfe';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.color = '#475569';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div style={{
            padding: '10px 12px 12px',
            borderTop: '1px solid #e2e8f0', flexShrink: 0,
            background: '#fafbfc',
          }}>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-end',
              background: '#fff', borderRadius: 12,
              border: '1.5px solid #e2e8f0', padding: '8px 10px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about medicines, reservations, how MedShare works…"
                rows={1}
                style={{
                  flex: 1, border: 'none', outline: 'none', resize: 'none',
                  fontSize: 12.5, color: '#0f172a', background: 'transparent',
                  fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.5,
                  maxHeight: 80, overflowY: 'auto',
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: (!input.trim() || isLoading) ? '#e2e8f0' : 'linear-gradient(135deg, #1d4ed8, #0d9488)',
                  border: 'none', cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: (!input.trim() || isLoading) ? '#94a3b8' : '#fff',
                  transition: 'all 0.15s ease',
                }}
              >
                {isLoading
                  ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                  : <Send style={{ width: 14, height: 14 }} />}
              </button>
            </div>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: '5px 2px 0', textAlign: 'center' }}>
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
};
