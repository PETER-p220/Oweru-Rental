import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import Api, { TOKEN_KEY } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LOGO from '../assets/IMG-20260326-WA0006.jpg';
import AuthAlert from '../components/auth/AuthAlert';
import { parseLoginError, type ParsedAuthAlert } from '../utils/authErrors';

const Login = () => {
  const [formData, setFormData]         = useState({ email: '', password: '', userType: 'tenant' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [alert, setAlert]               = useState<ParsedAuthAlert | null>(null);
  const [remember, setRemember]         = useState(false);
  const [searchParams] = useSearchParams();
  const navigate  = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const prefill = searchParams.get('email');
    if (prefill) {
      setFormData((prev) => ({ ...prev, email: prefill }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGoogleLogin = () => {
    window.location.href = Api.getGoogleAuthUrl(formData.userType);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setAlert(null);
    try {
      const response = await Api.login(formData.email.trim(), formData.password, formData.userType);
      const { user, token } = response.data as any;
      if (!user || !token) throw new Error('Invalid response from server');
      localStorage.removeItem('user');
      localStorage.setItem(TOKEN_KEY, token);
      login(user, token);
      navigate(`/dashboard/${user.userType}`);
    } catch (err: unknown) {
      setAlert(parseLoginError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const userTypes = [
    { value: 'tenant',     label: 'Tenant'     },
    { value: 'landlord',   label: 'Landlord'   },
    { value: 'agent',      label: 'Agent'       },
    { value: 'bnb_owner',  label: 'BNB Owner'  },
    { value: 'commercial', label: 'Commercial' },
    { value: 'admin',      label: 'Admin'       },
  ];

  // Color per role for the active tab accent
  const roleAccent: Record<string, string> = {
    tenant: '#16A34A', landlord: '#C89128', agent: '#2563EB',
    bnb_owner: '#9333EA', commercial: '#D97706', admin: '#DC2626',
  };
  const accent = roleAccent[formData.userType] || '#C89128';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F1F5F9' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Cormorant+Garamond:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .lg-tab:hover:not(.lg-tab-active) { background: #F8FAFC; color: #0F172A; }
        .lg-field:focus-within { border-color: ${accent} !important; box-shadow: 0 0 0 3px ${accent}18 !important; }
        .lg-field:focus-within .lg-field-icon { color: ${accent}; }
        .lg-social-btn:hover { border-color: #94A3B8; background: #F8FAFC; }
        .lg-submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px ${accent}40 !important; }
        .lg-forgot:hover { color: ${accent}; }
      `}</style>

      {/* ═══ LEFT — Branding Panel ═══ */}
      <div style={{
        width: '44%', minHeight: '100vh', flexShrink: 0,
        background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '52px 56px', position: 'relative', overflow: 'hidden',
      }}
        className="lg-left-panel"
      >
        {/* Grid texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(200,145,40,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(200,145,40,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        {/* Radial glow */}
        <div style={{ position: 'absolute', bottom: '-100px', left: '-80px', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(200,145,40,0.10) 0%, transparent 65%)', pointerEvents: 'none' }} />
        {/* Corner accent */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'radial-gradient(circle at top right, rgba(200,145,40,0.08), transparent 70%)', pointerEvents: 'none' }} />

        {/* Top logo */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Link to="/">
            <img src={LOGO} alt="OWERU" style={{ height: '32px', width: 'auto' }} />
          </Link>
        </div>

        {/* Center content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
            <div style={{ width: '28px', height: '2px', background: '#C89128' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#C89128' }}>
              Africa's #1 Platform
            </span>
          </div>

          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(40px, 4vw, 58px)', fontWeight: 400, lineHeight: 1.08, color: '#FFFFFF', marginBottom: '24px', letterSpacing: '-0.01em' }}>
            Smart Real Estate,<br />
            <span style={{ fontStyle: 'italic', color: '#C89128' }}>Redefined.</span>
          </h2>

          <p style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8', lineHeight: 1.75, marginBottom: '48px', maxWidth: '340px' }}>
            Join thousands of landlords, agents, and tenants using Oweru to simplify property rental across Africa.
          </p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
            {[
              { num: '10K+', lbl: 'Active Users' },
              { num: '5K+',  lbl: 'Listings'     },
              { num: '98%',  lbl: 'Satisfaction'  },
            ].map((s, i) => (
              <div key={s.lbl} style={{ padding: '22px 18px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '26px', fontWeight: 800, color: '#C89128', letterSpacing: '-0.02em', marginBottom: '4px' }}>{s.num}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748B' }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom text */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A', animation: 'pulse-dot 2s ease-in-out infinite' }} />
          <span style={{ fontSize: '11px', color: '#475569', fontWeight: 500, letterSpacing: '0.06em' }}>
            Dar es Salaam, Tanzania · Est. 2024
          </span>
        </div>

        {/* Hide on small screens */}
        <style>{`@media(max-width:900px){.lg-left-panel{display:none!important;}}`}</style>
      </div>

      {/* ═══ RIGHT — Form Panel ═══ */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#F1F5F9', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '440px', animation: 'fadeUp 0.4s ease both' }}>

          {/* Mobile logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '36px' }}>
            <Link to="/">
              <img src={LOGO} alt="OWERU" style={{ height: '30px', width: 'auto' }} />
            </Link>
          </div>
          <style>{`@media(min-width:901px){.lg-mobile-logo{display:none!important;}}`}</style>

          {/* Card */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>

            {/* Heading */}
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                Welcome back
              </h1>
              <p style={{ fontSize: '14px', color: '#64748B', fontWeight: 400 }}>
                Sign in to your Oweru account to continue.
              </p>
            </div>

            {/* Role selector */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748B', marginBottom: '10px' }}>
                Sign in as
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {userTypes.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    className={`lg-tab ${formData.userType === t.value ? 'lg-tab-active' : ''}`}
                    onClick={() => setFormData({ ...formData, userType: t.value })}
                    style={{
                      padding: '8px 4px', border: '1.5px solid',
                      borderColor: formData.userType === t.value ? accent : '#E2E8F0',
                      background: formData.userType === t.value ? `${accent}10` : '#F8FAFC',
                      borderRadius: '8px', cursor: 'pointer',
                      fontSize: '11px', fontWeight: 700,
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                      color: formData.userType === t.value ? accent : '#64748B',
                      fontFamily: "'DM Sans', sans-serif",
                      transition: 'all 0.18s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {alert && (
              <AuthAlert
                variant={alert.variant}
                title={alert.title}
                messages={alert.messages}
                emailForLogin={alert.emailForLogin}
              />
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

                {/* Email field */}
                <div className="lg-field" style={{ border: '1.5px solid #E2E8F0', borderBottom: 'none', borderRadius: '10px 10px 0 0', background: '#FFFFFF', transition: 'all 0.2s', position: 'relative' }}>
                  <div className="lg-field-icon" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', transition: 'color 0.2s', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                    <Mail size={15} />
                  </div>
                  <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, padding: '12px 16px 0 46px', fontFamily: "'DM Sans', sans-serif" }}>
                    Email Address
                  </div>
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="your@email.com" required
                    style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#0F172A', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 400, padding: '4px 46px 12px 46px' }}
                  />
                </div>

                {/* Password field */}
                <div className="lg-field" style={{ border: '1.5px solid #E2E8F0', borderRadius: '0 0 10px 10px', background: '#FFFFFF', transition: 'all 0.2s', position: 'relative' }}>
                  <div className="lg-field-icon" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', transition: 'color 0.2s', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                    <Lock size={15} />
                  </div>
                  <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, padding: '12px 46px 0 46px', fontFamily: "'DM Sans', sans-serif" }}>
                    Password
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                    onChange={handleChange} placeholder="Enter your password" required autoComplete="current-password"
                    style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#0F172A', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 400, padding: '4px 46px 12px 46px' }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', padding: '4px', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = accent)}
                    onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Options row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 24px' }}>
                <div onClick={() => setRemember(!remember)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <div style={{ width: 16, height: 16, border: `1.5px solid ${remember ? accent : '#CBD5E1'}`, borderRadius: '4px', background: remember ? `${accent}15` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
                    {remember && <div style={{ width: 8, height: 8, borderRadius: '2px', background: accent }} />}
                  </div>
                  <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>Remember me</span>
                </div>
                <Link to="/forgot-password" className="lg-forgot" style={{ fontSize: '13px', fontWeight: 600, color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}>
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading} className="lg-submit-btn"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: accent, color: '#FFFFFF', padding: '14px 24px', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, boxShadow: `0 4px 16px ${accent}35`, transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif" }}>
                {isLoading
                  ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Signing in…</>
                  : <>Sign In <ArrowRight size={16} /></>
                }
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94A3B8' }}>Or continue with</span>
              <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            </div>

            {/* Social buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '28px' }}>
              <button className="lg-social-btn" onClick={handleGoogleLogin}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '10px', color: '#334155', padding: '11px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif" }}>
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 4.9c1.69 0 3.22.6 4.41 1.58l3.3-3.3A11.95 11.95 0 0 0 12 1C8.37 1 5.17 2.91 3.27 5.76l2 4z"/>
                  <path fill="#34A853" d="M16.04 18.01A7.05 7.05 0 0 1 12 19.1c-2.86 0-5.3-1.69-6.49-4.15l-3.95 3.06A11.97 11.97 0 0 0 12 23c2.93 0 5.63-1.05 7.69-2.77l-3.65-2.22z"/>
                  <path fill="#FBBC05" d="M19.69 20.23A12 12 0 0 0 23 12c0-.73-.08-1.44-.2-2.12H12v4.5h6.2a5.27 5.27 0 0 1-2.17 3.47l3.66 2.38z"/>
                  <path fill="#4285F4" d="M5.51 14.95A7.11 7.11 0 0 1 4.9 12c0-1.03.18-2.03.51-2.95L3.27 5.76A12 12 0 0 0 1 12c0 2.1.54 4.08 1.51 5.79l3-2.84z"/>
                </svg>
                Google
              </button>
              <button className="lg-social-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '10px', color: '#334155', padding: '11px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif" }}>
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <path fill="#1877F2" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.32 0 2.7.24 2.7.24v2.97h-1.52c-1.5 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z"/>
                </svg>
                Facebook
              </button>
            </div>

            {/* Security badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px', background: '#F1F5F9', borderRadius: '8px', marginBottom: '24px' }}>
              <ShieldCheck size={13} style={{ color: '#16A34A', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>256-bit SSL encrypted · Your data is secure</span>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: accent, fontWeight: 700, textDecoration: 'none', transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Create one free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;