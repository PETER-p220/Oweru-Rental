import { Shield, Users, TrendingUp, Award, Clock, MapPin, ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  const stats = [
    { label: 'Active Users',       value: '10,000+', suffix: 'users' },
    { label: 'Properties Listed',  value: '5,000+',  suffix: 'listings' },
    { label: 'Verified Listings',  value: '95%',     suffix: 'accuracy' },
    { label: 'Success Rate',       value: '98%',     suffix: 'satisfaction' },
  ];

  const values = [
    {
      icon: Shield,
      num: '01',
      title: 'Trust & Security',
      description: 'We verify all properties and users to ensure a safe rental experience for every party involved.',
    },
    {
      icon: Users,
      num: '02',
      title: 'Community First',
      description: 'Building a trusted community of landlords, agents, and tenants across Tanzania.',
    },
    {
      icon: TrendingUp,
      num: '03',
      title: 'Innovation',
      description: 'Using technology to simplify the rental process and deliver better everyday experiences.',
    },
    {
      icon: Clock,
      num: '04',
      title: 'Efficiency',
      description: 'Streamlined processes that save time and reduce complexity for all users.',
    },
  ];

  const mission = [
    {
      title: 'For Landlords',
      desc: 'Find reliable tenants quickly, manage properties efficiently, and receive payments securely.',
      icon: MapPin,
    },
    {
      title: 'For Agents',
      desc: 'Track leads and commissions, build your reputation, and grow your business with our tools.',
      icon: TrendingUp,
    },
    {
      title: 'For Tenants',
      desc: 'Browse verified properties, apply online, and enjoy a fully secure rental experience.',
      icon: Shield,
    },
  ];

  return (
    <div style={{ fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif", background: '#f8fafc', color: '#1e293b', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        :root {
          --blue-900: #0f2d6e;
          --blue-800: #1a3f8f;
          --blue-700: #1d4ed8;
          --blue-600: #2563eb;
          --blue-500: #3b82f6;
          --blue-400: #60a5fa;
          --blue-300: #93c5fd;
          --blue-200: #bfdbfe;
          --blue-100: #dbeafe;
          --blue-50:  #eff6ff;
          --white:    #ffffff;
          --gray-50:  #f8fafc;
          --gray-100: #f1f5f9;
          --gray-200: #e2e8f0;
          --gray-300: #cbd5e1;
          --gray-400: #94a3b8;
          --gray-500: #64748b;
          --gray-600: #475569;
          --gray-700: #334155;
          --gray-800: #1e293b;
          --gray-900: #0f172a;
          --shadow-sm: 0 1px 3px rgba(15,45,110,0.08), 0 1px 2px rgba(15,45,110,0.06);
          --shadow-md: 0 4px 12px rgba(15,45,110,0.10), 0 2px 4px rgba(15,45,110,0.06);
          --shadow-lg: 0 10px 30px rgba(15,45,110,0.12), 0 4px 8px rgba(15,45,110,0.06);
        }

        /* ── Hero ── */
        .ab-hero {
          position: relative;
          overflow: hidden;
          min-height: 72vh;
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 45%, var(--blue-700) 100%);
        }

        .ab-hero-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0);
          background-size: 32px 32px;
          pointer-events: none;
        }

        .ab-hero-glow {
          position: absolute;
          right: -5%;
          top: -10%;
          width: 55%;
          height: 80%;
          background: radial-gradient(ellipse, rgba(96,165,250,0.15) 0%, transparent 65%);
          pointer-events: none;
        }

        .ab-hero-watermark {
          position: absolute;
          right: 4%;
          bottom: -4%;
          font-size: clamp(120px, 18vw, 240px);
          font-weight: 700;
          color: transparent;
          -webkit-text-stroke: 1px rgba(255,255,255,0.06);
          line-height: 1;
          user-select: none;
          letter-spacing: -0.05em;
        }

        .ab-hero-inner {
          position: relative;
          z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
          padding: 120px 48px 80px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
          width: 100%;
        }

        .ab-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          color: var(--blue-200);
          padding: 5px 14px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        .ab-eyebrow-dot {
          width: 6px;
          height: 6px;
          background: #4ade80;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .ab-hero-title {
          font-size: clamp(44px, 5.5vw, 72px);
          font-weight: 700;
          line-height: 1.06;
          letter-spacing: -0.03em;
          color: var(--white);
          margin-bottom: 20px;
        }

        .ab-hero-title span { color: var(--blue-300); }

        .ab-hero-text {
          font-size: 16px;
          font-weight: 400;
          line-height: 1.7;
          color: rgba(255,255,255,0.7);
          max-width: 420px;
        }

        /* founding card */
        .ab-founding-card {
          background: var(--white);
          border-radius: 16px;
          padding: 40px;
          box-shadow: var(--shadow-lg);
          position: relative;
          overflow: hidden;
        }

        .ab-founding-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--blue-600), var(--blue-400));
          border-radius: 4px 4px 0 0;
        }

        .founding-year {
          font-size: clamp(64px, 9vw, 104px);
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.04em;
          color: var(--blue-600);
          opacity: 0.15;
          margin-bottom: 8px;
        }

        .founding-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--blue-600);
          margin-bottom: 14px;
          background: var(--blue-50);
          padding: 4px 12px;
          border-radius: 100px;
        }

        .founding-desc {
          font-size: 14px;
          font-weight: 400;
          line-height: 1.7;
          color: var(--gray-500);
        }

        /* ── Stats bar ── */
        .ab-stats {
          background: var(--white);
          border-bottom: 1px solid var(--gray-200);
          box-shadow: var(--shadow-sm);
        }

        .ab-stats-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 48px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }

        .ab-stat {
          padding: 36px 28px;
          border-right: 1px solid var(--gray-200);
          position: relative;
          transition: background 0.25s;
        }

        .ab-stat:last-child { border-right: none; }
        .ab-stat:hover { background: var(--blue-50); }

        .ab-stat::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--blue-500), var(--blue-300));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s ease;
          border-radius: 2px;
        }

        .ab-stat:hover::after { transform: scaleX(1); }

        .ab-stat-num {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: var(--blue-600);
          line-height: 1;
          margin-bottom: 6px;
        }

        .ab-stat-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--gray-700);
          margin-bottom: 3px;
        }

        .ab-stat-suffix {
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.06em;
          color: var(--gray-400);
          text-transform: uppercase;
        }

        /* ── Shared section ── */
        .ab-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 88px 48px;
        }

        .ab-section-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: end;
          margin-bottom: 56px;
        }

        .ab-section-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--blue-600);
          margin-bottom: 14px;
          background: var(--blue-50);
          padding: 4px 12px;
          border-radius: 100px;
        }

        .ab-section-title {
          font-size: clamp(30px, 3.2vw, 46px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.025em;
          color: var(--gray-900);
        }

        .ab-section-title span { color: var(--blue-600); }

        .ab-section-desc {
          font-size: 15px;
          font-weight: 400;
          line-height: 1.75;
          color: var(--gray-500);
          align-self: end;
        }

        /* ── Story ── */
        .ab-story-bg {
          background: var(--white);
          border-top: 1px solid var(--gray-200);
          border-bottom: 1px solid var(--gray-200);
        }

        .ab-story-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 72px;
          align-items: start;
        }

        .ab-story-body {
          font-size: 15px;
          font-weight: 400;
          line-height: 1.8;
          color: var(--gray-500);
        }

        .ab-story-body p { margin-bottom: 18px; }
        .ab-story-body p:last-child { margin-bottom: 0; }

        .ab-story-highlight {
          font-size: 18px;
          font-weight: 500;
          font-style: italic;
          line-height: 1.55;
          color: var(--blue-700);
          border-left: 3px solid var(--blue-500);
          padding: 14px 0 14px 22px;
          margin: 28px 0;
          background: var(--blue-50);
          border-radius: 0 8px 8px 0;
        }

        .ab-timeline {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ab-timeline-item {
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: 10px;
          padding: 20px 24px;
          display: grid;
          grid-template-columns: 64px 1fr;
          gap: 16px;
          align-items: start;
          transition: all 0.2s;
        }

        .ab-timeline-item:hover {
          background: var(--blue-50);
          border-color: var(--blue-200);
          transform: translateX(4px);
        }

        .ab-tl-year {
          font-size: 11px;
          font-weight: 700;
          color: var(--blue-600);
          letter-spacing: 0.06em;
          padding-top: 3px;
          text-transform: uppercase;
        }

        .ab-tl-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: 5px;
        }

        .ab-tl-desc {
          font-size: 13px;
          font-weight: 400;
          line-height: 1.6;
          color: var(--gray-500);
        }

        /* ── Values grid ── */
        .ab-values-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .ab-value-card {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: 12px;
          padding: 32px 28px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
          box-shadow: var(--shadow-sm);
        }

        .ab-value-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--blue-500), var(--blue-300));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s ease;
          border-radius: 3px 3px 0 0;
        }

        .ab-value-card:hover {
          border-color: var(--blue-200);
          box-shadow: var(--shadow-md);
          transform: translateY(-3px);
        }

        .ab-value-card:hover::before { transform: scaleX(1); }

        .ab-value-num {
          position: absolute;
          top: 14px;
          right: 18px;
          font-size: 11px;
          font-weight: 700;
          color: var(--blue-200);
          letter-spacing: 0.08em;
        }

        .ab-value-icon {
          width: 46px;
          height: 46px;
          background: var(--blue-50);
          border: 1.5px solid var(--blue-100);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--blue-600);
          margin-bottom: 20px;
        }

        .ab-value-title {
          font-size: 17px;
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }

        .ab-value-desc {
          font-size: 13px;
          font-weight: 400;
          line-height: 1.7;
          color: var(--gray-500);
        }

        /* ── Mission ── */
        .ab-mission-bg {
          background: linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 50%, var(--blue-700) 100%);
          position: relative;
          overflow: hidden;
        }

        .ab-mission-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .ab-mission-inner {
          position: relative;
          z-index: 1;
        }

        .ab-mission-statement {
          font-size: clamp(19px, 2.4vw, 28px);
          font-weight: 500;
          line-height: 1.5;
          letter-spacing: -0.015em;
          color: var(--white);
          border-left: 3px solid var(--blue-400);
          padding: 18px 0 18px 28px;
          margin-bottom: 56px;
          max-width: 760px;
        }

        .ab-mission-statement span { color: var(--blue-300); font-style: italic; }

        .ab-mission-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .ab-mission-card {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 14px;
          padding: 36px 30px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
          backdrop-filter: blur(8px);
        }

        .ab-mission-card:hover {
          background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.28);
          transform: translateY(-3px);
        }

        .ab-mission-icon {
          width: 42px;
          height: 42px;
          background: rgba(255,255,255,0.12);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--blue-300);
          margin-bottom: 18px;
        }

        .ab-mission-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--white);
          margin-bottom: 10px;
        }

        .ab-mission-desc {
          font-size: 14px;
          font-weight: 400;
          line-height: 1.7;
          color: rgba(255,255,255,0.65);
        }

        /* ── CTA strip ── */
        .ab-cta {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          flex-wrap: wrap;
        }

        .ab-cta-text {
          font-size: clamp(26px, 2.8vw, 40px);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--gray-900);
          line-height: 1.2;
        }

        .ab-cta-text span { color: var(--blue-600); }

        .ab-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--blue-600);
          color: var(--white);
          padding: 14px 28px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
          text-decoration: none;
          border: none;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(37,99,235,0.3);
        }

        .ab-btn-primary:hover {
          background: var(--blue-700);
          gap: 14px;
          box-shadow: 0 4px 16px rgba(37,99,235,0.4);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .ab-values-grid { grid-template-columns: 1fr 1fr; }
          .ab-mission-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 860px) {
          .ab-hero-inner { grid-template-columns: 1fr; gap: 40px; padding: 100px 24px 60px; }
          .ab-hero-watermark { display: none; }
          .ab-stats-inner { grid-template-columns: 1fr 1fr; }
          .ab-section { padding: 60px 24px; }
          .ab-section-header { grid-template-columns: 1fr; gap: 16px; }
          .ab-story-grid { grid-template-columns: 1fr; gap: 40px; }
          .ab-values-grid { grid-template-columns: 1fr; }
          .ab-cta { padding: 60px 24px; flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section className="ab-hero">
        <div className="ab-hero-pattern" />
        <div className="ab-hero-glow" />
        <div className="ab-hero-watermark">2024</div>

        <div className="ab-hero-inner">
          <div>
            <div className="ab-eyebrow">
              <span className="ab-eyebrow-dot" />
              Our Story
            </div>
            <h1 className="ab-hero-title">
              About<br /><span>Oweru</span>
            </h1>
            <p className="ab-hero-text">
              Transforming Tanzania's rental market with technology, trust, and
              transparency. We're making property rental simple, secure, and
              accessible for everyone — everywhere.
            </p>
          </div>

          <div className="ab-founding-card">
            <div className="founding-year">2024</div>
            <div className="founding-label">Founded</div>
            <p className="founding-desc">
              Born from a simple observation: Tanzania's rental market was
              fragmented, inefficient, and lacked trust. We set out to fix that.
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="ab-stats">
        <div className="ab-stats-inner">
          {stats.map((s) => (
            <div key={s.label} className="ab-stat">
              <div className="ab-stat-num">{s.value}</div>
              <div className="ab-stat-label">{s.label}</div>
              <div className="ab-stat-suffix">{s.suffix}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Our Story ── */}
      <div className="ab-story-bg">
        <div className="ab-section">
          <div className="ab-section-header">
            <div>
              <div className="ab-section-eyebrow">Background</div>
              <h2 className="ab-section-title">
                Our <span>Story</span>
              </h2>
            </div>
            <p className="ab-section-desc">
              From a fragmented market to Tanzania's fastest-growing rental platform —
              here's how we got here.
            </p>
          </div>

          <div className="ab-story-grid">
            <div>
              <div className="ab-story-body">
                <p>
                  Founded in 2024, Oweru was born from a simple observation: Tanzania's
                  rental market was fragmented, inefficient, and lacked trust. Landlords
                  struggled to find reliable tenants, agents lacked proper tools to track
                  their performance, and tenants faced uncertainty in their search for
                  quality housing.
                </p>

                <div className="ab-story-highlight">
                  "We set out to bring transparency, efficiency, and security to
                  every corner of the rental process."
                </div>

                <p>
                  Our smart tracking system ensures agents get credited for their
                  work, our verification process builds trust, and our streamlined
                  application process makes renting simple for everyone.
                </p>
                <p>
                  Today, Oweru is Tanzania's fastest-growing rental platform,
                  connecting thousands of landlords, agents, and tenants across the country.
                </p>
              </div>
            </div>

            <div className="ab-timeline">
              {[
                { year: 'Q1 2024', title: 'Platform Founded',     desc: "Oweru launched with a mission to fix Tanzania's fragmented rental market." },
                { year: 'Q2 2024', title: 'First 1,000 Listings', desc: 'Reached our first milestone with verified properties across Dar es Salaam.' },
                { year: 'Q3 2024', title: 'Agent Dashboard Live', desc: 'Launched our agent tracking system, helping professionals grow their business.' },
                { year: 'Q4 2024', title: '10,000 Active Users',  desc: 'Crossed the milestone with landlords, agents, and tenants on board nationwide.' },
                { year: '2025',    title: 'National Expansion',   desc: 'Expanding to Arusha, Mwanza, Dodoma, and beyond across Tanzania.' },
              ].map((t) => (
                <div key={t.year} className="ab-timeline-item">
                  <div className="ab-tl-year">{t.year}</div>
                  <div>
                    <div className="ab-tl-title">{t.title}</div>
                    <div className="ab-tl-desc">{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Values ── */}
      <section style={{ background: 'var(--gray-50)', borderTop: '1px solid var(--gray-200)' }}>
        <div className="ab-section">
          <div className="ab-section-header">
            <div>
              <div className="ab-section-eyebrow">What Drives Us</div>
              <h2 className="ab-section-title">
                Our <span>Values</span>
              </h2>
            </div>
            <p className="ab-section-desc">
              The principles that guide every decision we make at Oweru —
              from product design to customer support.
            </p>
          </div>

          <div className="ab-values-grid">
            {values.map((v) => (
              <div key={v.title} className="ab-value-card">
                <div className="ab-value-num">{v.num}</div>
                <div className="ab-value-icon"><v.icon size={18} /></div>
                <div className="ab-value-title">{v.title}</div>
                <div className="ab-value-desc">{v.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="ab-mission-bg">
        <div className="ab-mission-pattern" />
        <div className="ab-mission-inner">
          <div className="ab-section">
            <div className="ab-section-eyebrow" style={{ marginBottom: 28, background: 'rgba(255,255,255,0.12)', color: 'var(--blue-200)' }}>Why We Exist</div>
            <div className="ab-mission-statement">
              To make <span>quality housing</span> accessible to everyone in Tanzania, while creating a
              transparent, efficient, and trustworthy rental ecosystem that benefits
              landlords, agents, and tenants <span>alike.</span>
            </div>

            <div className="ab-mission-grid">
              {mission.map((m) => (
                <div key={m.title} className="ab-mission-card">
                  <div className="ab-mission-icon"><m.icon size={18} /></div>
                  <div className="ab-mission-title">{m.title}</div>
                  <div className="ab-mission-desc">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'var(--white)', borderTop: '1px solid var(--gray-200)' }}>
        <div className="ab-cta">
          <div className="ab-cta-text">
            Ready to experience<br /><span>Oweru?</span>
          </div>
          <Link to="/properties" className="ab-btn-primary">
            Browse Properties
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;