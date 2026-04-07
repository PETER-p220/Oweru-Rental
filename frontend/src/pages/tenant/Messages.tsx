import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, Inbox, AlertCircle, MessageCircle } from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatDate, headingStyle,
  inputStyle, pageStyle, palette, panelStyle, sectionTitleStyle, textareaStyle,
  tableStyle, tableWrapStyle, tdStyle, thStyle,
} from './tenantPageStyles';

const Messages = () => {
  const [messages, setMessages]   = useState<any[]>([]);
  const [recipient, setRecipient] = useState<any | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [form, setForm]           = useState({ subject: '', body: '' });

  const load = async () => {
    try {
      setLoading(true);
      const res = await Api.getTenantMessages();
      const payload = res.data || {};
      setMessages(Array.isArray(payload.messages) ? payload.messages : []);
      setRecipient(payload.recipient || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load messages.');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const unread = useMemo(() => messages.filter((m) => !m.read_at).length, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await Api.sendTenantMessage(form);
      setForm({ subject: '', body: '' });
      setSuccess('Message sent successfully.');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to send message.');
    }
  };

  return (
    <div style={{ ...pageStyle, padding: '0' }}>
      {/* Header */}
      <section style={{ ...panelStyle }}>
        <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: '2px', background: `linear-gradient(90deg, transparent, ${palette.amber}, transparent)` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={sectionTitleStyle}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.amber, display: 'inline-block' }} />
              Tenant Workspace
            </div>
            <h1 style={headingStyle}>Messages</h1>
            <p style={descriptionStyle}>Conversation history with your landlord.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { label: 'Messages', value: messages.length, accent: false },
              { label: 'Unread',   value: unread,          accent: true  },
            ].map(({ label, value, accent }) => (
              <div key={label} style={{
                padding: '10px 18px', borderRadius: '12px',
                background: accent ? 'rgba(245,158,11,0.1)' : 'rgba(15,23,42,0.5)',
                border: accent ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(148,163,184,0.08)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: palette.muted, fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: accent ? palette.amber : palette.cream, marginTop: '4px' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main split layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(300px, 0.9fr)', gap: '20px' }}>
        {/* Messages table */}
        <section style={{ ...panelStyle }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: palette.cream, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Inbox size={15} style={{ color: palette.amber }} /> Inbox
          </div>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', fontSize: '14px' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: palette.muted, padding: '40px 0' }}>
              <div style={{ width: 16, height: 16, border: `2px solid ${palette.amber}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: palette.muted }}>
              <MessageCircle size={36} style={{ opacity: 0.3, margin: '0 auto 10px', display: 'block' }} />
              No messages yet
            </div>
          ) : (
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>{['', 'From / To', 'Subject', 'Date'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {messages.map((item) => (
                    <tr key={item.id}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ ...tdStyle, width: 20 }}>
                        {!item.read_at && <div style={{ width: 7, height: 7, borderRadius: '50%', background: palette.amber }} />}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500, fontSize: '13px' }}>
                          {item.direction === 'sent'
                            ? `To: ${item.recipient?.first_name} ${item.recipient?.last_name}`
                            : `From: ${item.sender?.first_name} ${item.sender?.last_name}`}
                        </div>
                        <div style={{ fontSize: '11px', color: palette.mutedDark, marginTop: '2px' }}>
                          {item.direction === 'sent' ? 'Sent' : 'Received'}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: item.read_at ? 400 : 600, fontSize: '13px' }}>{item.subject || 'No subject'}</div>
                        <div style={{ color: palette.muted, fontSize: '12px', marginTop: '3px' }}>{item.body}</div>
                      </td>
                      <td style={{ ...tdStyle, color: palette.muted, fontSize: '12px', whiteSpace: 'nowrap' as const }}>{formatDate(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Compose */}
        <section style={{ ...panelStyle, alignSelf: 'start' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: palette.cream, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={15} style={{ color: palette.amber }} /> Compose
          </div>
          <div style={{ color: palette.muted, fontSize: '13px', lineHeight: 1.6, marginBottom: '20px' }}>
            {recipient
              ? `Sending to ${recipient.name}${recipient.property_title ? ` about ${recipient.property_title}` : ''}.`
              : 'Message will be sent to your assigned landlord when tenancy is active.'}
          </div>

          {success && (
            <div style={{ color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px' }}>
              {success}
            </div>
          )}

          <form onSubmit={send} style={{ display: 'grid', gap: '12px' }}>
            <input
              style={{ ...inputStyle, borderRadius: '12px' }}
              placeholder="Subject"
              value={form.subject}
              onChange={(e) => setForm(c => ({ ...c, subject: e.target.value }))}
            />
            <textarea
              style={{ ...textareaStyle, borderRadius: '12px', minHeight: '140px' }}
              placeholder="Write your message…"
              value={form.body}
              onChange={(e) => setForm(c => ({ ...c, body: e.target.value }))}
              required
            />
            <button
              type="submit"
              style={{ ...buttonStyle('primary'), padding: '12px 20px', borderRadius: '12px', fontSize: '14px', justifyContent: 'center' }}
              disabled={!recipient}
            >
              <Send size={14} /> Send Message
            </button>
          </form>
        </section>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Messages;