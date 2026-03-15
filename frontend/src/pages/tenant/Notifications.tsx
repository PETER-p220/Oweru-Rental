import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle, AlertCircle, Clock, Home, CreditCard, FileText, MessageSquare, Calendar, DollarSign, Users, X, Check, Archive, Trash2, Settings, Search, Filter } from 'lucide-react';
import Api from '../../services/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'payment' | 'contract' | 'property' | 'message' | 'system' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: {
    propertyId?: number;
    contractId?: number;
    paymentId?: number;
    messageId?: number;
    amount?: number;
    dueDate?: string;
  };
}

interface NotificationStats {
  total: number;
  unread: number;
  highPriority: number;
  paymentReminders: number;
  contractUpdates: number;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
      const mockNotifications: Notification[] = [
        {
          id: 1,
          title: 'Rent Payment Due',
          message: 'Your rent payment for April 2024 is due on April 1st. Please make payment to avoid late fees.',
          type: 'payment',
          priority: 'high',
          status: 'unread',
          createdAt: '2024-03-25T10:00:00Z',
          actionUrl: '/dashboard/payments',
          actionText: 'Pay Now',
          metadata: {
            paymentId: 2,
            amount: 800000,
            dueDate: '2024-04-01'
          }
        },
        {
          id: 2,
          title: 'Contract Renewal Reminder',
          message: 'Your rental contract is set to expire on December 31, 2024. Please contact your landlord to discuss renewal options.',
          type: 'contract',
          priority: 'medium',
          status: 'unread',
          createdAt: '2024-03-20T14:30:00Z',
          actionUrl: '/dashboard/contract',
          actionText: 'View Contract',
          metadata: {
            contractId: 1
          }
        },
        {
          id: 3,
          title: 'Maintenance Scheduled',
          message: 'Scheduled maintenance for your building will take place on March 28th from 9 AM to 12 PM. Water supply may be temporarily interrupted.',
          type: 'maintenance',
          priority: 'medium',
          status: 'read',
          createdAt: '2024-03-22T09:15:00Z',
          readAt: '2024-03-22T10:00:00Z'
        },
        {
          id: 4,
          title: 'Payment Confirmation',
          message: 'Your March 2024 rent payment of TZS 800,000 has been successfully processed. Thank you for your timely payment!',
          type: 'payment',
          priority: 'low',
          status: 'read',
          createdAt: '2024-03-01T12:00:00Z',
          readAt: '2024-03-01T12:30:00Z',
          metadata: {
            paymentId: 1,
            amount: 800000
          }
        },
        {
          id: 5,
          title: 'New Property Listing',
          message: 'A new 2-bedroom apartment is now available in your area. Check it out if you\'re looking to move.',
          type: 'property',
          priority: 'low',
          status: 'read',
          createdAt: '2024-02-28T16:45:00Z',
          readAt: '2024-02-28T17:00:00Z',
          actionUrl: '/properties',
          actionText: 'View Property',
          metadata: {
            propertyId: 123
          }
        }
      ];

      const mockStats: NotificationStats = {
        total: 5,
        unread: 2,
        highPriority: 1,
        paymentReminders: 1,
        contractUpdates: 1
      };
      
      setNotifications(mockNotifications);
      setStats(mockStats);
      
