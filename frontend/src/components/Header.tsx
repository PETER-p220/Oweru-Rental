import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';
import LOGO from '../assets/IMG-20260326-WA0006.jpg';
import ThemeToggle from './ThemeToggle';

// ─── Oweru Brand Tokens ───────────────────────────────────────────────────────

const STRIP_H  = 36; // px — contact strip height
const NAV_H    = 68; // px — main nav height
const SCROLL_THRESHOLD = 20;

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    // Set initial value synchronously to avoid flash
    setScrolled(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setIsMenuOpen(false); }, [location]);

  const navLinks = [
    { label: 'Home',       to: '/' },
    { label: 'Properties', to: '/properties' },
    { label: 'About',      to: '/about' },
    { label: 'Contact',    to: '/contact' },
  ];

  const isActive = (to: string): boolean =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  // Total height of the fixed header changes when strip hides
  const totalHeaderH = scrolled ? NAV_H : STRIP_H + NAV_H;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Cormorant+Garamond:wght@300;400&display=swap');

        :root {
          --oweru-navy:       #0F172A;
          --oweru-navy-800:   #141F35;
          --oweru-navy-700:   #1A2A47;
          --oweru-navy-400:   #3D5E96;
          --oweru-gold:       #C89128;
          --oweru-gold-light: #D4A84B;
          --oweru-gold-pale:  #E8CC8A;
          --oweru-gold-faint: rgba(200, 145, 40, 0.10);
          --oweru-off-white:  #F8F8F9;
          --oweru-white:      #FFFFFF;
          --gold:       var(--oweru-gold);
          --gold-light: var(--oweru-gold-light);
          --dark:       var(--bg-primary,    var(--oweru-navy));
          --dark-2:     var(--bg-secondary,  var(--oweru-navy-800));
          --dark-3:     var(--bg-tertiary,   var(--oweru-navy-700));
          --cream:      var(--text-primary,  var(--oweru-off-white));
          --muted:      var(--text-secondary, #6888BC);
          --border:     var(--border-color,  rgba(200, 145, 40, 0.15));
        }

        /* ═══════════════════════════════════════════════
           KEY FIX: header wrapper is position:fixed so
           it never participates in document flow and
           can never cause a layout shift.
           The sibling <div> spacer reserves the space.
        ═══════════════════════════════════════════════ */
        .hdr-root {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Contact strip ── */
        .hdr-strip {
          background: var(--bg-tertiary, var(--oweru-navy-800));
          border-bottom: 1px solid var(--border, rgba(200, 145, 40, 0.12));
          padding: 0 40px;
          height: ${STRIP_H}px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          /* Collapse by shrinking height + fading — NO layout shift */
          overflow: hidden;
          transition: height 0.35s ease, opacity 0.25s ease, padding 0.35s ease;
          opacity: 1;
        }
        .hdr-strip.hidden-strip {
          height: 0;
          opacity: 0;
          padding-top: 0;
          padding-bottom: 0;
          border-bottom-color: transparent;
        }

        .strip-contact {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .strip-item {
          display: flex; align-items: center; gap: 7px;
          font-size: 11px; font-weight: 400; letter-spacing: 0.06em;
          color: var(--muted); text-decoration: none; transition: color 0.2s;
          white-space: nowrap;
        }
        .strip-item:hover { color: var(--oweru-gold); }
        .strip-item svg   { color: var(--oweru-gold); flex-shrink: 0; }
        .strip-divider    { width: 1px; height: 14px; background: rgba(200, 145, 40, 0.20); }
        .strip-location   {
          display: flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase;
          color: rgba(104, 136, 188, 0.55); white-space: nowrap;
        }
        .strip-dot {
          width: 5px; height: 5px; border-radius: 50%; background: var(--oweru-gold);
          animation: hdr-pulse 2.5s infinite; flex-shrink: 0;
        }
        @keyframes hdr-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }

        /* ── Main nav ── */
        .hdr-nav {
          background: var(--bg-primary, var(--oweru-navy));
          border-bottom: 1px solid var(--border, rgba(200, 145, 40, 0.12));
          transition: border-color 0.3s, box-shadow 0.3s;
          height: ${NAV_H}px;
        }
        .hdr-nav.scrolled {
          box-shadow: 0 8px 40px rgba(15, 23, 42, 0.70);
          border-bottom-color: rgba(200, 145, 40, 0.25);
        }
        .hdr-nav-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 40px;
          height: 100%; display: flex; align-items: center;
          justify-content: space-between; gap: 32px;
        }

        /* ── Logo ── */
        .hdr-logo { display: flex; align-items: center; gap: 1px; text-decoration: none; flex-shrink: 0; }

        /* ── Desktop links ── */
        .hdr-links { display: flex; align-items: center; gap: 4px; list-style: none; margin: 0; padding: 0; }
        .hdr-link {
          position: relative; padding: 8px 14px;
          font-size: 12px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--muted); text-decoration: none; transition: color 0.2s;
        }
        .hdr-link::after {
          content: ''; position: absolute; bottom: 4px; left: 14px; right: 14px;
          height: 1.5px; background: var(--oweru-gold);
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s ease;
        }
        .hdr-link:hover, .hdr-link.active { color: var(--cream); }
        .hdr-link:hover::after, .hdr-link.active::after { transform: scaleX(1); }
        .hdr-link.active { color: var(--oweru-gold-light); }

        /* ── CTA buttons ── */
        .hdr-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .hdr-btn-ghost {
          padding: 8px 18px; font-size: 12px; font-weight: 500;
          letter-spacing: 0.10em; text-transform: uppercase;
          color: var(--muted); text-decoration: none;
          border: 1.5px solid rgba(200, 145, 40, 0.20); border-radius: 4px;
          transition: all 0.2s; white-space: nowrap;
        }
        .hdr-btn-ghost:hover {
          color: var(--cream); border-color: rgba(200, 145, 40, 0.50);
          background: var(--oweru-gold-faint);
        }
        .hdr-btn-primary {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 20px; font-size: 12px; font-weight: 700;
          letter-spacing: 0.10em; text-transform: uppercase;
          color: var(--oweru-navy); background: var(--oweru-gold);
          text-decoration: none; border: 1px solid var(--oweru-gold); border-radius: 4px;
          transition: all 0.2s; white-space: nowrap;
          box-shadow: 0 2px 10px rgba(200, 145, 40, 0.30);
          clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
        }
        .hdr-btn-primary:hover {
          background: var(--oweru-gold-light); border-color: var(--oweru-gold-light);
          box-shadow: 0 4px 16px rgba(200, 145, 40, 0.40);
        }

        /* ── Hamburger ── */
        .hdr-hamburger {
          display: none; width: 38px; height: 38px;
          align-items: center; justify-content: center;
          border: 1.5px solid rgba(200, 145, 40, 0.22); border-radius: 4px;
          background: transparent; color: var(--cream); cursor: pointer;
          transition: all 0.2s; flex-shrink: 0;
        }
        .hdr-hamburger:hover { border-color: var(--oweru-gold); color: var(--oweru-gold); background: var(--oweru-gold-faint); }

        /* ── Mobile drawer ── */
        .hdr-mobile {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: min(320px, 85vw); background: var(--bg-primary, var(--oweru-navy));
          border-left: 1px solid rgba(200, 145, 40, 0.15); z-index: 200;
          display: flex; flex-direction: column;
          transform: translateX(100%); transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
        }
        .hdr-mobile.open { transform: translateX(0); }
        .hdr-mobile-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.80);
          z-index: 199; opacity: 0; pointer-events: none;
          transition: opacity 0.35s; backdrop-filter: blur(4px);
        }
        .hdr-mobile-overlay.open { opacity: 1; pointer-events: all; }

        .mobile-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; border-bottom: 1px solid rgba(200, 145, 40, 0.12); flex-shrink: 0;
        }
        .mobile-close {
          width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
          border: 1.5px solid rgba(200, 145, 40, 0.20); border-radius: 4px;
          background: transparent; color: var(--muted); cursor: pointer; transition: all 0.2s;
        }
        .mobile-close:hover { color: var(--oweru-gold); border-color: var(--oweru-gold); background: var(--oweru-gold-faint); }
        .mobile-links { flex: 1; padding: 20px 0; }
        .mobile-link {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px; font-size: 12px; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--muted); text-decoration: none;
          border-bottom: 1px solid rgba(200, 145, 40, 0.07); transition: all 0.2s;
        }
        .mobile-link:hover, .mobile-link.active { color: var(--cream); background: var(--oweru-gold-faint); padding-left: 28px; }
        .mobile-link.active { color: var(--oweru-gold-light); }
        .mobile-link svg { color: var(--oweru-gold); opacity: 0.5; }
        .mobile-link:hover svg, .mobile-link.active svg { opacity: 1; }
        .mobile-actions {
          padding: 20px 24px; display: flex; flex-direction: column; gap: 10px;
          border-top: 1px solid rgba(200, 145, 40, 0.10); flex-shrink: 0;
        }
        .mobile-btn-ghost {
          padding: 12px; font-size: 12px; font-weight: 500; letter-spacing: 0.10em;
          text-transform: uppercase; color: var(--muted); text-decoration: none;
          border: 1.5px solid rgba(200, 145, 40, 0.20); border-radius: 4px; text-align: center; transition: all 0.2s;
        }
        .mobile-btn-ghost:hover { color: var(--cream); border-color: rgba(200, 145, 40, 0.50); background: var(--oweru-gold-faint); }
        .mobile-btn-primary {
          padding: 12px; font-size: 12px; font-weight: 700; letter-spacing: 0.10em;
          text-transform: uppercase; color: var(--oweru-navy); background: var(--oweru-gold);
          text-decoration: none; border: 1px solid var(--oweru-gold); border-radius: 4px;
          text-align: center; transition: background 0.2s; box-shadow: 0 2px 10px rgba(200, 145, 40, 0.28);
        }
        .mobile-btn-primary:hover { background: var(--oweru-gold-light); border-color: var(--oweru-gold-light); }
        .mobile-contact {
          padding: 18px 24px; border-top: 1px solid rgba(200, 145, 40, 0.07);
          display: flex; flex-direction: column; gap: 10px; flex-shrink: 0;
        }
        .mobile-contact-item {
          display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 400;
          color: var(--muted); text-decoration: none; transition: color 0.2s;
        }
        .mobile-contact-item:hover { color: var(--oweru-gold); }
        .mobile-contact-item svg { color: var(--oweru-gold); flex-shrink: 0; }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .hdr-links, .hdr-actions { display: none; }
          .hdr-hamburger { display: flex; }
          .hdr-strip  { padding: 0 24px; }
          .hdr-nav-inner { padding: 0 24px; }
        }
        @media (max-width: 560px) {
          .strip-contact .strip-item:last-child,
          .strip-contact .strip-divider { display: none; }
        }
      `}</style>

      {/*
        ─────────────────────────────────────────────
        The entire header is position:fixed.
        A sibling spacer div (rendered outside this
        component) pushes page content down by the
        exact current header height — no layout shift.
        ─────────────────────────────────────────────
      */}
      <header className="hdr-root">
        {/* Contact strip */}
        <div className={`hdr-strip${scrolled ? ' hidden-strip' : ''}`}>
          <div className="strip-contact">
            <a href="tel:+255711890764" className="strip-item">
              <Phone size={12} />+255 711 890 764
            </a>
            <div className="strip-divider" />
            <a href="mailto:info@oweru.com" className="strip-item">
              <Mail size={12} />info@oweru.com
            </a>
          </div>
          <div className="strip-location">
            <div className="strip-dot" />
            <MapPin size={11} style={{ color: '#C89128' }} />
            Tancot House, Dar es Salaam
          </div>
        </div>

        {/* Main nav */}
        <nav className={`hdr-nav${scrolled ? ' scrolled' : ''}`}>
          <div className="hdr-nav-inner">
            <Link to="/" className="hdr-logo">
              <img src={LOGO} alt="OWERU" style={{ height: '34px', width: 'auto' }} />
            </Link>

            <ul className="hdr-links">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className={`hdr-link${isActive(l.to) ? ' active' : ''}`}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hdr-actions">
              <ThemeToggle />
              <Link to="/login"    className="hdr-btn-ghost">Login</Link>
              <Link to="/register" className="hdr-btn-primary">
                Register <ChevronRight size={13} />
              </Link>
            </div>

            <button className="hdr-hamburger" onClick={() => setIsMenuOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
          </div>
        </nav>
      </header>

      {/*
        ── Spacer ──────────────────────────────────
        Reserves the exact space the fixed header
        occupies so page content starts below it.
        Transitions in sync with the strip collapse.
      */}
      <div
        aria-hidden="true"
        style={{
          height:     totalHeaderH,
          transition: 'height 0.35s ease',
          flexShrink: 0,
        }}
      />

      {/* Mobile overlay */}
      <div className={`hdr-mobile-overlay${isMenuOpen ? ' open' : ''}`} onClick={() => setIsMenuOpen(false)} />

      {/* Mobile drawer */}
      <div className={`hdr-mobile${isMenuOpen ? ' open' : ''}`}>
        <div className="mobile-header">
          <Link to="/" className="hdr-logo">
            <img src={LOGO} alt="OWERU" style={{ height: '34px', width: 'auto' }} />
          </Link>
          <button className="mobile-close" onClick={() => setIsMenuOpen(false)}><X size={16} /></button>
        </div>

        <nav className="mobile-links">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className={`mobile-link${isActive(l.to) ? ' active' : ''}`}>
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
          <a href="tel:+255711890764" className="mobile-contact-item"><Phone size={12} /> +255 711 890 764</a>
          <a href="mailto:info@oweru.com" className="mobile-contact-item"><Mail size={12} /> info@oweru.com</a>
        </div>
      </div>
    </>
  );
};

export default Header;