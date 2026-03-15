import { useState, useEffect } from 'react';
import {
  Users, Search, Eye, Phone, Mail, MapPin, Calendar,
  Clock, AlertCircle, CheckCircle, MessageSquare, ExternalLink,
} from 'lucide-react';
import Api from '../../services/api';

/* ─── Types ─────────────────────────────────────────────────── */
interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  medium: string;
  campaign: string;
  propertyId?: number;
  propertyTitle?: string;
  propertyLocation?: string;
  propertyPrice?: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high';
  notes: string;
  assignedTo?: string;
  createdAt: string;
  lastContacted?: string;
  followUpDate?: string;
  tags: string[];
  score: number;
  visitorId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

interface Visitor {
  id: number;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  landingPage: string;
  pagesViewed: string[];
  timeOnSite: number;
  bounceRate: boolean;
  isNew: boolean;
  converted: boolean;
  convertedTo?: string;
  leadId?: number;
  createdAt: string;
  lastActive: string;
  location?: string;
  device: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  interests: string[];
  actions: {
    pageViews: number;
    clicks: number;
    formSubmissions: number;
    downloads: number;
    shares: number;
    timeOnSite: number;
  };
}

interface LeadStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  totalVisitors: number;
  uniqueVisitors: number;
  conversionRate: number;
  avgResponseTime: number;
  topSources: Array<{ source: string; count: number; conversions: number }>;
  topProperties: Array<{ propertyId: number; title: string; leads: number; conversions: number }>;
  monthlyTrend: Array<{ month: string; leads: number; conversions: number; visitors: number }>;
}

/* ─── Helpers ────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' });

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    new: '#f59e0b', contacted: '#3b82f6', qualified: '#8b5cf6',
    converted: '#10b981', lost: '#ef4444',
  };
  return map[status] ?? '#6b7280';
};

const getPriorityColor = (priority: string) => {
  const map: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
  return map[priority] ?? '#6b7280';
};

const getPriorityIcon = (priority: string) => {
  if (priority === 'high') return AlertCircle;
  if (priority === 'low') return CheckCircle;
  return Clock;
};

/* ─── Shared style tokens ────────────────────────────────────── */
const card: React.CSSProperties = {
  backgroundColor: '#0e0e0e',
  border: '1px solid rgba(201,168,76,0.10)',
  borderRadius: 8,
};

const metaBox: React.CSSProperties = {
  backgroundColor: 'rgba(201,168,76,0.03)',
  border: '1px solid rgba(201,168,76,0.08)',
  borderRadius: 6,
  padding: 12,
  marginBottom: 12,
};

const label: React.CSSProperties = {
  color: '#7a7060', fontSize: 11,
  fontFamily: 'DM Sans, sans-serif',
  marginBottom: 4,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const body: React.CSSProperties = { fontFamily: 'DM Sans, sans-serif' };

const actionBtn = (r: number, g: number, b: number): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 16px',
  backgroundColor: `rgba(${r},${g},${b},0.10)`,
  border: `1px solid rgba(${r},${g},${b},0.22)`,
  color: `rgb(${r},${g},${b})`,
  borderRadius: 4,
  ...body,
  fontSize: 12, fontWeight: 500, cursor: 'pointer',
});

