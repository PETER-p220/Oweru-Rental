import { useEffect, useMemo, useState } from 'react';
import Api from '../../services/api';
import { buttonStyle, descriptionStyle, formatDate, headingStyle, inputStyle, pageStyle, panelStyle, sectionTitleStyle, selectStyle, tableStyle, tableWrapStyle, tdStyle, textareaStyle, thStyle } from './agentPageStyles';

const MessagesPage = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [recipientOptions, setRecipientOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ recipient_id: '', property_id: '', subject: '', body: '' });

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await Api.getAgentMessages();
      const payload = res.data || {};
      setMessages(Array.isArray(payload.messages) ? payload.messages : []);
      setRecipientOptions(Array.isArray(payload.recipient_options) ? payload.recipient_options : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selected = useMemo(() => recipientOptions.find((item) => String(item.recipient_id) === form.recipient_id && String(item.property_id) === (form.property_id || String(item.property_id))) || recipientOptions.find((item) => String(item.recipient_id) === form.recipient_id) || null, [form.property_id, form.recipient_id, recipientOptions]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError('');
    setSuccess('');
    try {
      await Api.sendAgentMessage({
        recipient_id: Number(form.recipient_id),
        property_id: form.property_id ? Number(form.property_id) : undefined,
        subject: form.subject.trim() || undefined,
        body: form.body.trim(),
      });
      setSuccess('Message sent successfully.');
      setForm({ recipient_id: '', property_id: '', subject: '', body: '' });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>Messages</h1>
        <p style={descriptionStyle}>Communicate directly with landlords linked to your managed listings.</p>
      </section>
      <section style={{ ...panelStyle, display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(320px,0.9fr)', gap: '22px' }}>
        <div>
          {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Type</th><th style={thStyle}>Counterparty</th><th style={thStyle}>Subject</th><th style={thStyle}>Date</th></tr></thead>
              <tbody>
                {loading ? <tr><td style={tdStyle} colSpan={4}>Loading messages...</td></tr> : messages.length === 0 ? <tr><td style={tdStyle} colSpan={4}>No messages yet.</td></tr> : messages.map((item) => (
                  <tr key={item.id}>
                    <td style={tdStyle}>{item.direction === 'sent' ? 'Sent' : 'Received'}</td>
                    <td style={tdStyle}><div>{item.counterparty?.first_name} {item.counterparty?.last_name}</div><div style={{ color: '#8ea0b5', marginTop: '4px' }}>{item.counterparty?.email}</div></td>
                    <td style={tdStyle}><div>{item.subject || 'No subject'}</div><div style={{ color: '#8ea0b5', marginTop: '4px' }}>{item.body}</div></td>
                    <td style={tdStyle}>{formatDate(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <form onSubmit={send} style={{ display: 'grid', gap: '12px', alignContent: 'start' }}>
          {success && <div style={{ color: '#70c490' }}>{success}</div>}
          <div style={{ fontSize: '18px' }}>Compose message</div>
          <div style={{ color: '#8ea0b5', fontSize: '14px', lineHeight: 1.5 }}>
            {selected ? `Sending to ${selected.recipient_name}${selected.property_title ? ` about ${selected.property_title}` : ''}.` : 'Select a linked owner to reveal the exact recipient.'}
          </div>
          <select style={selectStyle} value={form.recipient_id} onChange={(e) => setForm((current) => ({ ...current, recipient_id: e.target.value, property_id: '' }))} required>
            <option value="">Select owner</option>
            {recipientOptions.map((item) => <option key={`${item.recipient_id}-${item.property_id}`} value={item.recipient_id}>{item.recipient_name} - {item.property_title}</option>)}
          </select>
          <select style={selectStyle} value={form.property_id} onChange={(e) => setForm((current) => ({ ...current, property_id: e.target.value }))}>
            <option value="">Auto-select property</option>
            {recipientOptions.filter((item) => String(item.recipient_id) === form.recipient_id).map((item) => <option key={`property-${item.property_id}`} value={item.property_id}>{item.property_title}</option>)}
          </select>
          <input style={inputStyle} placeholder="Subject" value={form.subject} onChange={(e) => setForm((current) => ({ ...current, subject: e.target.value }))} />
          <textarea style={textareaStyle} placeholder="Write your message" value={form.body} onChange={(e) => setForm((current) => ({ ...current, body: e.target.value }))} required />
          <button type="submit" style={buttonStyle('primary')} disabled={sending || !form.recipient_id}>{sending ? 'Sending...' : 'Send message'}</button>
        </form>
      </section>
    </div>
  );
};

export default MessagesPage;
