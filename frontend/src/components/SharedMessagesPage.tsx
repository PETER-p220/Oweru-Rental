import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Send,
  Search,
  Plus,
  MessageSquare,
  ChevronLeft,
  X,
  Bell,
  Check,
  CheckCheck,
  Inbox,
  Sparkles,
} from 'lucide-react';
import MessagesService, { type Message, type Conversation } from '../services/messages';
import {
  agentEyebrowStyle,
  agentHeaderInnerStyle,
  agentSubtitleStyle,
  agentTitleStyle,
  agentWorkspace,
} from '../pages/agent/agentWorkspaceTheme';

const ROLE_ACCENT: Record<string, string> = {
  tenant: agentWorkspace.link,
  agent: '#0EA5E9',
  landlord: agentWorkspace.gold,
};

const ROLE_META: Record<string, { title: string; sub: string; badge: string }> = {
  tenant: { title: 'Messages', sub: 'Chat with your landlord or agent', badge: 'Tenant' },
  agent: { title: 'Messages', sub: 'Client conversations and follow-ups', badge: 'Agent' },
  landlord: { title: 'Messages', sub: 'Stay in touch with tenants and agents', badge: 'Landlord' },
};

const QUICK_REPLIES = [
  'Hello! I had a question about the property.',
  'When would be a good time for a site visit?',
  'Thank you — I will get back to you shortly.',
];

type InboxFilter = 'all' | 'unread';

interface Props {
  role?: 'tenant' | 'agent' | 'landlord';
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const relTime = (iso: string) => {
  if (!iso) return '';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
};

const fullTime = (iso: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

const dayLabel = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfMsg.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
};

const messageIsRead = (msg: Message) =>
  (msg as Message & { is_read?: boolean }).is_read === true || msg.status === 'read';

const Avatar = ({ name, size = 40, accent }: { name: string; size?: number; accent: string }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      flexShrink: 0,
      background: `${accent}14`,
      border: `1.5px solid ${accent}35`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: Math.round(size * 0.36),
      fontWeight: 700,
      color: accent,
    }}
  >
    {initials(name || '?')}
  </div>
);

