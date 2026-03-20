import { useEffect, useMemo, useState } from 'react';
import Api from '../../services/api';
import {
  buttonStyle,
  descriptionStyle,
  formatDate,
  headingStyle,
  inputStyle,
  pageStyle,
  panelStyle,
  sectionTitleStyle,
  selectStyle,
  tableStyle,
  tableWrapStyle,
  tdStyle,
  textareaStyle,
  thStyle,
} from './landlordPageStyles';

interface MessageItem {
  id: number;
  subject?: string;
  body?: string;
  read_at?: string | null;
  created_at?: string;
  sender?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  recipient?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  property?: {
    id: number;
    title?: string;
  };
}

interface TenantOption {
  id: number;
  user?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  property?: {
    id: number;
    title?: string;
  };
}

const MessagesPage = () => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    recipient_id: '',
    property_id: '',
    subject: '',
    body: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [messagesResponse, tenantsResponse] = await Promise.all([
        Api.getOwnerMessages(),
        Api.getMyTenants(),
      ]);
      setMessages(Array.isArray(messagesResponse.data) ? messagesResponse.data : []);
      setTenants(Array.isArray(tenantsResponse.data) ? tenantsResponse.data : []);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Unable to load messages.';
      if (String(message).includes('could not be found')) {
        setMessages([]);
        setTenants([]);
        setError('');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const unreadCount = useMemo(
    () => messages.filter((message) => !message.read_at).length,
    [messages],
  );

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError('');
    setSuccess('');

    try {
      await Api.sendOwnerMessage({
        recipient_id: Number(form.recipient_id),
        property_id: form.property_id ? Number(form.property_id) : undefined,
        subject: form.subject.trim() || undefined,
        body: form.body.trim(),
      });
      setSuccess('Message sent successfully.');
      setForm({ recipient_id: '', property_id: '', subject: '', body: '' });
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Landlord Workspace</div>
        <h1 style={headingStyle}>Messages</h1>
        <p style={descriptionStyle}>
          Send and review landlord-to-tenant messages using the new Laravel owner messages API.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginTop: '22px' }}>
          <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Messages</div>
            <div style={{ fontSize: '30px', marginTop: '8px' }}>{messages.length}</div>
          </div>
          <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Unread</div>
            <div style={{ fontSize: '30px', marginTop: '8px' }}>{unreadCount}</div>
          </div>
        </div>
      </section>

      <section style={{ ...panelStyle, display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, 0.9fr)', gap: '22px' }}>
        <div>
          {error && <div style={{ marginBottom: '16px', color: '#e07070' }}>{error}</div>}
          {loading ? (
            <div style={{ color: '#9f9587' }}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div style={{ color: '#9f9587' }}>No messages yet.</div>
          ) : (
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>From</th>
                    <th style={thStyle}>To</th>
                    <th style={thStyle}>Property</th>
                    <th style={thStyle}>Message</th>
                    <th style={thStyle}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((message) => (
                    <tr key={message.id}>
                      <td style={tdStyle}>
                        <div>{message.sender?.first_name} {message.sender?.last_name}</div>
                        <div style={{ color: '#9f9587', marginTop: '4px' }}>{message.sender?.email || 'No email'}</div>
                      </td>
                      <td style={tdStyle}>
                        <div>{message.recipient?.first_name} {message.recipient?.last_name}</div>
                        <div style={{ color: '#9f9587', marginTop: '4px' }}>{message.recipient?.email || 'No email'}</div>
                      </td>
                      <td style={tdStyle}>{message.property?.title || 'General'}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, marginBottom: '6px' }}>{message.subject || 'No subject'}</div>
                        <div style={{ color: '#9f9587', lineHeight: 1.6 }}>{message.body || ''}</div>
                      </td>
                      <td style={tdStyle}>{formatDate(message.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} style={{ display: 'grid', gap: '12px', alignContent: 'start' }}>
          {success && <div style={{ color: '#70c490' }}>{success}</div>}
          <div style={{ fontSize: '18px' }}>Compose message</div>
          <select
            style={selectStyle}
            value={form.recipient_id}
            onChange={(event) => setForm((current) => ({ ...current, recipient_id: event.target.value }))}
            required
          >
            <option value="">Select tenant</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.user?.id}>
                {(tenant.user?.first_name || '').trim()} {(tenant.user?.last_name || '').trim()} {tenant.property?.title ? `- ${tenant.property.title}` : ''}
              </option>
            ))}
          </select>
          <select
            style={selectStyle}
            value={form.property_id}
            onChange={(event) => setForm((current) => ({ ...current, property_id: event.target.value }))}
          >
            <option value="">General message</option>
            {tenants
              .filter((tenant) => tenant.property?.id)
              .map((tenant) => (
                <option key={`${tenant.id}-${tenant.property?.id}`} value={tenant.property?.id}>
                  {tenant.property?.title}
                </option>
              ))}
          </select>
          <input
            style={inputStyle}
            placeholder="Subject"
            value={form.subject}
            onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
          />
          <textarea
            style={textareaStyle}
            placeholder="Write your message"
            value={form.body}
            onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
            required
          />
          <button type="submit" style={buttonStyle('primary')} disabled={sending}>
            {sending ? 'Sending...' : 'Send message'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default MessagesPage;
