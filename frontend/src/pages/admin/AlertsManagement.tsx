import { useState, useEffect } from 'react';
import {
  Search, Filter, Download, Eye, Edit, Trash2, Plus,
  Calendar, AlertCircle, CheckCircle, XCircle, Bell,
  TrendingUp, BarChart3, PieChart, RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, Info, ShieldCheck, User, Building, DollarSign,
  Mail, MessageSquare, Clock, Zap
} from 'lucide-react';
import Api from '../../services/api';
import {
  C, body, pageWrap, pageInner, card, inputCss, selectCss,
  btnPrimary, btnGhost, statCard, ADMIN_CSS, adminHeaderStyle,
} from './adminTheme';

/* ─────────────────────────────────────────────────────────────
   ALERTS MANAGEMENT COMPONENT
───────────────────────────────────────────────────────────── */
const AlertsManagement = () => {
  const [alerts, setAlerts] = useState<Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    severity: string;
    status: string;
    user_id: number;
    property_id: number;
    created_at: string;
    updated_at: string;
    user?: {
      name: string;
      email: string;
      user_type: string;
    };
    property?: {
      title: string;
      address: string;
    };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<{
    id: number;
    title: string;
    message: string;
    type: string;
    severity: string;
    status: string;
    user_id: number;
    property_id: number;
    created_at: string;
    updated_at: string;
    user?: {
      name: string;
      email: string;
      user_type: string;
    };
    property?: {
      title: string;
      address: string;
    };
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadAlerts();
  }, [searchTerm, severityFilter, statusFilter, typeFilter, sortBy, sortOrder]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (severityFilter !== 'all') filters.severity = severityFilter;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (typeFilter !== 'all') filters.type = typeFilter;

      const response = await Api.getAlerts(filters);
      setAlerts(response.data || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return C.red;
      case 'high': return C.amber;
      case 'medium': return C.gold;
      case 'low': return C.blue;
      case 'info': return C.blue;
      default: return C.textMuted;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle size={16} />;
      case 'high': return <AlertCircle size={16} />;
      case 'medium': return <AlertCircle size={16} />;
      case 'low': return <Info size={16} />;
      case 'info': return <Info size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return C.amber;
      case 'read': return C.green;
      case 'archived': return C.textMuted;
      default: return C.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unread': return <Bell size={16} />;
      case 'read': return <CheckCircle size={16} />;
      case 'archived': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return <User size={16} />;
      case 'property': return <Building size={16} />;
      case 'payment': return <DollarSign size={16} />;
      case 'system': return <Zap size={16} />;
      case 'security': return <ShieldCheck size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'user': return 'User';
      case 'property': return 'Property';
      case 'payment': return 'Payment';
      case 'system': return 'System';
      case 'security': return 'Security';
      default: return type;
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedAlerts = [...alerts].sort((a: any, b: any) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const modifier = sortOrder === 'asc' ? 1 : -1;
    
    if (aValue < bValue) return -1 * modifier;
    if (aValue > bValue) return 1 * modifier;
    return 0;
  });

  const filteredAlerts = sortedAlerts.filter((alert: any) => {
    const matchesSearch = !searchTerm || 
      alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.property?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus && matchesType;
  });

  const handleViewDetails = (alert: any) => {
    setSelectedAlert(alert);
    setShowDetails(true);
    
    // Mark as read if unread
    if (alert.status === 'unread') {
      // API call to mark as read
      Api.updateAlertStatus?.(alert.id, 'read');
      setAlerts(alerts.map((a: any) => 
        a.id === alert.id ? { ...a, status: 'read' } : a
      ));
    }
  };

  const handleMarkAsRead = async (alertId: number) => {
    try {
      await Api.updateAlertStatus?.(alertId, 'read');
      setAlerts(alerts.map((alert: any) => 
        alert.id === alertId ? { ...alert, status: 'read' } : alert
      ));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const handleArchive = async (alertId: number) => {
    try {
      await Api.updateAlertStatus?.(alertId, 'archived');
      setAlerts(alerts.map((alert: any) => 
        alert.id === alertId ? { ...alert, status: 'archived' } : alert
      ));
    } catch (error) {
      console.error('Failed to archive alert:', error);
    }
  };

  const handleExport = () => {
    // CSV export logic
    const csv = [
      ['ID', 'Title', 'Type', 'Severity', 'Status', 'User', 'Property', 'Created'],
      ...filteredAlerts.map((a: any) => [
        a.id,
        a.title,
        a.type,
        a.severity,
        a.status,
        a.user?.name || 'N/A',
        a.property?.title || 'N/A',
        a.created_at
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alerts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '60px',
        backgroundColor: C.cardBg,
        borderRadius: 12,
        border: `1px solid ${C.border}`
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: `3px solid ${C.border}`,
          borderTop: `3px solid ${C.gold}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
      </div>
    );
  }

  return (
    <div className="admin-page" style={pageWrap}>
      <style>{ADMIN_CSS}</style>
      <div style={pageInner}>
      <div style={adminHeaderStyle}>
        <div className="admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, color: '#fff' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: 6 }}>Admin · Alerts</div>
            <h1 style={{ ...body, fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
              Alerts Management
            </h1>
            <p style={{ ...body, fontSize: 14, color: C.textLight, margin: 0 }}>
              Monitor and manage system alerts and notifications
            </p>
          </div>
          <div className="admin-header-actions" style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleExport} style={{ ...btnGhost, backgroundColor: C.greenBg, color: C.green, borderColor: `${C.green}30` }}>
              <Download size={16} /> Export CSV
            </button>
            <button onClick={loadAlerts} style={{ ...btnGhost, backgroundColor: C.blueBg, color: C.blue, borderColor: `${C.blue}30` }}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-row" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: 20, 
        marginBottom: 32 
      }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${C.red}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <AlertTriangle size={24} style={{ color: C.red }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: C.textMuted, marginBottom: 4 }}>Critical</div>
              <div style={{ ...body, fontSize: 24, fontWeight: 600, color: C.text }}>
                {filteredAlerts.filter((a: any) => a.severity === 'critical').length}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${C.amber}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <AlertCircle size={24} style={{ color: C.amber }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: C.textMuted, marginBottom: 4 }}>High Priority</div>
              <div style={{ ...body, fontSize: 24, fontWeight: 600, color: C.text }}>
                {filteredAlerts.filter((a: any) => a.severity === 'high').length}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${C.amber}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bell size={24} style={{ color: C.amber }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: C.textMuted, marginBottom: 4 }}>Unread</div>
              <div style={{ ...body, fontSize: 24, fontWeight: 600, color: C.text }}>
                {filteredAlerts.filter((a: any) => a.status === 'unread').length}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, 
              background: `${C.green}20`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircle size={24} style={{ color: C.green }} />
            </div>
            <div>
              <div style={{ ...body, fontSize: 14, color: C.textMuted, marginBottom: 4 }}>Resolved</div>
              <div style={{ ...body, fontSize: 24, fontWeight: 600, color: C.text }}>
                {filteredAlerts.filter((a: any) => a.status === 'read').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={card}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ 
                position: 'absolute', 
                left: 12, 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: C.textMuted 
              }} />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  ...body,
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  backgroundColor: C.slate100,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.text,
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{
              ...body,
              padding: '10px 12px',
              backgroundColor: C.slate100,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.text,
              fontSize: 14,
              minWidth: 120,
            }}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              ...body,
              padding: '10px 12px',
              backgroundColor: C.slate100,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.text,
              fontSize: 14,
              minWidth: 120,
            }}
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              ...body,
              padding: '10px 12px',
              backgroundColor: C.slate100,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.text,
              fontSize: 14,
              minWidth: 120,
            }}
          >
            <option value="all">All Types</option>
            <option value="user">User</option>
            <option value="property">Property</option>
            <option value="payment">Payment</option>
            <option value="system">System</option>
            <option value="security">Security</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div style={card}>
        <div className="admin-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: C.textMuted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none'
                }} onClick={() => handleSort('id')}>
                  ID {sortBy === 'id' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: C.textMuted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Title</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: C.textMuted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Type</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: C.textMuted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Severity</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: C.textMuted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Status</th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: C.textMuted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none'
                }} onClick={() => handleSort('created_at')}>
                  Created {sortBy === 'created_at' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </th>
                <th style={{ 
                  ...body, 
                  padding: '12px', 
                  textAlign: 'left', 
                  color: C.textMuted, 
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ 
                    ...body, 
                    padding: '40px', 
                    textAlign: 'center', 
                    color: C.textMuted 
                  }}>
                    No alerts found
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert: any) => (
                  <tr key={alert.id} style={{ 
                    borderBottom: `1px solid ${C.border}`,
                    backgroundColor: alert.status === 'unread' ? `${C.amber}10` : 'transparent'
                  }}>
                    <td style={{ ...body, padding: '12px', color: C.text }}>
                      #{alert.id}
                    </td>
                    <td style={{ ...body, padding: '12px', color: C.text }}>
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>{alert.title}</div>
                        <div style={{ fontSize: 12, color: C.textMuted, maxWidth: 300 }}>
                          {alert.message}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px', color: C.text }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {getTypeIcon(alert.type)}
                        <span>{getTypeLabel(alert.type)}</span>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px', color: C.text }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        color: getSeverityColor(alert.severity)
                      }}>
                        {getSeverityIcon(alert.severity)}
                        <span>{alert.severity}</span>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px', color: C.text }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        color: getStatusColor(alert.status)
                      }}>
                        {getStatusIcon(alert.status)}
                        <span>{alert.status}</span>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px', color: C.text }}>
                      <div>
                        <div>{formatDate(alert.created_at)}</div>
                        <div style={{ fontSize: 12, color: C.textMuted }}>
                          {formatTimeAgo(alert.created_at)}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...body, padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleViewDetails(alert)}
                          style={{
                            ...btnGhost,
                            padding: '6px',
                            backgroundColor: `${C.blue}20`,
                            color: C.blue,
                            borderRadius: 6,
                          }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {alert.status === 'unread' && (
                          <button
                            onClick={() => handleMarkAsRead(alert.id)}
                            style={{
                              ...btnGhost,
                              padding: '6px',
                              backgroundColor: `${C.green}20`,
                              color: C.green,
                              borderRadius: 6,
                            }}
                            title="Mark as Read"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {alert.status !== 'archived' && (
                          <button
                            onClick={() => handleArchive(alert.id)}
                            style={{
                              ...btnGhost,
                              padding: '6px',
                              backgroundColor: `${C.textMuted}20`,
                              color: C.textMuted,
                              borderRadius: 6,
                            }}
                            title="Archive"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Details Modal */}
      {showDetails && selectedAlert && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div style={{ ...card, maxWidth: 700, width: '100', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
            <button
              onClick={() => setShowDetails(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'none',
                border: 'none',
                color: C.textMuted,
                cursor: 'pointer',
              }}
            >
              <XCircle size={18} />
            </button>

            <h2 style={{ ...body, fontSize: 20, fontWeight: 600, color: C.text, margin: '0 0 20px' }}>
              Alert Details
            </h2>

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Basic Information */}
              <div>
                <h3 style={{ ...body, fontSize: 16, fontWeight: 600, color: C.gold, margin: '0 0 12px' }}>
                  Alert Information
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Alert ID:</div>
                    <div style={{ ...body, fontSize: 14, color: C.text }}>#{selectedAlert.id}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Title:</div>
                    <div style={{ ...body, fontSize: 14, color: C.text, fontWeight: 500 }}>
                      {selectedAlert.title}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Message:</div>
                    <div style={{ ...body, fontSize: 14, color: C.text }}>
                      {selectedAlert.message}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Type:</div>
                    <div style={{ ...body, fontSize: 14, color: C.text }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {getTypeIcon(selectedAlert.type)}
                        <span>{getTypeLabel(selectedAlert.type)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Severity:</div>
                    <div style={{ ...body, fontSize: 14, color: C.text }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        color: getSeverityColor(selectedAlert.severity)
                      }}>
                        {getSeverityIcon(selectedAlert.severity)}
                        <span>{selectedAlert.severity}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Status:</div>
                    <div style={{ ...body, fontSize: 14, color: C.text }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        color: getStatusColor(selectedAlert.status)
                      }}>
                        {getStatusIcon(selectedAlert.status)}
                        <span>{selectedAlert.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Information */}
              {(selectedAlert.user || selectedAlert.property) && (
                <div>
                  <h3 style={{ ...body, fontSize: 16, fontWeight: 600, color: C.gold, margin: '0 0 12px' }}>
                    Related Information
                  </h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {selectedAlert.user && (
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                        <div style={{ ...body, fontSize: 14, color: C.textMuted }}>User:</div>
                        <div style={{ ...body, fontSize: 14, color: C.text }}>
                          <div>{selectedAlert.user.name}</div>
                          <div style={{ fontSize: 12, color: C.textMuted }}>
                            {selectedAlert.user.email} ({selectedAlert.user.user_type})
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedAlert.property && (
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                        <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Property:</div>
                        <div style={{ ...body, fontSize: 14, color: C.text }}>
                          <div>{selectedAlert.property.title}</div>
                          <div style={{ fontSize: 12, color: C.textMuted }}>
                            {selectedAlert.property.address}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <h3 style={{ ...body, fontSize: 16, fontWeight: 600, color: C.gold, margin: '0 0 12px' }}>
                  Timestamps
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Created:</div>
                    <div style={{ ...body, fontSize: 14, color: C.text }}>
                      {formatDate(selectedAlert.created_at)} ({formatTimeAgo(selectedAlert.created_at)})
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <div style={{ ...body, fontSize: 14, color: C.textMuted }}>Last Updated:</div>
                    <div style={{ ...body, fontSize: 14, color: C.text }}>
                      {formatDate(selectedAlert.updated_at)} ({formatTimeAgo(selectedAlert.updated_at)})
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 style={{ ...body, fontSize: 16, fontWeight: 600, color: C.gold, margin: '0 0 12px' }}>
                  Actions
                </h3>
                <div style={{ display: 'flex', gap: 12 }}>
                  {selectedAlert.status === 'unread' && (
                    <button
                      onClick={() => {
                        handleMarkAsRead(selectedAlert.id);
                        setSelectedAlert({ ...selectedAlert, status: 'read' });
                      }}
                      style={{
                        ...btnGhost,
                        backgroundColor: `${C.green}20`,
                        color: C.green,
                        flex: 1
                      }}
                    >
                      <CheckCircle size={16} />
                      Mark as Read
                    </button>
                  )}
                  {selectedAlert.status !== 'archived' && (
                    <button
                      onClick={() => {
                        handleArchive(selectedAlert.id);
                        setShowDetails(false);
                      }}
                      style={{
                        ...btnGhost,
                        backgroundColor: `${C.textMuted}20`,
                        color: C.textMuted,
                        flex: 1
                      }}
                    >
                      <XCircle size={16} />
                      Archive Alert
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AlertsManagement;
