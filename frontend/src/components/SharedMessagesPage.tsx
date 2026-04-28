import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Send, Search, Phone, Video, MoreVertical, Check, CheckCheck,
  Reply, Edit2, Trash2, Paperclip, Smile, Home, X,
  ChevronLeft, Wifi, WifiOff, Plus, MessageSquarePlus, Clock, Hash
} from 'lucide-react';
import MessagesService, { type Message, type Conversation } from '../services/messages';

interface Props {
  role?: 'tenant' | 'agent' | 'landlord';
}

const ROLE_CONFIG = {
  tenant:   { accent: '#6C63FF', label: 'Tenant Inbox',   tagline: 'Talk to your landlord or agent' },
  agent:    { accent: '#0EA5E9', label: 'Agent Inbox',    tagline: 'Manage client conversations' },
  landlord: { accent: '#10B981', label: 'Landlord Inbox', tagline: 'Connect with your tenants' },
};

const initials = (name: string) =>
  name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

const relativeTime = (iso: string) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
};

const fullTime = (iso: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

const Avatar = ({ name, size = 40, accent }: { name: string; size?: number; accent: string }) => (
  <div style={{
    width: size, height: size,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${accent}30, ${accent}60)`,
    border: `2px solid ${accent}40`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.38, fontWeight: 700, color: accent, flexShrink: 0,
  }}>
    {initials(name)}
  </div>
);

const MOBILE_STYLES = `
  @media (max-width: 640px) {
    .msg-sidebar {
      width: 100% !important;
      min-width: unset !important;
      display: flex !important;
    }
    .msg-sidebar.hidden-mobile {
      display: none !important;
    }
    .msg-chat {
      display: none !important;
    }
    .msg-chat.active-mobile {
      display: flex !important;
      width: 100% !important;
    }
    .msg-back-btn {
      display: flex !important;
    }
  }
  @media (min-width: 641px) {
    .msg-sidebar { display: flex !important; }
    .msg-chat { display: flex !important; }
    .msg-back-btn { display: none !important; }
  }
`;

const SharedMessagesPage = ({ role = 'tenant' }: Props) => {
  const cfg = ROLE_CONFIG[role];

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sideSearch, setSideSearch] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [online, setOnline] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await MessagesService.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (userId: number) => {
    try {
      const data = await MessagesService.getMessages(userId);
      setMessages(data.messages || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(() => {
      loadConversations();
      if (selected) loadMessages(selected.id);
    }, 15000);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [selected]);

  useEffect(() => {
    if (selected) loadMessages(selected.id);
  }, [selected]);

  const sendMessage = async () => {
    if (!draft.trim() || sending || !selected) return;
    setSending(true);
    try {
      const newMsg = await MessagesService.sendMessage({
        receiver_id: selected.id,
        content: draft.trim(),
        reply_to_id: replyTo?.id,
      });
      setMessages(prev => [...prev, newMsg]);
      setDraft('');
      setReplyTo(null);
      loadConversations();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!userQuery.trim()) { setFoundUsers([]); return; }
    const timer = setTimeout(async () => {
      try {
        const users = await MessagesService.searchUsers(userQuery);
        setFoundUsers(users || []);
      } catch { setFoundUsers([]); }
    }, 350);
    return () => clearTimeout(timer);
  }, [userQuery]);

  const openConversation = (user: any) => {
    const newConv: Conversation = {
      id: user.id, user,
      latest_message: null as any,
      unread_count: 0,
      updated_at: new Date().toISOString(),
    };
    setSelected(newConv);
    setNewChatOpen(false);
    setUserQuery('');
    setFoundUsers([]);
    setMessages([]);
    setMobileChatOpen(true);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user?.name?.toLowerCase().includes(sideSearch.toLowerCase()) ||
    conv.latest_message?.content?.toLowerCase().includes(sideSearch.toLowerCase())
  );

  return (
    <div style={{
      display: 'flex', height: '100dvh',
      background: '#0f172a',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      overflow: 'hidden', color: '#e2e8f0',
      position: 'relative',
    }}>
      <style>{MOBILE_STYLES}</style>

      {/* ── SIDEBAR ── */}
      <aside
        className={`msg-sidebar${mobileChatOpen ? ' hidden-mobile' : ''}`}
        style={{
          width: 340, minWidth: 320,
          borderRight: '1px solid #1e293b',
          flexDirection: 'column',
          background: '#0f172a',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>{cfg.label}</div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{cfg.tagline}</div>
            </div>
            <button
              onClick={() => setNewChatOpen(true)}
              style={{
                padding: '8px', background: cfg.accent + '20',
                border: `1px solid ${cfg.accent}40`,
                borderRadius: 10, color: cfg.accent, cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#475569' }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={sideSearch}
              onChange={e => setSideSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 38px',
                background: '#1e293b', border: '1px solid #334155',
                borderRadius: 10, color: '#e2e8f0', fontSize: 13, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>Loading…</div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>No conversations found</div>
          ) : (
            filteredConversations.map(conv => {
              const isSelected = selected?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => { setSelected(conv); setMobileChatOpen(true); }}
                  style={{
                    padding: '12px 14px',
                    display: 'flex', gap: 10, cursor: 'pointer',
                    background: isSelected ? cfg.accent + '12' : 'transparent',
                    borderLeft: isSelected ? `3px solid ${cfg.accent}` : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <Avatar name={conv.user?.name || 'User'} size={44} accent={cfg.accent} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>
                        {conv.user?.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{relativeTime(conv.updated_at || '')}</div>
                    </div>
                    <div style={{
                      fontSize: 13, color: conv.unread_count > 0 ? '#cbd5e1' : '#64748b',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {conv.latest_message?.content || 'No messages yet'}
                    </div>
                  </div>
                  {conv.unread_count > 0 && (
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: cfg.accent, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0, alignSelf: 'center',
                    }}>
                      {conv.unread_count}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ── CHAT AREA ── */}
      <main
        className={`msg-chat${mobileChatOpen ? ' active-mobile' : ''}`}
        style={{ flex: 1, flexDirection: 'column', background: '#0a1628', minWidth: 0 }}
      >
        {selected ? (
          <>
            {/* Chat header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #1e293b',
              background: '#0f172a',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  className="msg-back-btn"
                  onClick={() => setMobileChatOpen(false)}
                  style={{
                    background: 'none', border: 'none', color: '#94a3b8',
                    cursor: 'pointer', padding: '4px', display: 'none',
                    alignItems: 'center',
                  }}
                >
                  <ChevronLeft size={24} />
                </button>
                <Avatar name={selected.user?.name || ''} size={38} accent={cfg.accent} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{selected.user?.name}</div>
                  <div style={{ fontSize: 11, color: selected.user?.is_online ? '#22c55e' : '#475569' }}>
                    {selected.user?.is_online ? '● Online' : 'Offline'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                <button style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Phone size={18} color="#64748b" />
                </button>
                <button style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Video size={18} color="#64748b" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '16px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: 60, color: '#64748b', fontSize: 14 }}>
                  No messages yet. Say hello!
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} style={{
                    display: 'flex',
                    justifyContent: msg.is_from_me ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '78%',
                      backgroundColor: msg.is_from_me ? cfg.accent : '#1e293b',
                      padding: '10px 14px',
                      borderRadius: msg.is_from_me ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      color: msg.is_from_me ? '#fff' : '#e2e8f0',
                    }}>
                      <p style={{ margin: 0, lineHeight: 1.5, fontSize: 14 }}>{msg.content}</p>
                      <div style={{ fontSize: 10, textAlign: 'right', marginTop: 4, opacity: 0.65 }}>
                        {fullTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 14px', borderTop: '1px solid #1e293b', background: '#0f172a' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <button style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                  <Paperclip size={20} color="#475569" />
                </button>
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  rows={1}
                  style={{
                    flex: 1, background: '#1e293b',
                    border: '1px solid #334155', borderRadius: 12,
                    padding: '10px 14px', color: '#e2e8f0',
                    fontSize: 14, resize: 'none',
                    minHeight: 44, maxHeight: 120, outline: 'none',
                    fontFamily: 'inherit',
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!draft.trim() || sending}
                  style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: draft.trim() ? cfg.accent : '#1e293b',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: draft.trim() ? 'pointer' : 'not-allowed',
                    transition: 'background 0.2s',
                  }}
                >
                  <Send size={18} color="#fff" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', color: '#64748b',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              background: cfg.accent + '15',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
            }}>
              <MessageSquarePlus size={40} color={cfg.accent} />
            </div>
            <h2 style={{ color: '#f1f5f9', marginBottom: 8, fontSize: 18, fontWeight: 600 }}>
              No conversation selected
            </h2>
            <p style={{ fontSize: 14, textAlign: 'center', padding: '0 24px' }}>
              Select a conversation from the sidebar or start a new chat
            </p>
          </div>
        )}
      </main>

      {/* New Chat Modal */}
      {newChatOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px',
        }}>
          <div style={{
            background: '#1e293b', borderRadius: 16,
            width: '100%', maxWidth: 400, padding: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>New Conversation</h3>
              <button
                onClick={() => setNewChatOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={userQuery}
              onChange={e => setUserQuery(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px',
                background: '#0f172a', border: '1px solid #334155',
                borderRadius: 10, color: '#e2e8f0', marginBottom: 12,
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {foundUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => openConversation(user)}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: 'transparent', border: 'none',
                    textAlign: 'left', borderRadius: 8, marginBottom: 4,
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  }}
                >
                  <Avatar name={user.name} size={38} accent={cfg.accent} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{user.user_type}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedMessagesPage;