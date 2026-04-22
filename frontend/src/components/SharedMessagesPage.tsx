import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Send, Search, Phone, Video, MoreVertical, Check, CheckCheck,
  Circle, Reply, Edit2, Trash2, Paperclip, Smile, Home, X,
  ChevronLeft, Wifi, WifiOff, Plus, MessageSquarePlus, Clock,
  Hash
} from 'lucide-react';
import MessagesService, { type Message, type Conversation } from '../services/messages';

/* Types */
interface Props {
  role?: 'tenant' | 'agent' | 'landlord';
}

/* Role colour mapping */
const ROLE_CONFIG = {
  tenant:   { accent: '#6C63FF', label: 'Tenant Inbox',   tagline: 'Talk to your landlord or agent' },
  agent:    { accent: '#0EA5E9', label: 'Agent Inbox',    tagline: 'Manage client conversations'    },
  landlord: { accent: '#10B981', label: 'Landlord Inbox', tagline: 'Connect with your tenants'      },
};

/* Tiny helpers */
const initials = (name: string) =>
  name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)    return 'now';
  if (m < 60)   return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  if (m < 10080)return `${Math.floor(m / 1440)}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const fullTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

/* Avatar component */
const Avatar = ({ name, size = 40, src, accent }: { name: string; size?: number; src?: string; accent: string }) => (
  <div
    style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: src ? 'transparent' : `linear-gradient(135deg, ${accent}33, ${accent}66)`,
      border: `2px solid ${accent}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: accent,
      fontFamily: 'Georgia, serif', overflow: 'hidden',
    }}
  >
    {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(name)}
  </div>
);

/* Status tick icon */
const Tick = ({ status, accent }: { status: string; accent: string }) => {
  if (status === 'read')      return <CheckCheck size={13} style={{ color: accent }} />;
  if (status === 'delivered') return <CheckCheck size={13} style={{ color: '#94a3b8' }} />;
  return <Check size={13} style={{ color: '#94a3b8' }} />;
};

/* MAIN COMPONENT */
const SharedMessagesPage = ({ role = 'tenant' }: Props) => {
  const cfg = ROLE_CONFIG[role];

  /* state */
  const [conversations, setConversations]   = useState<Conversation[]>([]);
  const [selected, setSelected]             = useState<Conversation | null>(null);
  const [messages, setMessages]             = useState<Message[]>([]);
  const [draft, setDraft]                   = useState('');
  const [loading, setLoading]               = useState(true);
  const [sending, setSending]               = useState(false);
  const [unread, setUnread]                 = useState(0);
  const [sideSearch, setSideSearch]         = useState('');
  const [newChatOpen, setNewChatOpen]       = useState(false);
  const [userQuery, setUserQuery]           = useState('');
  const [foundUsers, setFoundUsers]         = useState<any[]>([]);
  const [replyTo, setReplyTo]               = useState<Message | null>(null);
  const [editing, setEditing]               = useState<{ id: number; content: string } | null>(null);
  const [mobilePaneOpen, setMobilePaneOpen] = useState(false);
  const [online, setOnline]                 = useState(true);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* load data */
  const loadConversations = useCallback(async () => {
    try {
      const data = await MessagesService.getConversations();
      setConversations(data.conversations);
      setUnread(data.unread_count);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  const loadMessages = useCallback(async (userId: number) => {
    try {
      const data = await MessagesService.getMessages(userId);
      setMessages(data.messages);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadConversations();
    const t = setInterval(() => {
      loadConversations();
      if (selected) loadMessages(selected.id);
    }, 20_000);
    window.addEventListener('online',  () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));
    return () => { clearInterval(t); };
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.id);
    MessagesService.markAsRead({ sender_id: selected.id });
    setConversations(prev =>
      prev.map(c => c.id === selected.id ? { ...c, unread_count: 0 } : c)
    );
  }, [selected]);

  /* send */
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
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    } catch { /* error toast could go here */ } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  /* user search */
  useEffect(() => {
    if (!userQuery.trim()) { setFoundUsers([]); return; }
    const t = setTimeout(async () => {
      const users = await MessagesService.searchUsers(userQuery).catch(() => []);
      setFoundUsers(users);
    }, 300);
    return () => clearTimeout(t);
  }, [userQuery]);

  const searchForUsers = async (term: string) => {
    if (!term.trim()) { setFoundUsers([]); return; }
    const t = setTimeout(async () => {
      const users = await MessagesService.searchUsers(userQuery).catch(() => []);
      setFoundUsers(users);
    }, 300);
    return () => clearTimeout(t);
  };

  const testAllUsers = async () => {
    try {
      console.log('Testing all users...');
      const users = await MessagesService.getAllUsers();
      console.log('All users found:', users);
      setFoundUsers(users);
    } catch (error) {
      console.error('Failed to get all users:', error);
    }
  };

  const openConversation = (user: any) => {
    const conv: Conversation = {
      id: user.id, user,
      latest_message: { id: 0, content: '', type: 'text', status: 'sent', created_at: new Date().toISOString(), sender_id: 0, is_edited: false },
      unread_count: 0, updated_at: new Date().toISOString(),
    };
    setSelected(conv);
    setNewChatOpen(false);
    setUserQuery('');
    setFoundUsers([]);
    setMessages([]);
    setMobilePaneOpen(true);
  };

  /* edit / delete */
  const saveEdit = async (id: number, content: string) => {
    await MessagesService.editMessage(id, content).catch(() => {});
    setMessages(prev => prev.map(m =>
      m.id === id ? { ...m, content, is_edited: true, edited_at: new Date().toISOString() } : m
    ));
    setEditing(null);
  };

  const deleteMsg = async (id: number) => {
    if (!confirm('Delete this message?')) return;
    await MessagesService.deleteMessage(id).catch(() => {});
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  /* filtered conversations */
  const filtered = conversations.filter(c =>
    c.user.name.toLowerCase().includes(sideSearch.toLowerCase()) ||
    c.latest_message.content.toLowerCase().includes(sideSearch.toLowerCase())
  );

  /* RENDER */
  return (
    <div style={s.root}>
      {/* Sidebar */}
      <aside style={{ ...s.sidebar, display: mobilePaneOpen ? 'none' : undefined } as React.CSSProperties}>
        {/* Sidebar header */}
        <div style={s.sideHeader}>
          <div style={s.sideHeaderTop}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ ...s.roleTag, background: cfg.accent + '22', color: cfg.accent }}>{cfg.label}</span>
                {!online && <WifiOff size={13} color="#ef4444" />}
              </div>
              <p style={s.tagline}>{cfg.tagline}</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {unread > 0 && (
                <span style={{ ...s.badge, background: cfg.accent }}>{unread > 99 ? '99+' : unread}</span>
              )}
              <button style={{ ...s.iconBtn, color: cfg.accent }} onClick={() => setNewChatOpen(v => !v)} title="New conversation">
                <MessageSquarePlus size={20} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={s.searchWrap}>
            <Search size={15} style={s.searchIcon} />
            <input
              style={s.searchInput}
              placeholder="Search conversations..."
              value={sideSearch}
              onChange={e => setSideSearch(e.target.value)}
            />
            {sideSearch && (
              <button style={s.clearBtn} onClick={() => setSideSearch('')}><X size={13} /></button>
            )}
          </div>

          {/* New chat panel */}
          {newChatOpen && (
            <div style={s.newChatPanel}>
              <div style={{ ...s.searchWrap, marginTop: 0 }}>
                <Search size={14} style={s.searchIcon} />
                <input
                  style={s.searchInput}
                  placeholder="Search people..."
                  value={userQuery}
                  autoFocus
                  onChange={e => setUserQuery(e.target.value)}
                />
                <button
                  onClick={testAllUsers}
                  style={{ marginLeft: 8, padding: '6px 12px', background: cfg.accent, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                >
                  Test All
                </button>
              </div>
              {foundUsers.length > 0 && (
                <div style={s.userResults}>
                  {foundUsers.map(u => (
                    <button key={u.id} style={s.userResult} onClick={() => openConversation(u)}>
                      <Avatar name={u.name} size={32} accent={cfg.accent} />
                      <div style={{ marginLeft: 10 }}>
                        <div style={s.userName}>{u.name}</div>
                        <div style={s.userType}>{u.user_type}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {userQuery && foundUsers.length === 0 && (
                <p style={s.noResult}>No users found</p>
              )}
            </div>
          )}
        </div>

        {/* Conversation list */}
        <div style={s.convList}>
          {loading ? (
            <div style={s.centerNote}>
              <div style={{ ...s.spinner, borderTopColor: cfg.accent }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={s.centerNote}>
              <MessageSquarePlus size={36} color={cfg.accent + '66'} />
              <p style={{ marginTop: 12, color: '#94a3b8', fontSize: 13 }}>No conversations yet</p>
              <button style={{ ...s.ghostBtn, color: cfg.accent, marginTop: 8 }} onClick={() => setNewChatOpen(true)}>
                <Plus size={14} style={{ marginRight: 4 }} /> Start one
              </button>
            </div>
          ) : (
            filtered.map(conv => {
              const isActive = selected?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  style={{
                    ...s.convItem,
                    background: isActive ? cfg.accent + '18' : 'transparent',
                    borderLeft: isActive ? `3px solid ${cfg.accent}` : '3px solid transparent',
                  }}
                  onClick={() => { setSelected(conv); setMobilePaneOpen(true); }}
                >
                  <div style={{ position: 'relative' }}>
                    <Avatar name={conv.user.name} size={44} accent={cfg.accent} />
                    {conv.user.is_online && (
                      <span style={{ ...s.onlineDot, background: '#22c55e' }} />
                    )}
                  </div>
                  <div style={s.convBody}>
                    <div style={s.convRow}>
                      <span style={{ ...s.convName, fontWeight: conv.unread_count > 0 ? 700 : 500 }}>
                        {conv.user.name}
                      </span>
                      <span style={s.convTime}>{relativeTime(conv.updated_at)}</span>
                    </div>
                    <div style={s.convRow}>
                      <span style={{ ...s.convPreview, fontWeight: conv.unread_count > 0 ? 600 : 400 }}>
                        {conv.latest_message.type === 'property' ? ' Property inquiry' : conv.latest_message.content || '...'}
                      </span>
                      {conv.unread_count > 0 && (
                        <span style={{ ...s.badge, background: cfg.accent, fontSize: 10 }}>{conv.unread_count}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Chat pane */}
      <main style={{
        ...s.chatPane,
        display: (!mobilePaneOpen && window.innerWidth < 768) ? 'none' : 'flex',
      } as React.CSSProperties}>
        {selected ? (
          <>
            {/* Chat header */}
            <div style={s.chatHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button style={s.backBtn} className="back-btn" onClick={() => setMobilePaneOpen(false)}>
                  <ChevronLeft size={20} />
                </button>
                <div style={{ position: 'relative' }}>
                  <Avatar name={selected.user.name} size={40} accent={cfg.accent} />
                  {selected.user.is_online && <span style={{ ...s.onlineDot, background: '#22c55e' }} />}
                </div>
                <div>
                  <div style={s.chatHeaderName}>{selected.user.name}</div>
                  <div style={s.chatHeaderSub}>
                    <span style={{ color: selected.user.is_online ? '#22c55e' : '#94a3b8' }}>
                      {selected.user.is_online ? ' Online' : ' Offline'}
                    </span>
                    <span style={{ color: '#cbd5e1', margin: '0 6px' }}>·</span>
                    <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{selected.user.user_type}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[Phone, Video, MoreVertical].map((Icon, i) => (
                  <button key={i} style={s.headerActionBtn}>
                    <Icon size={18} color="#94a3b8" />
                  </button>
                ))}
              </div>
            </div>

            {/* Messages area */}
            <div style={s.messagesArea}>
              {messages.length === 0 ? (
                <div style={s.centerNote}>
                  <div style={{ fontSize: 40 }}> </div>
                  <p style={{ color: '#94a3b8', marginTop: 12, fontSize: 14 }}>Say hello to {selected.user.name}!</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const isMe = msg.is_from_me;
                    const isEdit = editing?.id === msg.id;
                    const prevDate = idx > 0 ? new Date(messages[idx - 1].created_at).toDateString() : null;
                    const thisDate = new Date(msg.created_at).toDateString();
                    const showDate = prevDate !== thisDate;

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div style={s.dateDivider}>
                            <span style={s.datePill}>{thisDate === new Date().toDateString() ? 'Today' : thisDate}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
                          {!isMe && (
                            <div style={{ marginRight: 8, alignSelf: 'flex-end' }}>
                              <Avatar name={msg.sender.name} size={28} accent={cfg.accent} />
                            </div>
                          )}
                          <div style={{ maxWidth: '68%' }}>
                            {/* Reply preview */}
                            {msg.reply_to_id && (
                              <div style={{ ...s.replyPreview, background: isMe ? cfg.accent + '22' : '#1e293b' }}>
                                <Reply size={10} style={{ marginRight: 4, flexShrink: 0 }} />
                                <span style={{ color: '#94a3b8', fontSize: 11 }}>Replied to a message</span>
                              </div>
                            )}

                            {/* Bubble */}
                            <div
                              style={{
                                ...s.bubble,
                                background: isMe ? cfg.accent : '#1e293b',
                                color: isMe ? '#fff' : '#e2e8f0',
                                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                              }}
                              onDoubleClick={() => setReplyTo(msg)}
                            >
                              {/* Property card */}
                              {msg.type === 'property' && msg.property && (
                                <div style={s.propCard}>
                                  <Home size={14} style={{ marginRight: 6, flexShrink: 0 }} />
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{msg.property.title}</div>
                                    <div style={{ fontSize: 11, opacity: 0.7 }}>Property inquiry</div>
                                  </div>
                                </div>
                              )}

                              {isEdit ? (
                                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                                  <textarea
                                    autoFocus
                                    style={s.editTextarea}
                                    value={editing.content}
                                    onChange={e => setEditing({ ...editing, content: e.target.value })}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(msg.id, editing.content); }
                                      if (e.key === 'Escape') setEditing(null);
                                    }}
                                  />
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <button style={{ ...s.editBtn, background: '#22c55e' }} onClick={() => saveEdit(msg.id, editing.content)}><Check size={12} /></button>
                                    <button style={{ ...s.editBtn, background: '#ef4444' }} onClick={() => setEditing(null)}><X size={12} /></button>
                                  </div>
                                </div>
                              ) : (
                                <p style={s.msgText}>{msg.content}</p>
                              )}

                              <div style={s.msgMeta}>
                                <Clock size={10} style={{ marginRight: 3 }} />
                                {fullTime(msg.created_at)}
                                {msg.is_edited && <span style={{ marginLeft: 4, opacity: 0.7 }}>· edited</span>}
                                {isMe && <span style={{ marginLeft: 6 }}><Tick status={msg.status} accent="#fff" /></span>}
                              </div>
                            </div>

                            {/* Message actions */}
                            {!isEdit && (
                              <div style={{ ...s.msgActions, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                <button style={s.msgActionBtn} onClick={() => setReplyTo(msg)} title="Reply">
                                  <Reply size={12} />
                                </button>
                                {isMe && (
                                  <>
                                    <button style={s.msgActionBtn} onClick={() => setEditing({ id: msg.id, content: msg.content })} title="Edit">
                                      <Edit2 size={12} />
                                    </button>
                                    <button style={{ ...s.msgActionBtn, color: '#ef4444' }} onClick={() => deleteMsg(msg.id)} title="Delete">
                                      <Trash2 size={12} />
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          {isMe && <div style={{ marginLeft: 8, width: 28 }} />}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Input bar */}
            <div style={s.inputBar}>
              {/* Reply banner */}
              {replyTo && (
                <div style={s.replyBanner}>
                  <Reply size={13} color={cfg.accent} />
                  <span style={{ marginLeft: 8, fontSize: 13, color: '#94a3b8', flex: 1 }}>
                    Replying to <strong style={{ color: '#e2e8f0' }}>{replyTo.sender.name}</strong>
                    {' · '}
                    <span style={{ opacity: 0.7 }}>{replyTo.content.slice(0, 60)}{replyTo.content.length > 60 ? '...' : ''}</span>
                  </span>
                  <button style={s.closeReply} onClick={() => setReplyTo(null)}><X size={14} /></button>
                </div>
              )}

              <div style={s.inputRow}>
                <button style={s.attachBtn} onClick={() => fileRef.current?.click()} title="Attach file">
                  <Paperclip size={18} color="#64748b" />
                </button>
                <button style={s.attachBtn} title="Emoji">
                  <Smile size={18} color="#64748b" />
                </button>
                <textarea
                  ref={textareaRef}
                  style={s.textarea}
                  placeholder="Write a message..."
                  value={draft}
                  rows={1}
                  onChange={e => {
                    setDraft(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                />
                <button
                  style={{ ...s.sendBtn, background: draft.trim() ? cfg.accent : '#1e293b', cursor: draft.trim() ? 'pointer' : 'default' }}
                  onClick={sendMessage}
                  disabled={!draft.trim() || sending}
                >
                  {sending
                    ? <div style={{ ...s.spinner, width: 16, height: 16, borderTopColor: '#fff' }} />
                    : <Send size={16} color="#fff" />
                  }
                </button>
              </div>
              <input ref={fileRef} type="file" style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx" />
            </div>
          </>
        ) : (
          /* Empty state */
          <div style={s.emptyState}>
            <div style={{ ...s.emptyIcon, background: cfg.accent + '18', border: `1.5px solid ${cfg.accent}33` }}>
              <Send size={36} color={cfg.accent} />
            </div>
            <h2 style={s.emptyTitle}>Your inbox awaits</h2>
            <p style={s.emptySub}>Select a conversation or start a new one</p>
            <button
              style={{ ...s.sendBtn, background: cfg.accent, padding: '12px 28px', borderRadius: 12, marginTop: 24, fontSize: 14 }}
              onClick={() => setNewChatOpen(true)}
            >
              <Plus size={16} style={{ marginRight: 8 }} /> New conversation
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

/* Styles */
const s: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex', height: '100vh', width: '100%',
    background: '#0f172a', fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    overflow: 'hidden', color: '#e2e8f0',
  },

  /* Sidebar */
  sidebar: {
    width: 320, minWidth: 280, maxWidth: 360, display: 'flex', flexDirection: 'column',
    background: '#0f172a', borderRight: '1px solid #1e293b',
  },
  sideHeader: {
    padding: '20px 16px 12px', borderBottom: '1px solid #1e293b', flexShrink: 0,
  },
  sideHeaderTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14,
  },
  roleTag: {
    fontSize: 12, fontWeight: 700, letterSpacing: 0.5, padding: '3px 10px',
    borderRadius: 20, textTransform: 'uppercase',
  },
  tagline: { color: '#64748b', fontSize: 12, marginTop: 4 },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10, display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
    color: '#fff', padding: '0 6px',
  },
  iconBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center',
    transition: 'background 0.15s',
  },
  searchWrap: {
    position: 'relative', display: 'flex', alignItems: 'center', marginTop: 8,
  },
  searchIcon: { position: 'absolute', left: 10, color: '#475569', pointerEvents: 'none' },
  searchInput: {
    width: '100%', padding: '9px 32px 9px 32px', background: '#1e293b',
    border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0',
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
  },
  clearBtn: {
    position: 'absolute', right: 8, background: 'none', border: 'none',
    cursor: 'pointer', color: '#64748b', padding: 4,
  },
  newChatPanel: {
    marginTop: 10, background: '#1e293b', borderRadius: 12, padding: 10,
    border: '1px solid #334155',
  },
  userResults: { marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 },
  userResult: {
    display: 'flex', alignItems: 'center', padding: '8px 10px', borderRadius: 8,
    background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
    transition: 'background 0.15s', width: '100%',
  },
  userName: { color: '#e2e8f0', fontSize: 13, fontWeight: 600 },
  userType: { color: '#64748b', fontSize: 11, textTransform: 'capitalize' },
  noResult: { color: '#64748b', fontSize: 12, textAlign: 'center', padding: '8px 0' },
  convList: { flex: 1, overflowY: 'auto', paddingBottom: 8 },
  convItem: {
    width: '100%', display: 'flex', alignItems: 'center', padding: '10px 16px',
    cursor: 'pointer', border: 'none', textAlign: 'left', transition: 'background 0.15s',
    gap: 12,
  },
  convBody: { flex: 1, minWidth: 0 },
  convRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontSize: 14, color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  convTime: { fontSize: 11, color: '#64748b', flexShrink: 0, marginLeft: 8 },
  convPreview: { fontSize: 12, color: '#64748b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', border: '2px solid #0f172a' },
  centerNote: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, minHeight: 160 },
  spinner: { width: 28, height: 28, border: '3px solid #1e293b', borderTopColor: '#6C63FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  ghostBtn: { display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 },

  /* Chat pane */
  chatPane: {
    flex: 1, display: 'flex', flexDirection: 'column', background: '#0a1628', minWidth: 0,
  },
  chatHeader: {
    padding: '14px 20px', borderBottom: '1px solid #1e293b', background: '#0f172a',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
  },
  backBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b',
    padding: 4, borderRadius: 8, display: 'none',
  },
  chatHeaderName: { fontWeight: 700, fontSize: 15, color: '#f1f5f9' },
  chatHeaderSub: { fontSize: 12, display: 'flex', alignItems: 'center', marginTop: 2 },
  headerActionBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center',
  },
  messagesArea: {
    flex: 1, overflowY: 'auto', padding: '20px 20px 8px',
    display: 'flex', flexDirection: 'column',
    backgroundImage: 'radial-gradient(ellipse at 20% 50%, #1e293b18 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #1e293b22 0%, transparent 50%)',
  },
  dateDivider: { display: 'flex', justifyContent: 'center', margin: '12px 0 8px' },
  datePill: { background: '#1e293b', color: '#64748b', fontSize: 11, padding: '4px 14px', borderRadius: 20, fontWeight: 500 },
  bubble: {
    padding: '10px 14px', maxWidth: '100%', wordBreak: 'break-word',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  msgText: { margin: 0, fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap' },
  msgMeta: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, fontSize: 10, opacity: 0.65 },
  msgActions: { display: 'flex', gap: 4, marginTop: 3 },
  msgActionBtn: {
    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
    padding: '3px 5px', borderRadius: 6, fontSize: 11, display: 'flex', alignItems: 'center',
  },
  replyPreview: {
    display: 'flex', alignItems: 'center', padding: '5px 10px',
    borderRadius: '8px 8px 0 0', marginBottom: -4, fontSize: 11, color: '#94a3b8',
  },
  propCard: {
    display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '6px 10px', marginBottom: 8,
  },
  editTextarea: {
    flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
    color: '#e2e8f0', fontSize: 13, padding: '6px 8px', resize: 'none', outline: 'none',
  },
  editBtn: {
    width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
  },

  /* Input bar */
  inputBar: { padding: '12px 16px 16px', borderTop: '1px solid #1e293b', background: '#0f172a', flexShrink: 0 },
  replyBanner: {
    display: 'flex', alignItems: 'center', background: '#1e293b', borderRadius: 10,
    padding: '8px 12px', marginBottom: 8, borderLeft: '3px solid #6C63FF',
  },
  closeReply: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 },
  inputRow: { display: 'flex', alignItems: 'flex-end', gap: 8 },
  attachBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center',
  },
  textarea: {
    flex: 1, background: '#1e293b', border: '1px solid #334155',
    borderRadius: 14, color: '#e2e8f0', fontSize: 14, padding: '10px 14px',
    resize: 'none', outline: 'none', lineHeight: 1.5, minHeight: 42, maxHeight: 120,
    overflowY: 'auto', fontFamily: 'inherit',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 14, border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s, transform 0.1s', flexShrink: 0,
  },

  /* Empty state */
  emptyState: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' },
  emptySub: { color: '#64748b', fontSize: 14 },
};

/* CSS keyframe for spinner */
const styleEl = document.createElement('style');
styleEl.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
  button:hover { opacity: 0.85; }
  @media (max-width: 767px) {
    .back-btn { display: flex !important; }
  }
`;
if (!document.head.querySelector('[data-msg-styles]')) {
  styleEl.setAttribute('data-msg-styles', '1');
  document.head.appendChild(styleEl);
}

export default SharedMessagesPage;
