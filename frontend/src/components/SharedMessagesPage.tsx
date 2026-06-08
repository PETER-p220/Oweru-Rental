import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Send, Search, Plus, MessageSquarePlus,
  ChevronLeft, X, Paperclip, Phone, Video,
  Bell, Check, CheckCheck,
} from 'lucide-react';
import MessagesService, { type Message, type Conversation } from '../services/messages';

// ── Design tokens
const C = {
  pageBg:    '#F1F5F9',
  sidebarBg: '#0F172A',
  headerBg:  '#1E293B',
  chatBg:    '#0A1120',
  bubbleIn:  '#1E293B',
  inputBg:   '#1E293B',
  border:    'rgba(255,255,255,0.07)',
  text:      '#F1F5F9',
  textSub:   '#CBD5E1',
  textMuted: '#64748B',
  slate700:  '#334155',
  gold:      '#C89128',
  goldGlow:  '0 4px 14px rgba(200,145,40,0.26)',
  green:     '#16A34A',
  red:       '#DC2626',
};

const ROLE_ACCENT: Record<string, string> = {
  tenant:   '#2563EB',
  agent:    '#0EA5E9',
  landlord: '#C89128',
};

const ROLE_META: Record<string, { title: string; sub: string; badge: string }> = {
  tenant:   { title: 'Tenant Inbox',   sub: 'Talk to your landlord or agent', badge: 'Tenant'   },
  agent:    { title: 'Agent Inbox',    sub: 'Manage client conversations',    badge: 'Agent'    },
  landlord: { title: 'Landlord Inbox', sub: 'Connect with your tenants',      badge: 'Landlord' },
};

interface Props { role?: 'tenant' | 'agent' | 'landlord'; }

const initials = (name: string) =>
  name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

const relTime = (iso: string) => {
  if (!iso) return '';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1)    return 'now';
  if (m < 60)   return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
};

const fullTime = (iso: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

const Avatar = ({ name, size = 40, accent }: { name: string; size?: number; accent: string }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: `${accent}18`, border: `1.5px solid ${accent}40`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: Math.round(size * 0.36), fontWeight: 700, color: accent,
    letterSpacing: '-0.01em',
  }}>
    {initials(name || '?')}
  </div>
);