      // Uncomment when API is ready:
      // const [notificationsRes, statsRes] = await Promise.all([
      //   Api.getNotifications(),
      //   Api.getNotificationStats()
      // ]);
      // 
      // if (notificationsRes.data) setNotifications(notificationsRes.data);
      // if (statsRes.data) setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to load notifications:', e);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await Api.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId 
          ? { ...n, status: 'read' as const, readAt: new Date().toISOString() }
          : n
      ));
    } catch (e) {
      setError('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await Api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({
        ...n,
        status: 'read' as const,
        readAt: new Date().toISOString()
      })));
    } catch (e) {
      setError('Failed to mark all notifications as read');
    }
  };

  const archiveNotification = async (notificationId: number) => {
    try {
      await Api.archiveNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (e) {
      setError('Failed to archive notification');
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await Api.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (e) {
      setError('Failed to delete notification');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      // Navigate to action URL
      window.location.href = notification.actionUrl;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return CreditCard;
      case 'contract': return FileText;
      case 'property': return Home;
      case 'message': return MessageSquare;
      case 'system': return Settings;
      case 'maintenance': return Calendar;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return '#10b981';
      case 'contract': return '#c9a84c';
      case 'property': return '#3b82f6';
      case 'message': return '#8b5cf6';
      case 'system': return '#6b7280';
      case 'maintenance': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return '#c9a84c';
      case 'read': return '#7a7060';
      case 'archived': return '#4b5563';
      default: return '#7a7060';
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

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  const toggleSelection = (notificationId: number) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const bulkArchive = async () => {
    try {
      await Promise.all(selectedNotifications.map(id => Api.archiveNotification(id)));
      setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
      setSelectedNotifications([]);
    } catch (e) {
      setError('Failed to archive selected notifications');
    }
  };

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
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading notifications...</p>
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
            <Bell size={28} style={{ color: '#c9a84c' }} />
            <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
              Notifications
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
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {stats && stats.unread > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: 'rgba(201, 168, 76, 0.1)',
                  border: '1px solid rgba(201, 168, 76, 0.3)',
                  color: '#c9a84c',
                  borderRadius: '4px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <Check size={14} />
                Mark All Read
              </button>
            )}
            
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#e8e4dc',
                borderRadius: '4px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <Settings size={14} style={{ marginRight: '6px' }} />
              Settings
            </button>
          </div>
        </div>
        <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
          Stay updated with your rental activities and important announcements
        </p>
      </div>

      {/* Notification Stats */}
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
              Total Notifications
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
              {stats.highPriority}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              High Priority
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
              {stats.paymentReminders}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Payment Reminders
            </div>
          </div>

          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid rgba(201, 168, 76, 0.12)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#c9a84c', fontFamily: 'DM Sans, sans-serif', marginBottom: '4px' }}>
              {stats.contractUpdates}
            </div>
            <div style={{ fontSize: '12px', color: '#7a7060', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Contract Updates
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
              placeholder="Search notifications..."
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
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
            <option value="all">All Types</option>
            <option value="payment">Payments</option>
            <option value="contract">Contracts</option>
            <option value="property">Properties</option>
            <option value="message">Messages</option>
            <option value="system">System</option>
            <option value="maintenance">Maintenance</option>
          </select>

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
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
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
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {selectedNotifications.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid rgba(201, 168, 76, 0.12)' }}>
            <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
              {selectedNotifications.length} selected
            </span>
            <button
              onClick={bulkArchive}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: 'rgba(201, 168, 76, 0.1)',
                border: '1px solid rgba(201, 168, 76, 0.3)',
                color: '#c9a84c',
                borderRadius: '4px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Archive size={12} />
              Archive Selected
            </button>
            <button
              onClick={() => setSelectedNotifications([])}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#e8e4dc',
                borderRadius: '4px',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', margin: 0 }}>
            Recent Notifications
          </h3>
          <span style={{ color: '#7a7060', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
            {filteredNotifications.length} notifications
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredNotifications.map((notification) => {
            const TypeIcon = getTypeIcon(notification.type);
            const isSelected = selectedNotifications.includes(notification.id);
            
            return (
              <div
                key={notification.id}
                style={{
                  padding: '16px',
                  backgroundColor: notification.status === 'unread' ? 'rgba(201, 168, 76, 0.05)' : 'transparent',
                  border: `1px solid ${notification.status === 'unread' ? 'rgba(201, 168, 76, 0.2)' : 'rgba(201, 168, 76, 0.06)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                {notification.status === 'unread' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#c9a84c',
                    boxShadow: '0 0 8px rgba(201, 168, 76, 0.4)'
                  }}></div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelection(notification.id);
                    }}
                    style={{
                      marginTop: '2px',
                      width: '16px',
                      height: '16px',
                      accentColor: '#c9a84c'
                    }}
                  />

                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '8px',
                    backgroundColor: `${getTypeColor(notification.type)}15`,
                    border: `1px solid ${getTypeColor(notification.type)}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <TypeIcon size={20} style={{ color: getTypeColor(notification.type) }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h4 style={{ 
                        color: notification.status === 'unread' ? '#e8e4dc' : '#b8b3ab', 
                        fontSize: '15px', 
                        fontFamily: 'DM Sans, sans-serif', 
                        fontWeight: '500',
                        margin: 0 
                      }}>
                        {notification.title}
                      </h4>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: `${getPriorityColor(notification.priority)}15`,
                          border: `1px solid ${getPriorityColor(notification.priority)}30`,
                          color: getPriorityColor(notification.priority),
                          borderRadius: '999px',
                          fontSize: '10px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {notification.priority}
                        </span>
                        
                        <span style={{
                          color: '#7a7060',
                          fontSize: '12px',
                          fontFamily: 'DM Sans, sans-serif'
                        }}>
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>

                    <p style={{ 
                      color: notification.status === 'unread' ? '#b8b3ab' : '#7a7060', 
                      fontSize: '14px', 
                      fontFamily: 'DM Sans, sans-serif', 
                      lineHeight: '1.5',
                      margin: '0 0 12px'
                    }}>
                      {notification.message}
                    </p>

                    {notification.actionText && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(notification);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'rgba(201, 168, 76, 0.1)',
                            border: '1px solid rgba(201, 168, 76, 0.3)',
                            color: '#c9a84c',
                            borderRadius: '4px',
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            textDecoration: 'none'
                          }}
                        >
                          {notification.actionText}
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {notification.status === 'unread' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        style={{
                          padding: '6px',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#10b981',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Check size={14} />
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveNotification(notification.id);
                      }}
                      style={{
                        padding: '6px',
                        backgroundColor: 'rgba(201, 168, 76, 0.1)',
                        border: '1px solid rgba(201, 168, 76, 0.3)',
                        color: '#c9a84c',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Archive size={14} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      style={{
                        padding: '6px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredNotifications.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Bell size={48} style={{ color: '#7a7060', marginBottom: '16px' }} />
            <h3 style={{ color: '#e8e4dc', fontSize: '18px', marginBottom: '8px' }}>No notifications found</h3>
            <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>
              You're all caught up! Check back later for new notifications.
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Notifications;
