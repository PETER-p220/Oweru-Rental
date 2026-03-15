import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Search, Bell, Settings, LogOut, Menu, Building, Users,
  TrendingUp, DollarSign, Star, BarChart3, FileText, Plus, X, ChevronRight
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  user?: any;
}

type UserRole = 'tenant' | 'landlord' | 'agent';

const DashboardLayout = ({ children, title, user }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userType: UserRole = user?.userType || user?.user_type || 'tenant';
  console.log('DashboardLayout userType:', userType, 'user:', user); // Debug log
  console.log('User fields:', Object.keys(user || {})); // Debug: Show all user fields

  // Role-specific navigation with unique items and styling
  const navigation = {
    tenant: [
      { name: 'Dashboard',         icon: Home,       href: '/dashboard', color: '#70c490' },
      { name: 'Browse Properties', icon: Search,     href: '/properties', color: '#3b82f6' },
      { name: 'Saved Properties',  icon: Star,       href: '/dashboard/saved-properties', color: '#f59e0b' },
      { name: 'Applications',      icon: FileText,   href: '/dashboard/applications', color: '#8b5cf6' },
      { name: 'Messages',          icon: Bell,       href: '/dashboard/messages', color: '#ef4444' },
    ],
    landlord: [
      { name: 'Dashboard',         icon: Home,       href: '/dashboard', color: '#10b981' },
      { name: 'My Properties',     icon: Building,   href: '/dashboard/my-properties', color: '#f59e0b' },
      { name: 'Add Property',      icon: Plus,       href: '/dashboard/properties/add', color: '#22c55e' },
      { name: 'Applications',      icon: FileText,   href: '/dashboard/applications', color: '#3b82f6' },
      { name: 'Tenants',           icon: Users,      href: '/dashboard/tenants', color: '#8b5cf6' },
      { name: 'Analytics',         icon: BarChart3,  href: '/dashboard/analytics', color: '#ef4444' },
    ],
    agent: [
      { name: 'Dashboard',         icon: Home,       href: '/dashboard', color: '#06b6d4' },
      { name: 'My Listings',       icon: Building,   href: '/dashboard/my-listings', color: '#f59e0b' },
      { name: 'Add Listing',       icon: Plus,       href: '/dashboard/listings/add', color: '#10b981' },
      { name: 'Leads',             icon: Users,      href: '/dashboard/leads', color: '#8b5cf6' },
      { name: 'Commissions',       icon: DollarSign, href: '/dashboard/commissions', color: '#22c55e' },
      { name: 'Analytics',         icon: TrendingUp, href: '/dashboard/analytics', color: '#ef4444' },
    ],
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/api/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== '/dashboard' && location.pathname.startsWith(path));

  const initials =
    `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}` || 'U';

  const roleLabelMap: Record<UserRole, string> = { tenant: 'Tenant', landlord: 'Landlord', agent: 'Agent' };

  return (
    <div style={{
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      background: '#0a0a0a',
      color: '#f5f0e8',
      minHeight: '100vh',
      display: 'flex',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --gold: #c9a84c;
          --dark: #0a0a0a;
          --dark-2: #111;
          --cream: #f5f0e8;
          --muted: #8a8070;
          --border: rgba(201,168,76,0.12);
        }

        /* Role-specific sidebar themes */
        .dl-sidebar.tenant {
          background: linear-gradient(135deg, #0f1419 0%, #1a1f29 100%);
          border-right: 1px solid rgba(112,196,144,0.15);
        }

        .dl-sidebar.landlord {
          background: linear-gradient(135deg, #0f1a14 0%, #1a291f 100%);
          border-right: 1px solid rgba(245,158,11,0.15);
        }

        .dl-sidebar.agent {
          background: linear-gradient(135deg, #0f141a 0%, #1a1f29 100%);
          border-right: 1px solid rgba(6,182,212,0.15);
        }

        /* ── Sidebar ── */
        .dl-sidebar {
          width: 240px;
          background: var(--dark-2);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          transition: transform 0.3s ease;
          z-index: 100;
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
          gap: 1px;
        }

        .dl-logo-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 300;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--cream);
        }

        .dl-logo-dot { color: var(--gold); font-size: 18px; }

        .dl-close-btn {
          display: none;
          background: none; border: none;
          color: var(--muted); cursor: pointer;
          padding: 4px;
        }

        .dl-user {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .dl-avatar {
          width: 36px; height: 36px;
          background: rgba(201,168,76,0.1);
          border: 1px solid rgba(201,168,76,0.25);
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500;
          color: var(--gold);
          letter-spacing: 0.05em;
          margin-bottom: 10px;
        }

        .dl-user-name {
          font-size: 15px; font-weight: 400;
          color: var(--cream); letter-spacing: -0.01em;
          margin-bottom: 3px;
        }

        .dl-user-email {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 300;
          color: var(--muted); margin-bottom: 8px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .dl-role-tag {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--gold);
          border: 1px solid rgba(201,168,76,0.2);
          padding: 3px 9px;
          background: rgba(201,168,76,0.05);
        }

        .dl-nav {
          flex: 1;
          padding: 12px 0;
          overflow-y: auto;
        }

        .dl-nav-section {
          padding: 8px 24px 4px;
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(138,128,112,0.4);
        }

        .dl-nav-link {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 24px;
          text-decoration: none;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 400;
          transition: all 0.2s;
          border-left: 2px solid transparent;
        }

        .dl-nav-link:hover {
          color: var(--nav-color, var(--cream));
          background: var(--nav-hover-bg, rgba(201,168,76,0.04));
          border-left-color: var(--nav-color, rgba(201,168,76,0.3));
        }

        .dl-nav-link.active {
          color: var(--nav-color, var(--gold));
          background: var(--nav-active-bg, rgba(201,168,76,0.07));
          border-left-color: var(--nav-color, var(--gold));
        }

        .dl-sidebar-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 2px;
          flex-shrink: 0;
        }

        .dl-sidebar-footer-btn {
          display: flex; align-items: center; gap: 11px;
          padding: 9px 0;
          background: none; border: none;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 400;
          cursor: pointer; text-decoration: none;
          transition: color 0.2s; text-align: left;
        }

        .dl-sidebar-footer-btn:hover { color: var(--cream); }
        .dl-sidebar-footer-btn.danger:hover { color: #e07070; }

        /* ── Main ── */
        .dl-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          overflow: hidden;
          min-width: 0;
        }

        .dl-topbar {
          background: var(--dark-2);
          border-bottom: 1px solid var(--border);
          padding: 0 32px;
          height: 60px;
          display: flex; align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-shrink: 0;
          position: sticky;
          top: 0; z-index: 50;
        }

        .dl-topbar-left {
          display: flex; align-items: center; gap: 16px;
        }

        .dl-menu-toggle {
          display: none;
          background: none; border: none;
          color: var(--muted); cursor: pointer;
          padding: 6px; transition: color 0.2s;
        }

        .dl-menu-toggle:hover { color: var(--cream); }

        .dl-breadcrumb {
          display: flex; align-items: center; gap: 6px;
        }

        .dl-breadcrumb-home {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 400;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(138,128,112,0.5); text-decoration: none;
        }

        .dl-breadcrumb-sep { color: rgba(138,128,112,0.3); }

        .dl-breadcrumb-current {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--gold);
        }

        .dl-topbar-right {
          display: flex; align-items: center; gap: 4px;
        }

        .dl-topbar-btn {
          width: 34px; height: 34px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--muted);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; text-decoration: none;
          transition: all 0.2s;
        }

        .dl-topbar-btn:hover {
          color: var(--cream);
          border-color: rgba(201,168,76,0.2);
          background: rgba(201,168,76,0.05);
        }

        /* ── Content area — NO extra top padding ── */
        .dl-content {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
          background: var(--dark);
        }

        /* ── Mobile overlay ── */
        .dl-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 90;
          backdrop-filter: blur(4px);
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .dl-sidebar {
            position: fixed;
            top: 0; left: 0; bottom: 0;
            transform: translateX(-100%);
          }
          .dl-sidebar.open { transform: translateX(0); }
          .dl-close-btn { display: flex; }
          .dl-menu-toggle { display: flex; }
          .dl-content { padding: 20px; }
          .dl-topbar { padding: 0 20px; }
        }
      `}</style>

      {/* Mobile overlay — only rendered when open */}
      {sidebarOpen && (
        <div className="dl-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`dl-sidebar ${userType}${sidebarOpen ? ' open' : ''}`}>
        <div className="dl-logo-bar">
          <Link to="/" className="dl-logo">
            <span className="dl-logo-text">OWERU</span>
            <span className="dl-logo-dot">.</span>
          </Link>
          <button className="dl-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="dl-user">
          <div className="dl-avatar">{initials}</div>
          <div className="dl-user-name">{user?.firstName} {user?.lastName}</div>
          <div className="dl-user-email">{user?.email}</div>
          <div className="dl-role-tag">
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
            {roleLabelMap[userType] || userType}
          </div>
        </div>

        <nav className="dl-nav">
          <div className="dl-nav-section">Navigation</div>
          {(navigation[userType] || []).map((item) => {
            console.log('Rendering navigation item:', item.name, 'href:', item.href, 'userType:', userType);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`dl-nav-link${isActive(item.href) ? ' active' : ''}`}
                onClick={() => setSidebarOpen(false)}
                style={{
                  '--nav-color': item.color,
                  '--nav-hover-bg': `${item.color}15`,
                  '--nav-active-bg': `${item.color}25`,
                } as React.CSSProperties}
              >
                <item.icon size={14} style={{ color: 'var(--nav-color)' }} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="dl-sidebar-footer">
          <Link to="/settings" className="dl-sidebar-footer-btn">
            <Settings size={14} />
            Settings
          </Link>
          <button className="dl-sidebar-footer-btn danger" onClick={handleLogout}>
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dl-main">
        <header className="dl-topbar">
          <div className="dl-topbar-left">
            <button className="dl-menu-toggle" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <div className="dl-breadcrumb">
              <Link to="/dashboard" className="dl-breadcrumb-home">Dashboard</Link>
              {title && title !== 'Dashboard' && (
                <>
                  <ChevronRight size={10} className="dl-breadcrumb-sep" />
                  <span className="dl-breadcrumb-current">{title}</span>
                </>
              )}
            </div>
          </div>

          <div className="dl-topbar-right">
            <Link to="/messages" className="dl-topbar-btn" title="Messages">
              <Bell size={15} />
            </Link>
            <Link to="/settings" className="dl-topbar-btn" title="Settings">
              <Settings size={15} />
            </Link>
            <button
              className="dl-topbar-btn"
              onClick={handleLogout}
              title="Sign out"
              style={{ borderColor: 'rgba(224,112,112,0.15)' }}
            >
              <LogOut size={15} />
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