import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Search, Send, Paperclip, Phone, Mail, Calendar, Clock, User, Filter, CheckCircle, AlertCircle, Reply, Forward, Trash2, Archive, Star, MoreVertical } from 'lucide-react';
import Api from '../../services/api';

interface Message {
  id: number;
  subject: string;
  content: string;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    userType: 'landlord' | 'agent' | 'admin' | 'tenant';
    avatar?: string;
  };
  recipient: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'unread';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  readAt?: string;
  attachments?: {
    id: number;
    filename: string;
    url: string;
    size: number;
    type: string;
  }[];
  threadId?: number;
  propertyId?: number;
  contractId?: number;
}

interface MessageStats {
  total: number;
  unread: number;
  sent: number;
  received: number;
  starred: number;
}

const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    recipient: '',
    subject: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
      const mockMessages: Message[] = [
        {
          id: 1,
          subject: 'Rent Payment Confirmation - March 2024',
          content: 'Dear Peter,\n\nThis is to confirm that we have received your rent payment for March 2024 in the amount of TZS 800,000. Thank you for your timely payment.\n\nIf you have any questions about your account or need a receipt, please don\'t hesitate to contact us.\n\nBest regards,\nJohn Doe\nProperty Manager',
          sender: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'landlord@example.com',
            phone: '+255123456789',
            userType: 'landlord'
          },
          recipient: {
            id: 1,
            firstName: 'Peter',
            lastName: 'Mushy',
            email: 'mushyp420@gmail.com'
          },
          status: 'read',
          priority: 'medium',
          createdAt: '2024-03-01T12:00:00Z',
          readAt: '2024-03-01T12:30:00Z',
          propertyId: 1
        },
        {
          id: 2,
          subject: 'Maintenance Request - Kitchen Sink',
          content: 'Hi John,\n\nI wanted to report an issue with the kitchen sink. The faucet has been leaking for the past few days and it\'s getting worse. Could you please send someone to fix it?\n\nThe leak is constant and is causing water to pool around the sink area. I\'m concerned about potential water damage.\n\nPlease let me know when I can expect the maintenance to be scheduled.\n\nThanks,\nPeter',
          sender: {
            id: 1,
            firstName: 'Peter',
            lastName: 'Mushy',
            email: 'mushyp420@gmail.com',
            phone: '0753511713',
            userType: 'tenant'
          },
          recipient: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'landlord@example.com'
          },
          status: 'replied',
          priority: 'high',
          createdAt: '2024-03-15T09:30:00Z',
          propertyId: 1
        },
        {
          id: 3,
          subject: 'Re: Maintenance Request - Kitchen Sink',
          content: 'Hi Peter,\n\nThanks for letting me know about the kitchen sink issue. I\'ve scheduled a plumber to come tomorrow (March 16th) between 10 AM and 12 PM.\n\nThe plumber will call you when they\'re on their way. Please make sure someone is available to let them in.\n\nSorry for the inconvenience. Let me know if the issue isn\'t resolved after the visit.\n\nBest regards,\nJohn',
          sender: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'landlord@example.com',
            phone: '+255123456789',
            userType: 'landlord'
          },
          recipient: {
            id: 1,
            firstName: 'Peter',
            lastName: 'Mushy',
            email: 'mushyp420@gmail.com'
          },
          status: 'read',
          priority: 'high',
          createdAt: '2024-03-15T14:20:00Z',
          readAt: '2024-03-15T14:45:00Z',
          threadId: 2,
          propertyId: 1
        },
        {
          id: 4,
          subject: 'Contract Renewal Reminder',
          content: 'Dear Peter,\n\nI hope this message finds you well. I\'m writing to remind you that your current rental contract is set to expire on December 31, 2024.\n\nI would like to discuss the renewal options for the upcoming year. Would you be interested in renewing for another year? The terms would remain similar to your current agreement.\n\nPlease let me know your thoughts at your earliest convenience so we can plan accordingly.\n\nBest regards,\nJohn Doe',
          sender: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'landlord@example.com',
            phone: '+255123456789',
            userType: 'landlord'
          },
          recipient: {
            id: 1,
            firstName: 'Peter',
            lastName: 'Mushy',
            email: 'mushyp420@gmail.com'
          },
          status: 'unread',
          priority: 'medium',
          createdAt: '2024-03-20T11:00:00Z',
          contractId: 1
        },
        {
          id: 5,
          subject: 'Welcome to Your New Home!',
          content: 'Dear Peter,\n\nWelcome to your new home! I hope you\'re settling in well and enjoying the apartment.\n\nIf you need anything or have any questions about the property, please don\'t hesitate to reach out. I\'m here to help make your renting experience as smooth as possible.\n\nA few quick reminders:\n- Rent is due on the 1st of each month\n- Emergency contact: +255123456789\n- Building maintenance requests should be submitted through the tenant portal\n\nLooking forward to a great landlord-tenant relationship!\n\nBest regards,\nJohn Doe',
          sender: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'landlord@example.com',
            phone: '+255123456789',
            userType: 'landlord'
          },
          recipient: {
            id: 1,
            firstName: 'Peter',
            lastName: 'Mushy',
            email: 'mushyp420@gmail.com'
          },
          status: 'read',
          priority: 'low',
          createdAt: '2024-01-02T10:00:00Z',
          readAt: '2024-01-02T10:15:00Z',
          propertyId: 1
        }
      ];

      const mockStats: MessageStats = {
        total: 5,
        unread: 1,
        sent: 1,
        received: 4,
        starred: 0
      };
      
      setMessages(mockMessages);
      setStats(mockStats);
      
      // Uncomment when API is ready:
      // const [messagesRes, statsRes] = await Promise.all([
      //   Api.getMessages(),
      //   Api.getMessageStats()
      // ]);
      // 
      // if (messagesRes.data) setMessages(messagesRes.data);
      // if (statsRes.data) setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load messages:', e);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: number) => {
    try {
      // await Api.markMessageAsRead(messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: 'read' as const, readAt: new Date().toISOString() }
          : msg
      ));
    } catch (e) {
      setError('Failed to mark message as read');
    }
  };

  const sendMessage = async () => {
    try {
      // await Api.sendMessage(composeData);
      await loadMessages(); // Refresh messages
      setShowCompose(false);
      setComposeData({ recipient: '', subject: '', content: '', priority: 'medium' });
    } catch (e) {
      setError('Failed to send message');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return '#3b82f6';
      case 'delivered': return '#10b981';
      case 'read': return '#6b7280';
      case 'replied': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-TZ', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sender.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sender.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || message.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #e8e4dc', 
            borderTop: '3px solid #c9a84c', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageSquare size={28} style={{ color: '#c9a84c' }} />
            <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
              Messages
            </h1>
            {stats && stats.unread > 0 && (
              <span style={{
                padding: '4px 12px',
                backgroundColor: '#c9a84c',
                color: '#080808',
                borderRadius: '999px',
                fontSize: '12px',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: '600'
              }}>
                {stats.unread} unread
              </span>
            )}
          </div>
          
          <button
            onClick={() => setShowCompose(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#c9a84c',
              color: '#080808',
              border: 'none',
              borderRadius: '6px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Send size={16} />
            Compose
          </button>
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          Communicate with your landlord and property management
        </p>
      </div>

      {/* Message Stats */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '32px' 
        }}>
          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(201, 168, 76, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#e8e4dc', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Messages
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(239, 68, 68, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#ef4444', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.unread}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Unread
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(16, 185, 129, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.sent}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sent
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(56, 189, 248, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#38bdf8', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.received}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Received
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <Search size={18} style={{ color: '#7a7060' }} />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e8e4dc',
                borderRadius: '4px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#e8e4dc',
              borderRadius: '4px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              outline: 'none'
            }}
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#e8e4dc',
              borderRadius: '4px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              outline: 'none'
            }}
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Messages List */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: 0 }}>
            Recent Messages
          </h3>
          <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
            {filteredMessages.length} messages
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              style={{
                padding: '16px',
                backgroundColor: message.status === 'unread' ? 'rgba(201, 168, 76, 0.05)' : 'transparent',
                border: `1px solid ${message.status === 'unread' ? 'rgba(201, 168, 76, 0.2)' : 'rgba(201, 168, 76, 0.06)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => {
                setSelectedMessage(message);
                if (message.status === 'unread') {
                  markAsRead(message.id);
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%',
                  backgroundColor: '#c9a84c20',
                  border: '1px solid #c9a84c40',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={20} style={{ color: '#c9a84c' }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h4 style={{ 
                      color: message.status === 'unread' ? '#e8e4dc' : '#b8b3ab', 
                      fontSize: '15px', 
                      fontFamily: 'DM Sans, sans-serif', 
                      fontWeight: '500',
                      margin: 0 
                    }}>
                      {message.subject}
                    </h4>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: `${getPriorityColor(message.priority)}15`,
                        border: `1px solid ${getPriorityColor(message.priority)}30`,
                        color: getPriorityColor(message.priority),
                        borderRadius: '999px',
                        fontSize: '10px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {message.priority}
                      </span>
                      
                      <span style={{
                        color: '#7a7060',
                        fontSize: '12px',
                        fontFamily: 'DM Sans, sans-serif'
                      }}>
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ 
                      color: '#c9a84c', 
                      fontSize: '13px', 
                      fontFamily: 'DM Sans, sans-serif', 
                      fontWeight: '500' 
                    }}>
                      {message.sender.firstName} {message.sender.lastName}
                    </span>
                    <span style={{ 
                      color: '#7a7060', 
                      fontSize: '12px', 
                      fontFamily: 'DM Sans, sans-serif',
                      textTransform: 'capitalize'
                    }}>
                      ({message.sender.userType})
                    </span>
                  </div>

                  <p style={{ 
                    color: message.status === 'unread' ? '#b8b3ab' : '#7a7060', 
                    fontSize: '14px', 
                    fontFamily: 'DM Sans, sans-serif', 
                    lineHeight: '1.5',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {message.content}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(message.status)
                  }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMessages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <MessageSquare size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
            <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>No messages found</h3>
            <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
              Try adjusting your filters or compose a new message
            </p>
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ color: '#e8e4dc', fontSize: '20px', fontWeight: '500', margin: 0 }}>
                {selectedMessage.subject}
              </h3>
              <button
                onClick={() => setSelectedMessage(null)}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#7a7060',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%',
                backgroundColor: '#c9a84c20',
                border: '1px solid #c9a84c40',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={20} style={{ color: '#c9a84c' }} />
              </div>
              <div>
                <div style={{ color: '#e8e4dc', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                  {selectedMessage.sender.firstName} {selectedMessage.sender.lastName}
                </div>
                <div style={{ color: '#7a7060', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                  {selectedMessage.sender.email}
                </div>
              </div>
            </div>

            <div style={{ 
              color: '#e8e4dc', 
              fontSize: '14px', 
              fontFamily: 'DM Sans, sans-serif', 
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              marginBottom: '20px'
            }}>
              {selectedMessage.content}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '20px', borderTop: '1px solid rgba(201, 168, 76, 0.12)' }}>
              <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                {formatDate(selectedMessage.createdAt)}
              </span>
              <span style={{
                padding: '2px 8px',
                backgroundColor: `${getPriorityColor(selectedMessage.priority)}15`,
                border: `1px solid ${getPriorityColor(selectedMessage.priority)}30`,
                color: getPriorityColor(selectedMessage.priority),
                borderRadius: '999px',
                fontSize: '10px',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {selectedMessage.priority}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ color: '#e8e4dc', fontSize: '20px', fontWeight: '500', marginBottom: '20px' }}>
              Compose Message
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
                  To
                </label>
                <input
                  type="email"
                  placeholder="Recipient email"
                  value={composeData.recipient}
                  onChange={(e) => setComposeData(prev => ({ ...prev, recipient: e.target.value }))}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e8e4dc',
                    borderRadius: '4px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Message subject"
                  value={composeData.subject}
                  onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e8e4dc',
                    borderRadius: '4px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
                  Priority
                </label>
                <select
                  value={composeData.priority}
                  onChange={(e) => setComposeData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e8e4dc',
                    borderRadius: '4px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
                  Message
                </label>
                <textarea
                  placeholder="Type your message here..."
                  value={composeData.content}
                  onChange={(e) => setComposeData(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e8e4dc',
                    borderRadius: '4px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => setShowCompose(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#e8e4dc',
                  borderRadius: '4px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#c9a84c',
                  color: '#080808',
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Messages;
