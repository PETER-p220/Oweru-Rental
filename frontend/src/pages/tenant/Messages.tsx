import { useEffect, useMemo, useState } from 'react';
import Api from '../../services/api';
import { buttonStyle, descriptionStyle, formatDate, headingStyle, inputStyle, pageStyle, panelStyle, sectionTitleStyle, textareaStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './tenantPageStyles';

const Messages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ subject: '', body: '' });

  const load = async () => {
    try {
      setLoading(true);
      const res = await Api.getTenantMessages();
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load messages.');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const unread = useMemo(() => messages.filter((item) => !item.read_at).length, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Tenant Workspace</div>
        <h1 style={headingStyle}>Messages</h1>
        <p style={descriptionStyle}>Conversation history with your landlord, backed by the tenant messages API.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginTop: '22px' }}>
          <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}><div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase' }}>Messages</div><div style={{ fontSize: '30px', marginTop: '8px' }}>{messages.length}</div></div>
          <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}><div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase' }}>Unread</div><div style={{ fontSize: '30px', marginTop: '8px' }}>{unread}</div></div>
        </div>
      </section>
      <section style={{ ...panelStyle, display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, 0.9fr)', gap: '22px' }}>
        <div>
          {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
          {loading ? <div style={{ color: '#9f9587' }}>Loading messages...</div> : messages.length === 0 ? <div style={{ color: '#9f9587' }}>No messages found.</div> : (
            <div style={tableWrapStyle}>
              <table style={tableStyle}><thead><tr><th style={thStyle}>From</th><th style={thStyle}>To</th><th style={thStyle}>Subject</th><th style={thStyle}>Date</th></tr></thead>
              <tbody>{messages.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>{item.sender?.first_name} {item.sender?.last_name}</td>
                  <td style={tdStyle}>{item.recipient?.first_name} {item.recipient?.last_name}</td>
                  <td style={tdStyle}><div>{item.subject || 'No subject'}</div><div style={{ color: '#9f9587', marginTop: '4px' }}>{item.body}</div></td>
                  <td style={tdStyle}>{formatDate(item.created_at)}</td>
                </tr>
              ))}</tbody></table>
            </div>
          )}
        </div>
        <form onSubmit={send} style={{ display: 'grid', gap: '12px', alignContent: 'start' }}>
          {success && <div style={{ color: '#70c490' }}>{success}</div>}
          <div style={{ fontSize: '18px' }}>Compose message</div>
          <input style={inputStyle} placeholder="Subject" value={form.subject} onChange={(e) => setForm((c) => ({ ...c, subject: e.target.value }))} />
          <textarea style={textareaStyle} placeholder="Write your message" value={form.body} onChange={(e) => setForm((c) => ({ ...c, body: e.target.value }))} required />
          <button type="submit" style={buttonStyle('primary')}>Send message</button>
        </form>
      </section>
    </div>
  );
};

export default Messages;