const pill = (color: string): React.CSSProperties => ({
  padding: '3px 8px',
  backgroundColor: `${color}18`,
  border: `1px solid ${color}30`,
  color,
  borderRadius: 999,
  fontSize: 10,
  ...body,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  display: 'inline-flex', alignItems: 'center', gap: 4,
});

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#e8e4dc',
  borderRadius: 4,
  ...body, fontSize: 14, outline: 'none',
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════ */
const LeadsAndVisitors = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [activeTab, setActiveTab] = useState<'leads' | 'visitors'>('leads');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const mockLeads: Lead[] = [
        {
          id: 1, firstName: 'Alice', lastName: 'Johnson',
          email: 'alice.johnson@example.com', phone: '+255123456789',
          source: 'facebook', medium: 'social_media', campaign: 'Spring Campaign 2024',
          propertyId: 1, propertyTitle: 'Modern 3-Bedroom Penthouse',
          propertyLocation: 'Masaki, Dar es Salaam', propertyPrice: 2500000,
          status: 'new', priority: 'high',
          notes: 'Looking for a luxury apartment with ocean view. Budget up to TZS 3M. Ready to move in immediately.',
          assignedTo: 'John Agent', createdAt: '2024-03-20T10:30:00Z',
          lastContacted: '2024-03-20T14:15:00Z', followUpDate: '2024-03-21T10:00:00Z',
          tags: ['penthouse', 'luxury', 'ocean view'], score: 85,
          utmSource: 'facebook', utmMedium: 'social_media', utmCampaign: 'spring_campaign_2024',
        },
        {
          id: 2, firstName: 'Bob', lastName: 'Smith',
          email: 'bob.smith@example.com', phone: '+255987654321',
          source: 'google', medium: 'organic_search', campaign: 'Organic Search',
          propertyId: 2, propertyTitle: 'Cozy 1-Bedroom Apartment',
          propertyLocation: 'Mikocheni B, Dar es Salaam', propertyPrice: 450000,
          status: 'contacted', priority: 'medium',
          notes: 'Interested in the studio apartment. Called to schedule viewing.',
          assignedTo: 'Jane Agent', createdAt: '2024-03-18T09:15:00Z',
          lastContacted: '2024-03-19T16:30:00Z', followUpDate: '2024-03-20T11:00:00Z',
          tags: ['studio', 'affordable'], score: 72,
          utmSource: 'google', utmMedium: 'organic_search', utmCampaign: 'organic_search',
        },
        {
          id: 3, firstName: 'Carol', lastName: 'Davis',
          email: 'carol.davis@example.com', phone: '+255555666777',
          source: 'website', medium: 'direct', campaign: 'Direct Traffic',
          propertyId: 3, propertyTitle: 'Spacious Family Home',
          propertyLocation: 'Upanga, Dar es Salaam', propertyPrice: 1800000,
          status: 'qualified', priority: 'high',
          notes: 'Family of 4 looking for 3+ bedroom home. Pre-qualified based on income.',
          assignedTo: 'Michael Agent', createdAt: '2024-03-15T14:20:00Z',
          lastContacted: '2024-03-17T11:45:00Z', followUpDate: '2024-03-18T09:00:00Z',
          tags: ['family', 'house', '3+ bedroom'], score: 88,
          utmSource: 'direct', utmMedium: 'direct', utmCampaign: 'website',
        },
        {
          id: 4, firstName: 'David', lastName: 'Wilson',
          email: 'david.wilson@example.com', phone: '+255444555666',
          source: 'instagram', medium: 'social_media', campaign: 'Instagram Ads',
          propertyId: 4, propertyTitle: 'Luxury Executive Villa',
          propertyLocation: 'Oyster Bay, Dar es Salaam', propertyPrice: 4500000,
          status: 'converted', priority: 'high',
          notes: 'Successfully converted. Signed lease agreement and paid deposit.',
          assignedTo: 'Robert Agent', createdAt: '2024-03-10T16:45:00Z',
          lastContacted: '2024-03-12T13:30:00Z', followUpDate: '2024-03-11T10:00:00Z',
          tags: ['villa', 'luxury', 'executive'], score: 95,
          utmSource: 'instagram', utmMedium: 'social_media', utmCampaign: 'instagram_ads',
        },
        {
          id: 5, firstName: 'Emma', lastName: 'Brown',
          email: 'emma.brown@example.com', phone: '+255333444555',
          source: 'referral', medium: 'referral', campaign: 'Word of Mouth',
          propertyId: 5, propertyTitle: 'Modern Studio with City View',
          propertyLocation: 'Msasani, Dar es Salaam', propertyPrice: 380000,
          status: 'lost', priority: 'low',
          notes: 'Found another property that better fits their needs.',
          assignedTo: 'Sarah Agent', createdAt: '2024-03-08T11:20:00Z',
          lastContacted: '2024-03-09T09:15:00Z', followUpDate: '2024-03-10T10:00:00Z',
          tags: ['studio', 'city view'], score: 65,
          utmSource: 'referral', utmMedium: 'referral', utmCampaign: 'word_of_mouth',
        },
      ];

      const mockVisitors: Visitor[] = [
        {
          id: 1, sessionId: 'sess_123456789', ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Chrome/91', referrer: 'https://google.com',
          landingPage: '/properties', pagesViewed: ['/properties', '/properties/1'],
          timeOnSite: 245, bounceRate: false, isNew: true, converted: false,
          createdAt: '2024-03-20T10:30:00Z', lastActive: '2024-03-20T14:15:00Z',
          location: 'Dar es Salaam, Tanzania', device: 'desktop', browser: 'Chrome', os: 'Windows',
          interests: ['real estate', 'apartments'],
          actions: { pageViews: 12, clicks: 34, formSubmissions: 2, downloads: 1, shares: 0, timeOnSite: 245 },
        },
        {
          id: 2, sessionId: 'sess_234567890', ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0 iPhone Safari', referrer: 'https://facebook.com',
          landingPage: '/properties/1', pagesViewed: ['/properties/1', '/properties/1/gallery'],
          timeOnSite: 180, bounceRate: false, isNew: true, converted: true, convertedTo: 'lead_1',
          createdAt: '2024-03-18T09:15:00Z', lastActive: '2024-03-18T14:15:00Z',
          location: 'Dar es Salaam, Tanzania', device: 'mobile', browser: 'Safari', os: 'iOS',
          interests: ['real estate', 'luxury'],
          actions: { pageViews: 8, clicks: 22, formSubmissions: 1, downloads: 0, shares: 2, timeOnSite: 180 },
        },
        {
          id: 3, sessionId: 'sess_345678901', ipAddress: '192.168.1.3',
          userAgent: 'Mozilla/5.0 Chrome/91', referrer: 'https://instagram.com',
          landingPage: '/properties/4', pagesViewed: ['/properties/4', '/properties/4/gallery'],
          timeOnSite: 450, bounceRate: false, isNew: true, converted: true, convertedTo: 'lead_4',
          createdAt: '2024-03-10T16:45:00Z', lastActive: '2024-03-12T13:30:00Z',
          location: 'Dar es Salaam, Tanzania', device: 'mobile', browser: 'Chrome', os: 'iOS',
          interests: ['villas', 'luxury'],
          actions: { pageViews: 18, clicks: 56, formSubmissions: 2, downloads: 1, shares: 3, timeOnSite: 450 },
        },
      ];

      const mockStats: LeadStats = {
        totalLeads: 5, newLeads: 1, contactedLeads: 1, qualifiedLeads: 1,
        convertedLeads: 1, lostLeads: 1, totalVisitors: 3, uniqueVisitors: 3,
        conversionRate: 20.0, avgResponseTime: 2.5,
        topSources: [
          { source: 'facebook', count: 2, conversions: 1 },
          { source: 'google', count: 2, conversions: 1 },
        ],
        topProperties: [
          { propertyId: 4, title: 'Luxury Executive Villa', leads: 1, conversions: 1 },
        ],
        monthlyTrend: [
          { month: 'Jan', leads: 12, conversions: 2, visitors: 45 },
          { month: 'Feb', leads: 15, conversions: 3, visitors: 52 },
          { month: 'Mar', leads: 18, conversions: 4, visitors: 68 },
        ],
      };

      setLeads(mockLeads);
      setVisitors(mockVisitors);
      setStats(mockStats);
    } catch (e) {
      console.error('Failed to load leads and visitors:', e);
    } finally {
      setLoading(false);
    }
  };

  /* ── Filtered + sorted leads ── */
  const filteredLeads = leads
    .filter((lead) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        lead.firstName.toLowerCase().includes(q) ||
        lead.lastName.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        (lead.propertyTitle?.toLowerCase().includes(q) ?? false) ||
        lead.notes.toLowerCase().includes(q);
      return (
        matchSearch &&
        (statusFilter === 'all' || lead.status === statusFilter) &&
        (priorityFilter === 'all' || lead.priority === priorityFilter) &&
        (sourceFilter === 'all' || lead.source === sourceFilter)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      if (sortBy === 'priority') {
        const ord: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return ord[a.priority] - ord[b.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  /* ── Filtered + sorted visitors ── */
  const filteredVisitors = visitors
    .filter((v) => {
      const q = searchTerm.toLowerCase();
      return (
        v.sessionId.toLowerCase().includes(q) ||
        v.ipAddress.includes(q) ||
        (v.referrer?.toLowerCase().includes(q) ?? false)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'timeOnSite') return b.actions.timeOnSite - a.actions.timeOnSite;
      if (sortBy === 'pageViews') return b.actions.pageViews - a.actions.pageViews;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid #1a1a1a',
            borderTop: '3px solid #c9a84c',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#7a7060', ...body }}>Loading…</p>
        </div>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Users size={26} style={{ color: '#c9a84c' }} />
          <h1 style={{ color: '#e8e4dc', fontSize: 26, fontWeight: 500, margin: 0, fontFamily: 'Cormorant Garamond, serif', letterSpacing: '-0.02em' }}>
            Leads &amp; Visitors
          </h1>
          {stats && (
            <span style={pill('#c9a84c')}>
              {activeTab === 'leads' ? stats.totalLeads : stats.totalVisitors}{' '}
              {activeTab === 'leads' ? 'leads' : 'visitors'}
            </span>
          )}
        </div>
        <p style={{ color: '#7a7060', ...body, margin: 0, fontSize: 14 }}>
          Track your leads and monitor website visitor activity from the Digital Tracking System.
        </p>
      </div>

      {/* ── Stats strip ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: activeTab === 'leads' ? 'Total Leads' : 'Total Visitors', value: activeTab === 'leads' ? stats.totalLeads : stats.totalVisitors, color: '#e8e4dc' },
            { label: 'New This Month', value: stats.newLeads, color: '#f59e0b' },
            { label: 'Converted', value: stats.convertedLeads, color: '#10b981' },
            { label: 'Conversion Rate', value: `${stats.conversionRate}%`, color: '#ef4444' },
          ].map(({ label: lbl, value, color }) => (
            <div key={lbl} style={{ ...card, padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 600, color, ...body, marginBottom: 4 }}>{value}</div>
              <div style={{ ...label, marginBottom: 0 }}>{lbl}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab toggle ── */}
      <div style={{ ...card, padding: 4, marginBottom: 20, display: 'flex', gap: 4 }}>
        {(['leads', 'visitors'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '8px 16px',
              backgroundColor: activeTab === tab ? '#c9a84c' : 'transparent',
              border: `1px solid ${activeTab === tab ? '#c9a84c' : 'rgba(201,168,76,0.15)'}`,
              color: activeTab === tab ? '#080808' : '#7a7060',
              borderRadius: 4,
              ...body, fontSize: 14, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'capitalize',
            }}
          >
            {tab} ({tab === 'leads' ? (stats?.totalLeads ?? 0) : (stats?.totalVisitors ?? 0)})
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ ...card, padding: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220 }}>
            <Search size={16} style={{ color: '#7a7060', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={`Search ${activeTab}…`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1, padding: '8px 12px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#e8e4dc',
                borderRadius: 4, ...body, fontSize: 13, outline: 'none',
              }}
            />
          </div>

          {/* Leads-only filters */}
          {activeTab === 'leads' && (
            <>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>

              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={selectStyle}>
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} style={selectStyle}>
                <option value="all">All Sources</option>
                <option value="facebook">Facebook</option>
                <option value="google">Google</option>
                <option value="website">Website</option>
                <option value="instagram">Instagram</option>
                <option value="referral">Referral</option>
              </select>
            </>
          )}

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
            <option value="createdAt">Recently Created</option>
            {activeTab === 'leads' && <option value="score">Lead Score</option>}
            {activeTab === 'leads' && <option value="name">Name</option>}
            {activeTab === 'leads' && <option value="priority">Priority</option>}
            {activeTab === 'visitors' && <option value="timeOnSite">Time on Site</option>}
            {activeTab === 'visitors' && <option value="pageViews">Page Views</option>}
          </select>
        </div>
      </div>

      {/* ══ LEADS LIST ══ */}
      {activeTab === 'leads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {filteredLeads.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', ...card }}>
              <Users size={44} style={{ color: '#7a7060', marginBottom: 14 }} />
              <h3 style={{ color: '#e8e4dc', fontSize: 17, marginBottom: 8, ...body }}>No leads found</h3>
              <p style={{ color: '#7a7060', ...body, fontSize: 13 }}>
                Try adjusting your filters or wait for new leads.
              </p>
            </div>
          )}

          {filteredLeads.map((lead) => {
            const PriorityIcon = getPriorityIcon(lead.priority);
            const statusColor  = getStatusColor(lead.status);
            const priorityColor = getPriorityColor(lead.priority);

            return (
              <div
                key={lead.id}
                style={{
                  ...card,
                  padding: 20,
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>

                  {/* Avatar */}
                  <div style={{
                    width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Users size={22} style={{ color: '#c9a84c' }} />
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>

                    {/* Name + badges */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                      <div>
                        <h4 style={{ color: '#e8e4dc', fontSize: 15, ...body, fontWeight: 500, margin: '0 0 5px' }}>
                          {lead.firstName} {lead.lastName}
                        </h4>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#7a7060', fontSize: 12, ...body }}>
                            <Mail size={12} /> {lead.email}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#7a7060', fontSize: 12, ...body }}>
                            <Phone size={12} /> {lead.phone}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={pill(statusColor)}>
                            <PriorityIcon size={9} /> {lead.status}
                          </span>
                          <span style={pill(priorityColor)}>
                            {lead.priority}
                          </span>
                          <span style={{ ...body, fontSize: 11, color: '#7a7060', display: 'flex', alignItems: 'center' }}>
                            Score: <strong style={{ color: '#c9a84c', marginLeft: 3 }}>{lead.score}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Property interest */}
                    {lead.propertyTitle && (
                      <div style={metaBox}>
                        <div style={label}>Property Interest</div>
                        <div style={{ color: '#e8e4dc', fontSize: 14, ...body, marginBottom: 2 }}>{lead.propertyTitle}</div>
                        <div style={{ color: '#7a7060', fontSize: 12, ...body, marginBottom: 4 }}>{lead.propertyLocation}</div>
                        <div style={{ color: '#c9a84c', fontSize: 15, fontWeight: 600, ...body }}>{fmt(lead.propertyPrice ?? 0)}</div>
                      </div>
                    )}

                    {/* Source & campaign */}
                    <div style={metaBox}>
                      <div style={label}>Source &amp; Campaign</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={pill('#38bdf8')}>{lead.source}</span>
                        <span style={pill('#22c55e')}>{lead.medium}</span>
                        {lead.utmCampaign && (
                          <span style={{ color: '#7a7060', fontSize: 11, ...body, alignSelf: 'center' }}>
                            {lead.utmCampaign}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {lead.notes && (
                      <div style={metaBox}>
                        <div style={label}>Notes</div>
                        <p style={{ color: '#c8c0b0', fontSize: 13, ...body, lineHeight: 1.55, margin: 0 }}>
                          {lead.notes}
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                      <button style={actionBtn(201, 168, 76)}>
                        <MessageSquare size={13} /> Send Message
                      </button>
                      <button style={actionBtn(34, 197, 94)}>
                        <Phone size={13} /> Call
                      </button>
                      <button style={actionBtn(239, 68, 68)}>
                        <Eye size={13} /> View Details
                      </button>
                    </div>

                    {/* Date meta */}
                    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid rgba(201,168,76,0.07)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#7a7060', fontSize: 11, ...body }}>
                        <Calendar size={11} /> Created: {formatDate(lead.createdAt)}
                      </span>
                      {lead.lastContacted && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#7a7060', fontSize: 11, ...body }}>
                          <Eye size={11} /> Last contact: {formatDate(lead.lastContacted)}
                        </span>
                      )}
                      {lead.followUpDate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#7a7060', fontSize: 11, ...body }}>
                          <Clock size={11} /> Follow-up: {formatDate(lead.followUpDate)}
                        </span>
                      )}
                    </div>

                  </div>{/* /body */}
                </div>{/* /flex row */}
              </div>/* /lead card */
            );
          })}
        </div>
      )}

      {/* ══ VISITORS LIST ══ */}
      {activeTab === 'visitors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {filteredVisitors.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', ...card }}>
              <Users size={44} style={{ color: '#7a7060', marginBottom: 14 }} />
              <h3 style={{ color: '#e8e4dc', fontSize: 17, marginBottom: 8, ...body }}>No visitors found</h3>
              <p style={{ color: '#7a7060', ...body, fontSize: 13 }}>
                Try adjusting your search or wait for new visitors.
              </p>
            </div>
          )}

          {filteredVisitors.map((visitor) => (
            <div key={visitor.id} style={{ ...card, padding: 20 }}>
              <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>

                {/* Avatar */}
                <div style={{
                  width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: 'rgba(56,189,248,0.08)',
                  border: '1px solid rgba(56,189,248,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Users size={22} style={{ color: '#38bdf8' }} />
                </div>

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>

                  {/* Name row */}
                  <div style={{ marginBottom: 12 }}>
                    <h4 style={{ color: '#e8e4dc', fontSize: 15, ...body, fontWeight: 500, margin: '0 0 4px' }}>
                      Visitor #{visitor.id}
                    </h4>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ color: '#7a7060', fontSize: 12, ...body }}>{visitor.ipAddress}</span>
                      <span style={{ color: '#7a7060', fontSize: 12, ...body }}>{visitor.device} · {visitor.browser} · {visitor.os}</span>
                      {visitor.converted && (
                        <span style={pill('#10b981')}>Converted</span>
                      )}
                      {visitor.bounceRate && (
                        <span style={pill('#ef4444')}>Bounced</span>
                      )}
                    </div>
                  </div>

                  {/* Session info grid */}
                  <div style={metaBox}>
                    <div style={label}>Session</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12 }}>
                      {[
                        { k: 'Session ID', v: visitor.sessionId },
                        { k: 'Landing Page', v: visitor.landingPage },
                        { k: 'Time on Site', v: `${visitor.actions.timeOnSite}s` },
                        { k: 'Page Views',   v: visitor.actions.pageViews },
                        { k: 'Clicks',       v: visitor.actions.clicks },
                        { k: 'Form Submits', v: visitor.actions.formSubmissions },
                      ].map(({ k, v }) => (
                        <div key={k}>
                          <div style={{ ...label, marginBottom: 2 }}>{k}</div>
                          <div style={{ color: '#e8e4dc', fontSize: 13, ...body, wordBreak: 'break-all' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Referrer */}
                  {visitor.referrer && (
                    <div style={{ ...metaBox, marginBottom: 12 }}>
                      <div style={label}>Referrer</div>
                      <div style={{ color: '#38bdf8', fontSize: 13, ...body, wordBreak: 'break-all' }}>{visitor.referrer}</div>
                    </div>
                  )}

                  {/* Location */}
                  {visitor.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                      <MapPin size={12} style={{ color: '#7a7060' }} />
                      <span style={{ color: '#7a7060', fontSize: 12, ...body }}>{visitor.location}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button style={actionBtn(201, 168, 76)}>
                      <Eye size={13} /> View Details
                    </button>
                    <button style={actionBtn(56, 189, 248)}>
                      <ExternalLink size={13} /> View Property
                    </button>
                  </div>

                </div>{/* /body */}
              </div>{/* /flex row */}
            </div>/* /visitor card */
          ))}

        </div>
      )}

    </div>/* /page root */
  );
};

export default LeadsAndVisitors;