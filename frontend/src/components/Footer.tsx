import { Phone, Mail, MapPin, Globe, Facebook, Twitter, Instagram, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", background: 'var(--bg-primary)', color: 'var(--text-primary)', borderTop: '1px solid var(--border-color)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');

        .footer-sans { font-family: 'DM Sans', sans-serif; }

        .footer-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 32px 40px;
          border-bottom: 1px solid rgba(201,168,76,0.1);
          max-width: 1200px;
          margin: 0 auto;
          gap: 24px;
          flex-wrap: wrap;
        }

        .footer-brand {
          display: flex;
          align-items: baseline;
          gap: 2px;
        }

        .footer-logo-text {
          font-size: 26px;
          font-weight: 300;
          letter-spacing: 0.08em;
          color: var(--text-primary);
          text-transform: uppercase;
        }

        .footer-logo-dot {
          color: var(--accent-color);
          font-size: 26px;
        }

        .footer-tagline {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-secondary);
          padding-left: 16px;
          border-left: 1px solid var(--border-color);
        }

        .footer-socials {
          display: flex;
          gap: 4px;
        }

        .social-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(201,168,76,0.15);
          color: rgba(138,128,112,0.7);
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
        }

        .social-btn:hover {
          border-color: rgba(201,168,76,0.5);
          color: #c9a84c;
          background: rgba(201,168,76,0.06);
        }

        .footer-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 56px 40px 48px;
          display: grid;
          grid-template-columns: 1.8fr 1fr 1fr 1.4fr;
          gap: 48px;
        }

        .footer-about-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          line-height: 1.75;
          color: rgba(138,128,112,0.85);
          margin-bottom: 28px;
          max-width: 300px;
        }

        .footer-cert {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(201,168,76,0.15);
          padding: 8px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #c9a84c;
        }

        .footer-cert::before {
          content: '';
          width: 6px;
          height: 6px;
          background: #c9a84c;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .footer-col-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #c9a84c;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .footer-col-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(201,168,76,0.12);
        }

        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .footer-links a {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          color: rgba(138,128,112,0.8);
          text-decoration: none;
          padding: 6px 0;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          border-bottom: 1px solid transparent;
        }

        .footer-links a:hover {
          color: #f5f0e8;
          padding-left: 8px;
        }

        .footer-links a .link-arrow {
          opacity: 0;
          transition: opacity 0.2s;
          color: #c9a84c;
          flex-shrink: 0;
        }

        .footer-links a:hover .link-arrow { opacity: 1; }

        .footer-contact-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .contact-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .contact-item:root {
          --gold: #c9a84c;
          --gold-light: #e8c97a;
          --dark: var(--bg-primary);
          --dark-2: var(--bg-secondary);
          --dark-3: var(--bg-tertiary);
          --cream: var(--text-primary);
          --muted: var(--text-secondary);
          --border: var(--border-color);
        }

        .contact-icon {
          width: 30px;
          height: 30px;
          background: rgba(201,168,76,0.08);
          border: 1px solid rgba(201,168,76,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #c9a84c;
          margin-top: 1px;
        }

        .contact-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          line-height: 1.65;
          color: rgba(138,128,112,0.85);
        }

        .contact-text a {
          color: rgba(138,128,112,0.85);
          text-decoration: none;
          transition: color 0.2s;
        }

        .contact-text a:hover { color: #c9a84c; }

        .footer-divider {
          max-width: 1200px;
          margin: 0 auto;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.15) 20%, rgba(201,168,76,0.15) 80%, transparent);
          margin-left: 40px;
          margin-right: 40px;
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .footer-copy {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 300;
          color: rgba(138,128,112,0.45);
          letter-spacing: 0.04em;
        }

        .footer-legal {
          display: flex;
          gap: 0;
        }

        .footer-legal a {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.08em;
          color: rgba(138,128,112,0.5);
          text-decoration: none;
          padding: 0 16px;
          border-right: 1px solid rgba(201,168,76,0.1);
          transition: color 0.2s;
        }

        .footer-legal a:first-child { padding-left: 0; }
        .footer-legal a:last-child { border-right: none; }
        .footer-legal a:hover { color: #c9a84c; }

        .footer-location-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.1em;
          color: rgba(138,128,112,0.4);
          text-transform: uppercase;
        }

        .location-dot {
          width: 5px;
          height: 5px;
          background: #c9a84c;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @media (max-width: 900px) {
          .footer-top-bar { padding: 24px; }
          .footer-main {
            grid-template-columns: 1fr 1fr;
            gap: 36px;
            padding: 40px 24px;
          }
          .footer-bottom { padding: 20px 24px; flex-direction: column; align-items: flex-start; gap: 12px; }
          .footer-divider { margin-left: 24px; margin-right: 24px; }
        }

        @media (max-width: 560px) {
          .footer-main { grid-template-columns: 1fr; }
          .footer-tagline { display: none; }
          .footer-legal { flex-wrap: wrap; gap: 8px; }
          .footer-legal a { border-right: none; padding: 0; }
        }
      `}</style>

      {/* Top identity bar */}
      <div className="footer-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="footer-brand">
            <span className="footer-logo-text">OWERU</span>
            <span className="footer-logo-dot">.</span>
          </div>
          <span className="footer-tagline">Tanzania Property Rentals</span>
        </div>

        <div className="footer-socials">
          {[
            { icon: <Facebook size={15} />, href: '#' },
            { icon: <Twitter size={15} />,  href: '#' },
            { icon: <Instagram size={15} />, href: '#' },
            { icon: <Globe size={15} />,     href: '#' },
          ].map((s, i) => (
            <a key={i} href={s.href} className="social-btn">{s.icon}</a>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="footer-main">

        {/* About */}
        <div>
          <div className="footer-col-label">About</div>
          <p className="footer-about-text">
            Your trusted partner in property rental management across Tanzania. 
            We connect landlords, agents, and tenants through a transparent, 
            secure, and seamless platform.
          </p>
          <div className="footer-cert">Verified Platform · Tanzania</div>
        </div>

        {/* Quick Links */}
        <div>
          <div className="footer-col-label">Navigate</div>
          <ul className="footer-links">
            {[
              { label: 'About Us',    to: '/about' },
              { label: 'How It Works', to: '/how-it-works' },
              { label: 'For Landlords', to: '/landlords' },
              { label: 'For Agents',  to: '/agents' },
              { label: 'For Tenants', to: '/tenants' },
            ].map((l) => (
              <li key={l.label}>
                <Link to={l.to}>
                  <ArrowUpRight size={11} className="link-arrow" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <div className="footer-col-label">Services</div>
          <ul className="footer-links">
            {[
              'Property Listing',
              'Tenant Screening',
              'Payment Processing',
              'Maintenance Services',
              'Legal Support',
            ].map((s) => (
              <li key={s}>
                <a href="#">
                  <ArrowUpRight size={11} className="link-arrow" />
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div className="footer-col-label">Contact</div>
          <div className="footer-contact-list">
            <div className="contact-item">
              <div className="contact-icon"><Phone size={13} /></div>
              <div className="contact-text">
                <a href="tel:+255711890764">+255 711 890 764</a>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon"><Mail size={13} /></div>
              <div className="contact-text">
                <a href="mailto:info@oweru.com">info@oweru.com</a>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon"><MapPin size={13} /></div>
              <div className="contact-text">
                Tancot House, Posta<br />
                Dar es Salaam, Tanzania<br />
                P.O. Box 7563
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon"><Globe size={13} /></div>
              <div className="contact-text">
                <a href="https://www.oweru.com" target="_blank" rel="noreferrer">www.oweru.com</a>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Divider */}
      <div className="footer-divider" />

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p className="footer-copy">© 2025 Oweru Rental System. All rights reserved.</p>

        <div className="footer-legal">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/cookies">Cookie Policy</Link>
        </div>

        <div className="footer-location-badge">
          <span className="location-dot" />
          Dar es Salaam, TZ
        </div>
      </div>
    </footer>
  );
};

export default Footer;