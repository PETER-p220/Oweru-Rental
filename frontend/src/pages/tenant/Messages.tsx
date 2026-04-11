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
      const res     = await Api.getTenantMessages();
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

      {/* ── Header ── */}
      <section style={{ ...panelStyle, position: 'relative' }}>
        {/* Oweru gold accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 32, right: 32, height: '2px',
          background: `linear-gradient(90deg, transparent, ${palette.gold}, transparent)`,
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={sectionTitleStyle}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.gold, display: 'inline-block', marginRight: 6 }} />
              Tenant Workspace
            </div>
            <h1 style={headingStyle}>Messages</h1>
            <p style={descriptionStyle}>Conversation history with your landlord.</p>
          </div>

          {/* Stats chips */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { label: 'Messages', value: messages.length, accent: false },
              { label: 'Unread',   value: unread,          accent: true  },
            ].map(({ label, value, accent }) => (
              <div key={label} style={{
                padding: '10px 18px',
                borderRadius: '10px',
                background: accent ? 'rgba(200,145,40,0.10)' : 'rgba(15,23,42,0.04)',
                border: accent ? `1px solid rgba(200,145,40,0.28)` : `1px solid ${palette.gray200}`,
                textAlign: 'center',
                minWidth: '80px',
              }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: palette.gray400, fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: accent ? palette.gold : palette.navy900, marginTop: '4px' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Split layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(300px, 0.9fr)', gap: '20px' }}>

        {/* Inbox */}
        <section style={{ ...panelStyle }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: palette.gray600, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Inbox size={15} style={{ color: palette.gold }} /> Inbox
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              color: '#dc2626', background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.18)',
              borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', fontSize: '14px',
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: palette.gray400, padding: '40px 0' }}>
              <div style={{ width: 16, height: 16, border: `2px solid ${palette.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Loading messages…
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: palette.gray400 }}>
              <MessageCircle size={36} style={{ opacity: 0.25, margin: '0 auto 10px', display: 'block' }} />
              <div style={{ fontSize: '14px' }}>No messages yet</div>
            </div>
          ) : (
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>{['', 'From / To', 'Subject', 'Date'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {messages.map((item) => (
                    <tr
                      key={item.id}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,145,40,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Unread dot */}
                      <td style={{ ...tdStyle, width: 20 }}>
                        {!item.read_at && (
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: palette.gold }} />
                        )}
                      </td>

                      {/* Sender / recipient */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500, fontSize: '13px', color: palette.navy900 }}>
                          {item.direction === 'sent'
                            ? `To: ${item.recipient?.first_name} ${item.recipient?.last_name}`
                            : `From: ${item.sender?.first_name} ${item.sender?.last_name}`}
                        </div>
                        <div style={{ fontSize: '11px', color: palette.gray400, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {item.direction === 'sent' ? 'Sent' : 'Received'}
                        </div>
                      </td>

                      {/* Subject + body preview */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: item.read_at ? 400 : 600, fontSize: '13px', color: palette.navy900 }}>
                          {item.subject || 'No subject'}
                        </div>
                        <div style={{ color: palette.gray400, fontSize: '12px', marginTop: '3px' }}>{item.body}</div>
                      </td>

                      {/* Date */}
                      <td style={{ ...tdStyle, color: palette.gray400, fontSize: '12px', whiteSpace: 'nowrap' as const }}>
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Compose */}
        <section style={{ ...panelStyle, alignSelf: 'start' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: palette.gray600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={15} style={{ color: palette.gold }} /> Compose
          </div>

          <div style={{ color: palette.gray500, fontSize: '13px', lineHeight: 1.6, marginBottom: '20px' }}>
            {recipient
              ? `Sending to ${recipient.name}${recipient.property_title ? ` about ${recipient.property_title}` : ''}.`
              : 'Message will be sent to your assigned landlord when tenancy is active.'}
          </div>

          {success && (
            <div style={{
              color: '#16a34a',
              background: 'rgba(22,163,74,0.08)',
              border: '1px solid rgba(22,163,74,0.22)',
              borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px',
            }}>
              {success}
            </div>
          )}

          {error && !success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#dc2626', background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.18)',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px',
            }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={send} style={{ display: 'grid', gap: '12px' }}>
            <input
              style={{ ...inputStyle }}
              placeholder="Subject"
              value={form.subject}
              onChange={(e) => setForm(c => ({ ...c, subject: e.target.value }))}
            />
            <textarea
              style={{ ...textareaStyle, minHeight: '140px' }}
              placeholder="Write your message…"
              value={form.body}
              onChange={(e) => setForm(c => ({ ...c, body: e.target.value }))}
              required
            />
            <button
              type="submit"
              style={{ ...buttonStyle('primary'), padding: '12px 20px', fontSize: '14px', justifyContent: 'center' }}
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