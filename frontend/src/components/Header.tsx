import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';
import LOGO from '../assets/IMG-20260326-WA0006.jpg';
import ThemeToggle from './ThemeToggle';

const STRIP_H = 36;
const NAV_H   = 64;
const SCROLL_THRESHOLD = 20;

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    setScrolled(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setIsMenuOpen(false); }, [location]);

  const navLinks = [
    { label: 'Home',       to: '/'           },
    { label: 'Properties', to: '/properties' },
    { label: 'About',      to: '/about'      },
    { label: 'Contact',    to: '/contact'    },
  ];

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const totalHeaderH = scrolled ? NAV_H : STRIP_H + NAV_H;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Strip ── */
        .hdr-strip {
          background: #1E293B;
          border-bottom: 1px solid rgba(200,145,40,0.12);
          padding: 0 40px;
          height: ${STRIP_H}px;
          display: flex; align-items: center; justify-content: space-between;
          overflow: hidden;
          transition: height 0.3s ease, opacity 0.22s ease;
          opacity: 1;
          font-family: 'DM Sans', sans-serif;
        }
        .hdr-strip.gone { height: 0; opacity: 0; }

        .strip-left { display: flex; align-items: center; gap: 20px; }
        .strip-link {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: #94A3B8; text-decoration: none;
          transition: color 0.2s; white-space: nowrap;
        }
        .strip-link:hover { color: #C89128; }
        .strip-link svg { color: #C89128; flex-shrink: 0; }
        .strip-sep { width: 1px; height: 12px; background: rgba(200,145,40,0.18); }
        .strip-right {
          display: flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 500; letter-spacing: 0.14em;
          text-transform: uppercase; color: rgba(148,163,184,0.5); white-space: nowrap;
        }
        .strip-dot {
          width: 5px; height: 5px; border-radius: 50%; background: #C89128;
          animation: hpulse 2.5s ease-in-out infinite; flex-shrink: 0;
        }
        @keyframes hpulse { 0%,100%{opacity:1;} 50%{opacity:0.25;} }

        /* ── Nav ── */
        .hdr-nav {
          background: var(--bg-primary, #0F172A);
          border-bottom: 1px solid rgba(200,145,40,0.10);
          height: ${NAV_H}px;
          transition: box-shadow 0.3s, border-color 0.3s;
          font-family: 'DM Sans', sans-serif;
        }
        .hdr-nav.scrolled {
          box-shadow: 0 4px 24px rgba(15,23,42,0.60);
          border-bottom-color: rgba(200,145,40,0.22);
        }
        .hdr-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 40px;
          height: 100%; display: flex; align-items: center;
          justify-content: space-between; gap: 28px;
        }

        /* ── Nav links ── */
        .hdr-links { display: flex; align-items: center; gap: 2px; list-style: none; margin: 0; padding: 0; }
        .hdr-link {
          position: relative; padding: 7px 13px;
          font-size: 12px; font-weight: 500; letter-spacing: 0.10em; text-transform: uppercase;
          color: var(--text-secondary, #64748B); text-decoration: none; transition: color 0.2s;
        }
        .hdr-link::after {
          content: ''; position: absolute; bottom: 3px; left: 13px; right: 13px;
          height: 1.5px; background: #C89128;
          transform: scaleX(0); transform-origin: left; transition: transform 0.28s ease;
        }
        .hdr-link:hover { color: var(--text-primary, #F1F5F9); }
        .hdr-link:hover::after { transform: scaleX(1); }
        .hdr-link.active { color: #C89128; }
        .hdr-link.active::after { transform: scaleX(1); }

        /* ── CTA ── */
        .hdr-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .hdr-login {
          padding: 7px 16px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--text-secondary, #94A3B8); text-decoration: none;
          border: 1px solid rgba(200,145,40,0.20); border-radius: 6px;
          transition: all 0.2s; white-space: nowrap;
        }
        .hdr-login:hover { color: var(--text-primary, #F1F5F9); border-color: rgba(200,145,40,0.45); background: rgba(200,145,40,0.06); }
        .hdr-register {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 18px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: #0F172A; background: #C89128;
          text-decoration: none; border: 1px solid #C89128; border-radius: 6px;
          transition: all 0.2s; white-space: nowrap;
          box-shadow: 0 2px 10px rgba(200,145,40,0.28);
        }
        .hdr-register:hover { background: #D4A84B; border-color: #D4A84B; box-shadow: 0 4px 14px rgba(200,145,40,0.38); }

        /* ── Hamburger ── */
        .hdr-burger {
          display: none; width: 36px; height: 36px;
          align-items: center; justify-content: center;
          border: 1px solid rgba(200,145,40,0.22); border-radius: 6px;
          background: transparent; color: var(--text-primary, #F1F5F9); cursor: pointer;
          transition: all 0.2s; flex-shrink: 0;
        }
        .hdr-burger:hover { border-color: #C89128; color: #C89128; background: rgba(200,145,40,0.06); }

        /* ── Mobile drawer ── */
        .hdr-drawer {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: min(300px, 82vw); background: var(--bg-primary, #0F172A);
          border-left: 1px solid rgba(200,145,40,0.14); z-index: 200;
          display: flex; flex-direction: column;
          transform: translateX(100%); transition: transform 0.32s cubic-bezier(0.4,0,0.2,1);
          font-family: 'DM Sans', sans-serif;
        }
        .hdr-drawer.open { transform: translateX(0); }
        .hdr-overlay {
          position: fixed; inset: 0; background: rgba(15,23,42,0.75);
          z-index: 199; opacity: 0; pointer-events: none;
          transition: opacity 0.32s; backdrop-filter: blur(4px);
        }
        .hdr-overlay.open { opacity: 1; pointer-events: all; }

        .drw-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 22px; border-bottom: 1px solid rgba(200,145,40,0.10); flex-shrink: 0;
        }
        .drw-close {
          width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(200,145,40,0.18); border-radius: 6px;
          background: transparent; color: #94A3B8; cursor: pointer; transition: all 0.2s;
        }
        .drw-close:hover { color: #C89128; border-color: #C89128; background: rgba(200,145,40,0.07); }
        .drw-nav { flex: 1; padding: 12px 0; }
        .drw-link {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 22px; font-size: 12px; font-weight: 600; letter-spacing: 0.10em; text-transform: uppercase;
          color: #64748B; text-decoration: none;
          border-bottom: 1px solid rgba(255,255,255,0.04); transition: all 0.18s;
        }
        .drw-link:hover, .drw-link.active { color: #F1F5F9; background: rgba(200,145,40,0.06); padding-left: 26px; }
        .drw-link.active { color: #C89128; }
        .drw-actions {
          padding: 16px 22px; display: flex; flex-direction: column; gap: 8px;
          border-top: 1px solid rgba(200,145,40,0.08); flex-shrink: 0;
        }
        .drw-login {
          padding: 11px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          color: #94A3B8; text-decoration: none; border: 1px solid rgba(200,145,40,0.18); border-radius: 6px;
          text-align: center; transition: all 0.2s;
        }
        .drw-login:hover { color: #F1F5F9; border-color: rgba(200,145,40,0.45); background: rgba(200,145,40,0.06); }
        .drw-register {
          padding: 11px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: #0F172A; background: #C89128; text-decoration: none;
          border: 1px solid #C89128; border-radius: 6px; text-align: center; transition: background 0.2s;
          box-shadow: 0 2px 10px rgba(200,145,40,0.26);
        }
        .drw-register:hover { background: #D4A84B; border-color: #D4A84B; }
        .drw-contact {
          padding: 14px 22px; border-top: 1px solid rgba(255,255,255,0.04);
          display: flex; flex-direction: column; gap: 9px; flex-shrink: 0;
        }
        .drw-citem {
          display: flex; align-items: center; gap: 9px; font-size: 12px;
          color: #64748B; text-decoration: none; transition: color 0.2s;
        }
        .drw-citem:hover { color: #C89128; }
        .drw-citem svg { color: #C89128; flex-shrink: 0; }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .hdr-links, .hdr-actions { display: none !important; }
          .hdr-burger { display: flex !important; }
          .hdr-strip { padding: 0 20px; }
          .hdr-inner { padding: 0 20px; }
        }
        @media (max-width: 560px) {
          .strip-sep, .strip-link:last-child { display: none; }
        }
      `}</style>

      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>

        {/* Contact strip */}
        <div className={`hdr-strip${scrolled ? ' gone' : ''}`}>
          <div className="strip-left">
            <a href="tel:+255711890764" className="strip-link">
              <Phone size={11} /> +255 711 890 764
            </a>
            <div className="strip-sep" />
            <a href="mailto:info@oweru.com" className="strip-link">
              <Mail size={11} /> info@oweru.com
            </a>
          </div>
          <div className="strip-right">
            <div className="strip-dot" />
            <MapPin size={10} style={{ color: '#C89128' }} />
            Tancot House, Dar es Salaam
          </div>
        </div>

        {/* Main nav */}
        <nav className={`hdr-nav${scrolled ? ' scrolled' : ''}`}>
          <div className="hdr-inner">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
              <img src={LOGO} alt="OWERU" style={{ height: '30px', width: 'auto' }} />
            </Link>

            <ul className="hdr-links">
              {navLinks.map(l => (
                <li key={l.to}>
                  <Link to={l.to} className={`hdr-link${isActive(l.to) ? ' active' : ''}`}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hdr-actions">
              <ThemeToggle />
              <Link to="/login"    className="hdr-login">Login</Link>
              <Link to="/register" className="hdr-register">
                Register <ChevronRight size={12} />
              </Link>
            </div>

            <button className="hdr-burger" onClick={() => setIsMenuOpen(true)} aria-label="Open menu">
              <Menu size={17} />
            </button>
          </div>
        </nav>
      </header>

      {/* Spacer */}
      <div aria-hidden="true" style={{ height: totalHeaderH, transition: 'height 0.3s ease', flexShrink: 0 }} />

      {/* Overlay */}
      <div className={`hdr-overlay${isMenuOpen ? ' open' : ''}`} onClick={() => setIsMenuOpen(false)} />

      {/* Drawer */}
      <div className={`hdr-drawer${isMenuOpen ? ' open' : ''}`}>
        <div className="drw-head">
          <Link to="/" onClick={() => setIsMenuOpen(false)}>
            <img src={LOGO} alt="OWERU" style={{ height: '28px', width: 'auto' }} />
          </Link>
          <button className="drw-close" onClick={() => setIsMenuOpen(false)}><X size={15} /></button>
        </div>
        <nav className="drw-nav">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} className={`drw-link${isActive(l.to) ? ' active' : ''}`}
              onClick={() => setIsMenuOpen(false)}>
              {l.label}
              <ChevronRight size={12} style={{ color: '#C89128', opacity: 0.5 }} />
            </Link>
          ))}
        </nav>
        <div className="drw-actions">
          <ThemeToggle />
          <Link to="/login"    className="drw-login"    onClick={() => setIsMenuOpen(false)}>Login</Link>
          <Link to="/register" className="drw-register" onClick={() => setIsMenuOpen(false)}>Create Account</Link>
        </div>
        <div className="drw-contact">
          <a href="tel:+255711890764"   className="drw-citem"><Phone size={11} /> +255 711 890 764</a>
          <a href="mailto:info@oweru.com" className="drw-citem"><Mail size={11} /> info@oweru.com</a>
        </div>
      </div>
    </>
  );
};

export default Header;