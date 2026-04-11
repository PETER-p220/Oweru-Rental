import { Shield, Users, TrendingUp, Clock, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  const stats = [
    { label: 'Active Users',      value: '10,000+', suffix: 'users'        },
    { label: 'Properties Listed', value: '5,000+',  suffix: 'listings'     },
    { label: 'Verified Listings', value: '95%',     suffix: 'accuracy'     },
    { label: 'Success Rate',      value: '98%',     suffix: 'satisfaction' },
  ];

  const values = [
    { icon: Shield,     num: '01', title: 'Trust & Security', description: 'We verify all properties and users to ensure a safe rental experience for every party involved.' },
    { icon: Users,      num: '02', title: 'Community First',  description: 'Building a trusted community of landlords, agents, and tenants across Tanzania.' },
    { icon: TrendingUp, num: '03', title: 'Innovation',       description: 'Using technology to simplify the rental process and deliver better everyday experiences.' },
    { icon: Clock,      num: '04', title: 'Efficiency',       description: 'Streamlined processes that save time and reduce complexity for all users.' },
  ];

  const mission = [
    { title: 'For Landlords', desc: 'Find reliable tenants quickly, manage properties efficiently, and receive payments securely.', icon: MapPin    },
    { title: 'For Agents',    desc: 'Track leads and commissions, build your reputation, and grow your business with our tools.',  icon: TrendingUp },
    { title: 'For Tenants',   desc: 'Browse verified properties, apply online, and enjoy a fully secure rental experience.',       icon: Shield    },
  ];

  return (
    <div style={{ fontFamily: "'Jost', 'Futura PT', sans-serif", background: '#0F172A', color: '#F8F8F9', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700;800&display=swap');
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
          --border-f: rgba(200,145,40,0.08);
        }

        /* ── Hero ── */
        .ab-hero {
          position: relative;
          overflow: hidden;
          min-height: 72vh;
          display: flex;
          align-items: center;
          background: var(--navy-900);
          border-bottom: 1px solid var(--border);
        }

        .ab-hero-geo {
          position: absolute; inset: 0;
          background-image:
            repeating-linear-gradient(60deg, transparent, transparent 30px, rgba(200,145,40,0.025) 30px, rgba(200,145,40,0.025) 31px),
            repeating-linear-gradient(-60deg, transparent, transparent 30px, rgba(200,145,40,0.025) 30px, rgba(200,145,40,0.025) 31px);
          pointer-events: none;
        }

        .ab-hero-glow {
          position: absolute;
          right: -8%; top: -15%;
          width: 55%; height: 80%;
          background: radial-gradient(ellipse, rgba(200,145,40,0.06) 0%, transparent 65%);
          pointer-events: none;
        }

        .ab-hero-wm {
          position: absolute;
          right: 4%; bottom: -4%;
          font-size: clamp(120px, 18vw, 240px);
          font-weight: 800;
          color: transparent;
          -webkit-text-stroke: 1px rgba(200,145,40,0.05);
          line-height: 1;
          user-select: none;
          letter-spacing: -0.05em;
        }

        .ab-hero-inner {
          position: relative; z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
          padding: 130px 48px 90px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
          width: 100%;
        }

        .ab-tag {
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

        .ab-tag::before { content: ''; width: 28px; height: 2px; background: var(--gold); }

        .ab-hero-h1 {
          font-size: clamp(44px, 5.5vw, 72px);
          font-weight: 300;
          line-height: 1.02;
          letter-spacing: -0.025em;
          color: var(--cream);
          margin-bottom: 20px;
        }

        .ab-hero-h1 b { font-weight: 800; color: var(--gold); display: block; }

        .ab-hero-p {
          font-size: 16px;
          font-weight: 300;
          line-height: 1.75;
          color: var(--slate);
          max-width: 400px;
        }

        /* founding card */
        .ab-founding {
          background: var(--navy-800);
          border: 1px solid var(--border);
          padding: 40px;
          position: relative;
          overflow: hidden;
        }

        .ab-founding::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--gold);
        }

        .founding-yr {
          font-size: clamp(64px, 9vw, 96px);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.05em;
          color: transparent;
          -webkit-text-stroke: 1px rgba(200,145,40,0.25);
          margin-bottom: 10px;
        }

        .founding-lbl {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .founding-lbl::after { content: ''; flex: 1; height: 1px; background: var(--border); }

        .founding-desc {
          font-size: 14px;
          font-weight: 300;
          line-height: 1.75;
          color: var(--slate);
        }

        /* ── Stats bar ── */
        .ab-stats { background: var(--navy-800); border-bottom: 1px solid var(--border); }

        .ab-stats-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-left: 1px solid var(--border);
        }

        .ab-stat {
          padding: 36px 32px;
          border-right: 1px solid var(--border);
          position: relative;
          transition: background 0.25s;
        }

        .ab-stat:last-child { border-right: none; }
        .ab-stat:hover { background: rgba(200,145,40,0.04); }

        .ab-stat::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: var(--gold);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s ease;
        }

        .ab-stat:hover::after { transform: scaleX(1); }

        .ab-stat-num {
          font-size: 36px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--gold);
          line-height: 1;
          margin-bottom: 6px;
        }

        .ab-stat-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--cream);
          margin-bottom: 3px;
        }

        .ab-stat-suffix {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.08em;
          color: var(--slate);
          text-transform: uppercase;
        }

        /* ── Shared section ── */
        .ab-section { max-width: 1200px; margin: 0 auto; padding: 88px 48px; }

        .ab-section-hdr {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: end;
          margin-bottom: 56px;
        }

        .ab-section-title { font-size: clamp(30px, 3.2vw, 46px); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; color: var(--cream); }
        .ab-section-title span { color: var(--gold); }
        .ab-section-desc { font-size: 15px; font-weight: 300; line-height: 1.75; color: var(--slate); }

        /* ── Story ── */
        .ab-story-bg { background: var(--navy-800); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }

        .ab-story-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: start; }

        .ab-story-body { font-size: 15px; font-weight: 300; line-height: 1.8; color: var(--slate); }
        .ab-story-body p { margin-bottom: 18px; }
        .ab-story-body p:last-child { margin-bottom: 0; }

        .ab-story-pull {
          font-size: 18px;
          font-weight: 500;
          line-height: 1.55;
          color: var(--cream);
          border-left: 3px solid var(--gold);
          padding: 14px 0 14px 22px;
          margin: 28px 0;
          background: rgba(200,145,40,0.05);
        }

        .ab-timeline { display: flex; flex-direction: column; gap: 1px; }

        .ab-tl-item {
          background: var(--navy-900);
          border: 1px solid var(--border-f);
          padding: 20px 24px;
          display: grid;
          grid-template-columns: 60px 1fr;
          gap: 16px;
          align-items: start;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .ab-tl-item::before {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 2px;
          background: var(--gold);
          transform: scaleY(0);
          transform-origin: top;
          transition: transform 0.3s;
        }

        .ab-tl-item:hover { background: rgba(200,145,40,0.04); border-color: rgba(200,145,40,0.25); }
        .ab-tl-item:hover::before { transform: scaleY(1); }

        .ab-tl-yr { font-size: 10px; font-weight: 700; color: var(--gold); letter-spacing: 0.1em; text-transform: uppercase; padding-top: 3px; }
        .ab-tl-title { font-size: 15px; font-weight: 600; color: var(--cream); margin-bottom: 5px; }
        .ab-tl-desc { font-size: 13px; font-weight: 300; line-height: 1.6; color: var(--slate); }

        /* ── Values ── */
        .ab-values-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
        }

        .ab-value-card {
          background: var(--navy-800);
          padding: 36px 28px;
          position: relative;
          overflow: hidden;
          transition: background 0.3s;
        }

        .ab-value-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--gold);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s;
        }

        .ab-value-card:hover { background: rgba(200,145,40,0.04); }
        .ab-value-card:hover::before { transform: scaleX(1); }

        .ab-value-num { position: absolute; top: 16px; right: 20px; font-size: 11px; font-weight: 700; color: rgba(200,145,40,0.2); letter-spacing: 0.1em; }

        .ab-value-icon {
          width: 44px; height: 44px;
          background: var(--gold-dim);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold);
          margin-bottom: 20px;
        }

        .ab-value-title { font-size: 17px; font-weight: 600; color: var(--cream); margin-bottom: 10px; }
        .ab-value-desc { font-size: 14px; font-weight: 300; line-height: 1.7; color: var(--slate); }

        /* ── Mission ── */
        .ab-mission-bg { background: var(--navy-800); border-top: 1px solid var(--border); position: relative; overflow: hidden; }

        .ab-mission-bg::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(200,145,40,0.06) 0%, transparent 60%);
          bottom: -200px; right: -100px;
          pointer-events: none;
        }

        .ab-mission-inner { position: relative; z-index: 1; }

        .ab-mission-stmt {
          font-size: clamp(18px, 2.4vw, 28px);
          font-weight: 300;
          line-height: 1.55;
          letter-spacing: -0.01em;
          color: var(--cream);
          border-left: 3px solid var(--gold);
          padding: 18px 0 18px 28px;
          margin-bottom: 56px;
          max-width: 720px;
        }

        .ab-mission-stmt b { font-weight: 700; color: var(--gold); }

        .ab-mission-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
        }

        .ab-mission-card {
          background: var(--navy-900);
          padding: 36px 30px;
          position: relative;
          overflow: hidden;
          transition: background 0.3s;
        }

        .ab-mission-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--gold);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s;
        }

        .ab-mission-card:hover { background: rgba(200,145,40,0.04); }
        .ab-mission-card:hover::before { transform: scaleX(1); }

        .ab-mission-icon {
          width: 42px; height: 42px;
          background: var(--gold-dim);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold);
          margin-bottom: 18px;
        }

        .ab-mission-title { font-size: 18px; font-weight: 700; color: var(--cream); margin-bottom: 10px; }
        .ab-mission-desc { font-size: 14px; font-weight: 300; line-height: 1.7; color: var(--slate); }

        /* ── CTA ── */
        .ab-cta {
          background: var(--navy-900);
          border-top: 1px solid var(--border);
        }

        .ab-cta-inner {
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
          font-size: clamp(26px, 2.8vw, 42px);
          font-weight: 300;
          letter-spacing: -0.02em;
          color: var(--cream);
          line-height: 1.2;
        }

        .ab-cta-text b { font-weight: 800; color: var(--gold); }

        .ab-btn-gold {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--gold);
          color: var(--navy-900);
          padding: 15px 30px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .ab-btn-gold:hover { background: var(--gold-lt); gap: 14px; }

        /* Responsive */
        @media (max-width: 1024px) {
          .ab-values-grid { grid-template-columns: 1fr 1fr; }
          .ab-mission-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 860px) {
          .ab-hero-inner { grid-template-columns: 1fr; gap: 40px; padding: 100px 24px 60px; }
          .ab-hero-wm { display: none; }
          .ab-stats-inner { grid-template-columns: 1fr 1fr; }
          .ab-section { padding: 60px 24px; }
          .ab-section-hdr { grid-template-columns: 1fr; gap: 16px; }
          .ab-story-grid { grid-template-columns: 1fr; gap: 40px; }
          .ab-values-grid { grid-template-columns: 1fr; }
          .ab-cta-inner { padding: 60px 24px; flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section className="ab-hero">
        <div className="ab-hero-geo" />
        <div className="ab-hero-glow" />
        <div className="ab-hero-wm">2024</div>
        <div className="ab-hero-inner">
          <div>
            <div className="ab-tag">Our Story</div>
            <h1 className="ab-hero-h1">About<br /><b>Oweru</b></h1>
            <p className="ab-hero-p">
              Transforming Tanzania's rental market with technology, trust, and
              transparency — making property rental simple, secure, and accessible for everyone.
            </p>
          </div>
          <div className="ab-founding">
            <div className="founding-yr">2024</div>
            <div className="founding-lbl">Founded</div>
            <p className="founding-desc">
              Born from a simple observation: Tanzania's rental market was
              fragmented, inefficient, and lacked trust. We set out to fix that
              with technology and transparency.
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

      {/* ── Story ── */}
      <div className="ab-story-bg">
        <div className="ab-section">
          <div className="ab-section-hdr">
            <div>
              <div className="ab-tag" style={{ marginBottom: 14 }}>Background</div>
              <h2 className="ab-section-title">Our <span>Story</span></h2>
            </div>
            <p className="ab-section-desc">
              From a fragmented market to Tanzania's fastest-growing rental platform — here's how we got here.
            </p>
          </div>
          <div className="ab-story-grid">
            <div>
              <div className="ab-story-body">
                <p>
                  Founded in 2024, Oweru was born from a simple observation: Tanzania's rental market
                  was fragmented, inefficient, and lacked trust. Landlords struggled to find reliable
                  tenants, agents lacked proper tools to track their performance, and tenants faced
                  uncertainty in their search for quality housing.
                </p>
                <div className="ab-story-pull">
                  "We set out to bring transparency, efficiency, and security to every corner of the rental process."
                </div>
                <p>
                  Our smart tracking system ensures agents get credited for their work, our verification
                  process builds trust, and our streamlined application process makes renting simple for
                  everyone. Today, Oweru is Tanzania's fastest-growing rental platform.
                </p>
              </div>
            </div>
            <div className="ab-timeline">
              {[
                { yr: 'Q1 2024', title: 'Platform Founded',     desc: "Oweru launched with a mission to fix Tanzania's fragmented rental market." },
                { yr: 'Q2 2024', title: 'First 1,000 Listings', desc: 'Reached our first milestone with verified properties across Dar es Salaam.' },
                { yr: 'Q3 2024', title: 'Agent Dashboard Live', desc: 'Launched our agent tracking system, helping professionals grow their business.' },
                { yr: 'Q4 2024', title: '10,000 Active Users',  desc: 'Crossed the milestone with landlords, agents, and tenants on board nationwide.' },
                { yr: '2025',    title: 'National Expansion',   desc: 'Expanding to Arusha, Mwanza, Dodoma, and beyond across Tanzania.' },
              ].map(t => (
                <div key={t.yr} className="ab-tl-item">
                  <div className="ab-tl-yr">{t.yr}</div>
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
      <section style={{ background: 'var(--navy-900)', borderTop: '1px solid var(--border)' }}>
        <div className="ab-section">
          <div className="ab-section-hdr">
            <div>
              <div className="ab-tag" style={{ marginBottom: 14 }}>What Drives Us</div>
              <h2 className="ab-section-title">Our <span>Values</span></h2>
            </div>
            <p className="ab-section-desc">
              The principles that guide every decision we make at Oweru — from product design to customer support.
            </p>
          </div>
          <div className="ab-values-grid">
            {values.map(v => (
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
        <div className="ab-mission-inner">
          <div className="ab-section">
            <div className="ab-tag" style={{ marginBottom: 28 }}>Why We Exist</div>
            <div className="ab-mission-stmt">
              To make <b>quality housing</b> accessible to everyone in Tanzania, while creating a
              transparent, efficient, and trustworthy rental ecosystem that benefits
              landlords, agents, and tenants <b>alike.</b>
            </div>
            <div className="ab-mission-grid">
              {mission.map(m => (
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
      <section className="ab-cta">
        <div className="ab-cta-inner">
          <div className="ab-cta-text">
            Ready to experience<br /><b>Oweru?</b>
          </div>
          <Link to="/properties" className="ab-btn-gold">
            Browse Properties <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;