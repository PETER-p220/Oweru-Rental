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
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

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

        .ab-sans { font-family: 'DM Sans', sans-serif; }

        /* ── Hero ── */
        .ab-hero {
          position: relative;
          overflow: hidden;
          min-height: 72vh;
          display: flex;
          align-items: center;
          border-bottom: 1px solid var(--border);
        }

        .ab-hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 80% at 80% 40%, rgba(201,168,76,0.07) 0%, transparent 55%),
            radial-gradient(ellipse 40% 60% at 10% 90%, rgba(201,168,76,0.04) 0%, transparent 50%),
            linear-gradient(160deg, #0d0d0b 0%, #0a0a0a 100%);
        }

        .ab-hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 100%);
        }

        .ab-hero-watermark {
          position: absolute;
          right: 4%;
          bottom: -4%;
          font-size: clamp(120px, 18vw, 240px);
          font-weight: 700;
          color: transparent;
          -webkit-text-stroke: 1px rgba(201,168,76,0.06);
          line-height: 1;
          user-select: none;
          letter-spacing: -0.05em;
        }

        .ab-hero-inner {
          position: relative;
          z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
          padding: 120px 40px 80px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
          width: 100%;
        }

        .ab-eyebrow {
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

        .ab-eyebrow::before {
          content: '';
          width: 28px;
          height: 1px;
          background: var(--gold);
        }

        .ab-hero-title {
          font-size: clamp(44px, 6vw, 80px);
          font-weight: 300;
          line-height: 1.02;
          letter-spacing: -0.03em;
          color: var(--cream);
          margin-bottom: 24px;
        }

        .ab-hero-title em {
          font-style: italic;
          color: var(--gold-light);
        }

        .ab-hero-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 300;
          line-height: 1.75;
          color: var(--muted);
          max-width: 400px;
        }

        /* founding card */
        .ab-founding-card {
          background: rgba(201,168,76,0.04);
          border: 1px solid var(--border);
          padding: 48px 40px;
          position: relative;
          overflow: hidden;
        }

        .ab-founding-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }

        .ab-founding-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; top: 0;
          width: 1px;
          background: linear-gradient(to bottom, var(--gold), transparent);
        }

        .founding-year {
          font-size: clamp(72px, 10vw, 120px);
          font-weight: 300;
          line-height: 1;
          letter-spacing: -0.04em;
          color: transparent;
          -webkit-text-stroke: 1px var(--gold);
          margin-bottom: 12px;
        }

        .founding-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .founding-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .founding-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          line-height: 1.7;
          color: var(--muted);
        }

        /* ── Stats bar ── */
        .ab-stats {
          background: var(--dark-3);
          border-bottom: 1px solid var(--border);
        }

        .ab-stats-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: var(--border);
          gap: 1px;
        }

        .ab-stat {
          background: var(--dark-3);
          padding: 36px 32px;
          position: relative;
          transition: background 0.3s;
        }

        .ab-stat:hover { background: rgba(26,26,26,0.9); }

        .ab-stat::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, var(--gold), transparent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s;
        }

        .ab-stat:hover::after { transform: scaleX(1); }

        .ab-stat-num {
          font-size: 38px;
          font-weight: 300;
          letter-spacing: -0.03em;
          color: var(--gold);
          line-height: 1;
          margin-bottom: 6px;
        }

        .ab-stat-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 4px;
        }

        .ab-stat-suffix {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 300;
          letter-spacing: 0.08em;
          color: rgba(138,128,112,0.35);
          text-transform: uppercase;
        }

        /* ── Shared section ── */
        .ab-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 100px 40px;
        }

        .ab-section-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: end;
          margin-bottom: 64px;
        }

        .ab-section-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ab-section-eyebrow::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .ab-section-title {
          font-size: clamp(32px, 3.5vw, 52px);
          font-weight: 300;
          line-height: 1.08;
          letter-spacing: -0.025em;
          color: var(--cream);
        }

        .ab-section-title em { font-style: italic; color: var(--gold-light); }

        .ab-section-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 300;
          line-height: 1.75;
          color: var(--muted);
          align-self: end;
        }

        /* ── Story ── */
        .ab-story-bg {
          background: var(--dark-3);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .ab-story-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: start;
        }

        .ab-story-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 300;
          line-height: 1.8;
          color: var(--muted);
        }

        .ab-story-body p { margin-bottom: 20px; }
        .ab-story-body p:last-child { margin-bottom: 0; }

        .ab-story-highlight {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 300;
          font-style: italic;
          line-height: 1.5;
          color: rgba(201,168,76,0.7);
          border-left: 2px solid var(--gold);
          padding: 16px 0 16px 24px;
          margin: 28px 0;
        }

        .ab-timeline {
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
        }

        .ab-timeline-item {
          background: var(--dark-2);
          padding: 24px 28px;
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 20px;
          align-items: start;
          transition: background 0.2s;
        }

        .ab-timeline-item:hover { background: rgba(26,26,26,0.9); }

        .ab-tl-year {
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          color: var(--gold);
          letter-spacing: 0.08em;
          padding-top: 3px;
        }

        .ab-tl-title {
          font-size: 17px;
          font-weight: 400;
          color: var(--cream);
          margin-bottom: 6px;
          letter-spacing: -0.01em;
        }

        .ab-tl-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          line-height: 1.6;
          color: var(--muted);
        }

        /* ── Values grid ── */
        .ab-values-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
        }

        .ab-value-card {
          background: var(--dark-2);
          padding: 40px 32px;
          position: relative;
          overflow: hidden;
          transition: background 0.3s;
        }

        .ab-value-card:hover { background: rgba(22,22,22,0.95); }

        .ab-value-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.45s ease;
        }

        .ab-value-card:hover::after { transform: scaleX(1); }

        .ab-value-num {
          position: absolute;
          top: 16px;
          right: 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: rgba(201,168,76,0.18);
          letter-spacing: 0.1em;
        }

        .ab-value-icon {
          width: 44px;
          height: 44px;
          background: rgba(201,168,76,0.07);
          border: 1px solid rgba(201,168,76,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gold);
          margin-bottom: 22px;
        }

        .ab-value-title {
          font-size: 19px;
          font-weight: 400;
          color: var(--cream);
          margin-bottom: 12px;
          letter-spacing: -0.01em;
        }

        .ab-value-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          line-height: 1.7;
          color: var(--muted);
        }

        /* ── Mission ── */
        .ab-mission-bg {
          position: relative;
          overflow: hidden;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .ab-mission-radial {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 80% at 50% 50%, rgba(201,168,76,0.05) 0%, transparent 60%);
          pointer-events: none;
        }

        .ab-mission-inner {
          position: relative;
          z-index: 1;
        }

        .ab-mission-statement {
          font-size: clamp(22px, 2.8vw, 34px);
          font-weight: 300;
          line-height: 1.4;
          letter-spacing: -0.015em;
          color: var(--cream);
          border-left: 2px solid var(--gold);
          padding: 20px 0 20px 32px;
          margin-bottom: 64px;
          max-width: 780px;
        }

        .ab-mission-statement em { font-style: italic; color: var(--gold-light); }

        .ab-mission-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
        }

        .ab-mission-card {
          background: rgba(14,14,12,0.95);
          padding: 40px 36px;
          position: relative;
          overflow: hidden;
          transition: background 0.3s;
        }

        .ab-mission-card:hover { background: rgba(20,20,16,0.95); }

        .ab-mission-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, var(--gold), transparent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s;
        }

        .ab-mission-card:hover::before { transform: scaleX(1); }

        .ab-mission-icon {
          width: 40px;
          height: 40px;
          background: rgba(201,168,76,0.06);
          border: 1px solid rgba(201,168,76,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gold);
          margin-bottom: 20px;
        }

        .ab-mission-title {
          font-size: 20px;
          font-weight: 400;
          color: var(--gold-light);
          margin-bottom: 12px;
          letter-spacing: -0.01em;
        }

        .ab-mission-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          line-height: 1.7;
          color: var(--muted);
        }

        /* ── CTA strip ── */
        .ab-cta {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          flex-wrap: wrap;
        }

        .ab-cta-text {
          font-size: clamp(28px, 3vw, 42px);
          font-weight: 300;
          letter-spacing: -0.02em;
          color: var(--cream);
        }

        .ab-cta-text em { font-style: italic; color: var(--gold-light); }

        .ab-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--gold);
          color: #0a0a0a;
          padding: 14px 28px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
          white-space: nowrap;
          flex-shrink: 0;
        }

        .ab-btn-primary:hover { background: var(--gold-light); gap: 16px; }

        /* Responsive */
        @media (max-width: 1024px) {
          .ab-values-grid { grid-template-columns: 1fr 1fr; }
          .ab-mission-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 860px) {
          .ab-hero-inner { grid-template-columns: 1fr; gap: 48px; padding: 100px 24px 60px; }
          .ab-hero-watermark { display: none; }
          .ab-stats-inner { grid-template-columns: 1fr 1fr; }
          .ab-section { padding: 70px 24px; }
          .ab-section-header { grid-template-columns: 1fr; gap: 20px; }
          .ab-story-grid { grid-template-columns: 1fr; gap: 48px; }
          .ab-values-grid { grid-template-columns: 1fr; }
          .ab-cta { padding: 60px 24px; flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section className="ab-hero">
        <div className="ab-hero-bg" />
        <div className="ab-hero-grid" />
        <div className="ab-hero-watermark">2024</div>

        <div className="ab-hero-inner">
          <div>
            <div className="ab-eyebrow">Our Story</div>
            <h1 className="ab-hero-title">
              About<br /><em>Oweru</em>
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
                Our<br /><em>Story</em>
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
                { year: 'Q1 2024', title: 'Platform Founded',       desc: 'Oweru launched with a mission to fix Tanzania\'s fragmented rental market.' },
                { year: 'Q2 2024', title: 'First 1,000 Listings',   desc: 'Reached our first milestone with verified properties across Dar es Salaam.' },
                { year: 'Q3 2024', title: 'Agent Dashboard Live',   desc: 'Launched our agent tracking system, helping professionals grow their business.' },
                { year: 'Q4 2024', title: '10,000 Active Users',    desc: 'Crossed the milestone with landlords, agents, and tenants on board nationwide.' },
                { year: '2025',    title: 'National Expansion',     desc: 'Expanding to Arusha, Mwanza, Dodoma, and beyond across Tanzania.' },
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
      <section style={{ background: 'var(--dark)' }}>
        <div className="ab-section">
          <div className="ab-section-header">
            <div>
              <div className="ab-section-eyebrow">What Drives Us</div>
              <h2 className="ab-section-title">
                Our<br /><em>Values</em>
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
        <div className="ab-mission-radial" />
        <div className="ab-mission-inner">
          <div className="ab-section">
            <div className="ab-section-eyebrow" style={{ marginBottom: 28 }}>Why We Exist</div>
            <div className="ab-mission-statement">
              To make <em>quality housing</em> accessible to everyone in Tanzania, while creating a 
              transparent, efficient, and trustworthy rental ecosystem that benefits 
              landlords, agents, and tenants <em>alike.</em>
            </div>

            <div className="ab-mission-grid">
              {mission.map((m) => (
                <div key={m.title} className="ab-mission-card">
                  <div className="ab-mission-icon"><m.icon size={17} /></div>
                  <div className="ab-mission-title">{m.title}</div>
                  <div className="ab-mission-desc">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ borderTop: '1px solid var(--border)' }}>
        <div className="ab-cta">
          <div className="ab-cta-text">
            Ready to experience<br /><em>Oweru?</em>
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