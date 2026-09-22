import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { ChatMessage, UserRole } from '../../types';
import { api } from '../../services/api';
import {
  MessageCircle, X, Send, Bot, Trash2, Loader2,
  HeartPulse, AlertTriangle, RotateCcw,
} from 'lucide-react';

const SUGGESTIONS_EN: Record<UserRole, string[]> = {
  PATIENT: [
    'How do I find a medicine?',
    'How does medicine reservation work?',
    'How do I use the map?',
    'What does partial inventory matching mean?',
    'How do I collect a reserved medicine?',
  ],
  PHARMACY: [
    'How do I update stock?',
    'How do I handle an emergency request?',
    'How do reservations affect inventory?',
    'How do I submit a daily report?',
  ],
  HOSPITAL: [
    'How do I request medicine from a pharmacy?',
    'How does Smart Allocation work?',
    'How do I manage hospital inventory?',
    'How do I create an emergency request?',
  ],
  ADMIN: [
    'How do I verify a pharmacy?',
    'How do I monitor shortages?',
    'How do I manage organizations?',
    'How do I view reports?',
  ],
};

const SUGGESTIONS_TA: Record<UserRole, string[]> = {
  PATIENT: [
    'மருந்தை எப்படி தேடுவது?',
    'மருந்து முன்பதிவு எப்படி செயல்படுகிறது?',
    'வரைபடத்தை எப்படி பயன்படுத்துவது?',
    'பகுதி இருப்பு பொருத்தம் என்றால் என்ன?',
    'முன்பதிவு செய்த மருந்தை எப்படிப் பெறுவது?',
  ],
  PHARMACY: [
    'ஸ்டாக்கை எப்படி அப்டேட் செய்வது?',
    'அவசரக் கோரிக்கையை எப்படி கையாள்வது?',
    'முன்பதிவுகள் ஸ்டாக்கை எவ்வாறு மாற்றும்?',
    'தினசரி அறிக்கையை எப்படி சமர்ப்பிப்பது?',
  ],
  HOSPITAL: [
    'ஃபார்மசியிடம் மருந்து கேட்பது எப்படி?',
    'ஸ்மார்ட் ஒதுக்கீடு எப்படி செயல்படுகிறது?',
    'மருத்துவமனை மருந்து இருப்பை எப்படி நிர்வகிப்பது?',
    'அவசரக் கோரிக்கை உருவாக்குவது எப்படி?',
  ],
  ADMIN: [
    'மருந்தகத்தை எப்படி சரிபார்ப்பது?',
    'பற்றாக்குறையை எப்படி கண்காணிப்பது?',
    'நிறுவனங்களை எப்படி நிர்வகிப்பது?',
    'அறிக்கைகளை எப்படி பார்ப்பது?',
  ],
};

