import { useState, useEffect } from 'react';
import { MessageSquare, Inbox, Calendar, Users, Star } from 'lucide-react';
import Api from '../../services/api';

interface BnbMessage {
  id: number;
  property_id: number;
  property_title: string;
  guest_name: string;
  guest_email: string;
  booking_id: number;
  subject: string;
  message: string;
  direction: 'sent' | 'received';
  created_at: string;
  read_at?: string;
}

const BnbMessages = () => {
  const [messages, setMessages] = useState<BnbMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [replyText, setReplyText] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<BnbMessage | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await Api.getTenantMessages(); // Using tenant API as fallback
      setMessages(response.data || []);
    } catch (err: any) {
      console.error('Failed to load BnB messages:', err);
      // Fallback to mock data if API fails
      const mockMessages: BnbMessage[] = [
        {
          id: 1,
          property_id: 1,
          property_title: 'Luxury Beach Villa',
          guest_name: 'John Doe',
          guest_email: 'john@example.com',
          booking_id: 1,
          subject: 'Check-in Information',
          message: 'Hi, I wanted to confirm the check-in time and get the exact address.',
          direction: 'received',
          created_at: '2026-04-10T10:30:00Z',
        },
        {
          id: 2,
          property_id: 1,
          property_title: 'Luxury Beach Villa',
          guest_name: 'Jane Smith',
          guest_email: 'jane@example.com',
          booking_id: 2,
          subject: 'Early Check-in Request',
          message: 'Is it possible to check in early at 11 AM instead of 3 PM?',
          direction: 'received',
          created_at: '2026-04-09T15:45:00Z',
        },
      ];
      setMessages(mockMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (messageId: number) => {
    if (!replyText.trim()) return;
    
    try {
      setError('');
      setSuccess('');
      await Api.sendOwnerMessage({
        recipient_id: 1, // Using a default recipient_id since we don't have the actual user ID
        subject: `Re: ${selectedMessage?.subject}`,
        body: replyText,
      });
      setSuccess('Reply sent successfully!');
      setReplyText('');
      setSelectedMessage(null);
      loadMessages(); // Reload messages
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send reply');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: '#080808',
      color: '#e8e4dc',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <style>{`
        .bnb-messages-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .bnb-messages-title {
          font-size: 24px;
          font-weight: 600;
          color: #e8e4dc;
          margin: 0;
        }
        .bnb-messages-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: 'rgba(37,99,235,0.1)';
          border: '1px solid rgba(37,99,235,0.2)';
          border-radius: '12px';
          padding: '16px 20px';
          text-align: center;
          min-width: '400px';
        }
        .stat-number {
          font-size: '24px';
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 12px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .messages-grid {
          display: grid;
          gap: '16px';
          grid-template-columns: repeat(auto-fill, minmax('400px', 1fr));
        }
        .message-card {
          background: 'rgba(255,255,255,0.05)';
          border: '1px solid rgba(255,255,255,0.1)';
          border-radius: '12px';
          padding: '20px';
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .message-card:hover {
          transform: 'translateY(-2px)';
          box-shadow: '0 4px 12px rgba(37,99,235,0.15)';
          border-color: 'rgba(37,99,235,0.3)';
        }
        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .message-property {
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 4px;
        }
        .message-guest {
          font-size: 14px;
          color: #9ca3af;
        }
        .message-subject {
          font-weight: 500;
          color: #e8e4dc;
          margin-bottom: 8px;
        }
        .message-content {
          color: #d1d5db;
          lineHeight: 1.5;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .message-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #6b7280;
        }
        .unread-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: '#2563eb';
        }
        .reply-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 'rgba(0,0,0,0.8)';
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .reply-modal-content {
          background: #1a1a1a;
          border-radius: 12px;
          padding: 24px;
          maxWidth: 500px;
          width: 90%;
          maxHeight: 80vh;
          overflow: auto;
        }
        .reply-textarea {
          width: 100%;
          min-height: '100px';
          padding: '12px';
          border: '1px solid rgba(255,255,255,0.1)';
          border-radius: '8px';
          background: 'rgba(255,255,255,0.05)';
          color: #e8e4dc;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          margin-bottom: 16px;
        }
        .reply-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary {
          background: #2563eb;
          color: white;
        }
        .btn-primary:hover {
          background: '#1d4ed8';
        }
        .btn-secondary {
          background: 'rgba(255,255,255,0.1)';
          color: '#e8e4dc';
          border: '1px solid rgba(255,255,255,0.2)';
        }
        .btn-secondary:hover {
          background: 'rgba(255,255,255,0.15)';
        }
      `}</style>

      <div className="bnb-messages-header">
        <h1 className="bnb-messages-title">Messages</h1>
      </div>

      <div className="bnb-messages-stats">
        <div className="stat-card">
          <div className="stat-number">{messages.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{messages.filter(m => !m.read_at).length}</div>
          <div className="stat-label">Unread</div>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          color: '#ef4444'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          color: '#10b981'
        }}>
          {success}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading messages...</div>
      ) : messages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <MessageSquare size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
          <div>No messages yet</div>
        </div>
      ) : (
        <div className="messages-grid">
          {messages.map((message) => (
            <div
              key={message.id}
              className="message-card"
              onClick={() => setSelectedMessage(message)}
            >
              <div className="message-header">
                <div>
                  <div className="message-property">{message.property_title}</div>
                  <div className="message-guest">
                    <Users size={14} style={{ marginRight: '6px' }} />
                    {message.guest_name}
                  </div>
                </div>
                {!message.read_at && <div className="unread-indicator" />}
              </div>

              <div className="message-subject">{message.subject}</div>
              <div className="message-content">{message.message}</div>

              <div className="message-meta">
                <span>
                  <Calendar size={12} style={{ marginRight: '4px' }} />
                  {formatDate(message.created_at)}
                </span>
                <span>{message.direction === 'sent' ? 'Sent' : 'Received'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMessage && (
        <div className="reply-modal" onClick={() => setSelectedMessage(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <div className="reply-modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, color: '#e8e4dc' }}>Reply to Message</h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    fontSize: '20px'
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{ color: '#9ca3af', lineHeight: 1.6, marginBottom: '16px' }}>
                <p><strong>From:</strong> {selectedMessage.guest_name}</p>
                <p><strong>Property:</strong> {selectedMessage.property_title}</p>
                <p><strong>Subject:</strong> {selectedMessage.subject}</p>
                <p><strong>Message:</strong> {selectedMessage.message}</p>
              </div>

              <textarea
                className="reply-textarea"
                placeholder="Type your reply here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />

              <div className="reply-buttons">
                <button className="btn btn-secondary" onClick={() => setSelectedMessage(null)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleReply(selectedMessage.id)}
                  disabled={!replyText.trim()}
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BnbMessages;
