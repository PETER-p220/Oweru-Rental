import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building, DollarSign, TrendingUp, AlertCircle,
  CheckCircle, Clock, Activity, CreditCard, Shield,
  FileText, PieChart, Hotel, RefreshCw, ArrowUpRight,
  UserCheck, Briefcase, Home, Bell, BarChart3,
} from 'lucide-react';
import Api from '../../services/api';
import { useAuthenticatedEffect } from '../../hooks/useAuthenticatedEffect';
import {
  C, body, pageWrap, pageInner, card, btnPrimary,
  ADMIN_CSS, adminHeaderStyle,
} from './adminTheme';

type ReportData = {
  users: Record<string, number> | null;
  properties: Record<string, number> | null;
  transactions: Record<string, number> | null;
  commissions: Record<string, number> | null;
  contracts: Record<string, number> | null;
  verification: Record<string, number> | null;
  alerts: Record<string, number> | null;
  bnb: Record<string, number> | null;
};

const emptyReports = (): ReportData => ({
  users: null, properties: null, transactions: null, commissions: null,
  contracts: null, verification: null, alerts: null, bnb: null,
});

const fmt = (n: number | undefined | null) => {
  const v = typeof n === 'number' && !isNaN(n) ? n : 0;
  return new Intl.NumberFormat('en-TZ', { maximumFractionDigits: 0 }).format(v);
};