const SharedMessagesPage = ({ role = 'tenant' }: Props) => {
  const accent = ROLE_ACCENT[role] || agentWorkspace.gold;
  const meta = ROLE_META[role];

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sideSearch, setSideSearch] = useState('');
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [globalUnread, setGlobalUnread] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectedRef = useRef<Conversation | null>(null);
  selectedRef.current = selected;

  const loadConversations = useCallback(async () => {
    try {
      const data = await MessagesService.getConversations();
      setConversations(data.conversations || []);
      if (typeof data.unread_count === 'number') setGlobalUnread(data.unread_count);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (userId: number) => {
    try {
      const data = await MessagesService.getMessages(userId);
      setMessages(data.messages || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const iv = setInterval(() => {
      loadConversations();
      const current = selectedRef.current;
      if (current) loadMessages(current.id);
    }, 15_000);
    return () => clearInterval(iv);
  }, [loadConversations, loadMessages]);

  useEffect(() => {
    if (selected) loadMessages(selected.id);
  }, [selected, loadMessages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [draft]);

  useEffect(() => {
    if (!newChatOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNewChatOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [newChatOpen]);

  const markConversationRead = useCallback(async (conv: Conversation) => {
    if (!conv.unread_count) return;
    try {
      await MessagesService.markAsRead({ sender_id: conv.id });
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c)),
      );
      setGlobalUnread((n) => Math.max(0, n - (conv.unread_count || 0)));
    } catch {
      /* silent */
    }
  }, []);

  const selectConversation = (conv: Conversation) => {
    setSelected(conv);
    setMobileChatOpen(true);
    markConversationRead(conv);
  };

  const sendMessage = async (text?: string) => {
    const body = (text ?? draft).trim();
    if (!body || sending || !selected) return;
    setSending(true);
    try {
      const msg = await MessagesService.sendMessage({ receiver_id: selected.id, content: body });
      setMessages((p) => [...p, msg]);
      if (!text) setDraft('');
      loadConversations();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    } catch {
      /* silent */
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!userQuery.trim()) {
      setFoundUsers([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setFoundUsers((await MessagesService.searchUsers(userQuery)) || []);
      } catch {
        setFoundUsers([]);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [userQuery]);

  const openConversation = (user: any) => {
    setSelected({
      id: user.id,
      user,
      latest_message: null as any,
      unread_count: 0,
      updated_at: new Date().toISOString(),
    });
    setNewChatOpen(false);
    setUserQuery('');
    setFoundUsers([]);
    setMessages([]);
    setMobileChatOpen(true);
  };

  const sortedFiltered = useMemo(() => {
    const q = sideSearch.trim().toLowerCase();
    let list = [...conversations];
    if (inboxFilter === 'unread') list = list.filter((c) => (c.unread_count || 0) > 0);
    if (q) {
      list = list.filter(
        (c) =>
          c.user?.name?.toLowerCase().includes(q) ||
          c.latest_message?.content?.toLowerCase().includes(q) ||
          c.property?.title?.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      const ua = a.unread_count || 0;
      const ub = b.unread_count || 0;
      if (ua !== ub) return ub - ua;
      return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
    });
    return list;
  }, [conversations, sideSearch, inboxFilter]);

  const messageGroups = useMemo(() => {
    const groups: { label: string; items: Message[] }[] = [];
    let last = '';
    for (const msg of messages) {
      const label = dayLabel(msg.created_at);
      if (label !== last) {
        groups.push({ label, items: [msg] });
        last = label;
      } else {
        groups[groups.length - 1].items.push(msg);
      }
    }
    return groups;
  }, [messages]);

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);
  const unreadDisplay = globalUnread || totalUnread;

  const lightInput: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    background: agentWorkspace.pageBg,
    border: `1px solid ${agentWorkspace.border}`,
    borderRadius: 8,
    color: agentWorkspace.text,
    fontSize: 13,
    outline: 'none',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: agentWorkspace.pageBg,
        color: agentWorkspace.text,
        minHeight: '100vh',
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .msg-shell-scroll ::-webkit-scrollbar { width: 5px; }
        .msg-shell-scroll ::-webkit-scrollbar-thumb { background: ${agentWorkspace.border}; border-radius: 4px; }
        .msg-conv:hover { background: ${agentWorkspace.pageBg} !important; }
        .msg-icon-btn:hover { background: ${agentWorkspace.pageBg} !important; }
        .msg-user-row:hover { background: ${agentWorkspace.pageBg} !important; }
        .msg-light-input:focus { border-color: ${accent} !important; box-shadow: 0 0 0 3px ${accent}22; }
        .msg-filter-tab { border: 1px solid ${agentWorkspace.border}; background: ${agentWorkspace.cardBg}; color: ${agentWorkspace.textSub}; }
        .msg-filter-tab.active { background: ${accent}14; border-color: ${accent}55; color: ${accent}; font-weight: 700; }
        @media (max-width: 768px) {
          .msg-sidebar { width:100% !important; min-width:unset !important; display:flex !important; }
          .msg-sidebar.hide-mob { display:none !important; }
          .msg-chat { display:none !important; }
          .msg-chat.show-mob { display:flex !important; width:100% !important; }
          .msg-back { display:flex !important; }
          .msg-header-inner { padding: 28px 16px 24px !important; }
          .msg-pad { padding-left: 14px !important; padding-right: 14px !important; }
        }
        @media (min-width: 769px) {
          .msg-sidebar { display:flex !important; }
          .msg-chat { display:flex !important; }
          .msg-back { display:none !important; }
        }
      `}</style>

      {/* Page header — matches agent / dashboard shell */}
      <div
        style={{
          background: agentWorkspace.headerBg,
          borderBottom: `1px solid rgba(255,255,255,0.06)`,
        }}
      >
        <div className="msg-header-inner msg-pad" style={{ ...agentHeaderInnerStyle, padding: '40px 40px 36px' }}>
          <div>
            <div style={agentEyebrowStyle}>
              <MessageSquare size={12} style={{ marginRight: 2 }} />
              {meta.badge} · Inbox
            </div>
            <h1 style={agentTitleStyle}>{meta.title}</h1>
            <p style={agentSubtitleStyle}>{meta.sub}</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '10px 16px',
                minWidth: 100,
              }}
            >
              <div style={{ fontSize: 10, color: agentWorkspace.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Conversations
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 2 }}>{conversations.length}</div>
            </div>
            <div
              style={{
                background: unreadDisplay ? 'rgba(200,145,40,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${unreadDisplay ? 'rgba(200,145,40,0.35)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 10,
                padding: '10px 16px',
                minWidth: 100,
              }}
            >
              <div style={{ fontSize: 10, color: agentWorkspace.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Unread
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: unreadDisplay ? agentWorkspace.gold : '#fff', marginTop: 2 }}>
                {unreadDisplay}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNewChatOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 18px',
                background: agentWorkspace.gold,
                border: 'none',
                borderRadius: 9,
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(200,145,40,0.28)',
              }}
            >
              <Plus size={16} /> New chat
            </button>
          </div>
        </div>
      </div>

      {/* Messenger card */}
      <div
        className="msg-pad"
        style={{ maxWidth: agentWorkspace.maxContent, margin: '0 auto', padding: '24px 40px 40px' }}
      >
        <div
          style={{
            display: 'flex',
            height: 'min(72vh, 720px)',
            minHeight: 420,
            background: agentWorkspace.cardBg,
            border: `1px solid ${agentWorkspace.border}`,
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
          }}
        >
          {/* Sidebar */}
          <aside
            className={`msg-sidebar msg-shell-scroll${mobileChatOpen ? ' hide-mob' : ''}`}
            style={{
              width: 320,
              minWidth: 280,
              flexDirection: 'column',
              borderRight: `1px solid ${agentWorkspace.border}`,
              background: agentWorkspace.cardBg,
            }}
          >
            <div style={{ padding: '14px 14px 12px', borderBottom: `1px solid ${agentWorkspace.border}` }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {(['all', 'unread'] as InboxFilter[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`msg-filter-tab${inboxFilter === key ? ' active' : ''}`}
                    onClick={() => setInboxFilter(key)}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    {key === 'all' ? <Inbox size={14} /> : <Bell size={14} />}
                    {key === 'all' ? 'All' : 'Unread'}
                    {key === 'unread' && totalUnread > 0 && (
                      <span
                        style={{
                          background: accent,
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 99,
                        }}
                      >
                        {totalUnread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: agentWorkspace.textMuted,
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="search"
                  placeholder="Search name, message, property…"
                  value={sideSearch}
                  onChange={(e) => setSideSearch(e.target.value)}
                  className="msg-light-input"
                  style={{ ...lightInput, paddingLeft: 32 }}
                />
              </div>
            </div>

            <div className="msg-shell-scroll" style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: agentWorkspace.textMuted, fontSize: 13 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      border: `2px solid ${agentWorkspace.border}`,
                      borderTopColor: accent,
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto 10px',
                    }}
                  />
                  Loading inbox…
                </div>
              ) : sortedFiltered.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <Sparkles size={22} color={agentWorkspace.textMuted} style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: agentWorkspace.textSub }}>
                    {inboxFilter === 'unread' ? 'No unread messages' : 'No conversations yet'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewChatOpen(true)}
                    style={{
                      marginTop: 12,
                      background: 'none',
                      border: 'none',
                      color: accent,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Start a chat
                  </button>
                </div>
              ) : (
                sortedFiltered.map((conv) => {
                  const sel = selected?.id === conv.id;
                  return (
                    <div
                      key={conv.id}
                      className="msg-conv"
                      onClick={() => selectConversation(conv)}
                      style={{
                        padding: '12px 14px',
                        display: 'flex',
                        gap: 10,
                        cursor: 'pointer',
                        alignItems: 'flex-start',
                        background: sel ? `${accent}10` : 'transparent',
                        borderLeft: `3px solid ${sel ? accent : 'transparent'}`,
                        transition: 'background 0.12s',
                      }}
                    >
                      <Avatar name={conv.user?.name || 'User'} size={40} accent={accent} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 3,
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: conv.unread_count ? 800 : 600,
                              fontSize: 13,
                              color: agentWorkspace.text,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {conv.user?.name || 'Unknown'}
                          </div>
                          <div style={{ fontSize: 10, color: agentWorkspace.textMuted, flexShrink: 0 }}>
                            {relTime(conv.updated_at || conv.latest_message?.created_at || '')}
                          </div>
                        </div>
                        {conv.property?.title && (
                          <div
                            style={{
                              fontSize: 10,
                              color: agentWorkspace.gold,
                              fontWeight: 600,
                              marginBottom: 3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {conv.property.title}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: 12,
                            color: conv.unread_count ? agentWorkspace.text : agentWorkspace.textMuted,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {conv.latest_message?.content || 'No messages yet'}
                        </div>
                      </div>
                      {conv.unread_count > 0 && (
                        <div
                          style={{
                            minWidth: 18,
                            height: 18,
                            padding: '0 5px',
                            borderRadius: 99,
                            background: accent,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* Chat */}
          <main
            className={`msg-chat msg-shell-scroll${mobileChatOpen ? ' show-mob' : ''}`}
            style={{ flex: 1, flexDirection: 'column', background: agentWorkspace.pageBg, minWidth: 0 }}
          >
            {selected ? (
              <>
                <div
                  style={{
                    background: agentWorkspace.cardBg,
                    borderBottom: `1px solid ${agentWorkspace.border}`,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <button
                      type="button"
                      className="msg-back msg-icon-btn"
                      onClick={() => setMobileChatOpen(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: agentWorkspace.textSub,
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: 8,
                      }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <Avatar name={selected.user?.name || ''} size={36} accent={accent} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: agentWorkspace.text }}>
                        {selected.user?.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: selected.user?.is_online ? '#16A34A' : agentWorkspace.textMuted,
                          textTransform: 'capitalize',
                        }}
                      >
                        {selected.user?.is_online ? 'Online' : selected.user?.user_type || 'Offline'}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="msg-shell-scroll"
                  style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}
                >
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: 48, padding: '0 12px' }}>
                      <p style={{ fontSize: 13, color: agentWorkspace.textMuted, marginBottom: 16 }}>
                        Start the conversation — tap a quick reply or type below.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360, margin: '0 auto' }}>
                        {QUICK_REPLIES.map((line) => (
                          <button
                            key={line}
                            type="button"
                            onClick={() => sendMessage(line)}
                            disabled={sending}
                            style={{
                              textAlign: 'left',
                              padding: '10px 14px',
                              background: agentWorkspace.cardBg,
                              border: `1px solid ${agentWorkspace.border}`,
                              borderRadius: 10,
                              fontSize: 12,
                              color: agentWorkspace.textSub,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              lineHeight: 1.45,
                            }}
                          >
                            {line}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messageGroups.map((group) => (
                      <div key={group.label + group.items[0]?.id} style={{ marginBottom: 8 }}>
                        <div
                          style={{
                            textAlign: 'center',
                            fontSize: 11,
                            fontWeight: 600,
                            color: agentWorkspace.textMuted,
                            margin: '8px 0 12px',
                          }}
                        >
                          {group.label}
                        </div>
                        {group.items.map((msg) => (
                          <div
                            key={msg.id}
                            style={{
                              display: 'flex',
                              justifyContent: msg.is_from_me ? 'flex-end' : 'flex-start',
                              marginBottom: 6,
                              animation: 'fadeIn 0.18s ease',
                            }}
                          >
                            <div
                              style={{
                                maxWidth: '78%',
                                padding: '10px 14px',
                                background: msg.is_from_me ? accent : agentWorkspace.cardBg,
                                border: msg.is_from_me ? 'none' : `1px solid ${agentWorkspace.border}`,
                                borderRadius: msg.is_from_me ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                color: msg.is_from_me ? '#fff' : agentWorkspace.text,
                                boxShadow: msg.is_from_me ? `0 2px 8px ${accent}28` : '0 1px 2px rgba(15,23,42,0.04)',
                              }}
                            >
                              <p style={{ margin: 0, lineHeight: 1.55, fontSize: 14 }}>{msg.content}</p>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  gap: 4,
                                  marginTop: 4,
                                }}
                              >
                                <span style={{ fontSize: 10, opacity: msg.is_from_me ? 0.75 : 0.55 }}>
                                  {fullTime(msg.created_at)}
                                </span>
                                {msg.is_from_me &&
                                  (messageIsRead(msg) ? (
                                    <CheckCheck size={11} style={{ opacity: 0.85 }} />
                                  ) : (
                                    <Check size={11} style={{ opacity: 0.55 }} />
                                  ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>

                <div
                  style={{
                    background: agentWorkspace.cardBg,
                    borderTop: `1px solid ${agentWorkspace.border}`,
                    padding: '12px 14px',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <textarea
                      ref={textareaRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Write a message… (Enter to send, Shift+Enter for new line)"
                      rows={1}
                      className="msg-light-input"
                      style={{
                        ...lightInput,
                        flex: 1,
                        resize: 'none',
                        minHeight: 42,
                        maxHeight: 120,
                        lineHeight: 1.5,
                        fontSize: 14,
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={!draft.trim() || sending}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        flexShrink: 0,
                        border: 'none',
                        background: draft.trim() ? agentWorkspace.gold : agentWorkspace.pageBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: draft.trim() ? 'pointer' : 'not-allowed',
                        boxShadow: draft.trim() ? '0 4px 12px rgba(200,145,40,0.25)' : 'none',
                        opacity: sending ? 0.7 : 1,
                      }}
                    >
                      {sending ? (
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            border: '2px solid rgba(255,255,255,0.35)',
                            borderTopColor: '#fff',
                            borderRadius: '50%',
                            animation: 'spin 0.7s linear infinite',
                          }}
                        />
                      ) : (
                        <Send size={16} color={draft.trim() ? '#fff' : agentWorkspace.textMuted} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 24,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: `${agentWorkspace.gold}14`,
                    border: `1.5px solid ${agentWorkspace.gold}35`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <MessageSquare size={28} color={agentWorkspace.gold} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: agentWorkspace.text, marginBottom: 6 }}>
                  Select a conversation
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: agentWorkspace.textMuted,
                    textAlign: 'center',
                    maxWidth: 280,
                    lineHeight: 1.6,
                    margin: '0 0 18px',
                  }}
                >
                  Pick someone from the inbox or start a new chat. Unread threads are sorted to the top.
                </p>
                <button
                  type="button"
                  onClick={() => setNewChatOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    background: agentWorkspace.gold,
                    border: 'none',
                    borderRadius: 9,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(200,145,40,0.26)',
                    fontFamily: 'inherit',
                  }}
                >
                  <Plus size={15} /> New chat
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {newChatOpen && (
        <div
          role="dialog"
          aria-modal
          aria-label="New conversation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNewChatOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              background: agentWorkspace.cardBg,
              borderRadius: 14,
              width: '100%',
              maxWidth: 420,
              padding: '22px 20px',
              border: `1px solid ${agentWorkspace.border}`,
              boxShadow: '0 24px 48px rgba(15,23,42,0.18)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: agentWorkspace.gold,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  New conversation
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: agentWorkspace.text }}>Find someone to message</div>
              </div>
              <button
                type="button"
                onClick={() => setNewChatOpen(false)}
                className="msg-icon-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  color: agentWorkspace.textMuted,
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 8,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <input
              type="search"
              placeholder="Search by name or email…"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="msg-light-input"
              style={{ ...lightInput, marginBottom: 12 }}
              autoFocus
            />

            <div className="msg-shell-scroll" style={{ maxHeight: 300, overflowY: 'auto' }}>
              {foundUsers.length === 0 && userQuery.trim() && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: agentWorkspace.textMuted, fontSize: 13 }}>
                  No users found
                </div>
              )}
              {foundUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="msg-user-row"
                  onClick={() => openConversation(user)}
                  style={{
                    width: '100%',
                    padding: '10px 10px',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    borderRadius: 10,
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <Avatar name={user.name} size={36} accent={accent} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: agentWorkspace.text }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: agentWorkspace.textMuted, marginTop: 2, textTransform: 'capitalize' }}>
                      {user.user_type}
                    </div>
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
