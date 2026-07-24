import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, User, Phone,
  AlertCircle, ArrowRight, ArrowLeft, Check, ShieldCheck,
} from 'lucide-react';
import Api, { TOKEN_KEY } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LOGO from '../assets/IMG-20260326-WA0006.jpg';
import AuthAlert from '../components/auth/AuthAlert';
import { parseAuthError, validateRegistrationEmail, type ParsedAuthAlert } from '../utils/authErrors';
import { resolveDashboardRedirect } from '../utils/bnbNav';

const GOLD = '#C89128';

// ─────────────────────────────────────────────────────────────
// IMPORTANT: InputField must live OUTSIDE the Register component.
// Previously it was declared inside Register's function body, which
// meant React created a brand-new component type on every render
// (i.e. every keystroke). That forced React to unmount the old
// <input> and mount a fresh one each time, which is why the field
// lost focus and felt like you had to click back into it after
// every character. Defining it here, at module scope, gives React
// a stable component reference across renders, so the underlying
// DOM <input> is reused and focus is preserved while typing.
// ─────────────────────────────────────────────────────────────
type InputFieldProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  icon: React.ComponentType<{ size?: number }>;
  toggle?: boolean;
  showToggle?: boolean;
  onToggle?: () => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const InputField = ({
  label, name, type = 'text', placeholder, icon: Icon,
  toggle, showToggle, onToggle, value, onChange,
}: InputFieldProps) => (
  <div>
    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#334155', marginBottom: '7px' }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
        <Icon size={15} />
      </div>
      <input
        type={toggle ? (showToggle ? 'text' : 'password') : type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'new-password' : undefined}
        style={{ width: '100%', padding: `11px 16px 11px ${toggle ? '42px' : '42px'}`, paddingRight: toggle ? '44px' : '16px', background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '9px', color: '#0F172A', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box' }}
        onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px ${GOLD}18`; }}
        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
      />
      {toggle && (
        <button type="button" onClick={onToggle}
          style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', padding: '4px', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
          onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}>
          {showToggle ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      )}
    </div>
  </div>
);

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', userType: 'tenant', agreeToTerms: false,
  });
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading,           setIsLoading]           = useState(false);
  const [fieldErrors,         setFieldErrors]         = useState<string[]>([]);
  const [alert,               setAlert]               = useState<ParsedAuthAlert | null>(null);
  const [step,                setStep]                = useState(1);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, logout, isAuthenticated, user } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const validateStep1 = () => {
    const errs: string[] = [];
    if (!formData.firstName.trim()) errs.push('First name is required');
    if (!formData.lastName.trim())  errs.push('Last name is required');
    const emailCheck = validateRegistrationEmail(formData.email);
    if (!emailCheck.ok) errs.push(emailCheck.message);
    if (!formData.phone.trim())     errs.push('Phone number is required');
    setFieldErrors(errs);
    setAlert(null);
    return errs.length === 0;
  };

  const validateStep2 = () => {
    const errs: string[] = [];
    if (!formData.password)                             errs.push('Password is required');
    if (formData.password.length < 8)                   errs.push('Password must be at least 8 characters');
    if (formData.password !== formData.confirmPassword) errs.push('Passwords do not match');
    if (!formData.agreeToTerms)                         errs.push('You must agree to the Terms & Privacy Policy');
    setFieldErrors(errs);
    setAlert(null);
    return errs.length === 0;
  };

  const handleNext = async () => {
    if (!validateStep1()) return;
    setFieldErrors([]);
    setAlert(null);
    try {
      const check = await Api.checkEmailAvailability(formData.email);
      const data = check.data as { available?: boolean; reason?: string; message?: string };
      if (data?.available === false && data.reason === 'taken') {
        setAlert({
          variant: 'exists',
          title: 'You already have an account',
          messages: [
            data.message ||
              'This email is already registered. Sign in instead, or use another email address.',
          ],
          emailForLogin: formData.email.trim().toLowerCase(),
        });
        return;
      }
      if (data?.available === false) {
        setFieldErrors([data.message || 'Enter a valid email address.']);
        return;
      }
      setStep(2);
    } catch {
      setStep(2);
    }
  };
  const handleBack = () => { setStep(1); setFieldErrors([]); setAlert(null); };

  const handleGoogleRegister = () => {
    logout();
    window.location.href = Api.getGoogleRegisterUrl(formData.userType);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setIsLoading(true); setFieldErrors([]); setAlert(null);
    try {
      const response = await Api.register({
        first_name: formData.firstName, last_name: formData.lastName,
        email: formData.email.trim().toLowerCase(), password: formData.password,
        password_confirmation: formData.confirmPassword,
        phone: formData.phone, user_type: formData.userType,
      });
      const { user, token } = response.data as any;
      if (!user || !token) throw new Error('Invalid response from server');
      localStorage.setItem(TOKEN_KEY, token);
      login(user, token);
      const redirect = searchParams.get('redirect');
      const destination = resolveDashboardRedirect(redirect, user.userType)
        || `/dashboard/${user.userType}`;
      navigate(destination);
    } catch (err: unknown) {
      const parsed = parseAuthError(err, formData.email);
      if (parsed.variant === 'exists') {
        setStep(1);
      }
      setAlert(parsed);
    } finally { setIsLoading(false); }
  };

  const pwReqs = [
    { label: 'At least 8 characters', met: formData.password.length >= 8         },
    { label: 'Uppercase letter',       met: /[A-Z]/.test(formData.password)        },
    { label: 'Lowercase letter',       met: /[a-z]/.test(formData.password)        },
    { label: 'Contains a number',      met: /\d/.test(formData.password)           },
  ];
  const pwStrength = pwReqs.filter(r => r.met).length;
  const strengthColor = ['#DC2626','#D97706','#16A34A','#059669'][pwStrength - 1] || '#E2E8F0';

  const userTypes = [
    { value: 'tenant',    label: 'Tenant',    desc: 'Looking to rent',  color: '#16A34A' },
    { value: 'landlord',  label: 'Landlord',  desc: 'I own property',   color: '#C89128' },
    { value: 'agent',     label: 'Agent',     desc: 'Broker listings',  color: '#2563EB' },
    { value: 'bnb_owner', label: 'BNB Owner', desc: 'I host stays',     color: '#9333EA' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F1F5F9' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Cormorant+Garamond:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes fadeUp   { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
        @keyframes pulse-rg { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .rg-type-btn:hover:not(.rg-type-active) { border-color: #94A3B8 !important; background: #F8FAFC !important; }
        .rg-social-btn:hover { border-color: #94A3B8 !important; background: #F8FAFC !important; }
        .rg-back-btn:hover { background: #F1F5F9 !important; border-color: #CBD5E1 !important; }
        @media(max-width:900px){ .rg-left-panel{ display:none!important; } }
        @media(max-width:640px){ .rg-card{ padding: 28px 20px !important; } }
      `}</style>

      {/* ═══ LEFT — Branding Panel ═══ */}
      <div className="rg-left-panel" style={{
        width: '40%', minHeight: '100vh', flexShrink: 0,
        background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '52px 52px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(200,145,40,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(200,145,40,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(200,145,40,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '360px', height: '360px', background: 'radial-gradient(circle, rgba(22,163,74,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Link to="/"><img src={LOGO} alt="OWERU" style={{ height: '30px', width: 'auto' }} /></Link>
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
            <div style={{ width: '28px', height: '2px', background: GOLD }} />
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: GOLD }}>
              Join Oweru Today
            </span>
          </div>

          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(36px, 3.6vw, 52px)', fontWeight: 400, lineHeight: 1.1, color: '#FFFFFF', marginBottom: '22px', letterSpacing: '-0.01em' }}>
            Africa's <span style={{ fontStyle: 'italic', color: GOLD }}>Premium</span><br />
            Property Hub.
          </h2>

          <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.75, marginBottom: '44px', maxWidth: '320px' }}>
            Connecting landlords, agents, and tenants seamlessly with a modern digital platform built for Africa.
          </p>

          {/* Benefits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {[
              { num: '01', title: 'Manually Vetted Listings',               desc: 'Every property is monitored and certified by our administrative team.' },
              { num: '02', title: 'Unified Payment Infrastructure',          desc: 'Settle payments safely via integrated mobile money and banking networks.' },
              { num: '03', title: 'Real-time Portfolio Operations',          desc: 'Track leasing metrics, transactions, and occupancy in one place.' },
            ].map(b => (
              <div key={b.num} style={{ display: 'flex', gap: '18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: GOLD, letterSpacing: '0.06em', paddingTop: '2px', flexShrink: 0 }}>{b.num}</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>{b.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.6 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A', animation: 'pulse-rg 2s ease-in-out infinite' }} />
          <span style={{ fontSize: '11px', color: '#475569', fontWeight: 500, letterSpacing: '0.06em' }}>
            © {new Date().getFullYear()} Oweru Group · Dar es Salaam, Tanzania
          </span>
        </div>
      </div>

      {/* ═══ RIGHT — Form Panel ═══ */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#F1F5F9', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '480px', animation: 'fadeUp 0.4s ease both' }}>

          {/* Card */}
          <div className="rg-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>

            {/* Logo (mobile) */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
              <Link to="/"><img src={LOGO} alt="OWERU" style={{ height: '28px', width: 'auto' }} /></Link>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '28px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px' }}>
              {[
                { n: 1, label: 'Personal Info'  },
                { n: 2, label: 'Security Setup' },
              ].map((s, i) => (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i === 0 ? 'none' : 1, gap: '8px', ...(i > 0 ? { flex: 1 } : {}) }}>
                  {i > 0 && (
                    <div style={{ flex: 1, height: '2px', background: step >= 2 ? GOLD : '#E2E8F0', transition: 'background 0.4s ease', margin: '0 10px' }} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', border: `1.5px solid ${step === s.n ? GOLD : step > s.n ? '#16A34A' : '#E2E8F0'}`, background: step === s.n ? `${GOLD}15` : step > s.n ? '#DCFCE7' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s', fontSize: '11px', fontWeight: 700, color: step === s.n ? GOLD : step > s.n ? '#16A34A' : '#94A3B8' }}>
                      {step > s.n ? <Check size={13} strokeWidth={3} /> : s.n}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: step === s.n ? 700 : 500, color: step === s.n ? '#0F172A' : step > s.n ? '#16A34A' : '#94A3B8', transition: 'color 0.25s', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Heading */}
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '5px' }}>
                {step === 1 ? 'Create your account' : 'Secure your account'}
              </h1>
              <p style={{ fontSize: '14px', color: '#64748B' }}>
                {step === 1 ? 'Enter your details to get started with Oweru.' : 'Set a strong password to protect your workspace.'}
              </p>
            </div>

            {isAuthenticated && user?.email && (
              <div style={{ marginBottom: 16, padding: '12px 14px', background: '#EFF6FF', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 10, fontSize: 13, color: '#1E40AF', lineHeight: 1.5 }}>
                You are still signed in as <strong>{user.email}</strong>. To register someone else,{' '}
                <button type="button" onClick={() => { logout(); setAlert(null); }} style={{ background: 'none', border: 'none', color: GOLD, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                  sign out first
                </button>
                , or use a different email below.
              </div>
            )}

            {/* Alerts */}
            {alert && (
              <AuthAlert
                variant={alert.variant}
                title={alert.title}
                messages={alert.messages}
                emailForLogin={alert.emailForLogin}
              />
            )}
            {fieldErrors.length > 0 && !alert && (
              <div style={{ background: '#FFF1F2', border: '1px solid rgba(220,38,38,0.22)', borderRadius: '10px', padding: '13px 14px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {fieldErrors.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#DC2626', lineHeight: 1.4 }}>
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <>
                {/* Role selector */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#334155', marginBottom: '10px' }}>
                    I am a…
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {userTypes.map(t => {
                      const active = formData.userType === t.value;
                      return (
                        <button key={t.value} type="button" className={`rg-type-btn ${active ? 'rg-type-active' : ''}`}
                          onClick={() => setFormData({ ...formData, userType: t.value })}
                          style={{ padding: '13px 14px', border: `1.5px solid ${active ? t.color : '#E2E8F0'}`, borderRadius: '10px', background: active ? `${t.color}0D` : '#FFFFFF', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', fontFamily: "'DM Sans', sans-serif" }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: active ? t.color : '#0F172A', marginBottom: '2px', transition: 'color 0.18s' }}>{t.label}</div>
                          <div style={{ fontSize: '12px', color: '#94A3B8' }}>{t.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <InputField label="First Name" name="firstName" placeholder="First name" icon={User} value={formData.firstName} onChange={handleChange} />
                  <InputField label="Last Name"  name="lastName"  placeholder="Last name"  icon={User} value={formData.lastName} onChange={handleChange} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  <InputField label="Email Address" name="email" type="email" placeholder="you@gmail.com" icon={Mail} value={formData.email} onChange={handleChange} />
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '-6px 0 0', lineHeight: 1.45 }}>
                    Use a real inbox (Gmail, Outlook, Yahoo, or work email). Temporary addresses are not accepted.
                  </p>
                  <InputField label="Phone Number"  name="phone" type="tel"   placeholder="+255 xxx xxx xxx" icon={Phone} value={formData.phone} onChange={handleChange} />
                </div>

                {/* Primary CTA */}
                <button type="button" onClick={handleNext}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#0F172A', color: '#FFFFFF', padding: '14px 24px', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '20px', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 14px rgba(15,23,42,0.20)', transition: 'all 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                  Continue <ArrowRight size={16} />
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94A3B8' }}>Or register with</span>
                  <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                </div>

                <button type="button" className="rg-social-btn" onClick={handleGoogleRegister}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '10px', color: '#334155', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', marginBottom: '0' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 4.9c1.69 0 3.22.6 4.41 1.58l3.3-3.3A11.95 11.95 0 0 0 12 1C8.37 1 5.17 2.91 3.27 5.76l2 4z"/>
                    <path fill="#34A853" d="M16.04 18.01A7.05 7.05 0 0 1 12 19.1c-2.86 0-5.3-1.69-6.49-4.15l-3.95 3.06A11.97 11.97 0 0 0 12 23c2.93 0 5.63-1.05 7.69-2.77l-3.65-2.22z"/>
                    <path fill="#FBBC05" d="M19.69 20.23A12 12 0 0 0 23 12c0-.73-.08-1.44-.2-2.12H12v4.5h6.2a5.27 5.27 0 0 1-2.17 3.47l3.66 2.38z"/>
                    <path fill="#4285F4" d="M5.51 14.95A7.11 7.11 0 0 1 4.9 12c0-1.03.18-2.03.51-2.95L3.27 5.76A12 12 0 0 0 1 12c0 2.1.54 4.08 1.51 5.79l3-2.84z"/>
                  </svg>
                  Continue with Google
                </button>
              </>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                  <InputField label="Password" name="password" toggle onToggle={() => setShowPassword(!showPassword)} showToggle={showPassword} placeholder="Minimum 8 characters" icon={Lock} value={formData.password} onChange={handleChange} />
                  <InputField label="Confirm Password" name="confirmPassword" toggle onToggle={() => setShowConfirmPassword(!showConfirmPassword)} showToggle={showConfirmPassword} placeholder="Repeat your password" icon={Lock} value={formData.confirmPassword} onChange={handleChange} />
                </div>

                {/* Password strength */}
                {formData.password && (
                  <div style={{ marginBottom: '20px', padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Password strength</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: strengthColor }}>
                        {['Weak', 'Fair', 'Good', 'Strong'][pwStrength - 1] || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i < pwStrength ? strengthColor : '#E2E8F0', transition: 'background 0.3s ease' }} />
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {pwReqs.map(r => (
                        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', background: r.met ? '#DCFCE7' : '#F1F5F9', border: `1px solid ${r.met ? '#16A34A' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                            {r.met && <Check size={8} strokeWidth={3} style={{ color: '#16A34A' }} />}
                          </div>
                          <span style={{ fontSize: '12px', color: r.met ? '#334155' : '#94A3B8', fontWeight: r.met ? 600 : 400, transition: 'color 0.2s' }}>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Terms */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px', cursor: 'pointer', padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                  <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange} style={{ display: 'none' }} />
                  <div style={{ width: 18, height: 18, borderRadius: '5px', border: `1.5px solid ${formData.agreeToTerms ? GOLD : '#CBD5E1'}`, background: formData.agreeToTerms ? `${GOLD}15` : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s', flexShrink: 0, marginTop: '1px' }}>
                    {formData.agreeToTerms && <Check size={11} strokeWidth={3} style={{ color: GOLD }} />}
                  </div>
                  <span style={{ fontSize: '13px', color: '#475569', lineHeight: 1.55 }}>
                    I agree to the <Link to="#terms" style={{ color: GOLD, fontWeight: 700, textDecoration: 'none' }}>Terms of Service</Link> and <Link to="#privacy" style={{ color: GOLD, fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</Link>.
                  </span>
                </label>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="rg-back-btn" onClick={handleBack}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px 20px', background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '10px', color: '#334155', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', flexShrink: 0 }}>
                    <ArrowLeft size={15} /> Back
                  </button>
                  <button type="submit" disabled={isLoading}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: GOLD, color: '#FFFFFF', padding: '13px 24px', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, boxShadow: `0 4px 16px ${GOLD}35`, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }}
                    onMouseEnter={e => !isLoading && (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                    {isLoading
                      ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Creating account…</>
                      : <>Complete Registration <ArrowRight size={16} /></>
                    }
                  </button>
                </div>
              </form>
            )}

            {/* Security note */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px', background: '#F1F5F9', borderRadius: '8px', margin: '20px 0' }}>
              <ShieldCheck size={13} style={{ color: '#16A34A', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>256-bit SSL encrypted · Your data is secure</span>
            </div>

            {/* Footer link */}
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: GOLD, fontWeight: 700, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;