const fmtCurrency = (n: number | undefined | null) => {
  const v = typeof n === 'number' && !isNaN(n) ? n : 0;
  if (v >= 1e9) return `TZS ${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `TZS ${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `TZS ${(v / 1e3).toFixed(1)}K`;
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(v);
};

const fmtPct = (n: number | undefined | null) => `${typeof n === 'number' && !isNaN(n) ? n : 0}%`;

interface StatItemProps {
  label: string;
  value: string | number;
  accent?: string;
  sub?: string;
}

const StatItem = ({ label, value, accent = C.text, sub }: StatItemProps) => (
  <div style={{
    background: C.slate100, borderRadius: 10, padding: '14px 16px',
    border: `1px solid ${C.border}`, minHeight: 88,
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
  }}>
    <div style={{ ...body, fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {label}
    </div>
    <div style={{ ...body, fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 600, color: accent, lineHeight: 1.2, marginTop: 6 }}>
      {value}
    </div>
    {sub && <div style={{ ...body, fontSize: 11, color: C.textMuted, marginTop: 4 }}>{sub}</div>}
  </div>
);

interface ReportSectionProps {
  title: string;
  badge: string;
  icon: React.ElementType;
  href: string;
  children: React.ReactNode;
}

const ReportSection = ({ title, badge, icon: Icon, href, children }: ReportSectionProps) => (
  <div style={card}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10, background: C.goldBg,
          border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={20} style={{ color: C.gold }} />
        </div>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: C.gold, marginBottom: 4,
          }}>{badge}</div>
          <h2 style={{ ...body, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>{title}</h2>
        </div>
      </div>
      <Link to={href} style={{
        ...body, display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 12, fontWeight: 600, color: C.gold, textDecoration: 'none',
        padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`,
        background: C.goldBg, whiteSpace: 'nowrap',
      }}>
        View <ArrowUpRight size={13} />
      </Link>
    </div>
    {children}
  </div>
);

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
}

const KpiCard = ({ label, value, icon: Icon, color, trend }: KpiCardProps) => (
  <div className="admin-kpi-card" style={{
    ...card, padding: '20px 22px', position: 'relative', overflow: 'hidden',
    transition: 'transform 0.2s, border-color 0.2s',
  }}>
    <div style={{
      position: 'absolute', top: -20, right: -20, width: 80, height: 80,
      borderRadius: '50%', background: `${color}18`, pointerEvents: 'none',
    }} />
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...body, fontSize: 12, color: C.textMuted, marginBottom: 8, fontWeight: 500 }}>{label}</div>
        <div style={{ ...body, fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 600, color: C.text, lineHeight: 1.1 }}>
          {value}
        </div>
        {trend && (
          <div style={{ ...body, fontSize: 12, color: C.green, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={12} /> {trend}
          </div>
        )}
      </div>
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} style={{ color: '#fff' }} />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [reports, setReports] = useState<ReportData>(emptyReports());
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string; type: string; message: string; time: string; status: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const formatTimeAgo = (d: string) => {
    if (!d) return 'Unknown';
    const ms = Date.now() - new Date(d).getTime();
    const mins = Math.floor(ms / 60000);
    const hrs  = Math.floor(ms / 3600000);
    const days = Math.floor(ms / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hrs  < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  };

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [
        usersRes, propsRes, txRes, commRes, contractRes,
        verifyRes, alertRes, bnbRes, logsRes,
      ] = await Promise.allSettled([
        Api.getUserStats(),
        Api.getAdminPropertyStats(),
        Api.getAdminTransactionStats(),
        Api.getCommissionStats(),
        Api.getAdminContractStats(),
        Api.getVerificationStats(),
        Api.getAlertStats(),
        Api.getAdminBnbAnalytics('30d'),
        Api.getActivityLogs({ per_page: 10 }),
      ]);

      const pick = (res: PromiseSettledResult<any>) =>
        res.status === 'fulfilled' ? (res.value?.data ?? res.value ?? null) : null;

      setReports({
        users: pick(usersRes),
        properties: pick(propsRes),
        transactions: pick(txRes),
        commissions: pick(commRes),
        contracts: pick(contractRes),
        verification: pick(verifyRes),
        alerts: pick(alertRes),
        bnb: pick(bnbRes),
      });

      if (logsRes.status === 'fulfilled') {
        const logs = Array.isArray(logsRes.value?.data) ? logsRes.value.data : [];
        setRecentActivity(logs.map((log: any) => ({
          id: String(log.id),
          type: (log.action || '').toLowerCase().includes('login') ? 'user'
            : (log.action || '').toLowerCase().includes('property') ? 'property'
            : (log.action || '').toLowerCase().includes('payment') ? 'payment' : 'system',
          message: log.description || log.action || 'Activity recorded',
          time: formatTimeAgo(log.created_at),
          status: (log.action || '').toLowerCase().includes('fail') ? 'error' : 'success',
        })));
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useAuthenticatedEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const getActivityIcon = (type: string) =>
    ({ user: Users, property: Building, payment: CreditCard, system: Activity }[type] ?? Activity);

  const getStatusColor = (status: string) =>
    ({ success: C.green, pending: C.amber, error: C.red }[status] ?? C.textMuted);

  const u = reports.users;
  const p = reports.properties;
  const tx = reports.transactions;
  const cm = reports.commissions;
  const ct = reports.contracts;
  const vf = reports.verification;
  const al = reports.alerts;
  const bnb = reports.bnb;

  const statGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 12,
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        minHeight: '70vh', background: C.pageBg, color: C.text, ...body, gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, border: `3px solid ${C.border}`,
          borderTopColor: C.gold, borderRadius: '50%', animation: 'admin-spin 0.8s linear infinite',
        }} />
        <div style={{ fontSize: 16, fontWeight: 500 }}>Loading system reports…</div>
        <div style={{ fontSize: 13, color: C.textMuted }}>Aggregating platform metrics</div>
        <style>{ADMIN_CSS}</style>
      </div>
    );
  }

  return (
    <div className="admin-page" style={pageWrap}>
      <style>{ADMIN_CSS}{`
        .admin-kpi-card:hover { transform: translateY(-2px); border-color: rgba(200,145,40,0.35) !important; }
        .admin-activity-item:hover { border-color: rgba(200,145,40,0.3) !important; }
        .admin-quick-link:hover { border-color: rgba(200,145,40,0.4) !important; background: rgba(200,145,40,0.06) !important; }
      `}</style>

      <div style={pageInner}>

      {/* Header */}
      <div style={adminHeaderStyle}>
        <div className="admin-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.20em', textTransform: 'uppercase', color: C.textLight, fontWeight: 700, marginBottom: '6px' }}>
              Admin · System Reports
            </div>
            <h1 style={{ ...body, fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
              Admin Overview
            </h1>
            <p style={{ ...body, fontSize: 14, color: C.textLight, margin: 0, maxWidth: 520, lineHeight: 1.6 }}>
              Complete platform metrics across users, properties, finance, contracts, and operations.
            </p>
          </div>
          <div className="admin-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start' }}>
            {lastUpdated && (
              <span style={{ ...body, fontSize: 12, color: C.textLight }}>
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              style={{ ...btnPrimary, opacity: refreshing ? 0.7 : 1, cursor: refreshing ? 'wait' : 'pointer' }}
            >
              <RefreshCw size={15} style={{ animation: refreshing ? 'admin-spin 0.8s linear infinite' : 'none' }} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="admin-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <KpiCard label="Total Users" value={fmt(u?.total)} icon={Users} color={C.gold}
          trend={u?.newThisMonth ? `+${fmt(u.newThisMonth)} this month` : undefined} />
        <KpiCard label="Total Properties" value={fmt(p?.total_properties)} icon={Building} color={C.green}
          trend={p?.new_this_month ? `+${fmt(p.new_this_month)} this month` : undefined} />
        <KpiCard label="Total Revenue" value={fmtCurrency(tx?.total_revenue)} icon={DollarSign} color={C.blue}
          trend={tx?.revenue_growth ? `${tx.revenue_growth >= 0 ? '+' : ''}${fmtPct(tx.revenue_growth)} vs last month` : undefined} />
        <KpiCard label="Active Contracts" value={fmt(ct?.activeContracts)} icon={FileText} color={C.purple} />
        <KpiCard label="Active Alerts" value={fmt(al?.activeAlerts)} icon={Bell} color={C.red}
          trend={al?.criticalAlerts ? `${fmt(al.criticalAlerts)} critical` : undefined} />
        <KpiCard label="BNB Bookings (30d)" value={fmt(bnb?.totalBookings)} icon={Hotel} color={C.amber} />
      </div>

      {/* Report sections */}
      <div className="admin-reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 24 }}>

        {/* Users */}
        <ReportSection title="User Reports" badge="Users" icon={Users} href="/dashboard/admin/users">
          <div style={statGrid}>
            <StatItem label="Total" value={fmt(u?.total)} accent={C.gold} />
            <StatItem label="Active" value={fmt(u?.active)} accent={C.green} />
            <StatItem label="Inactive" value={fmt(u?.inactive)} accent={C.textMuted} />
            <StatItem label="Landlords" value={fmt(u?.landlords)} />
            <StatItem label="Tenants" value={fmt(u?.tenants)} />
            <StatItem label="Agents" value={fmt(u?.agents)} />
            <StatItem label="BNB Owners" value={fmt(u?.bnb_owners)} />
            <StatItem label="Commercial" value={fmt(u?.commercial)} />
            <StatItem label="Admins" value={fmt(u?.admins)} />
            <StatItem label="New This Month" value={fmt(u?.newThisMonth)} accent={C.green} />
            <StatItem label="Active Sessions" value={fmt(u?.activeSessions)} accent={C.blue} />
            <StatItem label="Active This Month" value={fmt(u?.activeThisMonth)} />
          </div>
        </ReportSection>

        {/* Properties */}
        <ReportSection title="Property Reports" badge="Properties" icon={Building} href="/dashboard/admin/properties">
          <div style={statGrid}>
            <StatItem label="Total" value={fmt(p?.total_properties)} accent={C.gold} />
            <StatItem label="Available" value={fmt(p?.available_properties)} accent={C.green} />
            <StatItem label="Rented" value={fmt(p?.rented_properties)} />
            <StatItem label="Featured" value={fmt(p?.featured_properties)} accent={C.amber} />
            <StatItem label="New This Month" value={fmt(p?.new_this_month)} accent={C.green} />
            <StatItem label="Portfolio Value" value={fmtCurrency(p?.total_value)} accent={C.gold} />
            <StatItem label="Avg. Price" value={fmtCurrency(p?.avg_price)} />
            <StatItem label="Maintenance" value={fmt(p?.maintenance_properties)} accent={C.red} />
          </div>
        </ReportSection>

        {/* Transactions */}
        <ReportSection title="Transaction Reports" badge="Finance" icon={DollarSign} href="/dashboard/admin/transactions">
          <div style={statGrid}>
            <StatItem label="Total Transactions" value={fmt(tx?.total_transactions)} accent={C.gold} />
            <StatItem label="Total Revenue" value={fmtCurrency(tx?.total_revenue)} accent={C.green} />
            <StatItem label="Net Revenue" value={fmtCurrency(tx?.net_revenue)} accent={C.green} />
            <StatItem label="Revenue This Month" value={fmtCurrency(tx?.revenue_this_month)} />
            <StatItem label="Completed" value={fmt(tx?.completed_transactions)} accent={C.green} />
            <StatItem label="Pending" value={fmt(tx?.pending_transactions)} accent={C.amber} />
            <StatItem label="Failed" value={fmt(tx?.failed_transactions)} accent={C.red} />
            <StatItem label="Refunded" value={fmt(tx?.refunded_transactions)} />
            <StatItem label="Avg. Amount" value={fmtCurrency(tx?.avg_transaction_amount)} />
            <StatItem label="Total Fees" value={fmtCurrency(tx?.total_fees)} />
            <StatItem label="Revenue Growth" value={fmtPct(tx?.revenue_growth)} accent={C.green} />
            <StatItem label="Txn Growth" value={fmtPct(tx?.transaction_growth)} accent={C.green} />
          </div>
        </ReportSection>

        {/* Commissions */}
        <ReportSection title="Commission Reports" badge="Commission" icon={PieChart} href="/dashboard/admin/commission">
          <div style={statGrid}>
            <StatItem label="Total" value={fmt(cm?.totalCommissions)} accent={C.gold} />
            <StatItem label="Total Amount" value={fmtCurrency(cm?.totalAmount)} accent={C.green} />
            <StatItem label="Pending" value={fmt(cm?.pendingCommissions)} accent={C.amber} />
            <StatItem label="Approved" value={fmt(cm?.approvedCommissions)} />
            <StatItem label="Paid" value={fmt(cm?.paidCommissions)} accent={C.green} />
            <StatItem label="Avg. Rate" value={fmtPct(cm?.avgCommissionRate)} />
            <StatItem label="This Month Total" value={fmtCurrency(cm?.thisMonth?.total)} />
            <StatItem label="This Month Paid" value={fmtCurrency(cm?.thisMonth?.paid)} accent={C.green} />
            <StatItem label="This Month Pending" value={fmtCurrency(cm?.thisMonth?.pending)} accent={C.amber} />
          </div>
        </ReportSection>

        {/* Contracts */}
        <ReportSection title="Contract Reports" badge="Contracts" icon={FileText} href="/dashboard/admin/contracts">
          <div style={statGrid}>
            <StatItem label="Total" value={fmt(ct?.totalContracts)} accent={C.gold} />
            <StatItem label="Active" value={fmt(ct?.activeContracts)} accent={C.green} />
            <StatItem label="Pending" value={fmt(ct?.pendingContracts)} accent={C.amber} />
            <StatItem label="Expired" value={fmt(ct?.expiredContracts)} accent={C.red} />
            <StatItem label="Total Value" value={fmtCurrency(ct?.totalValue)} accent={C.gold} />
            <StatItem label="Avg. Value" value={fmtCurrency(ct?.avgContractValue)} />
            <StatItem label="This Month" value={fmt(ct?.contractsThisMonth)} accent={C.green} />
            <StatItem label="Expiring This Month" value={fmt(ct?.expiringThisMonth)} accent={C.amber} />
            <StatItem label="Renewal Rate" value={fmtPct(ct?.renewalRate)} accent={C.green} />
            <StatItem label="Termination Rate" value={fmtPct(ct?.terminationRate)} accent={C.red} />
          </div>
        </ReportSection>

        {/* Verification */}
        <ReportSection title="Verification Reports" badge="Verification" icon={Shield} href="/dashboard/admin/verification">
          <div style={statGrid}>
            <StatItem label="Total Requests" value={fmt(vf?.totalRequests)} accent={C.gold} />
            <StatItem label="Approved" value={fmt(vf?.approvedRequests)} accent={C.green} />
            <StatItem label="Pending" value={fmt(vf?.pendingRequests)} accent={C.amber} />
            <StatItem label="Rejected" value={fmt(vf?.rejectedRequests)} accent={C.red} />
            <StatItem label="In Review" value={fmt(vf?.inReviewRequests)} />
            <StatItem label="Verification Rate" value={fmtPct(vf?.verificationRate)} accent={C.green} />
            <StatItem label="This Month" value={fmt(vf?.requestsThisMonth)} />
            <StatItem label="Urgent" value={fmt(vf?.urgentRequests)} accent={C.red} />
          </div>
        </ReportSection>

        {/* Alerts */}
        <ReportSection title="Alert Reports" badge="Alerts" icon={Bell} href="/dashboard/admin/alerts">
          <div style={statGrid}>
            <StatItem label="Total" value={fmt(al?.totalAlerts)} accent={C.gold} />
            <StatItem label="Active" value={fmt(al?.activeAlerts)} accent={C.amber} />
            <StatItem label="Resolved" value={fmt(al?.resolvedAlerts)} accent={C.green} />
            <StatItem label="Critical" value={fmt(al?.criticalAlerts)} accent={C.red} />
            <StatItem label="Urgent" value={fmt(al?.urgentAlerts)} accent={C.red} />
            <StatItem label="This Hour" value={fmt(al?.alertsThisHour)} />
            <StatItem label="Today" value={fmt(al?.alertsToday)} />
            <StatItem label="This Week" value={fmt(al?.alertsThisWeek)} />
          </div>
        </ReportSection>

        {/* BNB */}
        <ReportSection title="BNB Platform Reports" badge="BNB" icon={Hotel} href="/dashboard/admin/bnb-properties">
          <div style={statGrid}>
            <StatItem label="Total Properties" value={fmt(bnb?.totalProperties)} accent={C.gold} />
            <StatItem label="Active Properties" value={fmt(bnb?.activeProperties)} accent={C.green} />
            <StatItem label="Bookings (30d)" value={fmt(bnb?.totalBookings)} />
            <StatItem label="Completed (30d)" value={fmt(bnb?.completedBookings)} accent={C.green} />
            <StatItem label="Revenue (30d)" value={fmtCurrency(bnb?.totalRevenue)} accent={C.gold} />
            <StatItem label="Occupancy Rate" value={fmtPct(bnb?.occupancyRate)} accent={C.green} />
          </div>
        </ReportSection>
      </div>

      {/* Bottom: Activity + Quick Actions */}
      <div className="admin-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>

        {/* Recent Activity */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, marginBottom: 4 }}>
                Live Feed
              </div>
              <h2 style={{ ...body, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>Recent Activity</h2>
            </div>
            <Link to="/dashboard/admin/activity-logs" style={{ ...body, fontSize: 12, color: C.gold, textDecoration: 'none', fontWeight: 600 }}>
              View all →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: C.textMuted }}>
                <Clock size={28} style={{ opacity: 0.35, marginBottom: 10 }} />
                <div style={{ ...body, fontSize: 14 }}>No recent activity</div>
              </div>
            ) : (
              recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="admin-activity-item" style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    background: C.slate100, borderRadius: 10, border: `1px solid ${C.border}`, transition: 'border-color 0.2s',
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, background: C.goldBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      color: getStatusColor(activity.status),
                    }}>
                      <Icon size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...body, fontSize: 13, color: C.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {activity.message}
                      </div>
                      <div style={{ ...body, fontSize: 11, color: C.textMuted, marginTop: 2 }}>{activity.time}</div>
                    </div>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: getStatusColor(activity.status), flexShrink: 0 }} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={card}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, marginBottom: 4 }}>
              Shortcuts
            </div>
            <h2 style={{ ...body, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>Quick Actions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Manage Users', href: '/dashboard/admin/users', icon: Users },
              { label: 'All Properties', href: '/dashboard/admin/properties', icon: Home },
              { label: 'Oweru Rentals', href: '/dashboard/admin/oweru-properties', icon: Briefcase },
              { label: 'Transactions', href: '/dashboard/admin/transactions', icon: CreditCard },
              { label: 'Commission Control', href: '/dashboard/admin/commission', icon: PieChart },
              { label: 'Contracts', href: '/dashboard/admin/contracts', icon: FileText },
              { label: 'Verification Queue', href: '/dashboard/admin/verification', icon: UserCheck },
              { label: 'System Alerts', href: '/dashboard/admin/alerts', icon: AlertCircle },
              { label: 'BNB Properties', href: '/dashboard/admin/bnb-properties', icon: Hotel },
              { label: 'Activity Logs', href: '/dashboard/admin/activity-logs', icon: Activity },
            ].map(({ label, href, icon: Icon }) => (
              <Link key={href} to={href} className="admin-quick-link" style={{
                ...body, display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 10, textDecoration: 'none',
                background: C.slate100, border: `1px solid ${C.border}`,
                color: C.text, fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
              }}>
                <Icon size={16} style={{ color: C.gold, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
                <ArrowUpRight size={14} style={{ color: C.textMuted }} />
              </Link>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
