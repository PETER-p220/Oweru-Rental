import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, User, LogOut, Home, Building, FileText, MessageSquare, Bell, Settings, ChevronDown, ChevronRight, Heart, Star, Users, BarChart3, DollarSign, Package, Calendar, Phone, Mail, MapPin, Eye, Edit, Trash2, Plus, Filter, TrendingUp } from 'lucide-react';
import LOGO from '../assets/IMG-20260326-WA0006.jpg';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setIsMenuOpen(false); }, [location]);

  const navLinks = [
    { label: 'Home',       to: '/' },
    { label: 'Properties', to: '/properties' },
    { label: 'About',      to: '/about' },
    { label: 'Contact',    to: '/contact' },
  ];

  const isActive = (to: string): boolean =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <header style={{ fontFamily: "'DM Sans', sans-serif", position: 'sticky', top: 0, zIndex: 100 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --gold: #c9a84c;
          --gold-light: #e8c97a;
          --dark: var(--bg-primary);
          --dark-2: var(--bg-secondary);
          --dark-3: var(--bg-tertiary);
          --cream: var(--text-primary);
          --muted: var(--text-secondary);
          --border: var(--border-color);
        }

        /* ── Contact strip ── */
        .hdr-strip {
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-color);
          padding: 7px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .hdr-strip.hidden-strip {
          max-height: 0;
          padding-top: 0;
          padding-bottom: 0;
          border-bottom-color: transparent;
          opacity: 0;
        }

        .strip-contact {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .strip-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          font-weight: 300;
          letter-spacing: 0.06em;
          color: rgba(138,128,112,0.7);
          text-decoration: none;
          transition: color 0.2s;
        }

        .strip-item:hover { color: var(--gold); }

        .strip-item svg { color: var(--gold); flex-shrink: 0; }

        .strip-divider {
          width: 1px;
          height: 14px;
          background: rgba(201,168,76,0.15);
        }

        .strip-location {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(138,128,112,0.45);
        }

        .strip-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--gold);
          animation: hdr-pulse 2.5s infinite;
        }

        @keyframes hdr-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }

        /* ── Main nav ── */
        .hdr-nav {
          background: var(--bg-primary);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid var(--border-color);
          transition: border-color 0.3s, box-shadow 0.3s;
        }

        .hdr-nav.scrolled {
          box-shadow: 0 8px 40px rgba(0,0,0,0.6);
          border-bottom-color: rgba(201,168,76,0.2);
        }

        .hdr-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
        }

        /* Logo */
        .hdr-logo {
          display: flex;
          align-items: baseline;
          gap: 1px;
          text-decoration: none;
          flex-shrink: 0;
        }

        .hdr-logo-text {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 22px;
          font-weight: 300;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--cream);
          line-height: 1;
          transition: color 0.2s;
        }

        .hdr-logo:hover .hdr-logo-text { color: var(--gold-light); }

        .hdr-logo-dot {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 22px;
          font-weight: 300;
          color: var(--gold);
          line-height: 1;
        }

        /* Desktop links */
        .hdr-links {
          display: flex;
          align-items: center;
          gap: 4px;
          list-style: none;
        }

        .hdr-link {
          position: relative;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(138,128,112,0.9);
          text-decoration: none;
          transition: color 0.2s;
        }

        .hdr-link::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 14px;
          right: 14px;
          height: 1px;
          background: var(--gold);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }

        .hdr-link:hover,
        .hdr-link.active { color: var(--cream); }

        .hdr-link:hover::after,
        .hdr-link.active::after { transform: scaleX(1); }

        .hdr-link.active { color: var(--gold-light); }

        /* CTA buttons */
        .hdr-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .hdr-btn-ghost {
          padding: 8px 18px;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(138,128,112,0.9);
          text-decoration: none;
          border: 1px solid rgba(201,168,76,0.18);
          transition: all 0.2s;
          white-space: nowrap;
        }

        .hdr-btn-ghost:hover {
          color: var(--cream);
          border-color: rgba(201,168,76,0.45);
          background: rgba(201,168,76,0.05);
        }

        .hdr-btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #0a0a0a;
          background: var(--gold);
          text-decoration: none;
          border: 1px solid var(--gold);
          transition: all 0.2s;
          white-space: nowrap;
          clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
        }

        .hdr-btn-primary:hover {
          background: var(--gold-light);
          border-color: var(--gold-light);
        }

        /* Hamburger */
        .hdr-hamburger {
          display: none;
          width: 36px;
          height: 36px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(201,168,76,0.2);
          background: transparent;
          color: var(--cream);
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .hdr-hamburger:hover {
          border-color: rgba(201,168,76,0.5);
          color: var(--gold);
          background: rgba(201,168,76,0.05);
        }

        /* Mobile drawer */
        .hdr-mobile {
          position: fixed;
          top: 0; right: 0; bottom: 0;
          width: min(320px, 85vw);
          background: var(--bg-primary);
          border-left: 1px solid var(--border-color);
          z-index: 200;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
        }

        .hdr-mobile.open { transform: translateX(0); }

        .hdr-mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 199;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.35s;
          backdrop-filter: blur(4px);
        }

        .hdr-mobile-overlay.open {
          opacity: 1;
          pointer-events: all;
        }

        .mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .mobile-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(201,168,76,0.2);
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .mobile-close:hover { color: var(--gold); border-color: rgba(201,168,76,0.5); }

        .mobile-links {
          flex: 1;
          padding: 24px 0;
        }

        .mobile-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(138,128,112,0.85);
          text-decoration: none;
          border-bottom: 1px solid rgba(201,168,76,0.06);
          transition: all 0.2s;
        }

        .mobile-link:hover,
        .mobile-link.active {
          color: var(--cream);
          background: rgba(201,168,76,0.04);
          padding-left: 28px;
        }

        .mobile-link.active { color: var(--gold-light); }
        .mobile-link svg { color: var(--gold); opacity: 0.5; }
        .mobile-link:hover svg, .mobile-link.active svg { opacity: 1; }

        .mobile-actions {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }

        .mobile-btn-ghost {
          padding: 12px;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          text-decoration: none;
          border: 1px solid rgba(201,168,76,0.18);
          text-align: center;
          transition: all 0.2s;
        }

        .mobile-btn-ghost:hover { color: var(--cream); border-color: rgba(201,168,76,0.4); }

        .mobile-btn-primary {
          padding: 12px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #0a0a0a;
          background: var(--gold);
          text-decoration: none;
          text-align: center;
          transition: background 0.2s;
        }

        .mobile-btn-primary:hover { background: var(--gold-light); }

        .mobile-contact {
          padding: 20px 24px;
          border-top: 1px solid rgba(201,168,76,0.06);
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex-shrink: 0;
        }

        .mobile-contact-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 300;
          color: rgba(138,128,112,0.6);
          text-decoration: none;
        }

        .mobile-contact-item svg { color: var(--gold); flex-shrink: 0; }

        /* Responsive breakpoint */
        @media (max-width: 900px) {
          .hdr-links,
          .hdr-actions { display: none; }
          .hdr-hamburger { display: flex; }
          .hdr-strip { padding: 7px 24px; }
          .hdr-nav-inner { padding: 0 24px; }
        }

        @media (max-width: 560px) {
          .strip-contact .strip-item:last-child,
          .strip-contact .strip-divider { display: none; }
        }
      `}</style>

      {/* Contact strip */}
      <div className={`hdr-strip${scrolled ? ' hidden-strip' : ''}`}>
        <div className="strip-contact">
          <a href="tel:+255711890764" className="strip-item">
            <Phone size={12} />
            +255 711 890 764
          </a>
          <div className="strip-divider" />
          <a href="mailto:info@oweru.com" className="strip-item">
            <Mail size={12} />
            info@oweru.com
          </a>
        </div>
        <div className="strip-location">
          <div className="strip-dot" />
          <MapPin size={11} style={{ color: 'var(--gold)' }} />
          Tancot House, Dar es Salaam
        </div>
      </div>

      {/* Main nav */}
      <nav className={`hdr-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="hdr-nav-inner">

          {/* Logo */}
          <Link to="/" className="hdr-logo">
            <img src={LOGO} alt="OWERU" style={{ height: '32px', width: 'auto' }} />
          </Link>

          {/* Desktop links */}
          <ul className="hdr-links">
            {navLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={`hdr-link${isActive(l.to) ? ' active' : ''}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <div className="hdr-actions">
            <ThemeToggle />
            <Link to="/login"    className="hdr-btn-ghost">Login</Link>
            <Link to="/register" className="hdr-btn-primary">
              Register
              <ChevronRight size={13} />
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className="hdr-hamburger"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`hdr-mobile-overlay${isMenuOpen ? ' open' : ''}`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile drawer */}
      <div className={`hdr-mobile${isMenuOpen ? ' open' : ''}`}>
        <div className="mobile-header">
          <Link to="/" className="hdr-logo" style={{ textDecoration: 'none' }}>
            <img src={LOGO} alt="OWERU" style={{ height: '32px', width: 'auto' }} />
          </Link>
          <button className="mobile-close" onClick={() => setIsMenuOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <nav className="mobile-links">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`mobile-link${isActive(l.to) ? ' active' : ''}`}
            >
              {l.label}
              <ChevronRight size={13} />
            </Link>
          ))}
        </nav>

        <div className="mobile-actions">
          <ThemeToggle />
          <Link to="/login"    className="mobile-btn-ghost">Login</Link>
          <Link to="/register" className="mobile-btn-primary">Create Account</Link>
        </div>

        <div className="mobile-contact">
          <a href="tel:+255711890764" className="mobile-contact-item">
            <Phone size={12} /> +255 711 890 764
          </a>
          <a href="mailto:info@oweru.com" className="mobile-contact-item">
            <Mail size={12} /> info@oweru.com
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;