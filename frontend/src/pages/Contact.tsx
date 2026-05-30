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
    { icon: Phone,  label: 'Phone',   value: '+255 711 890 764',    sub: 'Mon–Fri  9AM – 6PM',       href: 'tel:+255711890764' },
    { icon: Mail,   label: 'Email',   value: 'info@oweru.com',      sub: 'Response within 24 hours', href: 'mailto:info@oweru.com' },
    { icon: MapPin, label: 'Office',  value: 'Tancot House, Posta', sub: 'Dar es Salaam, Africa',  href: '#map' },
    { icon: Globe,  label: 'Website', value: 'www.oweru.com',       sub: 'Available 24 / 7',         href: 'https://www.oweru.com' },
  ];

  const hours = [
    { day: 'Monday – Friday', time: '9:00 AM – 6:00 PM', open: true  },
    { day: 'Saturday',        time: '9:00 AM – 2:00 PM', open: true  },
    { day: 'Sunday',          time: 'Closed',             open: false },
  ];

  const faqs = [
    { q: 'How do I list my property on Oweru?',
      a: 'Create an account, click "List Property", and fill in the details. Our team will verify your listing within 24 hours.' },
    { q: 'Is Oweru available outside Dar es Salaam?',
      a: "We're currently focused on Dar es Salaam but expanding to Arusha, Mwanza, and Dodoma soon." },
    { q: 'How does the commission system work for agents?',
      a: 'Agents earn commission on successful rentals through their referral links. Our dashboard tracks all leads and conversions automatically.' },
    { q: 'Are all properties on Oweru verified?',
      a: 'Yes — every property goes through our verification process to ensure accuracy and prevent fraud before it goes live.' },
  ];

  return (
    <div style={{ fontFamily: "'Jost', 'Futura PT', sans-serif", background: '#0F172A', color: '#F8F8F9', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;1,300&display=swap');

        * { box-sizing: border-box; }

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
          --border-faint: rgba(200,145,40,0.08);
        }

        /* ── Hero ── */
        .ct-hero {
          position: relative;
          overflow: hidden;
          min-height: 56vh;
          display: flex;
          align-items: center;
          border-bottom: 1px solid var(--border);
          background: var(--navy-900);
        }

        .ct-hero-geo {
          position: absolute; inset: 0;
          background-image:
            repeating-linear-gradient(60deg, transparent, transparent 30px, rgba(200,145,40,0.025) 30px, rgba(200,145,40,0.025) 31px),
            repeating-linear-gradient(-60deg, transparent, transparent 30px, rgba(200,145,40,0.025) 30px, rgba(200,145,40,0.025) 31px);
        }

        .ct-hero-glow {
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(200,145,40,0.07) 0%, transparent 60%);
          top: -100px; right: -100px;
          pointer-events: none;
        }

        .ct-hero-inner {
          position: relative; z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
          padding: 130px 48px 90px;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .ct-tag {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 20px;
        }

        .ct-tag::before { content: ''; width: 28px; height: 2px; background: var(--gold); }

        .ct-hero-h1 {
          font-size: clamp(44px, 5.5vw, 72px);
          font-weight: 300;
          line-height: 1.02;
          letter-spacing: -0.025em;
          color: var(--cream);
          margin-bottom: 20px;
        }

        .ct-hero-h1 b { font-weight: 700; color: var(--gold); display: block; }

        .ct-hero-text {
          font-size: 15px;
          font-weight: 300;
          line-height: 1.75;
          color: var(--slate);
          max-width: 380px;
        }

        /* promise card */
        .ct-promise {
          background: var(--navy-800);
          border: 1px solid var(--border);
          padding: 40px 36px;
          position: relative;
          overflow: hidden;
        }

        .ct-promise::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent);
        }

        .ct-promise-num {
          font-size: 72px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.04em;
          color: transparent;
          -webkit-text-stroke: 1.5px var(--gold);
          margin-bottom: 12px;
        }

        .ct-promise-lbl {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ct-promise-lbl::after { content: ''; flex: 1; height: 1px; background: var(--border); }

        .ct-promise-desc {
          font-size: 14px;
          font-weight: 300;
          line-height: 1.7;
          color: var(--slate);
        }

        /* ── Info bar ── */
        .ct-info-bar {
          background: var(--navy-800);
          border-bottom: 1px solid var(--border);
        }

        .ct-info-grid {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 48px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-left: 1px solid var(--border);
        }

        .ct-info-card {
          padding: 32px 28px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          text-decoration: none;
          border-right: 1px solid var(--border);
          position: relative;
          overflow: hidden;
          transition: background 0.25s;
        }

        .ct-info-card::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px;
          background: var(--gold);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s;
        }

        .ct-info-card:hover { background: rgba(200,145,40,0.04); }
        .ct-info-card:hover::after { transform: scaleX(1); }

        .ct-info-icon {
          width: 36px; height: 36px;
          background: var(--gold-dim);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .ct-info-lbl {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 5px;
        }

        .ct-info-val {
          font-size: 15px;
          font-weight: 500;
          color: var(--cream);
          margin-bottom: 3px;
        }

        .ct-info-sub {
          font-size: 11px;
          font-weight: 300;
          color: rgba(148,163,184,0.6);
        }

        /* ── Body ── */
        .ct-body {
          max-width: 1200px;
          margin: 0 auto;
          padding: 88px 48px;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 64px;
          align-items: start;
        }

        .ct-form-tag {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ct-form-tag::after { content: ''; flex: 1; height: 1px; background: var(--border); }

        .ct-form-title {
          font-size: clamp(28px, 2.8vw, 40px);
          font-weight: 300;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: var(--cream);
          margin-bottom: 36px;
        }

        .ct-form-title b { font-weight: 700; color: var(--gold); }

        .ct-form-wrap {
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .ct-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid var(--border);
        }

        .ct-field {
          background: var(--navy-800);
          display: flex;
          flex-direction: column;
          transition: background 0.2s;
        }

        .ct-field:focus-within { background: rgba(200,145,40,0.04); }

        .ct-field + .ct-field { border-left: 1px solid var(--border); }

        .ct-field-lbl {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
          padding: 13px 18px 0;
        }

        .ct-input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--cream);
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          font-weight: 400;
          padding: 5px 18px 13px;
          width: 100%;
        }

        .ct-input::placeholder { color: rgba(148,163,184,0.4); }

        .ct-select {
          background: transparent;
          border: none;
          outline: none;
          color: var(--cream);
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          font-weight: 400;
          padding: 5px 18px 13px;
          width: 100%;
          cursor: pointer;
          appearance: none;
        }

        .ct-select option { background: #1E2D4A; color: var(--cream); }

        .ct-full {
          background: var(--navy-800);
          border-bottom: 1px solid var(--border);
          transition: background 0.2s;
        }

        .ct-full:focus-within { background: rgba(200,145,40,0.04); }

        .ct-textarea {
          background: transparent;
          border: none;
          outline: none;
          color: var(--cream);
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          font-weight: 400;
          padding: 5px 18px 18px;
          width: 100%;
          resize: none;
          line-height: 1.65;
        }

        .ct-textarea::placeholder { color: rgba(148,163,184,0.4); }

        .ct-form-foot {
          background: var(--navy-900);
          padding: 18px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .ct-form-note {
          font-size: 11px;
          font-weight: 300;
          color: rgba(148,163,184,0.45);
        }

        .ct-submit {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          background: var(--gold);
          color: var(--navy-900);
          padding: 12px 24px;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .ct-submit:hover { background: var(--gold-lt); gap: 13px; }
        .ct-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .ct-success {
          margin-top: 14px;
          background: rgba(200,145,40,0.08);
          border: 1px solid rgba(200,145,40,0.3);
          padding: 18px 22px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ct-success-dot {
          width: 8px; height: 8px;
          background: var(--gold);
          border-radius: 50%;
          flex-shrink: 0;
          animation: pulse-dot 1.5s infinite;
        }

        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }

        .ct-success-txt {
          font-size: 13px;
          font-weight: 400;
          color: var(--cream);
        }

        /* ── Side ── */
        .ct-side { display: flex; flex-direction: column; gap: 1px; }

        .ct-panel {
          background: var(--navy-800);
          border: 1px solid var(--border);
          overflow: hidden;
          position: relative;
          margin-bottom: 1px;
        }

        .ct-panel::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
        }

        .ct-panel-hdr {
          padding: 18px 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--border-faint);
        }

        .ct-panel-icon {
          width: 30px; height: 30px;
          background: var(--gold-dim);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold);
          flex-shrink: 0;
        }

        .ct-panel-title {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
        }

        .ct-hours-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          border-bottom: 1px solid var(--border-faint);
        }

        .ct-hours-row:last-child { border-bottom: none; }

        .ct-hours-day { font-size: 13px; font-weight: 300; color: var(--slate); }

        .ct-hours-time { font-size: 13px; font-weight: 500; color: var(--cream); }
        .ct-hours-time.closed { color: rgba(148,163,184,0.4); }

        .ct-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* FAQ */
        .ct-faq-item { border-bottom: 1px solid var(--border-faint); }
        .ct-faq-item:last-child { border-bottom: none; }

        .ct-faq-btn {
          width: 100%;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 17px 24px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s;
        }

        .ct-faq-btn:hover { background: rgba(200,145,40,0.04); }

        .ct-faq-q { font-size: 13px; font-weight: 500; color: var(--cream); line-height: 1.5; }

        .ct-faq-chev {
          color: var(--gold);
          flex-shrink: 0;
          margin-top: 2px;
          transition: transform 0.3s;
        }

        .ct-faq-chev.open { transform: rotate(180deg); }

        .ct-faq-ans {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.35s ease, padding 0.35s ease;
          padding: 0 24px;
        }

        .ct-faq-ans.open { max-height: 200px; padding: 0 24px 18px; }

        .ct-faq-a {
          font-size: 13px;
          font-weight: 300;
          line-height: 1.7;
          color: var(--slate);
        }

        /* ── Map ── */
        .ct-map-section {
          background: var(--navy-800);
          border-top: 1px solid var(--border);
        }

        .ct-map-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 48px;
        }

        .ct-map-hdr {
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
          letter-spacing: -0.02em;
          color: var(--cream);
        }

        .ct-map-title b { font-weight: 700; color: var(--gold); }

        .ct-map-addr {
          font-size: 13px;
          font-weight: 300;
          color: var(--slate);
          text-align: right;
          line-height: 1.65;
        }

        .ct-map-box {
          border: 1px solid var(--border);
          height: 380px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--navy-900);
          position: relative;
          overflow: hidden;
        }

        .ct-map-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(200,145,40,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200,145,40,0.04) 1px, transparent 1px);
          background-size: 36px 36px;
        }

        .ct-map-pin {
          position: relative; z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          text-align: center;
        }

        .ct-pin-icon {
          width: 56px; height: 56px;
          background: var(--gold-dim);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold);
        }

        .ct-pin-label { font-size: 15px; font-weight: 600; color: var(--cream); }
        .ct-pin-sub { font-size: 12px; font-weight: 300; color: var(--slate); }

        .ct-map-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--gold);
          color: var(--navy-900);
          padding: 11px 22px;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          margin-top: 6px;
          transition: background 0.2s;
        }

        .ct-map-btn:hover { background: var(--gold-lt); }

        /* Responsive */
        @media (max-width: 1024px) {
          .ct-info-grid { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 860px) {
          .ct-hero-inner { grid-template-columns: 1fr; gap: 40px; padding: 100px 24px 60px; }
          .ct-info-grid { grid-template-columns: 1fr 1fr; padding: 0 24px; }
          .ct-body { grid-template-columns: 1fr; padding: 60px 24px; gap: 48px; }
          .ct-map-inner { padding: 60px 24px; }
          .ct-map-hdr { flex-direction: column; align-items: flex-start; }
          .ct-map-addr { text-align: left; }
        }

        @media (max-width: 560px) {
          .ct-info-grid { grid-template-columns: 1fr; }
          .ct-row { grid-template-columns: 1fr; }
          .ct-field + .ct-field { border-left: none; border-top: 1px solid var(--border); }
        }
      `}</style>

      {/* ── Hero ── */}
      <section className="ct-hero">
        <div className="ct-hero-geo" />
        <div className="ct-hero-glow" />
        <div className="ct-hero-inner">
          <div>
            <div className="ct-tag">Get in Touch</div>
            <h1 className="ct-hero-h1">
              Contact<br />
              <b>Oweru</b>
            </h1>
            <p className="ct-hero-text">
              Have questions or need assistance? Our team is here to help.
              Reach out and we'll respond as quickly as possible.
            </p>
          </div>

          <div className="ct-promise">
            <div className="ct-promise-num">24h</div>
            <div className="ct-promise-lbl">Response Promise</div>
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

      {/* ── Body ── */}
      <div className="ct-body">

        {/* Form */}
        <div>
          <div className="ct-form-tag">Direct Message</div>
          <h2 className="ct-form-title">Send Us a <b>Message</b></h2>

          <form onSubmit={handleSubmit}>
            <div className="ct-form-wrap">
              {/* Name + Email */}
              <div className="ct-row">
                <div className="ct-field">
                  <div className="ct-field-lbl">Full Name *</div>
                  <input className="ct-input" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" required />
                </div>
                <div className="ct-field">
                  <div className="ct-field-lbl">Email *</div>
                  <input className="ct-input" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" required />
                </div>
              </div>

              {/* Phone + Subject */}
              <div className="ct-row">
                <div className="ct-field">
                  <div className="ct-field-lbl">Phone</div>
                  <input className="ct-input" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+255 XXX XXX XXX" />
                </div>
                <div className="ct-field">
                  <div className="ct-field-lbl">Subject *</div>
                  <select className="ct-select" name="subject" value={formData.subject} onChange={handleChange} required>
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
              <div className="ct-full">
                <div className="ct-field-lbl" style={{ padding: '13px 18px 0' }}>Message *</div>
                <textarea className="ct-textarea" name="message" value={formData.message} onChange={handleChange} placeholder="Tell us how we can help…" rows={5} required />
              </div>

              <div className="ct-form-foot">
                <span className="ct-form-note">* Required fields. We never share your information.</span>
                <button type="submit" className="ct-submit" disabled={submitted}>
                  {submitted ? 'Sent!' : <><Send size={12} /> Send Message</>}
                </button>
              </div>
            </div>
          </form>

          {submitted && (
            <div className="ct-success">
              <div className="ct-success-dot" />
              <div className="ct-success-txt">
                Thank you — your message has been received. We'll be in touch within 24 hours.
              </div>
            </div>
          )}
        </div>

        {/* Side */}
        <div className="ct-side">

          {/* Hours */}
          <div className="ct-panel">
            <div className="ct-panel-hdr">
              <div className="ct-panel-icon"><Clock size={13} /></div>
              <div className="ct-panel-title">Office Hours</div>
            </div>
            {hours.map((h) => (
              <div key={h.day} className="ct-hours-row">
                <span className="ct-hours-day">{h.day}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="ct-dot" style={{ background: h.open ? 'var(--gold)' : 'rgba(148,163,184,0.3)' }} />
                  <span className={`ct-hours-time${h.open ? '' : ' closed'}`}>{h.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="ct-panel">
            <div className="ct-panel-hdr">
              <div className="ct-panel-icon"><MessageSquare size={13} /></div>
              <div className="ct-panel-title">Frequently Asked</div>
            </div>
            {faqs.map((f, i) => (
              <div key={i} className="ct-faq-item">
                <button className="ct-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="ct-faq-q">{f.q}</span>
                  <ChevronDown size={14} className={`ct-faq-chev${openFaq === i ? ' open' : ''}`} />
                </button>
                <div className={`ct-faq-ans${openFaq === i ? ' open' : ''}`}>
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
          <div className="ct-map-hdr">
            <h2 className="ct-map-title">Visit Our <b>Office</b></h2>
            <div className="ct-map-addr">
              Tancot House, Posta<br />
              Dar es Salaam, Africa<br />
              P.O. Box 7563
            </div>
          </div>

          <div className="ct-map-box">
            <div className="ct-map-grid" />
            <div className="ct-map-pin">
              <div className="ct-pin-icon"><MapPin size={22} /></div>
              <div>
                <div className="ct-pin-label">Oweru HQ</div>
                <div className="ct-pin-sub">Tancot House, Posta · Dar es Salaam</div>
              </div>
              <a href="https://maps.google.com/?q=Tancot+House+Dar+es+Salaam" target="_blank" rel="noreferrer" className="ct-map-btn">
                Open in Maps <ArrowRight size={12} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;