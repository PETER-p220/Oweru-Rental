import { useState } from 'react';
import { Phone, Mail, MapPin, Globe, Send, Clock, MessageSquare, ChevronDown, ArrowRight } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq]     = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 4000);
  };

  const contactInfo = [
    { icon: Phone,  label: 'Phone',   value: '+255 711 890 764',              sub: 'Mon–Fri  9AM – 6PM',          href: 'tel:+255711890764' },
    { icon: Mail,   label: 'Email',   value: 'info@oweru.com',                sub: 'Response within 24 hours',    href: 'mailto:info@oweru.com' },
    { icon: MapPin, label: 'Office',  value: 'Tancot House, Posta',           sub: 'Dar es Salaam, Tanzania',     href: '#map' },
    { icon: Globe,  label: 'Website', value: 'www.oweru.com',                 sub: 'Available 24 / 7',            href: 'https://www.oweru.com' },
  ];

  const hours = [
    { day: 'Monday – Friday', time: '9:00 AM – 6:00 PM', open: true },
    { day: 'Saturday',        time: '9:00 AM – 2:00 PM', open: true },
    { day: 'Sunday',          time: 'Closed',             open: false },
  ];

  const faqs = [
    {
      q: 'How do I list my property on Oweru?',
      a: 'Create an account, click "List Property", and fill in the details. Our team will verify your listing within 24 hours.',
    },
    {
      q: 'Is Oweru available outside Dar es Salaam?',
      a: 'We\'re currently focused on Dar es Salaam but expanding to Arusha, Mwanza, and Dodoma soon.',
    },
    {
      q: 'How does the commission system work for agents?',
      a: 'Agents earn commission on successful rentals through their referral links. Our dashboard tracks all leads and conversions automatically.',
    },
    {
      q: 'Are all properties on Oweru verified?',
      a: 'Yes — every property goes through our verification process to ensure accuracy and prevent fraud before it goes live.',
    },
  ];

  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; }

        :root {
          --gold: var(--accent-color);
          --gold-light: var(--accent-light);
          --dark: var(--bg-primary);
          --dark-2: var(--bg-secondary);
          --dark-3: var(--bg-tertiary);
          --cream: var(--text-primary);
          --muted: var(--text-secondary);
          --border: var(--border-color);
        }

        /* ── Hero ── */
        .ct-hero {
          position: relative;
          overflow: hidden;
          min-height: 52vh;
          display: flex;
          align-items: center;
          border-bottom: 1px solid var(--border);
        }

        .ct-hero-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 55% 70% at 75% 40%, rgba(201,168,76,0.07) 0%, transparent 55%),
            radial-gradient(ellipse 35% 50% at 5% 90%,  rgba(201,168,76,0.04) 0%, transparent 50%),
            linear-gradient(150deg, #0e0e0b 0%, #0a0a0a 100%);
        }

        .ct-hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
        }

        .ct-hero-watermark {
          position: absolute;
          right: 3%;
          bottom: -8%;
          font-size: clamp(100px, 16vw, 200px);
          font-weight: 700;
          color: transparent;
          -webkit-text-stroke: 1px rgba(201,168,76,0.05);
          line-height: 1;
          user-select: none;
          letter-spacing: -0.05em;
        }

        .ct-hero-inner {
          position: relative; z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
          padding: 120px 40px 80px;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .ct-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 20px;
        }

        .ct-eyebrow::before { content: ''; width: 28px; height: 1px; background: var(--gold); }

        .ct-hero-title {
          font-size: clamp(44px, 6vw, 76px);
          font-weight: 300;
          line-height: 1.02;
          letter-spacing: -0.03em;
          color: var(--cream);
          margin-bottom: 24px;
        }

        .ct-hero-title em { font-style: italic; color: var(--gold-light); }

        .ct-hero-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 300;
          line-height: 1.75;
          color: var(--muted);
          max-width: 400px;
        }

        /* response promise card */
        .ct-promise {
          background: rgba(201,168,76,0.04);
          border: 1px solid var(--border);
          padding: 36px 32px;
          position: relative;
          overflow: hidden;
        }

        .ct-promise::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }

        .ct-promise-num {
          font-size: 64px;
          font-weight: 300;
          line-height: 1;
          letter-spacing: -0.04em;
          color: transparent;
          -webkit-text-stroke: 1px var(--gold);
          margin-bottom: 10px;
        }

        .ct-promise-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ct-promise-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

        .ct-promise-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          line-height: 1.7;
          color: var(--muted);
        }

        /* ── Info cards ── */
        .ct-info-bar {
          background: var(--dark-3);
          border-bottom: 1px solid var(--border);
        }

        .ct-info-grid {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: var(--border);
          gap: 1px;
        }

        .ct-info-card {
          background: var(--dark-3);
          padding: 32px 28px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          text-decoration: none;
          transition: background 0.25s;
          position: relative;
          overflow: hidden;
        }

        .ct-info-card::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s;
        }

        .ct-info-card:hover { background: rgba(26,26,26,0.9); }
        .ct-info-card:hover::after { transform: scaleX(1); }

        .ct-info-icon {
          width: 36px; height: 36px;
          background: rgba(201,168,76,0.08);
          border: 1px solid rgba(201,168,76,0.15);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .ct-info-lbl {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 6px;
        }

        .ct-info-val {
          font-size: 16px;
          font-weight: 400;
          color: var(--cream);
          margin-bottom: 4px;
          letter-spacing: -0.01em;
        }

        .ct-info-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 300;
          color: rgba(138,128,112,0.55);
          letter-spacing: 0.04em;
        }

        /* ── Main body ── */
        .ct-body {
          max-width: 1200px;
          margin: 0 auto;
          padding: 88px 40px;
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 64px;
          align-items: start;
        }

        /* form */
        .ct-form-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
        }

        .ct-form-eyebrow::after { content: ''; flex: 1; height: 1px; background: var(--border); }

        .ct-form-title {
          font-size: clamp(28px, 3vw, 42px);
          font-weight: 300;
          line-height: 1.1;
          letter-spacing: -0.025em;
          color: var(--cream);
          margin-bottom: 36px;
        }

        .ct-form-title em { font-style: italic; color: var(--gold-light); }

        .ct-form {
          display: flex;
          flex-direction: column;
          gap: 0;
          background: var(--border);
          border: 1px solid var(--border);
        }

        .ct-field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--border);
        }

        .ct-field {
          background: var(--dark-2);
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0;
          border-bottom: 1px solid var(--border);
        }

        .ct-field-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
          padding: 14px 18px 0;
        }

        .ct-input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--cream);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          padding: 6px 18px 14px;
          width: 100%;
          transition: background 0.2s;
        }

        .ct-input::placeholder { color: rgba(138,128,112,0.4); }
        .ct-field:focus-within { background: rgba(201,168,76,0.03); }
        .ct-input:focus { outline: none; }

        .ct-select {
          background: transparent;
          border: none;
          outline: none;
          color: var(--cream);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          padding: 6px 18px 14px;
          width: 100%;
          cursor: pointer;
          appearance: none;
        }

        .ct-select option { background: #111; color: var(--cream); }

        .ct-textarea {
          background: transparent;
          border: none;
          outline: none;
          color: var(--cream);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          padding: 6px 18px 18px;
          width: 100%;
          resize: none;
          line-height: 1.6;
        }

        .ct-textarea::placeholder { color: rgba(138,128,112,0.4); }

        .ct-form-footer {
          background: var(--dark-2);
          padding: 20px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .ct-form-note {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 300;
          color: rgba(138,128,112,0.45);
          letter-spacing: 0.04em;
        }

        .ct-submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--gold);
          color: #0a0a0a;
          padding: 12px 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
          flex-shrink: 0;
        }

        .ct-submit-btn:hover { background: var(--gold-light); gap: 14px; }
        .ct-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .ct-success {
          background: rgba(201,168,76,0.06);
          border: 1px solid rgba(201,168,76,0.25);
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 16px;
        }

        .ct-success-dot {
          width: 8px; height: 8px;
          background: var(--gold);
          border-radius: 50%;
          flex-shrink: 0;
          animation: ct-pulse 1.5s infinite;
        }

        @keyframes ct-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.8); }
        }

        .ct-success-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          color: var(--cream);
        }

        /* right column */
        .ct-side { display: flex; flex-direction: column; gap: 1px; }

        /* hours panel */
        .ct-panel {
          background: var(--dark-2);
          border: 1px solid var(--border);
          overflow: hidden;
          position: relative;
        }

        .ct-panel::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }

        .ct-panel-header {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--border);
        }

        .ct-panel-icon {
          width: 30px; height: 30px;
          background: rgba(201,168,76,0.08);
          border: 1px solid rgba(201,168,76,0.15);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold);
          flex-shrink: 0;
        }

        .ct-panel-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gold);
        }

        .ct-hours-list { padding: 0; }

        .ct-hours-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          border-bottom: 1px solid rgba(201,168,76,0.05);
        }

        .ct-hours-row:last-child { border-bottom: none; }

        .ct-hours-day {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          color: var(--muted);
        }

        .ct-hours-time {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: var(--cream);
        }

        .ct-hours-time.closed { color: rgba(138,128,112,0.45); }

        .ct-hours-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* FAQ accordion */
        .ct-faq-item {
          border-bottom: 1px solid rgba(201,168,76,0.06);
        }

        .ct-faq-item:last-child { border-bottom: none; }

        .ct-faq-btn {
          width: 100%;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 24px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s;
        }

        .ct-faq-btn:hover { background: rgba(201,168,76,0.03); }

        .ct-faq-q {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: var(--cream);
          line-height: 1.5;
        }

        .ct-faq-chevron {
          color: var(--gold);
          flex-shrink: 0;
          margin-top: 2px;
          transition: transform 0.3s;
        }

        .ct-faq-chevron.open { transform: rotate(180deg); }

        .ct-faq-answer {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.35s ease, padding 0.35s ease;
          padding: 0 24px;
        }

        .ct-faq-answer.open {
          max-height: 200px;
          padding: 0 24px 18px;
        }

        .ct-faq-a {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          line-height: 1.7;
          color: var(--muted);
        }

        /* ── Map ── */
        .ct-map-section {
          background: var(--dark-3);
          border-top: 1px solid var(--border);
        }

        .ct-map-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 40px;
        }

        .ct-map-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 40px;
          gap: 24px;
          flex-wrap: wrap;
        }

        .ct-map-title {
          font-size: clamp(28px, 3vw, 42px);
          font-weight: 300;
          letter-spacing: -0.025em;
          color: var(--cream);
        }

        .ct-map-title em { font-style: italic; color: var(--gold-light); }

        .ct-map-address {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          color: var(--muted);
          text-align: right;
          line-height: 1.6;
        }

        .ct-map-placeholder {
          border: 1px solid var(--border);
          height: 380px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(201,168,76,0.02);
          position: relative;
          overflow: hidden;
        }

        .ct-map-placeholder::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        .ct-map-pin {
          position: relative; z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          text-align: center;
        }

        .ct-map-pin-icon {
          width: 56px; height: 56px;
          background: rgba(201,168,76,0.1);
          border: 1px solid rgba(201,168,76,0.25);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold);
        }

        .ct-map-pin-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: var(--cream);
          margin-bottom: 4px;
        }

        .ct-map-pin-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 300;
          color: var(--muted);
        }

        .ct-map-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--gold);
          color: #0a0a0a;
          padding: 10px 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-decoration: none;
          text-transform: uppercase;
          margin-top: 8px;
          transition: background 0.2s;
        }

        .ct-map-btn:hover { background: var(--gold-light); }

        /* Responsive */
        @media (max-width: 1024px) {
          .ct-info-grid { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 860px) {
          .ct-hero-inner { grid-template-columns: 1fr; gap: 40px; padding: 100px 24px 60px; }
          .ct-hero-watermark { display: none; }
          .ct-info-grid { grid-template-columns: 1fr 1fr; }
          .ct-body { grid-template-columns: 1fr; padding: 60px 24px; gap: 48px; }
          .ct-map-inner { padding: 60px 24px; }
          .ct-map-header { flex-direction: column; align-items: flex-start; }
          .ct-map-address { text-align: left; }
        }

        @media (max-width: 560px) {
          .ct-info-grid { grid-template-columns: 1fr; }
          .ct-field-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section className="ct-hero">
        <div className="ct-hero-bg" />
        <div className="ct-hero-grid" />
        <div className="ct-hero-watermark">GET IN TOUCH</div>

        <div className="ct-hero-inner">
          <div>
            <div className="ct-eyebrow">Get in Touch</div>
            <h1 className="ct-hero-title">
              Contact<br /><em>Oweru</em>
            </h1>
            <p className="ct-hero-text">
              Have questions or need assistance? Our team is here to help.
              Reach out and we'll respond as quickly as possible.
            </p>
          </div>

          <div className="ct-promise">
            <div className="ct-promise-num">24h</div>
            <div className="ct-promise-label">Response Promise</div>
            <p className="ct-promise-desc">
              We commit to responding to every inquiry within 24 hours —
              often much sooner. Your time matters to us.
            </p>
          </div>
        </div>
      </section>

      {/* ── Info cards ── */}
      <div className="ct-info-bar">
        <div className="ct-info-grid">
          {contactInfo.map((c) => (
            <a key={c.label} href={c.href} className="ct-info-card">
              <div className="ct-info-icon"><c.icon size={15} /></div>
              <div>
                <div className="ct-info-lbl">{c.label}</div>
                <div className="ct-info-val">{c.value}</div>
                <div className="ct-info-sub">{c.sub}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── Body: form + side ── */}
      <div className="ct-body">

        {/* Form */}
        <div>
          <div className="ct-form-eyebrow">Direct Message</div>
          <h2 className="ct-form-title">
            Send Us a<br /><em>Message</em>
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="ct-form">
              {/* Name + Email */}
              <div className="ct-field-row">
                <div className="ct-field">
                  <div className="ct-field-label">Full Name *</div>
                  <input
                    className="ct-input"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="ct-field" style={{ borderLeft: '1px solid var(--border)' }}>
                  <div className="ct-field-label">Email *</div>
                  <input
                    className="ct-input"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {/* Phone + Subject */}
              <div className="ct-field-row">
                <div className="ct-field">
                  <div className="ct-field-label">Phone</div>
                  <input
                    className="ct-input"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+255 XXX XXX XXX"
                  />
                </div>
                <div className="ct-field" style={{ borderLeft: '1px solid var(--border)', position: 'relative' }}>
                  <div className="ct-field-label">Subject *</div>
                  <select
                    className="ct-select"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="listing">Property Listing</option>
                    <option value="partnership">Partnership</option>
                    <option value="complaint">Complaint</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div className="ct-field" style={{ borderBottom: 'none' }}>
                <div className="ct-field-label">Message *</div>
                <textarea
                  className="ct-textarea"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us how we can help…"
                  rows={5}
                  required
                />
              </div>

              <div className="ct-form-footer">
                <span className="ct-form-note">* Required fields. We never share your information.</span>
                <button type="submit" className="ct-submit-btn" disabled={submitted}>
                  {submitted ? 'Sent!' : (
                    <>
                      Send Message
                      <Send size={13} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {submitted && (
            <div className="ct-success">
              <div className="ct-success-dot" />
              <div className="ct-success-text">
                Thank you — your message has been received. We'll be in touch within 24 hours.
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="ct-side">

          {/* Office Hours */}
          <div className="ct-panel">
            <div className="ct-panel-header">
              <div className="ct-panel-icon"><Clock size={13} /></div>
              <div className="ct-panel-title">Office Hours</div>
            </div>
            <div className="ct-hours-list">
              {hours.map((h) => (
                <div key={h.day} className="ct-hours-row">
                  <span className="ct-hours-day">{h.day}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      className="ct-hours-dot"
                      style={{ background: h.open ? 'var(--gold)' : 'rgba(138,128,112,0.3)' }}
                    />
                    <span className={`ct-hours-time${h.open ? '' : ' closed'}`}>{h.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="ct-panel" style={{ marginTop: 1 }}>
            <div className="ct-panel-header">
              <div className="ct-panel-icon"><MessageSquare size={13} /></div>
              <div className="ct-panel-title">Frequently Asked</div>
            </div>
            {faqs.map((f, i) => (
              <div key={i} className="ct-faq-item">
                <button
                  className="ct-faq-btn"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="ct-faq-q">{f.q}</span>
                  <ChevronDown
                    size={14}
                    className={`ct-faq-chevron${openFaq === i ? ' open' : ''}`}
                  />
                </button>
                <div className={`ct-faq-answer${openFaq === i ? ' open' : ''}`}>
                  <p className="ct-faq-a">{f.a}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Map ── */}
      <section className="ct-map-section" id="map">
        <div className="ct-map-inner">
          <div className="ct-map-header">
            <h2 className="ct-map-title">
              Visit Our<br /><em>Office</em>
            </h2>
            <div className="ct-map-address">
              Tancot House, Posta<br />
              Dar es Salaam, Tanzania<br />
              P.O. Box 7563
            </div>
          </div>

          <div className="ct-map-placeholder">
            <div className="ct-map-pin">
              <div className="ct-map-pin-icon">
                <MapPin size={22} />
              </div>
              <div>
                <div className="ct-map-pin-label">Oweru HQ</div>
                <div className="ct-map-pin-sub">Tancot House, Posta · Dar es Salaam</div>
              </div>
              <a
                href="https://maps.google.com/?q=Tancot+House+Dar+es+Salaam"
                target="_blank"
                rel="noreferrer"
                className="ct-map-btn"
              >
                Open in Maps
                <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;