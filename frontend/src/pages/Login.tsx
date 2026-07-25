import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck,
  Building2, KeyRound, BarChart3,
} from 'lucide-react';
import Api, { TOKEN_KEY } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LOGO from '../assets/IMG-20260326-WA0006.jpg';
import AuthAlert from '../components/auth/AuthAlert';
import { parseLoginError, type ParsedAuthAlert } from '../utils/authErrors';
import { resolvePostLoginDestination } from '../utils/bnbNav';

const GOLD = '#C89128';
const SLATE900 = '#0F172A';
const SLATE600 = '#475569';
const SLATE400 = '#94A3B8';
const BORDER = '#E2E8F0';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<ParsedAuthAlert | null>(null);
  const [remember, setRemember] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  useEffect(() => {
    const prefill = searchParams.get('email');
    if (prefill) setEmail(prefill);
  }, [searchParams]);

  const handleGoogleLogin = () => {
    logout();
    window.location.href = Api.getGoogleAuthUrl();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setAlert(null);
    try {
      const response = await Api.login(email.trim(), password);
      const { user, token } = response.data as { user?: { user_type?: string }; token?: string };
      if (!user || !token) throw new Error('Invalid response from server');

      localStorage.removeItem('user');
      localStorage.setItem(TOKEN_KEY, token);
      if (remember) {
        localStorage.setItem('remember_email', email.trim().toLowerCase());
      } else {
        localStorage.removeItem('remember_email');
      }

      login(user as Parameters<typeof login>[0], token);

      const destination = resolvePostLoginDestination(
        user,
        searchParams.get('redirect'),
      );
      navigate(destination);
    } catch (err: unknown) {
      setAlert(parseLoginError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('remember_email');
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  const features = [
    { icon: Building2, title: 'All property types', desc: 'Residential, commercial & BnB in one place' },
    { icon: KeyRound, title: 'Secure access', desc: 'One account — routed to your dashboard automatically' },
    { icon: BarChart3, title: 'Smart dashboards', desc: 'Tenants, landlords, agents & admins each get their own workspace' },
  ];

  return (
    <div className="login-page" style={{ minHeight: '100vh', display: 'flex', fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F1F5F9' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Cormorant+Garamond:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

        .login-input-wrap:focus-within { border-color: ${GOLD} !important; box-shadow: 0 0 0 3px rgba(200,145,40,0.14); }
        .login-input-wrap:focus-within .login-input-icon { color: ${GOLD}; }
        .login-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(200,145,40,0.38); }
        .login-social:hover { border-color: #94A3B8; background: #F8FAFC; }
        .login-link:hover { color: ${GOLD}; }
        .login-feature:hover { border-color: rgba(200,145,40,0.35); background: rgba(255,255,255,0.05); }

        @media (max-width: 960px) {
          .login-brand { display: none !important; }
          .login-mobile-logo { display: flex !important; }
        }
        @media (min-width: 961px) {
          .login-mobile-logo { display: none !important; }
        }
      `}</style>

      {/* Brand panel */}
      <aside className="login-brand" style={{
        width: '46%', minHeight: '100vh', flexShrink: 0,
        background: 'linear-gradient(155deg, #0F172A 0%, #1E293B 55%, #0F172A 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '52px 56px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(200,145,40,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(200,145,40,0.035) 1px, transparent 1px)', backgroundSize: '44px 44px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', right: '-60px', width: 420, height: 420, background: 'radial-gradient(circle, rgba(200,145,40,0.12) 0%, transparent 68%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/">
            <img src={LOGO} alt="Oweru Rental" style={{ height: 34, width: 'auto' }} />
          </Link>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 28, height: 2, background: GOLD }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: GOLD }}>
              Oweru Rental Platform
            </span>
          </div>

          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(38px, 3.8vw, 54px)', fontWeight: 500, lineHeight: 1.08,
            color: '#fff', marginBottom: 18, letterSpacing: '-0.01em',
          }}>
            Sign in once.<br />
            <span style={{ fontStyle: 'italic', color: GOLD }}>Go straight to work.</span>
          </h2>

          <p style={{ fontSize: 14, color: SLATE400, lineHeight: 1.75, marginBottom: 36 }}>
            Enter your email and password — we detect your account type and open the right dashboard for you.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="login-feature" style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                padding: '14px 16px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)', transition: 'all 0.2s',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(200,145,40,0.15)', border: '1px solid rgba(200,145,40,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD,
                }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 12, color: SLATE400, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', animation: 'pulse-dot 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>Dar es Salaam, Tanzania · Secure platform</span>
        </div>
      </aside>

      {/* Form panel */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 440, animation: 'fadeUp 0.45s ease both' }}>
          <div className="login-mobile-logo" style={{ justifyContent: 'center', marginBottom: 32 }}>
            <Link to="/">
              <img src={LOGO} alt="Oweru Rental" style={{ height: 32, width: 'auto' }} />
            </Link>
          </div>

          <div style={{
            background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18,
            padding: '40px 36px', boxShadow: '0 8px 32px rgba(15,23,42,0.07)',
          }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: SLATE900, letterSpacing: '-0.02em', marginBottom: 8 }}>
                Welcome back
              </h1>
              <p style={{ fontSize: 14, color: SLATE600, lineHeight: 1.6, margin: 0 }}>
                Sign in with your Oweru credentials. No role selection needed — we'll take you to the right place.
              </p>
            </div>

            {alert && (
              <div style={{ marginBottom: 20 }}>
                <AuthAlert
                  variant={alert.variant}
                  title={alert.title}
                  messages={alert.messages}
                  emailForLogin={alert.emailForLogin}
                />
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
                <div>
                  <label htmlFor="login-email" style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: SLATE600, marginBottom: 8 }}>
                    Email address
                  </label>
                  <div className="login-input-wrap" style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    border: `1.5px solid ${BORDER}`, borderRadius: 11,
                    padding: '0 14px', background: '#FAFBFC', transition: 'all 0.2s',
                  }}>
                    <Mail size={16} className="login-input-icon" style={{ color: SLATE400, flexShrink: 0, transition: 'color 0.2s' }} />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      style={{
                        flex: 1, border: 'none', outline: 'none', background: 'transparent',
                        padding: '14px 0', fontSize: 14, color: SLATE900, fontFamily: 'inherit',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: SLATE600, marginBottom: 8 }}>
                    Password
                  </label>
                  <div className="login-input-wrap" style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    border: `1.5px solid ${BORDER}`, borderRadius: 11,
                    padding: '0 14px', background: '#FAFBFC', transition: 'all 0.2s',
                  }}>
                    <Lock size={16} className="login-input-icon" style={{ color: SLATE400, flexShrink: 0, transition: 'color 0.2s' }} />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      style={{
                        flex: 1, border: 'none', outline: 'none', background: 'transparent',
                        padding: '14px 0', fontSize: 14, color: SLATE900, fontFamily: 'inherit',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: SLATE400, display: 'flex', padding: 4 }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: GOLD }}
                  />
                  <span style={{ fontSize: 13, color: SLATE600, fontWeight: 500 }}>Remember email</span>
                </label>
                <Link to="/forgot-password" className="login-link" style={{ fontSize: 13, fontWeight: 600, color: SLATE600, textDecoration: 'none', transition: 'color 0.2s' }}>
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="login-submit"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: GOLD, color: '#fff', padding: '15px 24px', border: 'none', borderRadius: 11,
                  fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.75 : 1, transition: 'all 0.2s', fontFamily: 'inherit',
                  boxShadow: '0 4px 16px rgba(200,145,40,0.32)',
                }}
              >
                {isLoading ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Signing in…
                  </>
                ) : (
                  <>Continue to dashboard <ArrowRight size={17} /></>
                )}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '26px 0 20px' }}>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: SLATE400 }}>Or</span>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
            </div>

            <button
              type="button"
              className="login-social"
              onClick={handleGoogleLogin}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: 11,
                color: SLATE900, padding: '12px 16px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', marginBottom: 20,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 4.9c1.69 0 3.22.6 4.41 1.58l3.3-3.3A11.95 11.95 0 0 0 12 1C8.37 1 5.17 2.91 3.27 5.76l2 4z" />
                <path fill="#34A853" d="M16.04 18.01A7.05 7.05 0 0 1 12 19.1c-2.86 0-5.3-1.69-6.49-4.15l-3.95 3.06A11.97 11.97 0 0 0 12 23c2.93 0 5.63-1.05 7.69-2.77l-3.65-2.22z" />
                <path fill="#FBBC05" d="M19.69 20.23A12 12 0 0 0 23 12c0-.73-.08-1.44-.2-2.12H12v4.5h6.2a5.27 5.27 0 0 1-2.17 3.47l3.66 2.38z" />
                <path fill="#4285F4" d="M5.51 14.95A7.11 7.11 0 0 1 4.9 12c0-1.03.18-2.03.51-2.95L3.27 5.76A12 12 0 0 0 1 12c0 2.1.54 4.08 1.51 5.79l3-2.84z" />
              </svg>
              Continue with Google
            </button>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px 14px', background: '#F8FAFC', borderRadius: 10,
              border: `1px solid ${BORDER}`, marginBottom: 22,
            }}>
              <ShieldCheck size={14} style={{ color: '#16A34A', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: SLATE600, fontWeight: 600 }}>256-bit encrypted · Role detected automatically</span>
            </div>

            <p style={{ textAlign: 'center', fontSize: 13, color: SLATE600, margin: 0 }}>
              New to Oweru?{' '}
              <Link to="/register" style={{ color: GOLD, fontWeight: 700, textDecoration: 'none' }}>
                Create a free account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