const SharedMessagesPage = ({ role = 'tenant' }: Props) => {
  const accent = ROLE_ACCENT[role] || C.gold;
  const meta   = ROLE_META[role];

  const [conversations,  setConversations]  = useState<Conversation[]>([]);
  const [selected,       setSelected]       = useState<Conversation | null>(null);
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [draft,          setDraft]          = useState('');
  const [loading,        setLoading]        = useState(true);
  const [sending,        setSending]        = useState(false);
  const [sideSearch,     setSideSearch]     = useState('');
  const [newChatOpen,    setNewChatOpen]    = useState(false);
  const [userQuery,      setUserQuery]      = useState('');
  const [foundUsers,     setFoundUsers]     = useState<any[]>([]);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await MessagesService.getConversations();
      setConversations(data.conversations || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const loadMessages = useCallback(async (userId: number) => {
    try {
      const data = await MessagesService.getMessages(userId);
      setMessages(data.messages || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadConversations();
    const iv = setInterval(() => {
      loadConversations();
      if (selected) loadMessages(selected.id);
    }, 15_000);
    return () => clearInterval(iv);
  }, [selected]);

  useEffect(() => { if (selected) loadMessages(selected.id); }, [selected]);

  const sendMessage = async () => {
    if (!draft.trim() || sending || !selected) return;
    setSending(true);
    try {
      const msg = await MessagesService.sendMessage({ receiver_id: selected.id, content: draft.trim() });
      setMessages(p => [...p, msg]);
      setDraft('');
      loadConversations();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  useEffect(() => {
    if (!userQuery.trim()) { setFoundUsers([]); return; }
    const t = setTimeout(async () => {
      try { setFoundUsers((await MessagesService.searchUsers(userQuery)) || []); }
      catch { setFoundUsers([]); }
    }, 350);
    return () => clearTimeout(t);
  }, [userQuery]);

  const openConversation = (user: any) => {
    setSelected({ id: user.id, user, latest_message: null as any, unread_count: 0, updated_at: new Date().toISOString() });
    setNewChatOpen(false); setUserQuery(''); setFoundUsers([]); setMessages([]); setMobileChatOpen(true);
  };

  const filtered = conversations.filter(c =>
    c.user?.name?.toLowerCase().includes(sideSearch.toLowerCase()) ||
    c.latest_message?.content?.toLowerCase().includes(sideSearch.toLowerCase())
  );

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  const darkInput: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)',
    border: `1px solid ${C.border}`, borderRadius: 8, color: C.text,
    fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif',
    boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', background: C.chatBg, fontFamily: "'DM Sans', system-ui, sans-serif", overflow: 'hidden', color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }

        /* scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 4px; }

        /* hover states */
        .conv-row:hover { background: rgba(255,255,255,0.05) !important; }
        .icon-btn:hover { background: rgba(255,255,255,0.09) !important; }
        .user-row:hover { background: rgba(255,255,255,0.07) !important; }
        .dark-input:focus { border-color: ${accent} !important; }

        /* mobile */
        @media (max-width: 640px) {
          .msg-sidebar { width:100% !important; min-width:unset !important; display:flex !important; }
          .msg-sidebar.hide-mob { display:none !important; }
          .msg-chat { display:none !important; }
          .msg-chat.show-mob { display:flex !important; width:100% !important; }
          .back-btn { display:flex !important; }
        }
        @media (min-width: 641px) {
          .msg-sidebar { display:flex !important; }
          .msg-chat { display:flex !important; }
          .back-btn { display:none !important; }
        }
      `}</style>

      {/* ══ SIDEBAR ══ */}
      <aside className={`msg-sidebar${mobileChatOpen ? ' hide-mob' : ''}`}
        style={{ width: 300, minWidth: 260, flexDirection: 'column', background: C.sidebarBg, borderRight: `1px solid ${C.border}` }}>

        {/* Sidebar header */}
        <div style={{ background: C.headerBg, padding: '16px 14px 13px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Role badge */}
              <span style={{ padding: '3px 8px', background: `${accent}20`, border: `1px solid ${accent}35`, borderRadius: 5, fontSize: 9, fontWeight: 700, color: accent, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                {meta.badge}
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>{meta.title}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {totalUnread > 0 && (
                <div style={{ position: 'relative' }}>
                  <Bell size={15} style={{ color: C.textMuted }} />
                  <div style={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6, borderRadius: '50%', background: C.red, border: `1.5px solid ${C.headerBg}` }} />
                </div>
              )}
              <button onClick={() => setNewChatOpen(true)} className="icon-btn"
                style={{ padding: 7, background: `${accent}18`, border: `1px solid ${accent}35`, borderRadius: 7, color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}>
                <Plus size={15} />
              </button>
            </div>
          </div>
          <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 11 }}>{meta.sub}</p>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
            <input type="text" placeholder="Search…" value={sideSearch} onChange={e => setSideSearch(e.target.value)}
              className="dark-input"
              style={{ ...darkInput, paddingLeft: 32, paddingTop: 8, paddingBottom: 8 }} />
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '48px 16px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
              <div style={{ width: 18, height: 18, border: `2px solid rgba(255,255,255,0.08)`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 16px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>No conversations yet</div>
          ) : filtered.map(conv => {
            const sel = selected?.id === conv.id;
            return (
              <div key={conv.id} className="conv-row"
                onClick={() => { setSelected(conv); setMobileChatOpen(true); }}
                style={{ padding: '11px 13px', display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'center', background: sel ? `${accent}12` : 'transparent', borderLeft: `3px solid ${sel ? accent : 'transparent'}`, transition: 'background 0.12s', animation: 'fadeIn 0.2s ease' }}>
                <Avatar name={conv.user?.name || 'User'} size={38} accent={accent} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 6 }}>
                      {conv.user?.name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: 10, color: C.textMuted, flexShrink: 0 }}>{relTime(conv.updated_at || '')}</div>
                  </div>
                  <div style={{ fontSize: 12, color: conv.unread_count > 0 ? C.textSub : C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conv.latest_message?.content || 'No messages yet'}
                  </div>
                </div>
                {conv.unread_count > 0 && (
                  <div style={{ width: 17, height: 17, borderRadius: '50%', background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {conv.unread_count > 9 ? '9+' : conv.unread_count}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ══ CHAT AREA ══ */}
      <main className={`msg-chat${mobileChatOpen ? ' show-mob' : ''}`}
        style={{ flex: 1, flexDirection: 'column', background: C.chatBg, minWidth: 0 }}>

        {selected ? (
          <>
            {/* Chat header */}
            <div style={{ background: C.headerBg, borderBottom: `1px solid ${C.border}`, padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="back-btn icon-btn" onClick={() => setMobileChatOpen(false)}
                  style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 6, display: 'none', alignItems: 'center', borderRadius: 7, transition: 'background 0.12s' }}>
                  <ChevronLeft size={19} />
                </button>
                <Avatar name={selected.user?.name || ''} size={34} accent={accent} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{selected.user?.name}</div>
                  <div style={{ fontSize: 11, color: selected.user?.is_online ? C.green : C.textMuted, marginTop: 1 }}>
                    {selected.user?.is_online ? '● Online' : 'Offline'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {([Phone, Video] as any[]).map((Icon: any, i: number) => (
                  <button key={i} className="icon-btn"
                    style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 7, color: C.textMuted, transition: 'background 0.12s' }}>
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: 80, color: C.textMuted, fontSize: 13 }}>
                  No messages yet. Say hello! 👋
                </div>
              ) : messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.is_from_me ? 'flex-end' : 'flex-start', animation: 'fadeIn 0.18s ease' }}>
                  <div style={{
                    maxWidth: '74%', padding: '10px 14px',
                    background: msg.is_from_me ? accent : C.bubbleIn,
                    borderRadius: msg.is_from_me ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    color: C.text, boxShadow: msg.is_from_me ? `0 2px 8px ${accent}30` : 'none',
                  }}>
                    <p style={{ margin: 0, lineHeight: 1.55, fontSize: 14 }}>{msg.content}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                      <span style={{ fontSize: 10, opacity: 0.55 }}>{fullTime(msg.created_at)}</span>
                      {msg.is_from_me && (
                        msg.is_read
                          ? <CheckCheck size={11} style={{ opacity: 0.65 }} />
                          : <Check size={11} style={{ opacity: 0.45 }} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div style={{ background: C.headerBg, borderTop: `1px solid ${C.border}`, padding: '11px 14px', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <button className="icon-btn"
                  style={{ padding: 9, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, borderRadius: 8, color: C.textMuted, transition: 'background 0.12s' }}>
                  <Paperclip size={16} />
                </button>
                <textarea ref={textareaRef} value={draft} onChange={e => setDraft(e.target.value)}
                  placeholder="Type a message…" rows={1}
                  style={{ ...darkInput, flex: 1, resize: 'none', minHeight: 40, maxHeight: 110, lineHeight: 1.5, fontSize: 14, padding: '10px 14px' }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <button onClick={sendMessage} disabled={!draft.trim() || sending}
                  style={{ width: 40, height: 40, borderRadius: 9, flexShrink: 0, border: 'none', background: draft.trim() ? C.gold : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: draft.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.18s', boxShadow: draft.trim() ? C.goldGlow : 'none', opacity: sending ? 0.7 : 1 }}>
                  {sending
                    ? <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    : <Send size={15} color="#fff" />
                  }
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ width: 68, height: 68, borderRadius: 18, background: `${accent}14`, border: `1.5px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <MessageSquarePlus size={30} color={accent} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 7, letterSpacing: '-0.01em' }}>No conversation selected</div>
            <p style={{ fontSize: 13, color: C.textMuted, textAlign: 'center', maxWidth: 250, lineHeight: 1.65, margin: '0 0 22px' }}>
              Select a conversation from the sidebar or start a new one.
            </p>
            <button onClick={() => setNewChatOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: C.gold, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: C.goldGlow, fontFamily: 'inherit' }}>
              <Plus size={15} /> New Conversation
            </button>
          </div>
        )}
      </main>

      {/* ══ New Chat Modal ══ */}
      {newChatOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setNewChatOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,17,32,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: C.headerBg, borderRadius: 13, width: '100%', maxWidth: 390, padding: '22px 20px', border: `1px solid ${C.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.40)', animation: 'fadeIn 0.2s ease' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.textMuted, fontWeight: 700, marginBottom: 3 }}>Messaging</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>New Conversation</div>
              </div>
              <button onClick={() => setNewChatOpen(false)} className="icon-btn"
                style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 6, borderRadius: 7, transition: 'background 0.12s' }}>
                <X size={17} />
              </button>
            </div>

            <input type="text" placeholder="Search by name or email…" value={userQuery}
              onChange={e => setUserQuery(e.target.value)}
              className="dark-input"
              style={{ ...darkInput, marginBottom: 10 }} />

            <div style={{ maxHeight: 290, overflowY: 'auto' }}>
              {foundUsers.length === 0 && userQuery.trim() && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: C.textMuted, fontSize: 13 }}>No users found</div>
              )}
              {foundUsers.map(user => (
                <button key={user.id} className="user-row" onClick={() => openConversation(user)}
                  style={{ width: '100%', padding: '9px 10px', background: 'transparent', border: 'none', textAlign: 'left', borderRadius: 8, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'background 0.12s', fontFamily: 'inherit' }}>
                  <Avatar name={user.name} size={34} accent={accent} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1, textTransform: 'capitalize' }}>{user.user_type}</div>
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