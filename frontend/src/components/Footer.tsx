import { Phone, Mail, MapPin, Globe, Facebook, Twitter, Instagram, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import LOGO from '../assets/IMG-20260326-WA0006.jpg';

const Footer = () => {
  return (
    <footer style={{ fontFamily: "'Jost', 'Futura PT', sans-serif", background: '#0F172A', color: '#F8F8F9', borderTop: '1px solid rgba(200,145,40,0.18)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');

        :root {
          --navy-900: #0F172A;
          --navy-800: #162035;
          --navy-700: #1E2D4A;
          --gold:     #C89128;
          --gold-lt:  #D4A843;
          --gold-dim: rgba(200,145,40,0.12);
          --cream:    #F8F8F9;
          --slate:    #94A3B8;
          --border:   rgba(200,145,40,0.18);
        }

        .ft-top-bar {
          border-bottom: 1px solid var(--border);
          background: var(--navy-800);
        }

        .ft-top-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 28px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }

        .ft-brand {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .ft-divider-line {
          width: 1px;
          height: 22px;
          background: var(--border);
        }

        .ft-tagline {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--slate);
        }

        .ft-socials { display: flex; gap: 4px; }

        .social-btn {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--slate);
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
        }

        .social-btn:hover {
          border-color: rgba(200,145,40,0.5);
          color: var(--gold);
          background: var(--gold-dim);
        }

        /* ── Main 4-column grid ── */
        .ft-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 56px 48px 48px;
          display: grid;
          grid-template-columns: 1.8fr 1fr 1fr 1.4fr;
          gap: 48px;
        }

        .ft-about-text {
          font-size: 14px;
          font-weight: 300;
          line-height: 1.75;
          color: rgba(148,163,184,0.8);
          margin-bottom: 24px;
          max-width: 300px;
        }

        .ft-cert {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--border);
          padding: 7px 14px;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
          background: var(--gold-dim);
        }

        .ft-cert::before {
          content: '';
          width: 6px; height: 6px;
          background: var(--gold);
          border-radius: 50%;
          flex-shrink: 0;
          animation: blink 2s infinite;
        }

        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

        .ft-col-lbl {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ft-col-lbl::after { content: ''; flex: 1; height: 1px; background: var(--border); }

        .ft-links { list-style: none; display: flex; flex-direction: column; gap: 2px; padding: 0; margin: 0; }

        .ft-links a {
          font-size: 14px;
          font-weight: 300;
          color: rgba(148,163,184,0.8);
          text-decoration: none;
          padding: 6px 0;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .ft-links a:hover { color: var(--cream); padding-left: 6px; }

        .lk-arrow { opacity: 0; transition: opacity 0.2s; color: var(--gold); flex-shrink: 0; }
        .ft-links a:hover .lk-arrow { opacity: 1; }

        .ft-contacts { display: flex; flex-direction: column; gap: 18px; }

        .ft-contact-item { display: flex; align-items: flex-start; gap: 14px; }

        .ft-contact-icon {
          width: 30px; height: 30px;
          background: var(--gold-dim);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: var(--gold);
          margin-top: 1px;
        }

        .ft-contact-text {
          font-size: 13px;
          font-weight: 300;
          line-height: 1.65;
          color: rgba(148,163,184,0.85);
        }

        .ft-contact-text a {
          color: rgba(148,163,184,0.85);
          text-decoration: none;
          transition: color 0.2s;
        }

        .ft-contact-text a:hover { color: var(--gold); }

        /* Bottom */
        .ft-divide {
          max-width: 1200px;
          margin: 0 48px;
          height: 1px;
          background: var(--border);
        }

        .ft-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .ft-copy {
          font-size: 12px;
          font-weight: 300;
          color: rgba(148,163,184,0.4);
        }

        .ft-legal { display: flex; gap: 0; flex-wrap: wrap; }

        .ft-legal a {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          color: rgba(148,163,184,0.45);
          text-decoration: none;
          padding: 0 16px;
          border-right: 1px solid var(--border);
          transition: color 0.2s;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .ft-legal a:first-child { padding-left: 0; }
        .ft-legal a:last-child  { border-right: none; }
        .ft-legal a:hover { color: var(--gold); }

        .ft-location {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.16em;
          color: rgba(148,163,184,0.4);
          text-transform: uppercase;
          white-space: nowrap;
        }

        .loc-dot {
          width: 5px; height: 5px;
          background: var(--gold);
          border-radius: 50%;
          animation: blink 2s infinite;
          flex-shrink: 0;
        }

        /* ── Tablet: 2+2 column layout ── */
        @media (max-width: 900px) {
          .ft-top-inner {
            padding: 18px 24px;
          }

          .ft-main {
            grid-template-columns: 1fr 1fr;
            gap: 32px 24px;
            padding: 36px 24px 36px;
          }

          .ft-divide { margin: 0 24px; }

          .ft-bottom {
            padding: 20px 24px;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }

        /* ── Mobile: keep 4 columns but compact ── */
        @media (max-width: 600px) {
          .ft-top-inner {
            padding: 14px 16px;
          }

          /* 4 columns preserved — first col (About) spans full width on its own row,
             then Navigate | Services in row 2, Contact full width in row 3 */
          .ft-main {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto auto;
            gap: 28px 20px;
            padding: 28px 16px 32px;
          }

          /* About spans both columns */
          .ft-main > div:nth-child(1) {
            grid-column: 1 / -1;
          }

          /* Contact spans both columns */
          .ft-main > div:nth-child(4) {
            grid-column: 1 / -1;
          }

          .ft-about-text {
            font-size: 13px;
            max-width: 100%;
            margin-bottom: 16px;
          }

          .ft-col-lbl {
            font-size: 8px;
            margin-bottom: 14px;
          }

          .ft-links a {
            font-size: 13px;
            padding: 5px 0;
          }

          .ft-contacts {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          .ft-contact-text {
            font-size: 12px;
          }

          .ft-divide { margin: 0 16px; }

          .ft-bottom {
            padding: 18px 16px;
            gap: 14px;
          }

          .ft-copy {
            font-size: 11px;
          }

          .ft-legal {
            gap: 0;
          }

          .ft-legal a {
            font-size: 10px;
            padding: 0 10px;
          }

          .ft-legal a:first-child { padding-left: 0; }

          .ft-location {
            font-size: 9px;
          }
        }

        /* ── Very small phones ── */
        @media (max-width: 380px) {
          .ft-main {
            grid-template-columns: 1fr 1fr;
            gap: 22px 14px;
            padding: 22px 12px 24px;
          }

          .ft-contacts {
            grid-template-columns: 1fr;
          }

          .ft-links a {
            font-size: 12px;
          }

          .ft-cert {
            font-size: 8px;
            padding: 5px 10px;
          }
        }
      `}</style>

      
      {/* Main grid — 4 cols desktop, 2+2 tablet, About+Nav+Svc+Contact mobile */}
      <div className="ft-main">

        {/* About */}
        <div>
          <div className="ft-col-lbl">About Oweru</div>
          <p className="ft-about-text">
            Your trusted partner in property rental management across Tanzania.
            We connect landlords, agents, and tenants through a transparent,
            secure, and seamless platform powered by technology.
          </p>
          <div className="ft-cert">Verified Platform · Tanzania</div>
        </div>

        {/* Navigate */}
        <div>
          <div className="ft-col-lbl">Navigate</div>
          <ul className="ft-links">
            {[
              { label: 'About Us',      to: '/about' },
              { label: 'How It Works',  to: '/how-it-works' },
              { label: 'For Landlords', to: '/landlords' },
              { label: 'For Agents',    to: '/agents' },
              { label: 'For Tenants',   to: '/tenants' },
            ].map(l => (
              <li key={l.label}>
                <Link to={l.to}>
                  <ArrowUpRight size={11} className="lk-arrow" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <div className="ft-col-lbl">Services</div>
          <ul className="ft-links">
            {[
              'Property Listing',
              'Tenant Screening',
              'Payment Processing',
              'Maintenance Services',
              'Legal Support',
            ].map(s => (
              <li key={s}>
                <a href="#">
                  <ArrowUpRight size={11} className="lk-arrow" />
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div className="ft-col-lbl">Contact</div>
          <div className="ft-contacts">
            <div className="ft-contact-item">
              <div className="ft-contact-icon"><Phone size={13} /></div>
              <div className="ft-contact-text">
                <a href="tel:+255711890764">+255 711 890 764</a>
              </div>
            </div>
            <div className="ft-contact-item">
              <div className="ft-contact-icon"><Mail size={13} /></div>
              <div className="ft-contact-text">
                <a href="mailto:info@oweru.com">info@oweru.com</a>
              </div>
            </div>
            <div className="ft-contact-item">
              <div className="ft-contact-icon"><MapPin size={13} /></div>
              <div className="ft-contact-text">
                Tancot House, Posta<br />
                Dar es Salaam, Tanzania<br />
                P.O. Box 7563
              </div>
            </div>
            <div className="ft-contact-item">
              <div className="ft-contact-icon"><Globe size={13} /></div>
              <div className="ft-contact-text">
                <a href="https://www.oweru.com" target="_blank" rel="noreferrer">www.oweru.com</a>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Divider */}
      <div className="ft-divide" />

      {/* Bottom */}
      <div className="ft-bottom">
        <p className="ft-copy">© 2025 Oweru Investment Ltd. All rights reserved.</p>

        <div className="ft-legal">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/cookies">Cookie Policy</Link>
        </div>

        <div className="ft-location">
          <span className="loc-dot" />
          Dar es Salaam, Tanzania
        </div>
      </div>
    </footer>
  );
};

export default Footer;