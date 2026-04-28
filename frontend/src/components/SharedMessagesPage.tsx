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
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
};

const fullTime = (iso: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

const Avatar = ({ name, size = 40, src, accent }: { name: string; size?: number; src?: string; accent: string }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: src ? 'transparent' : `linear-gradient(135deg, ${accent}33, ${accent}66)`,
    border: `2px solid ${accent}44`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.35, fontWeight: 700, color: accent,
    overflow: 'hidden',
  }}>
    {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(name)}
  </div>
);

const SharedMessagesPage = ({ role = 'tenant' }: Props) => {
  const cfg = ROLE_CONFIG[role];

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [sideSearch, setSideSearch] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [showOnlineOnly, setShowOnlineOnly] = useState(true);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<{ id: number; content: string } | null>(null);
  const [mobilePaneOpen, setMobilePaneOpen] = useState(false);
  const [online, setOnline] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await MessagesService.getConversations();
      setConversations(data.conversations || []);
      setUnread(data.unread_count || 0);
    } catch (err) {
      console.error(err);
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
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(() => {
      loadConversations();
      if (selected) loadMessages(selected.id);
    }, 20000);

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
    if (!selected) return;
    loadMessages(selected.id);
    MessagesService.markAsRead({ sender_id: selected.id });
  }, [selected]);

  const sendMessage = async () => {
    if (!draft.trim() || sending || !selected) return;

    setSending(true);
    try {
      const msg = await MessagesService.sendMessage({
        receiver_id: selected.id,
        content: draft.trim(),
        reply_to_id: replyTo?.id,
      });

      setMessages(prev => [...prev, msg]);
      setDraft('');
      setReplyTo(null);
      loadConversations();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  // Search users
  useEffect(() => {
    if (!userQuery.trim()) {
      setFoundUsers([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const users = await MessagesService.searchUsers(userQuery);
        setFoundUsers(users || []);
      } catch {
        setFoundUsers([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [userQuery]);

  const openConversation = (user: any) => {
    const conv: Conversation = {
      id: user.id,
      user,
      latest_message: { id: 0, content: '', type: 'text', status: 'sent', created_at: new Date().toISOString() } as any,
      unread_count: 0,
      updated_at: new Date().toISOString(),
    };
    setSelected(conv);
    setNewChatOpen(false);
    setUserQuery('');
    setFoundUsers([]);
    setMessages([]);
    setMobilePaneOpen(true);
  };

  const filteredConversations = conversations.filter(c =>
    c.user?.name?.toLowerCase().includes(sideSearch.toLowerCase()) ||
    c.latest_message?.content?.toLowerCase().includes(sideSearch.toLowerCase())
  );

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#0f172a',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: '#e2e8f0',
      overflow: 'hidden'
    }}>
      {/* Sidebar */}
      <aside style={{
        width: 340,
        minWidth: 300,
        borderRight: '1px solid #1e293b',
        display: mobilePaneOpen ? 'none' : 'flex',
        flexDirection: 'column',
        background: '#0f172a'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  background: cfg.accent + '22',
                  color: cfg.accent,
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.5
                }}>
                  {cfg.label}
                </span>
                {!online && <WifiOff size={16} color="#ef4444" />}
              </div>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{cfg.tagline}</p>
            </div>

            <button
              onClick={() => setNewChatOpen(!newChatOpen)}
              style={{ background: 'none', border: 'none', color: cfg.accent, padding: 8, borderRadius: 8 }}
            >
              <MessageSquarePlus size={22} />
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#64748b' }} />
            <input
              style={{
                width: '100%', padding: '10px 12px 10px 40px',
                background: '#1e293b', border: '1px solid #334155',
                borderRadius: 10, color: '#e2e8f0', fontSize: 14
              }}
              placeholder="Search conversations..."
              value={sideSearch}
              onChange={(e) => setSideSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
              No conversations yet
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = selected?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelected(conv);
                    setMobilePaneOpen(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: isActive ? cfg.accent + '15' : 'transparent',
                    borderLeft: isActive ? `4px solid ${cfg.accent}` : '4px solid transparent',
                    border: 'none',
                    textAlign: 'left',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <Avatar name={conv.user?.name || ''} size={48} accent={cfg.accent} />
                    {conv.user?.is_online && (
                      <span style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, background: '#22c55e', borderRadius: '50%', border: '2px solid #0f172a' }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: conv.unread_count ? 600 : 500, fontSize: 15 }}>
                        {conv.user?.name || 'Unknown User'}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {relativeTime(conv.updated_at || '')}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: conv.unread_count ? '#e2e8f0' : '#94a3b8',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {conv.latest_message?.content || 'No messages yet'}
                    </div>
                  </div>

                  {conv.unread_count > 0 && (
                    <div style={{
                      background: cfg.accent,
                      color: 'white',
                      fontSize: 11,
                      fontWeight: 700,
                      minWidth: 20,
                      height: 20,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {conv.unread_count}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#0a1628',
        minWidth: 0,
      }}>
        {selected ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #1e293b',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setMobilePaneOpen(false)}
                  style={{ display: window.innerWidth < 768 ? 'block' : 'none', background: 'none', border: 'none', color: '#94a3b8' }}
                >
                  <ChevronLeft size={24} />
                </button>

                <Avatar name={selected.user?.name || ''} size={42} accent={cfg.accent} />
                <div>
                  <div style={{ fontWeight: 600 }}>{selected.user?.name}</div>
                  <div style={{ fontSize: 12, color: selected.user?.is_online ? '#22c55e' : '#64748b' }}>
                    {selected.user?.is_online ? '● Online' : 'Offline'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ background: 'none', border: 'none', padding: 8 }}><Phone size={20} color="#94a3b8" /></button>
                <button style={{ background: 'none', border: 'none', padding: 8 }}><Video size={20} color="#94a3b8" /></button>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: 100, color: '#64748b' }}>
                  Start the conversation
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} style={{
                    display: 'flex',
                    justifyContent: msg.is_from_me ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{
                      maxWidth: '70%',
                      background: msg.is_from_me ? cfg.accent : '#1e293b',
                      padding: '10px 14px',
                      borderRadius: msg.is_from_me ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    }}>
                      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>{msg.content}</p>
                      <div style={{ fontSize: 10, textAlign: 'right', marginTop: 4, opacity: 0.7 }}>
                        {fullTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #1e293b', background: '#0f172a' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <button style={{ padding: 10 }}><Paperclip size={20} color="#64748b" /></button>
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: '#e2e8f0',
                    resize: 'none',
                    minHeight: 48,
                    maxHeight: 120,
                    fontSize: 15
                  }}
                  onKeyDown={(e) => {
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
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: draft.trim() ? cfg.accent : '#334155',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: draft.trim() ? 'pointer' : 'default'
                  }}
                >
                  <Send size={18} color="#fff" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b'
          }}>
            <div style={{
              width: 90,
              height: 90,
              borderRadius: 30,
              background: cfg.accent + '15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20
            }}>
              <MessageSquarePlus size={48} color={cfg.accent} />
            </div>
            <h2 style={{ color: '#e2e8f0', marginBottom: 8 }}>No conversation selected</h2>
            <p>Select a conversation from the left or start a new one</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SharedMessagesPage;