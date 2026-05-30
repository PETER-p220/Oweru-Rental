import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import Api, { TOKEN_KEY } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LOGO from '../assets/IMG-20260326-WA0006.jpg';

const Login = () => {
  const [formData, setFormData]         = useState({ email: '', password: '', userType: 'tenant' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState('');
  const [remember, setRemember]         = useState(false);
  const navigate  = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch(Api.getGoogleAuthUrl(formData.userType));
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Failed to get Google auth URL:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await Api.login(formData.email, formData.password, formData.userType);
      const { user, token } = response.data as any;
      if (!user || !token) throw new Error('Invalid response from server');
      localStorage.removeItem('user');
      localStorage.setItem(TOKEN_KEY, token);
      login(user, token);
      navigate(`/dashboard/${user.userType}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const userTypes = [
    { value: 'tenant',    label: 'Tenant' },
    { value: 'landlord',  label: 'Landlord' },
    { value: 'agent',     label: 'Agent' },
    { value: 'bnb_owner', label: 'BNB Owner' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'admin',     label: 'Admin' },
  ];

  return (
    <div style={{ fontFamily: "'Jost', 'Futura PT', sans-serif", background: '#0F172A', color: '#F8F8F9', minHeight: '100vh', display: 'flex' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;1,300&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy-900: #0F172A;
          --navy-800: #162035;
          --navy-700: #1E2D4A;
          --navy-600: #253660;
          --gold:     #C89128;
          --gold-lt:  #D4A843;
          --gold-dim: rgba(200,145,40,0.15);
          --cream:    #F8F8F9;
          --slate:    #94A3B8;
          --border:   rgba(200,145,40,0.18);
        }

        /* ── Layout ── */
        .lg-wrap { display: flex; min-height: 100vh; width: 100%; }
        .lg-left {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          background: var(--navy-900);
          position: relative;
          overflow: hidden;
        }
        .lg-left::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(200,145,40,0.07) 0%, transparent 70%);
          top: -100px; right: -100px;
          pointer-events: none;
        }
        .lg-right {
          width: 46%;
          min-height: 100vh;
          background: var(--navy-800);
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 56px 52px;
          position: relative;
          overflow: hidden;
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .lg-wrap {
            flex-direction: column;
          }
          
          .lg-left {
            flex: none;
            padding: 32px 24px;
          }
          
          .lg-right {
            width: 100%;
            min-height: auto;
            border-left: none;
            border-top: 1px solid var(--border);
          }
        }

        @media (max-width: 480px) {
          .lg-left {
            padding: 24px 16px;
          }
          
          .lg-right {
            padding: 20px;
          }
        }

        .lg-right-geo {
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(
              60deg,
              transparent,
              transparent 28px,
              rgba(200,145,40,0.03) 28px,
              rgba(200,145,40,0.03) 29px
            ),
            repeating-linear-gradient(
              -60deg,
              transparent,
              transparent 28px,
              rgba(200,145,40,0.03) 28px,
              rgba(200,145,40,0.03) 29px
            );
        }

        .lg-right-stamp {
          position: absolute;
          top: 48px; right: 52px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(200,145,40,0.35);
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }

        .lg-right-content { position: relative; z-index: 2; }

        .lg-right-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 24px;
        }

        .lg-right-tag::before {
          content: '';
          width: 32px; height: 2px;
          background: var(--gold);
        }

        .lg-right-title {
          font-size: clamp(36px, 4.5vw, 58px);
          font-weight: 300;
          line-height: 1.06;
          letter-spacing: -0.02em;
          color: var(--cream);
          margin-bottom: 18px;
        }

        .lg-right-title strong {
          font-weight: 700;
          color: var(--gold);
          display: block;
        }

        .lg-right-desc {
          font-size: 14px;
          font-weight: 300;
          line-height: 1.75;
          color: var(--slate);
          margin-bottom: 40px;
          max-width: 360px;
        }

        .lg-right-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .lg-right-stat {
          padding: 20px 18px;
          border-right: 1px solid var(--border);
        }

        .lg-right-stat:last-child { border-right: none; }

        .stat-n {
          font-size: 26px;
          font-weight: 700;
          color: var(--gold);
          letter-spacing: -0.02em;
          margin-bottom: 4px;
        }

        .stat-l {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--slate);
        }

        /* ── Panel ── */
        .lg-panel { width: 100%; max-width: 400px; position: relative; z-index: 1; }

        .lg-logo {
          display: flex;
          align-items: center;
          gap: 0;
          margin-bottom: 52px;
          text-decoration: none;
        }

        .lg-heading {
          margin-bottom: 36px;
        }

        .lg-title {
          font-size: clamp(30px, 3vw, 40px);
          font-weight: 300;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: var(--cream);
          margin-bottom: 6px;
        }

        .lg-title b { font-weight: 700; color: var(--gold); }

        .lg-sub {
          font-size: 14px;
          font-weight: 400;
          color: var(--slate);
        }

        /* tabs */
        .lg-tabs {
          display: flex;
          background: var(--navy-800);
          border: 1px solid var(--border);
          margin-bottom: 28px;
          overflow: hidden;
        }

        .lg-tab {
          flex: 1;
          padding: 9px 4px;
          background: transparent;
          border: none;
          border-right: 1px solid var(--border);
          color: var(--slate);
          font-family: 'Jost', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .lg-tab:last-child { border-right: none; }

        .lg-tab.active {
          background: var(--gold-dim);
          color: var(--gold);
        }

        .lg-tab.active::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: var(--gold);
        }

        .lg-tab:hover:not(.active) { color: var(--cream); background: rgba(255,255,255,0.03); }

        /* error */
        .lg-error {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(220,60,60,0.08);
          border: 1px solid rgba(220,60,60,0.3);
          padding: 12px 14px;
          margin-bottom: 20px;
          font-size: 13px;
          font-weight: 400;
          color: #f87171;
          border-radius: 2px;
        }

        /* fields */
        .lg-fields { display: flex; flex-direction: column; }

        .lg-field {
          position: relative;
          border: 1px solid var(--border);
          border-bottom: none;
          background: var(--navy-800);
          transition: background 0.2s, border-color 0.2s;
        }

        .lg-field:last-of-type {
          border-bottom: 1px solid var(--border);
        }

        .lg-field:focus-within {
          background: rgba(200,145,40,0.04);
          border-color: rgba(200,145,40,0.45);
          z-index: 1;
        }

        .lg-field-lbl {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--gold);
          padding: 12px 16px 0 46px;
        }

        .lg-field-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(148,163,184,0.5);
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .lg-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: var(--cream);
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          font-weight: 400;
          padding: 4px 46px 12px 46px;
        }

        .lg-input::placeholder { color: rgba(148,163,184,0.4); }

        .lg-eye {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--slate);
          display: flex;
          align-items: center;
          padding: 4px;
          transition: color 0.2s;
        }

        .lg-eye:hover { color: var(--gold); }

        /* options */
        .lg-opts {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 18px 0 26px;
        }

        .lg-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .lg-chk {
          width: 15px; height: 15px;
          border: 1.5px solid rgba(200,145,40,0.3);
          background: transparent;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .lg-chk.on { background: var(--gold-dim); border-color: var(--gold); }
        .lg-chk.on::after { content: '✓'; font-size: 9px; color: var(--gold); font-weight: 700; }

        .lg-rlbl { font-size: 12px; font-weight: 400; color: var(--slate); }

        .lg-forgot {
          font-size: 12px;
          font-weight: 500;
          color: var(--slate);
          text-decoration: none;
          transition: color 0.2s;
        }

        .lg-forgot:hover { color: var(--gold); }

        /* submit */
        .lg-submit {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: var(--gold);
          color: var(--navy-900);
          padding: 15px 24px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: all 0.25s;
          margin-bottom: 28px;
        }

        .lg-submit:hover:not(:disabled) { background: var(--gold-lt); gap: 16px; }
        .lg-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .lg-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(15,23,42,0.25);
          border-top-color: var(--navy-900);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* divider */
        .lg-div {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .lg-div-line { flex: 1; height: 1px; background: var(--border); }

        .lg-div-text {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(148,163,184,0.4);
        }

        /* socials */
        .lg-socials { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 32px; }

        .lg-social {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--navy-800);
          border: 1px solid var(--border);
          color: var(--slate);
          padding: 11px 16px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .lg-social:hover { border-color: rgba(200,145,40,0.4); color: var(--cream); }

        .lg-social svg { flex-shrink: 0; }

        .lg-footer {
          font-size: 13px;
          font-weight: 400;
          color: var(--slate);
          text-align: center;
        }

        .lg-footer a { color: var(--gold); text-decoration: none; font-weight: 600; transition: color 0.2s; }
        .lg-footer a:hover { color: var(--gold-lt); }

        @media (max-width: 900px) {
          .lg-right { display: none; }
          .lg-left { padding: 36px 24px; }
        }
      `}</style>

      <div className="lg-wrap">

        {/* ── Form side ── */}
        <div className="lg-left">
          <div className="lg-panel">

            <Link to="/" className="lg-logo">
              <img src={LOGO} alt="OWERU" style={{ height: '36px', width: 'auto' }} loading="lazy" decoding="async" />
            </Link>

            <div className="lg-heading">
              <h1 className="lg-title">Welcome <b>Back</b></h1>
              <p className="lg-sub">Sign in to your Oweru account</p>
            </div>

            {/* Role tabs */}
            <div className="lg-tabs">
              {userTypes.map(t => (
                <button
                  key={t.value}
                  className={`lg-tab${formData.userType === t.value ? ' active' : ''}`}
                  onClick={() => setFormData({ ...formData, userType: t.value })}
                  type="button"
                >
                  {t.label}
                </button>
              ))}
            </div>

            {error && (
              <div className="lg-error">
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="lg-fields">
                {/* Email */}
                <div className="lg-field">
                  <div className="lg-field-icon"><Mail size={14} /></div>
                  <div className="lg-field-lbl">Email Address</div>
                  <input
                    className="lg-input"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                {/* Password */}
                <div className="lg-field">
                  <div className="lg-field-icon"><Lock size={14} /></div>
                  <div className="lg-field-lbl">Password</div>
                  <input
                    className="lg-input"
                    style={{ paddingRight: '44px' }}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" className="lg-eye" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="lg-opts">
                <div className="lg-remember" onClick={() => setRemember(!remember)}>
                  <div className={`lg-chk${remember ? ' on' : ''}`} />
                  <span className="lg-rlbl">Remember me</span>
                </div>
                <Link to="/forgot-password" className="lg-forgot">Forgot password?</Link>
              </div>

              <button type="submit" className="lg-submit" disabled={isLoading}>
                {isLoading
                  ? <><div className="lg-spinner" /> Signing in…</>
                  : <>Sign In <ArrowRight size={15} /></>
                }
              </button>
            </form>

            <div className="lg-div">
              <div className="lg-div-line" />
              <span className="lg-div-text">Or continue with</span>
              <div className="lg-div-line" />
            </div>

            <div className="lg-socials">
              <button className="lg-social" onClick={handleGoogleLogin}>
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 4.9c1.69 0 3.22.6 4.41 1.58l3.3-3.3A11.95 11.95 0 0 0 12 1C8.37 1 5.17 2.91 3.27 5.76l2 4z"/>
                  <path fill="#34A853" d="M16.04 18.01A7.05 7.05 0 0 1 12 19.1c-2.86 0-5.3-1.69-6.49-4.15l-3.95 3.06A11.97 11.97 0 0 0 12 23c2.93 0 5.63-1.05 7.69-2.77l-3.65-2.22z"/>
                  <path fill="#FBBC05" d="M19.69 20.23A12 12 0 0 0 23 12c0-.73-.08-1.44-.2-2.12H12v4.5h6.2a5.27 5.27 0 0 1-2.17 3.47l3.66 2.38z"/>
                  <path fill="#4285F4" d="M5.51 14.95A7.11 7.11 0 0 1 4.9 12c0-1.03.18-2.03.51-2.95L3.27 5.76A12 12 0 0 0 1 12c0 2.1.54 4.08 1.51 5.79l3-2.84z"/>
                </svg>
                Google
              </button>
              <button className="lg-social">
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path fill="#1877F2" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.32 0 2.7.24 2.7.24v2.97h-1.52c-1.5 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z"/>
                </svg>
                Facebook
              </button>
            </div>

            <div className="lg-footer">
              Don't have an account?{' '}
              <Link to="/register">Create one</Link>
            </div>

          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="lg-right">
          <div className="lg-right-geo" />
          <div className="lg-right-stamp">Africa · Est. 2024</div>
          <div className="lg-right-content">
            <div className="lg-right-tag">Africa's #1 Platform</div>
            <h2 className="lg-right-title">
              Smart, Secure<br />Real Estate
              <strong>Powered by Tech.</strong>
            </h2>
            <p className="lg-right-desc">
              Join thousands of landlords, agents, and tenants using
              Oweru to simplify property rental across Africa.
            </p>
            <div className="lg-right-stats">
              {[
                { num: '10K+', lbl: 'Active Users' },
                { num: '5K+',  lbl: 'Listings' },
                { num: '98%',  lbl: 'Satisfaction' },
              ].map(s => (
                <div key={s.lbl} className="lg-right-stat">
                  <div className="stat-n">{s.num}</div>
                  <div className="stat-l">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;