export const MedShareAIChatbot: React.FC = () => {
  const { currentUser, isAuthenticated } = useApp();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('ta') ? 'ta' : 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const role: UserRole = currentUser?.role || 'PATIENT';
  const suggestions = currentLang === 'ta'
    ? (SUGGESTIONS_TA[role] || SUGGESTIONS_TA.PATIENT)
    : (SUGGESTIONS_EN[role] || SUGGESTIONS_EN.PATIENT);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: currentLang === 'ta'
          ? `வணக்கம்${currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}! 👋 நான் **MedShare AI**, உங்கள் மருந்து இருப்பு மற்றும் தள வழிகாட்டி.\n\nநான் உங்களுக்கு உதவக்கூடியவை:\n• மருந்துகள் மற்றும் அருகிலுள்ள மருந்தகங்களைக் கண்டறிதல்\n• 15-நிமிட அவசர முன்பதிவு பாஸ்களைப் புரிந்துகொள்ளுதல்\n• தளத்தைப் பயன்படுத்துதல் மற்றும் அவசர மருந்து ஒருங்கிணைப்பு\n\n> ⚕️ **மருத்துவப் பொறுப்புத் துறப்பு**: நான் தளம் மற்றும் இருப்பு வழிகாட்டலை மட்டுமே வழங்குகிறேன். நோயறிதல் அல்லது மருந்துச் சீட்டுகளுக்கு எப்போதும் மருத்துவரை அணுகவும்.`
          : `Hello${currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}! 👋 I'm **MedShare AI**, your medicine availability and logistics assistant.\n\nI can help you with:\n• Finding medicines and nearby verified stock\n• Understanding 15-minute reservation passes\n• Navigating Patient, Pharmacy & Hospital portals\n• Logistics and emergency coordination\n\n> ⚕️ **Medical Disclaimer**: I provide platform guidance only. For medical advice, diagnoses, or prescriptions, always consult a qualified healthcare professional.`,
        timestamp: new Date(),
      };
      setMessages([welcome]);
    }
  }, [isOpen, currentLang]);

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
        content: currentLang === 'ta'
          ? '🔒 MedShare AI-ஐ பயன்படுத்த தயவுசெய்து உள்நுழையவும்.'
          : '🔒 Please **sign in** to use MedShare AI. The chatbot is available to authenticated users only.',
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
    setLastFailedMessage(null);

    try {
      const res = await api.ai.chat(trimmed, currentLang, role);
      setMessages(prev =>
        prev.map(m =>
          m.loading
            ? { ...m, content: res.reply || (currentLang === 'ta' ? 'பதில் கிடைக்கவில்லை.' : 'No response received.'), loading: false }
            : m
        )
      );
    } catch (err: any) {
      setLastFailedMessage(trimmed);
      const isAuthError = err.message?.includes('401');
      const errText = isAuthError
        ? (currentLang === 'ta' ? '🔒 அமர்வு காலாவதியானது. தயவுசெய்து மீண்டும் உள்நுழையவும்.' : '🔒 Session expired. Please sign in again to use MedShare AI.')
        : (currentLang === 'ta' ? 'AI சேவை தற்போது கிடைக்கவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.' : 'AI service is temporarily unavailable. Please try again.');

      setMessages(prev =>
        prev.map(m =>
          m.loading
            ? {
                ...m,
                content: errText,
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

  const retryLastMessage = () => {
    if (lastFailedMessage) {
      sendMessage(lastFailedMessage);
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
    setLastFailedMessage(null);
    setTimeout(() => {
      const welcome: ChatMessage = {
        id: 'welcome-new',
        role: 'assistant',
        content: currentLang === 'ta'
          ? `அரட்டை அழிக்கப்பட்டது. MedShare பற்றி உங்களுக்கு எப்படி உதவ முடியும்?\n\n> ⚕️ மருத்துவ ஆலோசனைக்கு தகுதியான மருத்துவரை அணுகவும்.`
          : `Chat cleared. How can I help you with MedShare?\n\n> ⚕️ For medical advice, please consult a qualified healthcare professional.`,
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
      {/* Floating launcher button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
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
        title="MedShare AI"
        aria-label="Open MedShare AI Chat"
      >
        {isOpen ? <X style={{ width: 22, height: 22 }} /> : <MessageCircle style={{ width: 24, height: 24 }} />}
        {!isOpen && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            width: 16, height: 16, borderRadius: '50%',
            background: '#10b981', border: '2px solid #fff',
            animation: 'pulse 2s infinite',
          }} />
        )}
      </button>

      {/* Floating Chat Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 90,
          right: 20,
          zIndex: 999,
          width: '92vw',
          maxWidth: 400,
          height: '75vh',
          maxHeight: 600,
          minHeight: 420,
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 24px 80px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter, system-ui, sans-serif',
          overflow: 'hidden',
          animation: 'slideUp 0.2s ease',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1d4ed8, #0d9488)',
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <HeartPulse style={{ width: 18, height: 18, color: '#fff' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ fontWeight: 900, fontSize: 14, color: '#fff', margin: 0 }}>MedShare AI</p>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 99,
                    background: 'rgba(255,255,255,0.25)', color: '#fff', textTransform: 'uppercase',
                  }}>
                    {role}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                    {t('chatbot.status')}
                  </p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={clearChat}
                title={t('chatbot.clearChat')}
                style={{
                  background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer',
                  width: 30, height: 30, borderRadius: 8, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title={t('common.close')}
                style={{
                  background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer',
                  width: 30, height: 30, borderRadius: 8, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
          </div>

          {/* Medical disclaimer banner */}
          <div style={{
            background: '#fffbeb', borderBottom: '1px solid #fde68a',
            padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
          }}>
            <AlertTriangle style={{ width: 13, height: 13, color: '#d97706', flexShrink: 0 }} />
            <p style={{ fontSize: 10.5, color: '#92400e', margin: 0, lineHeight: 1.4 }}>
              {t('chatbot.disclaimer')}
            </p>
          </div>

          {/* Message History Area */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 14px',
            display: 'flex', flexDirection: 'column', gap: 12,
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
                    width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                    background: 'linear-gradient(135deg, #eff6ff, #f0fdfa)',
                    border: '1px solid #bfdbfe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 2,
                  }}>
                    <Bot style={{ width: 15, height: 15, color: '#1d4ed8' }} />
                  </div>
                )}

                <div style={{
                  maxWidth: '82%',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #1d4ed8, #2563eb)'
                    : msg.error ? '#fef2f2' : '#f8fafc',
                  color: msg.role === 'user' ? '#fff'
                    : msg.error ? '#dc2626' : '#0f172a',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user'
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px',
                  fontSize: 12.5, lineHeight: 1.6,
                  border: msg.role === 'assistant'
                    ? msg.error ? '1px solid #fecaca' : '1px solid #e2e8f0'
                    : 'none',
                  boxShadow: msg.role === 'user' ? '0 2px 8px rgba(29,78,216,0.25)' : 'none',
                }}>
                  {msg.loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                      <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite', color: '#1d4ed8' }} />
                      <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                        {t('chatbot.thinking')}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                      {msg.error && lastFailedMessage && (
                        <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #fecaca' }}>
                          <button
                            type="button"
                            onClick={retryLastMessage}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 10px', borderRadius: 8,
                              background: '#dc2626', color: '#fff',
                              border: 'none', fontSize: 11, fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <RotateCcw style={{ width: 11, height: 11 }} />
                            {t('chatbot.retry')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: 9, flexShrink: 0,
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

          {/* Quick Suggested Questions */}
          {messages.length <= 1 && (
            <div style={{
              padding: '8px 12px', borderTop: '1px solid #f1f5f9',
              background: '#fafbfc', flexShrink: 0,
            }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t('chatbot.suggestedTitle')}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 110, overflowY: 'auto' }}>
                {suggestions.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendMessage(s)}
                    style={{
                      background: '#fff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 99, padding: '4px 10px',
                      fontSize: 11, color: '#334155', cursor: 'pointer',
                      fontWeight: 600, transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = '#eff6ff';
                      (e.currentTarget as HTMLElement).style.borderColor = '#93c5fd';
                      (e.currentTarget as HTMLElement).style.color = '#1d4ed8';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = '#fff';
                      (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1';
                      (e.currentTarget as HTMLElement).style.color = '#334155';
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input & Send Area */}
          <div style={{
            padding: '10px 14px 12px',
            borderTop: '1px solid #e2e8f0',
            background: '#fff',
            display: 'flex', alignItems: 'center', gap: 8,
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chatbot.placeholder')}
              disabled={isLoading}
              style={{
                flex: 1, resize: 'none',
                padding: '9px 12px',
                borderRadius: 12, border: '1.5px solid #cbd5e1',
                fontSize: 12.5, outline: 'none',
                fontFamily: 'inherit',
                maxHeight: 80,
                background: isLoading ? '#f8fafc' : '#fff',
              }}
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              style={{
                width: 38, height: 38, borderRadius: 12,
                background: !input.trim() || isLoading ? '#94a3b8' : '#1d4ed8',
                border: 'none', color: '#fff',
                cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s ease',
              }}
              title={t('chatbot.send')}
            >
              {isLoading ? (
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send style={{ width: 16, height: 16 }} />
              )}
            </button>
          </div>

        </div>
      )}
    </>
  );
};
