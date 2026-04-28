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
    width: size,
    height: size,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${accent}30, ${accent}60)`,
    border: `2px solid ${accent}40`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.38,
    fontWeight: 700,
    color: accent,
    flexShrink: 0,
  }}>
    {initials(name)}
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

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await MessagesService.getConversations();
      setConversations(data.conversations || []);
      setUnread(data.unread_count || 0);
    } catch (err) {
      console.error("Failed to load conversations", err);
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
      console.error("Failed to load messages", err);
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
    if (selected) {
      loadMessages(selected.id);
    }
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

  // User search for new chat
  useEffect(() => {
    if (!userQuery.trim()) {
      setFoundUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const users = await MessagesService.searchUsers(userQuery);
        setFoundUsers(users || []);
      } catch {
        setFoundUsers([]);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [userQuery]);

  const openConversation = (user: any) => {
    const newConv: Conversation = {
      id: user.id,
      user: user,
      latest_message: null as any,
      unread_count: 0,
      updated_at: new Date().toISOString(),
    };
    setSelected(newConv);
    setNewChatOpen(false);
    setUserQuery('');
    setFoundUsers([]);
    setMessages([]);
    setMobilePaneOpen(true);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user?.name?.toLowerCase().includes(sideSearch.toLowerCase()) ||
    conv.latest_message?.content?.toLowerCase().includes(sideSearch.toLowerCase())
  );

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#0f172a',
      fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
      overflow: 'hidden',
      color: '#e2e8f0'
    }}>

      {/* ==================== SIDEBAR ==================== */}
      <aside style={{
        width: 340,
        minWidth: 320,
        borderRight: '1px solid #1e293b',
        display: mobilePaneOpen ? 'none' : 'flex',
        flexDirection: 'column',
        background: '#0f172a',
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{cfg.label}</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>{cfg.tagline}</div>
            </div>
            <button 
              onClick={() => setNewChatOpen(true)}
              style={{ padding: 8, background: 'none', border: 'none', color: cfg.accent }}
            >
              <Plus size={24} />
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', marginTop: 16 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: 13, color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={sideSearch}
              onChange={(e) => setSideSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 46px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 12,
                color: '#e2e8f0',
                fontSize: 14,
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading messages...</div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              No conversations found
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selected?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setSelected(conv);
                    setMobilePaneOpen(true);
                  }}
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    gap: 12,
                    cursor: 'pointer',
                    background: isSelected ? cfg.accent + '15' : 'transparent',
                    borderLeft: isSelected ? `4px solid ${cfg.accent}` : '4px solid transparent',
                  }}
                >
                  <Avatar name={conv.user?.name || 'User'} size={46} accent={cfg.accent} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        {conv.user?.name || 'Unknown User'}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {relativeTime(conv.updated_at || '')}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 13.5,
                      color: conv.unread_count > 0 ? '#cbd5e1' : '#94a3b8',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {conv.latest_message?.content || 'No message'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ==================== CHAT AREA ==================== */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a1628' }}>
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
                  style={{ display: 'none', background: 'none', border: 'none', color: '#94a3b8' }}
                  className="mobile-back-btn"
                >
                  <ChevronLeft size={26} />
                </button>

                <Avatar name={selected.user?.name || ''} size={42} accent={cfg.accent} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{selected.user?.name}</div>
                  <div style={{ fontSize: 12, color: selected.user?.is_online ? '#22c55e' : '#64748b' }}>
                    {selected.user?.is_online ? '● Online' : 'Offline'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 4 }}>
                <button style={{ padding: 8, background: 'none', border: 'none' }}><Phone size={20} color="#94a3b8" /></button>
                <button style={{ padding: 8, background: 'none', border: 'none' }}><Video size={20} color="#94a3b8" /></button>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: 80, color: '#64748b' }}>
                  <p>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} style={{
                    display: 'flex',
                    justifyContent: msg.is_from_me ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{
                      maxWidth: '75%',
                      backgroundColor: msg.is_from_me ? cfg.accent : '#1e293b',
                      padding: '11px 15px',
                      borderRadius: msg.is_from_me ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      color: msg.is_from_me ? '#fff' : '#e2e8f0',
                    }}>
                      <p style={{ margin: 0, lineHeight: 1.5, fontSize: 15 }}>{msg.content}</p>
                      <div style={{ fontSize: 11, textAlign: 'right', marginTop: 4, opacity: 0.75 }}>
                        {fullTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Message Input */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #1e293b', background: '#0f172a' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <button style={{ padding: 10 }}><Paperclip size={22} color="#64748b" /></button>
                
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your message..."
                  rows={1}
                  style={{
                    flex: 1,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: '#e2e8f0',
                    fontSize: 15,
                    resize: 'none',
                    minHeight: 48,
                    maxHeight: 130,
                    outline: 'none'
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
                    cursor: draft.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  <Send size={20} color="#ffffff" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b'
          }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: 30,
              background: cfg.accent + '15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24
            }}>
              <MessageSquarePlus size={50} color={cfg.accent} />
            </div>
            <h2 style={{ color: '#f1f5f9', marginBottom: 8 }}>No conversation selected</h2>
            <p>Select a conversation from the sidebar or start a new chat</p>
          </div>
        )}
      </main>

      {/* New Chat Modal */}
      {newChatOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1e293b',
            borderRadius: 16,
            width: '90%',
            maxWidth: 420,
            padding: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3>New Conversation</h3>
              <button onClick={() => setNewChatOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8' }}>
                <X size={24} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search users..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 10,
                color: '#e2e8f0',
                marginBottom: 16
              }}
            />

            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {foundUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => openConversation(user)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    borderRadius: 8,
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <Avatar name={user.name} size={40} accent={cfg.accent} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{user.user_type}</div>
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