import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home, Search, Bell, Settings, LogOut, Menu, Building, Users,
  TrendingUp, DollarSign, Star, BarChart3, FileText, Plus, X,
  ChevronRight, QrCode, Link2, ShieldCheck, CreditCard, Wallet,
  Receipt, UserCheck, MessageSquare, AlertCircle, PieChart,
  RefreshCw, Clock, BookOpen, Landmark, Eye,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

type UserRole = 'tenant' | 'landlord' | 'agent' | 'admin';

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();

  const userType: UserRole = user?.userType ||
                           user?.user_type ||
                           user?.role ||
                           user?.userRole ||
                           user?.user_role ||
                           'tenant';

  console.log('DashboardLayout - User object:', user);
  console.log('DashboardLayout - User object keys:', user ? Object.keys(user) : 'No user');
  console.log('DashboardLayout - Detected user type:', userType);

  const navigation: Record<UserRole, { name: string; icon: any; href: string; color: string; badge?: string }[]> = {

    tenant: [
      { name: 'Overview',           icon: Home,          href: '',                    color: '#c9a84c' },
      { name: 'Browse Properties',  icon: Search,        href: '/properties',         color: '#60a5fa' },
      { name: 'My Applications',    icon: FileText,      href: 'applications',        color: '#a78bfa' },
      { name: 'Saved Properties',   icon: Star,          href: 'saved-properties',    color: '#f59e0b' },
      { name: 'My Contract',        icon: BookOpen,      href: 'contract',            color: '#34d399' },
      { name: 'Rent Payments',      icon: CreditCard,    href: 'payments',            color: '#10b981' },
      { name: 'Payment History',    icon: Receipt,       href: 'payment-history',     color: '#6ee7b7' },
      { name: 'Messages',           icon: MessageSquare, href: 'messages',            color: '#f87171' },
      { name: 'Notifications',      icon: Bell,          href: 'notifications',       color: '#fb923c' },
    ],

    landlord: [
      { name: 'Overview',           icon: Home,          href: '',                    color: '#c9a84c' },
      { name: 'My Properties',      icon: Building,      href: 'my-properties',       color: '#f59e0b' },
      { name: 'Add Property',       icon: Plus,          href: 'add-property',        color: '#34d399' },
      { name: 'Applications',       icon: FileText,      href: 'applications',        color: '#60a5fa' },
      { name: 'My Tenants',         icon: Users,         href: 'tenants',             color: '#a78bfa' },
      { name: 'Digital Contracts',  icon: BookOpen,      href: 'contracts',           color: '#f472b6' },
      { name: 'Rent Collection',    icon: Wallet,        href: 'rent-collection',     color: '#10b981' },
      { name: 'Payment Receipts',   icon: Receipt,       href: 'receipts',            color: '#6ee7b7' },
      { name: 'Commission Reports', icon: PieChart,      href: 'commissions',         color: '#fb923c' },
      { name: 'Analytics',          icon: BarChart3,     href: 'analytics',           color: '#f87171' },
      { name: 'Messages',           icon: MessageSquare, href: 'messages',            color: '#94a3b8' },
    ],

    agent: [
      { name: 'Overview',           icon: Home,          href: '',                    color: '#c9a84c' },
      { name: 'My Listings',        icon: Building,      href: 'my-listings',         color: '#f59e0b' },
      { name: 'Add Listing',        icon: Plus,          href: 'listings/add',        color: '#34d399' },
      { name: 'Linked Owners',      icon: Landmark,      href: 'linked-owners',       color: '#60a5fa' },
      { name: 'Share & Track',      icon: Link2,         href: 'tracking',            color: '#a78bfa' },
      { name: 'QR Codes',           icon: QrCode,        href: 'qr-codes',            color: '#f472b6' },
      { name: 'Leads & Visitors',   icon: Eye,           href: 'leads',               color: '#38bdf8' },
      { name: 'Applications',       icon: FileText,      href: 'applications',        color: '#94a3b8' },
      { name: 'My Commissions',     icon: DollarSign,    href: 'commissions',         color: '#10b981' },
      { name: 'Payout History',     icon: Receipt,       href: 'payouts',             color: '#6ee7b7' },
      { name: 'Analytics',          icon: TrendingUp,    href: 'analytics',           color: '#f87171' },
      { name: 'Messages',           icon: MessageSquare, href: 'messages',            color: '#fb923c' },
    ],

    admin: [
      { name: 'Overview',           icon: Home,          href: '',                    color: '#c9a84c' },
      { name: 'Users',              icon: Users,         href: 'users',               color: '#60a5fa' },
      { name: 'Properties',         icon: Building,      href: 'properties',          color: '#f59e0b' },
      { name: 'Transactions',       icon: RefreshCw,     href: 'transactions',        color: '#6ee7b7' },
      { name: 'Commission',         icon: PieChart,      href: 'commission',          color: '#10b981' },
      { name: 'Payments',           icon: CreditCard,    href: 'payments',            color: '#f472b6' },
      { name: 'Contracts',          icon: BookOpen,      href: 'contracts',           color: '#a78bfa' },
      { name: 'Verification',       icon: ShieldCheck,   href: 'verification',        color: '#34d399' },
      { name: 'Alerts',             icon: AlertCircle,   href: 'alerts',              color: '#f87171' },
      { name: 'Settings',           icon: Settings,      href: 'settings',            color: '#fb923c' },
    ],
  };

  const roleConfig: Record<UserRole, { label: string; accent: string; sidebarBg: string; border: string }> = {
    tenant:   { label: 'Tenant',   accent: '#70c490', sidebarBg: 'linear-gradient(160deg,#0c1610 0%,#111a14 100%)', border: 'rgba(112,196,144,0.12)' },
    landlord: { label: 'Landlord', accent: '#c9a84c', sidebarBg: 'linear-gradient(160deg,#1a1507 0%,#1f1a0b 100%)', border: 'rgba(201,168,76,0.12)' },
    agent:    { label: 'Dalali',   accent: '#38bdf8', sidebarBg: 'linear-gradient(160deg,#05101a 0%,#0c1824 100%)', border: 'rgba(56,189,248,0.12)' },
    admin:    { label: 'Admin',    accent: '#f87171', sidebarBg: 'linear-gradient(160deg,#1a0505 0%,#1f0c0c 100%)', border: 'rgba(248,113,113,0.12)' },
  };

  const cfg = roleConfig[userType] ?? roleConfig.tenant;
  const dashboardRoot = `/dashboard/${userType}`;

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  // ── FIX 1: always use `pathname` from useLocation (not global `location`) ──
  // ── FIX 2: build absolute paths so active state is always correct          ──
  const getFullPath = (href: string): string => {
    if (href === '') return dashboardRoot;
    if (href.startsWith('/')) return href;           // already absolute (e.g. /properties)
    return `${dashboardRoot}/${href}`;
  };

  const isActive = (href: string): boolean => {
    const fullPath = getFullPath(href);
    if (href === '') {
      // Only exact match for Overview so it doesn't light up everything
      return pathname === fullPath || pathname === '/dashboard';
    }
    return pathname === fullPath || pathname.startsWith(fullPath + '/');
  };

  const initials =
    `${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}` || 'U';

  const navItems = navigation[userType] ?? navigation.tenant;

  const sectionMap: Record<UserRole, { label: string; items: string[] }[]> = {
    tenant: [
      { label: 'Explore',   items: ['Overview','Browse Properties','Saved Properties'] },
      { label: 'My Rental', items: ['My Applications','My Contract','Rent Payments','Payment History'] },
      { label: 'Connect',   items: ['Messages','Notifications'] },
    ],
    landlord: [
      { label: 'Properties', items: ['Overview','My Properties','Add Property'] },
      { label: 'Tenants',    items: ['Applications','My Tenants','Digital Contracts'] },
      { label: 'Finance',    items: ['Rent Collection','Payment Receipts','Commission Reports'] },
      { label: 'Insights',   items: ['Analytics','Messages'] },
    ],
    agent: [
      { label: 'Listings',   items: ['Overview','My Listings','Add Listing','Linked Owners'] },
      { label: 'Tracking',   items: ['Share & Track','QR Codes','Leads & Visitors','Applications'] },
      { label: 'Finance',    items: ['My Commissions','Payout History'] },
      { label: 'Insights',   items: ['Analytics','Messages'] },
    ],
    admin: [
      { label: 'Platform',   items: ['Overview','Users','Properties','Verification'] },
      { label: 'Operations', items: ['Transactions','Commission','Payments','Contracts'] },
      { label: 'Monitoring', items: ['Alerts','Settings'] },
    ],
  };

  const sections = sectionMap[userType] ?? sectionMap.tenant;

  const roleQuickLinks: Record<UserRole, {
    primary: string;
    primaryLabel: string;
    primaryIcon: any;
    secondary: string;
    secondaryLabel: string;
    secondaryIcon: any;
    settings?: string;
    settingsLabel?: string;
  }> = {
    tenant: {
      primary: getFullPath('messages'),
      primaryLabel: 'Messages',
      primaryIcon: MessageSquare,
      secondary: getFullPath('notifications'),
      secondaryLabel: 'Notifications',
      secondaryIcon: Bell,
      settings: getFullPath('settings'),
      settingsLabel: 'Account Settings',
    },
    landlord: {
      primary: getFullPath('tenants'),
      primaryLabel: 'Tenants',
      primaryIcon: Users,
      secondary: getFullPath('my-properties'),
      secondaryLabel: 'Properties',
      secondaryIcon: Building,
      settings: getFullPath('settings'),
      settingsLabel: 'Account Settings',
    },
    agent: {
      primary: getFullPath('leads'),
      primaryLabel: 'Leads',
      primaryIcon: Eye,
      secondary: getFullPath('tracking'),
      secondaryLabel: 'Tracking',
      secondaryIcon: Link2,
      settings: getFullPath('settings'),
      settingsLabel: 'Account Settings',
    },
    admin: {
      primary: getFullPath('verification'),
      primaryLabel: 'Verification',
      primaryIcon: ShieldCheck,
      secondary: getFullPath('alerts'),
      secondaryLabel: 'Alerts',
      secondaryIcon: AlertCircle,
      settings: getFullPath('settings'),
      settingsLabel: 'System Settings',
    },
  };

  const quickLinks = roleQuickLinks[userType] ?? roleQuickLinks.tenant;
  const settingsPath = quickLinks.settings ?? dashboardRoot;
  const PrimaryQuickIcon = quickLinks.primaryIcon;
  const SecondaryQuickIcon = quickLinks.secondaryIcon;
  const settingsLabel = quickLinks.settingsLabel ?? 'Account Settings';

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: '#080808',
      color: '#e8e4dc',
      minHeight: '100vh',
      display: 'flex',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --gold:    #c9a84c;
          --gold-lt: #e8c97a;
          --dark:    #080808;
          --dark-2:  #0e0e0e;
          --dark-3:  #141414;
          --cream:   #e8e4dc;
          --muted:   #7a7060;
          --accent:  ${cfg.accent};
          --border:  ${cfg.border};
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }

        .dl-sidebar {
          width: 256px;
          background: ${cfg.sidebarBg};
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          z-index: 100;
        }

        .dl-sidebar-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .dl-logo-bar {
          padding: 22px 24px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .dl-logo {
          text-decoration: none;
          display: flex;
          align-items: baseline;
          gap: 0;
        }

        .dl-logo-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--cream);
        }

        .dl-logo-dot {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px;
          font-weight: 300;
          color: var(--accent);
          line-height: 1;
          margin-left: 1px;
        }

        .dl-tagline {
          font-size: 9px;
          font-weight: 400;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
          margin-top: 2px;
        }

        .dl-close-btn {
          display: none;
          background: none; border: none;
          color: var(--muted); cursor: pointer; padding: 4px;
          transition: color 0.2s;
        }
        .dl-close-btn:hover { color: var(--cream); }

        .dl-user {
          padding: 18px 24px 16px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .dl-avatar {
          width: 38px; height: 38px;
          background: rgba(201,168,76,0.08);
          border: 1px solid rgba(201,168,76,0.22);
          border-radius: 2px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 15px; font-weight: 500;
          color: var(--gold);
          letter-spacing: 0.04em;
          margin-bottom: 11px;
          flex-shrink: 0;
        }

        .dl-user-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px; font-weight: 500;
          color: var(--cream); letter-spacing: 0.01em;
          margin-bottom: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .dl-user-email {
          font-size: 11px; font-weight: 300;
          color: var(--muted); margin-bottom: 10px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .dl-role-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--accent);
          border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
          padding: 4px 10px;
          background: color-mix(in srgb, var(--accent) 6%, transparent);
          border-radius: 2px;
        }

        .dl-role-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
          box-shadow: 0 0 6px var(--accent);
          animation: glow-pulse 2.5s ease-in-out infinite;
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }

        .dl-nav { padding: 8px 0 12px; }

        .dl-nav-section {
          padding: 14px 24px 4px;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(122,112,96,0.45);
          display: flex; align-items: center; gap: 8px;
        }

        .dl-nav-section::after {
          content: '';
          flex: 1; height: 1px;
          background: linear-gradient(to right, rgba(122,112,96,0.15), transparent);
        }

        .dl-nav-link {
          display: flex; align-items: center; gap: 11px;
          padding: 9px 24px;
          text-decoration: none;
          color: var(--muted);
          font-size: 12.5px; font-weight: 400;
          transition: all 0.18s;
          border-left: 2px solid transparent;
          position: relative;
        }

        .dl-nav-link:hover {
          color: var(--nav-color, var(--cream));
          background: var(--nav-hover-bg, rgba(255,255,255,0.03));
          border-left-color: var(--nav-color, rgba(201,168,76,0.3));
        }

        .dl-nav-link.active {
          color: var(--nav-color, var(--gold));
          background: var(--nav-active-bg, rgba(201,168,76,0.07));
          border-left-color: var(--nav-color, var(--gold));
        }

        .dl-nav-link-icon {
          width: 16px; height: 16px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .dl-nav-badge {
          margin-left: auto;
          font-size: 9px; font-weight: 600;
          letter-spacing: 0.04em;
          padding: 2px 6px;
          border-radius: 999px;
          background: rgba(248,113,113,0.15);
          color: #f87171;
          border: 1px solid rgba(248,113,113,0.2);
        }

        .dl-sidebar-footer {
          padding: 14px 24px 18px;
          border-top: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 1px;
          flex-shrink: 0;
        }

        .dl-sidebar-footer-btn {
          display: flex; align-items: center; gap: 11px;
          padding: 9px 0;
          background: none; border: none;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px; font-weight: 400;
          cursor: pointer; text-decoration: none;
          transition: color 0.18s; text-align: left;
          border-radius: 2px;
        }

        .dl-sidebar-footer-btn:hover { color: var(--cream); }
        .dl-sidebar-footer-btn.danger:hover { color: #e07070; }

        .dl-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          overflow: hidden;
          min-width: 0;
          background: var(--dark);
        }

        .dl-topbar {
          background: rgba(14,14,14,0.95);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 0 36px;
          height: 58px;
          display: flex; align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-shrink: 0;
          position: sticky;
          top: 0; z-index: 50;
          backdrop-filter: blur(12px);
        }

        .dl-topbar-left {
          display: flex; align-items: center; gap: 14px;
        }

        .dl-menu-toggle {
          display: none;
          background: none; border: 1px solid rgba(255,255,255,0.07);
          color: var(--muted); cursor: pointer;
          padding: 7px; border-radius: 4px;
          transition: all 0.2s;
        }
        .dl-menu-toggle:hover { color: var(--cream); border-color: rgba(255,255,255,0.15); }

        .dl-breadcrumb {
          display: flex; align-items: center; gap: 7px;
        }

        .dl-bc-home {
          font-size: 10px; font-weight: 400;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(122,112,96,0.5); text-decoration: none;
          transition: color 0.18s;
        }
        .dl-bc-home:hover { color: var(--muted); }

        .dl-bc-sep { color: rgba(122,112,96,0.25); display: flex; align-items: center; }

        .dl-bc-current {
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--accent);
        }

        .dl-topbar-right {
          display: flex; align-items: center; gap: 3px;
        }

        .dl-topbar-btn {
          width: 34px; height: 34px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--muted);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; text-decoration: none; border-radius: 4px;
          transition: all 0.18s;
        }
        .dl-topbar-btn:hover {
          color: var(--cream);
          border-color: rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
        }

        .dl-topbar-divider {
          width: 1px; height: 18px;
          background: rgba(255,255,255,0.06);
          margin: 0 4px;
        }

        .dl-topbar-role {
          display: flex; align-items: center; gap: 6px;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--accent);
          padding: 4px 10px;
          border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
          background: color-mix(in srgb, var(--accent) 5%, transparent);
          border-radius: 2px;
        }

        .dl-content {
          flex: 1;
          padding: 36px 40px;
          overflow-y: auto;
        }

        .dl-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.75);
          z-index: 90;
          backdrop-filter: blur(6px);
        }

        @media (max-width: 960px) {
          .dl-sidebar {
            position: fixed;
            top: 0; left: 0; bottom: 0;
            transform: translateX(-100%);
            box-shadow: 8px 0 40px rgba(0,0,0,0.6);
          }
          .dl-sidebar.open { transform: translateX(0); }
          .dl-close-btn { display: flex; }
          .dl-menu-toggle { display: flex; }
          .dl-topbar { padding: 0 20px; }
          .dl-content { padding: 24px 20px; }
          .dl-topbar-role { display: none; }
        }
      `}</style>

      {sidebarOpen && (
        <div className="dl-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══ SIDEBAR ══ */}
      <aside className={`dl-sidebar${sidebarOpen ? ' open' : ''}`}>

        <div className="dl-logo-bar">
          <div>
            <Link to="/" className="dl-logo">
              <span className="dl-logo-text">OWERU</span>
              <span className="dl-logo-dot">.</span>
            </Link>
            <div className="dl-tagline">Real Estate Management</div>
          </div>
          <button className="dl-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={15} />
          </button>
        </div>

        <div className="dl-user">
          <div className="dl-avatar">{initials}</div>
          <div className="dl-user-name">{user?.firstName} {user?.lastName}</div>
          <div className="dl-user-email">{user?.email}</div>
          <div className="dl-role-tag">
            <span className="dl-role-dot" />
            {cfg.label}
          </div>
        </div>

        <div className="dl-sidebar-scroll">
          <nav className="dl-nav">
            {sections.map((section) => {
              const sectionItems = navItems.filter((item) =>
                section.items.includes(item.name)
              );
              if (!sectionItems.length) return null;
              return (
                <div key={section.label}>
                  <div className="dl-nav-section">{section.label}</div>
                  {sectionItems.map((item) => (
                    <Link
                      key={item.name}
                      // ── FIX: always navigate to a fully-resolved absolute path ──
                      to={getFullPath(item.href)}
                      className={`dl-nav-link${isActive(item.href) ? ' active' : ''}`}
                      onClick={() => setSidebarOpen(false)}
                      style={{
                        '--nav-color': item.color,
                        '--nav-hover-bg': `${item.color}10`,
                        '--nav-active-bg': `${item.color}18`,
                      } as React.CSSProperties}
                    >
                      <span className="dl-nav-link-icon" style={{ color: isActive(item.href) ? item.color : 'var(--muted)' }}>
                        <item.icon size={14} />
                      </span>
                      {item.name}
                      {item.badge && (
                        <span className="dl-nav-badge">{item.badge}</span>
                      )}
                    </Link>
                  ))}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="dl-sidebar-footer">
          <Link to={settingsPath} className="dl-sidebar-footer-btn" onClick={() => setSidebarOpen(false)}>
            <Settings size={13} style={{ color: 'var(--muted)' }} />
            {settingsLabel}
          </Link>
          <button className="dl-sidebar-footer-btn danger" onClick={handleLogout}>
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="dl-main">

        <header className="dl-topbar">
          <div className="dl-topbar-left">
            <button className="dl-menu-toggle" onClick={() => setSidebarOpen(true)}>
              <Menu size={16} />
            </button>

            <nav className="dl-breadcrumb">
              <Link to={`/dashboard/${userType}`} className="dl-bc-home">Dashboard</Link>
              {title && title !== 'Dashboard' && (
                <>
                  <ChevronRight size={9} className="dl-bc-sep" />
                  <span className="dl-bc-current">{title}</span>
                </>
              )}
            </nav>
          </div>

          <div className="dl-topbar-right">
            <span className="dl-topbar-role">
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 5px var(--accent)',
                flexShrink: 0,
              }} />
              {cfg.label}
            </span>

            <div className="dl-topbar-divider" />

            <Link to={quickLinks.primary} className="dl-topbar-btn" title={quickLinks.primaryLabel}>
              <PrimaryQuickIcon size={14} />
            </Link>
            <Link to={quickLinks.secondary} className="dl-topbar-btn" title={quickLinks.secondaryLabel}>
              <SecondaryQuickIcon size={14} />
            </Link>

            <div className="dl-topbar-divider" />

            <Link to={settingsPath} className="dl-topbar-btn" title="Settings">
              <Settings size={14} />
            </Link>
            <button
              className="dl-topbar-btn danger"
              onClick={handleLogout}
              title="Sign out"
              style={{ color: 'rgba(224,112,112,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e07070')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(224,112,112,0.5)')}
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        <div className="dl-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
