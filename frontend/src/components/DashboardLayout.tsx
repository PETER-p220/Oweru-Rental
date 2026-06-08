import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home, Search, Bell, Settings, LogOut, Menu, Building, Users,
  TrendingUp, DollarSign, Star, BarChart3, FileText, Plus, X,
  ChevronRight, QrCode, Link2, ShieldCheck, CreditCard, Wallet,
  Receipt, MessageSquare, AlertCircle, PieChart,
  RefreshCw, BookOpen, Landmark, Eye,
  Calendar, Hotel, Briefcase,
} from 'lucide-react';
import LOGO from '../assets/IMG-20260326-WA0006.jpg';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export type UserRole = 'tenant' | 'landlord' | 'agent' | 'admin' | 'bnb_owner' | 'commercial';

// ── Pure slate/white token system — no accent colors in nav
const T = {
  // Page & surfaces
  pageBg:      '#F1F5F9',   // slate-100 — page background
  sidebarBg:   '#0F172A',   // slate-900 — sidebar body
  headerBg:    '#1E293B',   // slate-800 — topbar + sidebar logo bar
  cardBg:      '#FFFFFF',

  // Text on light surfaces
  text:        '#0F172A',   // slate-900
  textSub:     '#475569',   // slate-600
  textMuted:   '#94A3B8',   // slate-400

  // Text on dark surfaces (sidebar)
  textOnDark:  '#F1F5F9',   // slate-100
  textOnDarkM: '#64748B',   // slate-500
  textOnDarkS: '#94A3B8',   // slate-400

  // Borders
  borderDark:  '#1E293B',   // slate-800 — inside sidebar
  borderLight: '#E2E8F0',   // slate-200 — inside page

  // Slate scale
  slate200:    '#E2E8F0',
  slate300:    '#CBD5E1',
  slate400:    '#94A3B8',
  slate500:    '#64748B',
  slate600:    '#475569',
  slate700:    '#334155',
  slate800:    '#1E293B',
  slate900:    '#0F172A',

  // Gold — CTA & active indicator ONLY
  gold:        '#C89128',
  goldGlow:    '0 0 8px rgba(200,145,40,0.35)',
};

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate    = useNavigate();
  const { pathname } = useLocation();
  const { user }    = useAuth();

  const userType: UserRole = (
    user?.userType || user?.user_type || user?.role || user?.userRole || 'tenant'
  ) as UserRole;

  // ── Navigation items — all icons use inherited slate color (no per-item accent)
  const navigation: Record<UserRole, { name: string; icon: any; href: string; badge?: string }[]> = {
    tenant: [
      { name: 'Overview',          icon: Home,          href: ''                             },
      { name: 'Browse Properties', icon: Search,        href: '/dashboard/tenant/properties' },
      { name: 'My Applications',   icon: FileText,      href: 'applications'                 },
      { name: 'Saved Properties',  icon: Star,          href: 'saved-properties'             },
      { name: 'Digital Contracts', icon: FileText,      href: 'digital-contracts'            },
      { name: 'Rent Payments',     icon: CreditCard,    href: 'payments'                     },
      { name: 'Payment History',   icon: Receipt,       href: 'payment-history'              },
      { name: 'Messages',          icon: MessageSquare, href: 'messages'                     },
      { name: 'Notifications',     icon: Bell,          href: 'notifications'                },
    ],
    landlord: [
      { name: 'Overview',           icon: Home,          href: ''               },
      { name: 'My Properties',      icon: Building,      href: 'my-properties'  },
      { name: 'Add Property',       icon: Plus,          href: 'add-property'   },
      { name: 'Applications',       icon: FileText,      href: 'applications'   },
      { name: 'My Tenants',         icon: Users,         href: 'tenants'        },
      { name: 'Digital Contracts',  icon: BookOpen,      href: 'digital-contracts' },
      { name: 'Rent Collection',    icon: Wallet,        href: 'rent-collection'},
      { name: 'Payment Receipts',   icon: Receipt,       href: 'receipts'       },
      { name: 'Commission Reports', icon: PieChart,      href: 'commissions'    },
      { name: 'Analytics',          icon: BarChart3,     href: 'analytics'      },
      { name: 'Messages',           icon: MessageSquare, href: 'messages'       },
    ],
    agent: [
      { name: 'Overview',         icon: Home,          href: ''              },
      { name: 'My Listings',      icon: Building,      href: 'my-listings'   },
      { name: 'Add Listing',      icon: Plus,          href: 'listings/add'  },
      { name: 'Linked Owners',    icon: Landmark,      href: 'linked-owners' },
      { name: 'Share & Track',    icon: Link2,         href: 'tracking'      },
      { name: 'QR Codes',         icon: QrCode,        href: 'qr-codes'      },
      { name: 'Leads & Visitors', icon: Eye,           href: 'leads'         },
      { name: 'Applications',     icon: FileText,      href: 'applications'  },
      { name: 'My Commissions',   icon: DollarSign,    href: 'commissions'   },
      { name: 'Payout History',   icon: Receipt,       href: 'payouts'       },
      { name: 'Analytics',        icon: TrendingUp,    href: 'analytics'     },
      { name: 'Messages',         icon: MessageSquare, href: 'messages'      },
    ],
    admin: [
      { name: 'Overview',             icon: Home,        href: ''                 },
      { name: 'Users',                icon: Users,       href: 'users'            },
      { name: 'Properties',           icon: Building,    href: 'properties'       },
      { name: 'Add Oweru Properties', icon: Plus,        href: 'oweru-properties' },
      { name: 'BNB Properties',       icon: Hotel,       href: 'bnb-properties'   },
      { name: 'Transactions',         icon: RefreshCw,   href: 'transactions'     },
      { name: 'Commission',           icon: PieChart,    href: 'commission'       },
      { name: 'Payments',             icon: CreditCard,  href: 'payments'         },
      { name: 'Contracts',            icon: BookOpen,    href: 'contracts'        },
      { name: 'Verification',         icon: ShieldCheck, href: 'verification'     },
      { name: 'Alerts',               icon: AlertCircle, href: 'alerts'           },
      { name: 'Settings',             icon: Settings,    href: 'settings'         },
    ],
    bnb_owner: [
      { name: 'Overview',          icon: Home,          href: ''                    },
      { name: 'My BNB Properties', icon: Hotel,         href: 'bnb-properties'      },
      { name: 'Add Property',      icon: Plus,          href: 'bnb-properties/add'  },
      { name: 'Bookings',          icon: Calendar,      href: 'bnb-bookings'        },
      { name: 'Reviews',           icon: Star,          href: 'bnb-reviews'         },
      { name: 'Analytics',         icon: BarChart3,     href: 'bnb-analytics'       },
      { name: 'Messages',          icon: MessageSquare, href: 'messages'            },
      { name: 'Settings',          icon: Settings,      href: 'settings'            },
    ],
    commercial: [
      { name: 'Overview',      icon: Home,          href: ''               },
      { name: 'My Properties', icon: Building,      href: 'my-properties'  },
      { name: 'Add Property',  icon: Plus,          href: 'properties/add' },
      { name: 'Applications',  icon: FileText,      href: 'applications'   },
      { name: 'Analytics',     icon: BarChart3,     href: 'analytics'      },
      { name: 'Reports',       icon: PieChart,      href: 'reports'        },
      { name: 'Profile',       icon: Briefcase,     href: 'profile'        },
      { name: 'Settings',      icon: Settings,      href: 'settings'       },
    ],
  };

  // Role config — label only (no per-role accent colors)
  const roleLabel: Record<UserRole, string> = {
    tenant: 'Tenant', landlord: 'Landlord', agent: 'Agent',
    admin: 'Admin', bnb_owner: 'BNB Owner', commercial: 'Commercial',
  };

  const sectionMap: Record<UserRole, { label: string; items: string[] }[]> = {
    tenant: [
      { label: 'Explore',   items: ['Overview','Browse Properties','Saved Properties'] },
      { label: 'My Rental', items: ['My Applications','Digital Contracts','Rent Payments','Payment History'] },
      { label: 'Connect',   items: ['Messages','Notifications'] },
    ],
    landlord: [
      { label: 'Properties', items: ['Overview','My Properties','Add Property'] },
      { label: 'Tenants',    items: ['Applications','My Tenants','Digital Contracts'] },
      { label: 'Finance',    items: ['Rent Collection','Payment Receipts','Commission Reports'] },
      { label: 'Insights',   items: ['Analytics','Messages'] },
    ],
    agent: [
      { label: 'Listings', items: ['Overview','My Listings','Add Listing','Linked Owners'] },
      { label: 'Tracking', items: ['Share & Track','QR Codes','Leads & Visitors','Applications'] },
      { label: 'Finance',  items: ['My Commissions','Payout History'] },
      { label: 'Insights', items: ['Analytics','Messages'] },
    ],
    admin: [
      { label: 'Platform',   items: ['Overview','Users','Properties','Verification','Add Oweru Properties'] },
      { label: 'Operations', items: ['Transactions','Commission','Payments','Contracts','BNB Properties'] },
      { label: 'Monitoring', items: ['Alerts','Settings'] },
    ],
    bnb_owner: [
      { label: 'Properties', items: ['Overview','My BNB Properties','Add Property'] },
      { label: 'Bookings',   items: ['Bookings','Reviews'] },
      { label: 'Insights',   items: ['Analytics','Messages','Settings'] },
    ],
    commercial: [
      { label: 'Properties', items: ['Overview','My Properties','Add Property'] },
      { label: 'Business',   items: ['Applications','Analytics','Reports'] },
      { label: 'Account',    items: ['Profile','Settings'] },
    ],
  };

  const dashboardRoot = `/dashboard/${userType}`;
  const navItems      = navigation[userType] ?? navigation.tenant;
  const sections      = sectionMap[userType]  ?? sectionMap.tenant;
  const label         = roleLabel[userType]   ?? 'User';

  const getFullPath = (href: string) => {
    if (href === '') return dashboardRoot;
    if (href.startsWith('/')) return href;
    return `${dashboardRoot}/${href}`;
  };

  const isActive = (href: string) => {
    const fp = getFullPath(href);
    if (href === '') return pathname === fp || pathname === '/dashboard';
    return pathname === fp || pathname.startsWith(fp + '/');
  };

  const initials =
    `${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}` || 'U';

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
      });
    } catch (e) { console.error('Logout error:', e); }
    finally { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.pageBg, color: T.text, minHeight: '100vh', display: 'flex' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes dot-pulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.slate700}; border-radius: 4px; }

        /* ══ SIDEBAR ══ */
        .dl-sidebar {
          width: 244px; flex-shrink: 0;
          background: ${T.sidebarBg};
          border-right: 1px solid ${T.borderDark};
          display: flex; flex-direction: column;
          position: sticky; top: 0; height: 100vh;
          overflow: hidden;
          transition: transform 0.30s cubic-bezier(0.22,1,0.36,1);
          z-index: 100;
        }
        .dl-sidebar-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; }

        /* Logo bar — slate-800 strip at top of sidebar */
        .dl-logo-bar {
          padding: 16px 18px;
          background: ${T.headerBg};
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .dl-close-btn {
          display: none; background: none; border: none; padding: 6px;
          color: ${T.textOnDarkM}; cursor: pointer; border-radius: 6px; align-items: center;
          transition: background 0.15s, color 0.15s;
        }
        .dl-close-btn:hover { background: rgba(255,255,255,0.08); color: ${T.textOnDark}; }

        /* User block */
        .dl-user {
          padding: 14px 18px 13px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .dl-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: ${T.slate700}; border: 1.5px solid ${T.slate600};
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; color: #fff; margin-bottom: 10px;
          letter-spacing: -0.01em;
        }
        .dl-user-name {
          font-size: 13px; font-weight: 700; color: ${T.textOnDark};
          margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .dl-user-email {
          font-size: 11px; color: ${T.textOnDarkM};
          margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        /* Role badge — pure slate, no accent bg */
        .dl-role-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
          padding: 3px 9px; border-radius: 4px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          color: ${T.slate300};
        }
        .dl-role-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: ${T.gold}; flex-shrink: 0;
          animation: dot-pulse 2.5s ease-in-out infinite;
          box-shadow: 0 0 6px rgba(200,145,40,0.50);
        }

        /* Nav */
        .dl-nav { padding: 4px 0 8px; }
        .dl-nav-section {
          padding: 12px 18px 5px;
          font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
          color: ${T.slate500};
          display: flex; align-items: center; gap: 8px;
        }
        .dl-nav-section::after { content:''; flex:1; height:1px; background:rgba(255,255,255,0.06); }

        .dl-nav-link {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 18px; text-decoration: none;
          color: ${T.slate400};
          font-size: 13px; font-weight: 500;
          border-left: 2px solid transparent;
          transition: background 0.12s, color 0.12s, border-left-color 0.12s;
        }
        .dl-nav-link:hover {
          color: ${T.textOnDark};
          background: rgba(255,255,255,0.05);
          border-left-color: ${T.slate500};
        }
        /* Active — white text on slate-700 bg, gold left border */
        .dl-nav-link.active {
          color: #fff;
          background: ${T.slate700};
          border-left-color: ${T.gold};
          font-weight: 700;
        }
        .dl-nav-link.active .dl-nav-icon { color: ${T.gold}; }
        .dl-nav-icon { width:15px; height:15px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        .dl-nav-badge {
          margin-left: auto; font-size: 9px; font-weight: 700; padding: 2px 7px;
          border-radius: 999px; background: rgba(220,38,38,0.14); color: #F87171;
          border: 1px solid rgba(220,38,38,0.22);
        }

        /* Sidebar footer */
        .dl-sidebar-footer {
          padding: 10px 18px 14px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column; gap: 1px; flex-shrink: 0;
        }
        .dl-footer-btn {
          display: flex; align-items: center; gap: 9px; padding: 9px 4px;
          background: none; border: none; color: ${T.slate500};
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          cursor: pointer; text-decoration: none; text-align: left; border-radius: 6px;
          transition: color 0.15s, background 0.15s;
        }
        .dl-footer-btn:hover { color: ${T.textOnDark}; background: rgba(255,255,255,0.05); }
        .dl-footer-btn.danger { color: ${T.slate500}; }
        .dl-footer-btn.danger:hover { color: #FCA5A5; background: rgba(220,38,38,0.07); }

        /* ══ MAIN ══ */
        .dl-main { flex:1; display:flex; flex-direction:column; min-height:100vh; overflow:hidden; min-width:0; background:${T.pageBg}; }

        /* Topbar — slate-800 */
        .dl-topbar {
          background: ${T.headerBg};
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 0 24px; height: 54px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          flex-shrink: 0; position: sticky; top: 0; z-index: 50;
        }
        .dl-topbar-left { display:flex; align-items:center; gap:10px; }

        .dl-menu-toggle {
          display: none; background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.10);
          color: ${T.textOnDark}; cursor: pointer; padding: 7px; border-radius: 8px;
          align-items: center; justify-content: center; transition: background 0.15s;
        }
        .dl-menu-toggle:hover { background: rgba(255,255,255,0.12); }

        /* Breadcrumb */
        .dl-breadcrumb { display:flex; align-items:center; gap:5px; }
        .dl-bc-home {
          font-size:11px; font-weight:500; letter-spacing:0.10em; text-transform:uppercase;
          color:${T.slate500}; text-decoration:none; transition:color 0.15s;
        }
        .dl-bc-home:hover { color:${T.textOnDark}; }
        .dl-bc-sep { color:${T.slate600}; display:flex; align-items:center; }
        .dl-bc-current { font-size:11px; font-weight:700; letter-spacing:0.10em; text-transform:uppercase; color:${T.slate300}; }

        .dl-topbar-right { display:flex; align-items:center; gap:2px; }
        .dl-topbar-divider { width:1px; height:16px; background:${T.slate700}; margin:0 4px; }

        /* Role pill — slate, no accent bg */
        .dl-topbar-role {
          display:flex; align-items:center; gap:6px;
          font-size:9px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase;
          color:${T.slate300}; padding:4px 10px;
          border:1px solid rgba(255,255,255,0.10);
          background:rgba(255,255,255,0.06);
          border-radius:4px; white-space:nowrap;
        }

        /* Topbar icon buttons */
        .dl-topbar-btn {
          width:34px; height:34px; background:transparent;
          border:1px solid transparent; color:${T.slate500};
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; text-decoration:none; border-radius:8px;
          transition: color 0.15s, background 0.15s, border-color 0.15s;
        }
        .dl-topbar-btn:hover { color:${T.textOnDark}; background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.10); }
        .dl-logout-btn { color: rgba(248,113,113,0.45); }
        .dl-logout-btn:hover { color:#FCA5A5 !important; background:rgba(220,38,38,0.08) !important; border-color:rgba(220,38,38,0.20) !important; }

        /* Content */
        .dl-content { flex:1; padding:28px 32px; overflow-y:auto; overflow-x:hidden; }

        /* Overlay */
        .dl-overlay { position:fixed; inset:0; background:rgba(10,16,28,0.72); z-index:90; backdrop-filter:blur(4px); }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .dl-sidebar {
            position: fixed; top:0; left:0; bottom:0;
            transform: translateX(-100%);
            box-shadow: 8px 0 32px rgba(0,0,0,0.45);
          }
          .dl-sidebar.open { transform: translateX(0); }
          .dl-close-btn  { display: flex; }
          .dl-menu-toggle { display: flex; }
          .dl-topbar { padding: 0 18px; }
          .dl-content { padding: 22px 18px; }
          .dl-topbar-role { display: none; }
        }
        @media (max-width: 768px) {
          .dl-sidebar { width: min(256px, 84vw); }
          .dl-topbar { padding: 0 14px; height: 50px; }
          .dl-content { padding: 16px 14px; }
          .dl-topbar-divider { display: none; }
          .dl-bc-current { display: none; }
        }
        @media (max-width: 480px) {
          .dl-topbar { padding: 0 10px; height: 46px; }
          .dl-content { padding: 12px 10px; }
          .dl-topbar-btn { width: 30px; height: 30px; }
        }
      `}</style>

      {sidebarOpen && <div className="dl-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ══ SIDEBAR ══ */}
      <aside className={`dl-sidebar${sidebarOpen ? ' open' : ''}`}>

        {/* Logo bar — slate-800 */}
        <div className="dl-logo-bar">
          <div>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src={LOGO} alt="OWERU" style={{ height: 22, width: 'auto' }} />
            </Link>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.slate500, marginTop: 4 }}>
              Real Estate Management
            </div>
          </div>
          <button className="dl-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={14} />
          </button>
        </div>

        {/* User block */}
        <div className="dl-user">
          <div className="dl-avatar">{initials}</div>
          <div className="dl-user-name">{user?.firstName} {user?.lastName}</div>
          <div className="dl-user-email">{user?.email}</div>
          <div className="dl-role-tag">
            <span className="dl-role-dot" />
            {label}
          </div>
        </div>

        {/* Nav */}
        <div className="dl-sidebar-scroll">
          <nav className="dl-nav">
            {sections.map(section => {
              const items = navItems.filter(i => section.items.includes(i.name));
              if (!items.length) return null;
              return (
                <div key={section.label}>
                  <div className="dl-nav-section">{section.label}</div>
                  {items.map(item => (
                    <Link
                      key={item.name}
                      to={getFullPath(item.href)}
                      className={`dl-nav-link${isActive(item.href) ? ' active' : ''}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="dl-nav-icon">
                        <item.icon size={14} />
                      </span>
                      {item.name}
                      {item.badge && <span className="dl-nav-badge">{item.badge}</span>}
                    </Link>
                  ))}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="dl-sidebar-footer">
          <Link to={`${dashboardRoot}/settings`} className="dl-footer-btn" onClick={() => setSidebarOpen(false)}>
            <Settings size={13} style={{ flexShrink: 0 }} />
            Account Settings
          </Link>
          <button className="dl-footer-btn danger" onClick={handleLogout}>
            <LogOut size={13} style={{ flexShrink: 0 }} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="dl-main">

        {/* Topbar — slate-800 */}
        <header className="dl-topbar">
          <div className="dl-topbar-left">
            <button className="dl-menu-toggle" onClick={() => setSidebarOpen(true)}>
              <Menu size={15} />
            </button>
            <nav className="dl-breadcrumb">
              <Link to={dashboardRoot} className="dl-bc-home">Dashboard</Link>
              {title && title !== 'Dashboard' && (
                <>
                  <ChevronRight size={9} className="dl-bc-sep" style={{ color: T.slate600 }} />
                  <span className="dl-bc-current">{title}</span>
                </>
              )}
            </nav>
          </div>

          <div className="dl-topbar-right">
            {/* Role pill — slate only */}
            <span className="dl-topbar-role">
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.gold, boxShadow: T.goldGlow, flexShrink: 0, animation: 'dot-pulse 2.5s ease-in-out infinite' }} />
              {label}
            </span>
            <div className="dl-topbar-divider" />
            <Link to={`${dashboardRoot}/messages`} className="dl-topbar-btn" title="Messages">
              <MessageSquare size={14} />
            </Link>
            <Link to={`${dashboardRoot}/notifications`} className="dl-topbar-btn" title="Notifications">
              <Bell size={14} />
            </Link>
            <div className="dl-topbar-divider" />
            <Link to={`${dashboardRoot}/settings`} className="dl-topbar-btn" title="Settings">
              <Settings size={14} />
            </Link>
            <button className="dl-topbar-btn dl-logout-btn" onClick={handleLogout} title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </header>

        {/* Page content — slate-100 bg */}
        <div className="dl-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;