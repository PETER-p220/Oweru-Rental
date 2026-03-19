import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import Api, { TOKEN_KEY } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await Api.login(formData.email, formData.password, formData.userType);

      // response.data  →  { user: {...camelCase...}, token: "..." }
      const { user, token } = response.data as any;

      if (!user || !token) {
        throw new Error('Invalid response from server');
      }

      // Clear any existing user data first
      localStorage.removeItem('user');
      
      // Persist token under the same key api.ts reads from
      localStorage.setItem(TOKEN_KEY, token);

      // Push camelCase user into AuthContext
      login(user);

      // Route to the correct role dashboard
      navigate(`/dashboard/${user.userType}`);

    } catch (err: any) {
      console.error('Login error:', err);

      // Laravel 401/422 errors 
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Invalid email or password. Please try again.';

      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const userTypes = [
    { value: 'tenant',   label: 'Tenant' },
    { value: 'landlord', label: 'Landlord' },
    { value: 'agent',    label: 'Agent' },
    { value: 'admin',    label: 'Admin' },
  ];

  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex' }}>
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
          --error: #e07070;
        }

        .lg-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 40px;
          position: relative;
          min-height: 100vh;
        }

        .lg-right {
          width: 44%;
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 48px;
          border-left: 1px solid var(--border);
        }

        .lg-right-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 60% 30%, rgba(201,168,76,0.09) 0%, transparent 55%),
            radial-gradient(ellipse 50% 70% at 20% 80%, rgba(201,168,76,0.05) 0%, transparent 50%),
            linear-gradient(160deg, #0e0e0b 0%, #0a0a0a 100%);
        }

        .lg-right-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
        }

        .lg-right-watermark {
          position: absolute;
          bottom: -5%;
          right: -3%;
          font-size: clamp(120px, 16vw, 200px);
          font-weight: 700;
          color: transparent;
          -webkit-text-stroke: 1px rgba(201,168,76,0.06);
          line-height: 1;
          user-select: none;
          letter-spacing: -0.05em;
        }

        .lg-right-content { position: relative; z-index: 2; }

        .lg-right-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lg-right-eyebrow::before { content: ''; width: 24px; height: 1px; background: var(--gold); }

        .lg-right-title {
          font-size: clamp(36px, 4vw, 56px);
          font-weight: 300;
          line-height: 1.05;
          letter-spacing: -0.025em;
          color: var(--cream);
          margin-bottom: 20px;
        }
        .lg-right-title em { font-style: italic; color: var(--gold-light); }

        .lg-right-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          line-height: 1.7;
          color: var(--muted);
          margin-bottom: 36px;
          max-width: 380px;
        }

        .lg-right-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
        }

        .lg-right-stat {
          background: rgba(10,10,10,0.7);
          padding: 16px 20px;
          backdrop-filter: blur(8px);
        }

        .lg-right-stat-num {
          font-size: 22px;
          font-weight: 300;
          color: var(--gold);
          letter-spacing: -0.02em;
          margin-bottom: 3px;
        }

        .lg-right-stat-lbl {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(138,128,112,0.6);
        }

        .lg-panel { width: 100%; max-width: 420px; }

        .lg-logo {
          display: flex;
          align-items: baseline;
          gap: 1px;
          text-decoration: none;
          margin-bottom: 48px;
        }
        .lg-logo-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 300;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--cream);
        }
        .lg-logo-dot { color: var(--gold); font-size: 24px; font-family: 'Cormorant Garamond', serif; }

        .lg-title {
          font-size: clamp(32px, 3.5vw, 44px);
          font-weight: 300;
          line-height: 1.05;
          letter-spacing: -0.025em;
          color: var(--cream);
          margin-bottom: 8px;
        }
        .lg-title em { font-style: italic; color: var(--gold-light); }

        .lg-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          color: var(--muted);
          margin-bottom: 40px;
        }

        .lg-tabs {
          display: flex;
          gap: 0;
          background: var(--border);
          border: 1px solid var(--border);
          margin-bottom: 32px;
          overflow: hidden;
        }

        .lg-tab {
          flex: 1;
          padding: 10px 12px;
          background: var(--dark-3);
          border: none;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          border-right: 1px solid var(--border);
          position: relative;
        }
        .lg-tab:last-child { border-right: none; }
        .lg-tab.active { background: rgba(201,168,76,0.1); color: var(--gold); }
        .lg-tab.active::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: var(--gold);
        }
        .lg-tab:hover:not(.active) { color: var(--cream); background: rgba(255,255,255,0.03); }

        .lg-error {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(224,112,112,0.06);
          border: 1px solid rgba(224,112,112,0.25);
          padding: 12px 16px;
          margin-bottom: 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          color: var(--error);
        }

        .lg-form { display: flex; flex-direction: column; gap: 0; }

        .lg-field {
          background: var(--dark-2);
          border: 1px solid rgba(201,168,76,0.12);
          border-bottom: none;
          position: relative;
          transition: background 0.2s, border-color 0.2s;
        }
        .lg-field:last-of-type { border-bottom: 1px solid rgba(201,168,76,0.12); }
        .lg-field:focus-within { background: rgba(201,168,76,0.03); border-color: rgba(201,168,76,0.35); z-index: 1; }

        .lg-field-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
          padding: 12px 16px 0 44px;
        }

        .lg-field-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(138,128,112,0.5);
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
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          padding: 4px 44px 12px 44px;
        }
        .lg-input::placeholder { color: rgba(138,128,112,0.4); }

        .lg-eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--muted);
          display: flex;
          align-items: center;
          padding: 4px;
          transition: color 0.2s;
        }
        .lg-eye-btn:hover { color: var(--gold); }

        .lg-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 20px 0 28px;
          gap: 12px;
        }

        .lg-remember { display: flex; align-items: center; gap: 8px; cursor: pointer; }

        .lg-checkbox {
          width: 14px; height: 14px;
          border: 1px solid rgba(201,168,76,0.25);
          background: rgba(201,168,76,0.04);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; cursor: pointer; transition: all 0.2s;
        }
        .lg-checkbox.checked { background: rgba(201,168,76,0.15); border-color: rgba(201,168,76,0.5); }
        .lg-checkbox.checked::after { content: ''; width: 6px; height: 6px; background: var(--gold); display: block; }

        .lg-remember-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 300; color: var(--muted);
        }

        .lg-forgot {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 400; color: var(--muted);
          text-decoration: none; transition: color 0.2s; white-space: nowrap;
        }
        .lg-forgot:hover { color: var(--gold); }

        .lg-submit {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          background: var(--gold);
          color: #0a0a0a;
          padding: 14px 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          border: none; cursor: pointer; transition: all 0.25s;
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
          margin-bottom: 24px;
        }
        .lg-submit:hover:not(:disabled) { background: var(--gold-light); gap: 16px; }
        .lg-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .lg-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #0a0a0a;
          border-radius: 50%;
          animation: lg-spin 0.7s linear infinite;
        }
        @keyframes lg-spin { to { transform: rotate(360deg); } }

        .lg-divider {
          display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
        }
        .lg-divider-line { flex: 1; height: 1px; background: rgba(201,168,76,0.1); }
        .lg-divider-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 400; letter-spacing: 0.15em;
          text-transform: uppercase; color: rgba(138,128,112,0.45); white-space: nowrap;
        }

        .lg-socials { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 36px; }

        .lg-social-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(201,168,76,0.12);
          color: var(--muted);
          padding: 11px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 400; letter-spacing: 0.06em;
          cursor: pointer; transition: all 0.2s;
        }
        .lg-social-btn:hover { border-color: rgba(201,168,76,0.35); color: var(--cream); background: rgba(255,255,255,0.05); }
        .lg-social-icon { width: 14px; height: 14px; flex-shrink: 0; }

        .lg-footer {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 300;
          color: var(--muted); text-align: center;
        }
        .lg-footer a { color: var(--gold); text-decoration: none; font-weight: 400; transition: color 0.2s; }
        .lg-footer a:hover { color: var(--gold-light); }

        @media (max-width: 900px) {
          .lg-right { display: none; }
          .lg-left { padding: 40px 24px; }
        }
      `}</style>

      {/* ── Form side ── */}
      <div className="lg-left">
        <div className="lg-panel">

          <Link to="/" className="lg-logo">
            <span className="lg-logo-text">OWERU</span>
            <span className="lg-logo-dot">.</span>
          </Link>

          <h1 className="lg-title">Welcome<br /><em>Back</em></h1>
          <p className="lg-subtitle">Sign in to access your account</p>

          {/* User type tabs */}
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
            <div className="lg-form">

              {/* Email */}
              <div className="lg-field">
                <div className="lg-field-icon"><Mail size={14} /></div>
                <div className="lg-field-label">Email Address</div>
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
              <div className="lg-field" style={{ borderBottom: '1px solid rgba(201,168,76,0.12)' }}>
                <div className="lg-field-icon"><Lock size={14} /></div>
                <div className="lg-field-label">Password</div>
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
                <button type="button" className="lg-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

            </div>

            <div className="lg-options">
              <div className="lg-remember" onClick={() => setRemember(!remember)}>
                <div className={`lg-checkbox${remember ? ' checked' : ''}`} />
                <span className="lg-remember-label">Remember me</span>
              </div>
              <Link to="/forgot-password" className="lg-forgot">Forgot password?</Link>
            </div>

            <button type="submit" className="lg-submit" disabled={isLoading}>
              {isLoading
                ? <><div className="lg-spinner" />Signing in…</>
                : <>Sign In <ArrowRight size={14} /></>
              }
            </button>
          </form>

          <div className="lg-divider">
            <div className="lg-divider-line" />
            <span className="lg-divider-text">Or continue with</span>
            <div className="lg-divider-line" />
          </div>

          <div className="lg-socials">
            <button className="lg-social-btn">
              <svg className="lg-social-icon" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 4.9c1.69 0 3.22.6 4.41 1.58l3.3-3.3A11.95 11.95 0 0 0 12 1C8.37 1 5.17 2.91 3.27 5.76l2 4z"/>
                <path fill="#34A853" d="M16.04 18.01A7.05 7.05 0 0 1 12 19.1c-2.86 0-5.3-1.69-6.49-4.15l-3.95 3.06A11.97 11.97 0 0 0 12 23c2.93 0 5.63-1.05 7.69-2.77l-3.65-2.22z"/>
                <path fill="#FBBC05" d="M19.69 20.23A12 12 0 0 0 23 12c0-.73-.08-1.44-.2-2.12H12v4.5h6.2a5.27 5.27 0 0 1-2.17 3.47l3.66 2.38z"/>
                <path fill="#4285F4" d="M5.51 14.95A7.11 7.11 0 0 1 4.9 12c0-1.03.18-2.03.51-2.95L3.27 5.76A12 12 0 0 0 1 12c0 2.1.54 4.08 1.51 5.79l3-2.84z"/>
              </svg>
              Google
            </button>
            <button className="lg-social-btn">
              <svg className="lg-social-icon" viewBox="0 0 24 24">
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

      {/* ── Right decorative panel ── */}
      <div className="lg-right">
        <div className="lg-right-bg" />
        <div className="lg-right-grid" />
        <div className="lg-right-watermark">TZ</div>
        <div className="lg-right-content">
          <div className="lg-right-eyebrow">Tanzania's #1 Platform</div>
          <h2 className="lg-right-title">Find Your<br /><em>Perfect</em><br />Rental</h2>
          <p className="lg-right-desc">
            Join thousands of landlords, agents, and tenants using
            Oweru to simplify property rental across Tanzania.
          </p>
          <div className="lg-right-stats">
            {[
              { num: '10K+', lbl: 'Active Users' },
              { num: '5K+',  lbl: 'Listings' },
              { num: '98%',  lbl: 'Satisfaction' },
            ].map(s => (
              <div key={s.lbl} className="lg-right-stat">
                <div className="lg-right-stat-num">{s.num}</div>
                <div className="lg-right-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;