import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import Api, { TOKEN_KEY } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LOGO from '../assets/IMG-20260326-WA0006.jpg';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', userType: 'tenant', agreeToTerms: false,
  });
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading,           setIsLoading]           = useState(false);
  const [errors,              setErrors]              = useState<string[]>([]);
  const [step,                setStep]                = useState(1);

  const navigate  = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const validateStep1 = () => {
    const errs: string[] = [];
    if (!formData.firstName.trim()) errs.push('First name is required');
    if (!formData.lastName.trim())  errs.push('Last name is required');
    if (!formData.email.trim())     errs.push('Email address is required');
    if (!formData.phone.trim())     errs.push('Phone number is required');
    setErrors(errs);
    return errs.length === 0;
  };

  const validateStep2 = () => {
    const errs: string[] = [];
    if (!formData.password)                             errs.push('Password is required');
    if (formData.password.length < 8)                   errs.push('Password must be at least 8 characters');
    if (formData.password !== formData.confirmPassword) errs.push('Passwords do not match');
    if (!formData.agreeToTerms)                         errs.push('You must agree to the Terms & Privacy Policy');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleNext = () => { if (validateStep1()) { setStep(2); setErrors([]); } };
  const handleBack = () => { setStep(1); setErrors([]); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsLoading(true);
    setErrors([]);

    try {
      const response = await Api.register({
        first_name:            formData.firstName,
        last_name:             formData.lastName,
        email:                 formData.email,
        password:              formData.password,
        password_confirmation: formData.confirmPassword,
        phone:                 formData.phone,
        user_type:             formData.userType,   // ← selected role is sent here
      });

      // api.ts unwraps one level so response.data = { user, token }
      const { user, token } = response.data as any;

      if (!user || !token) throw new Error('Invalid response from server');

      // Store token under the same key api.ts reads on every request
      localStorage.setItem(TOKEN_KEY, token);

      // Hydrate AuthContext so DashboardLayout sees the user immediately
      login(user, token);

      // ── KEY FIX: navigate to role-specific dashboard ──
      // user.userType comes from AuthController->formatUser() as camelCase
      navigate(`/dashboard/${user.userType}`);

    } catch (err: any) {
      console.error('Registration error:', err);

      // Unwrap Laravel validation errors: { errors: { field: ['msg'] } }
      const laravelErrors = err?.response?.data?.errors;
      if (laravelErrors) {
        const msgs = Object.values(laravelErrors).flat() as string[];
        setErrors(msgs);
      } else {
        setErrors([
          err?.response?.data?.message ||
          err?.message ||
          'Registration failed. Please try again.',
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const pwReqs = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'Uppercase letter',      met: /[A-Z]/.test(formData.password) },
    { label: 'Lowercase letter',      met: /[a-z]/.test(formData.password) },
    { label: 'Contains a number',     met: /\d/.test(formData.password) },
  ];
  const pwStrength = pwReqs.filter(r => r.met).length;

  const userTypes = [
    { value: 'tenant',   label: 'Tenant',   desc: 'Looking to rent' },
    { value: 'landlord', label: 'Landlord', desc: 'I own property' },
    { value: 'agent',    label: 'Agent',    desc: 'Real estate professional' },
    { value: 'bnb_owner', label: 'BNB Owner', desc: 'I host BNB properties' },
  ];

  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        :root {
          --gold: var(--accent-color); --gold-light: var(--accent-light);
          --dark: var(--bg-primary); --dark-2: var(--bg-secondary); --dark-3: var(--bg-tertiary);
          --cream: var(--text-primary); --muted: var(--text-secondary);
          --border: var(--border-color); --error: #e07070; --success: #70c490;
        }
        .rg-right { flex: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 48px; overflow-y: auto; }
        .rg-left { width: 40%; min-height: 100vh; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; padding: 48px; border-right: 1px solid var(--border); flex-shrink: 0; }
        .rg-left-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 60% at 30% 30%, rgba(37,99,235,0.08) 0%, transparent 55%), radial-gradient(ellipse 50% 60% at 80% 80%, rgba(37,99,235,0.05) 0%, transparent 50%), linear-gradient(160deg, #1e293b 0%, #334155 100%); }
        .rg-left-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(37,99,235,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.035) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 10%, transparent 100%); }
        .rg-left-watermark { position: absolute; top: -4%; left: -3%; font-size: clamp(100px, 14vw, 180px); font-weight: 700; color: transparent; -webkit-text-stroke: 1px rgba(37,99,235,0.055); line-height: 1; user-select: none; letter-spacing: -0.05em; }
        .rg-left-content { position: relative; z-index: 2; }
        .rg-left-eyebrow { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .rg-left-eyebrow::before { content: ''; width: 24px; height: 1px; background: var(--gold); }
        .rg-left-title { font-size: clamp(34px, 3.5vw, 52px); font-weight: 300; line-height: 1.05; letter-spacing: -0.025em; color: var(--cream); margin-bottom: 20px; }
        .rg-left-title em { font-style: italic; color: var(--gold-light); }
        .rg-left-desc { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 300; line-height: 1.75; color: var(--muted); margin-bottom: 36px; }
        .rg-benefits { display: flex; flex-direction: column; gap: 0; }
        .rg-benefit { display: flex; align-items: flex-start; gap: 16px; padding: 16px 0; border-bottom: 1px solid rgba(37,99,235,0.07); }
        .rg-benefit:last-child { border-bottom: none; }
        .rg-benefit-num { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500; color: var(--gold); letter-spacing: 0.1em; padding-top: 2px; flex-shrink: 0; width: 24px; }
        .rg-benefit-title { font-size: 15px; font-weight: 400; color: var(--cream); margin-bottom: 3px; letter-spacing: -0.01em; }
        .rg-benefit-desc { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 300; color: var(--muted); line-height: 1.5; }
        .rg-panel { width: 100%; max-width: 460px; }
        .rg-logo { display: flex; align-items: baseline; gap: 1px; text-decoration: none; margin-bottom: 44px; }
        .rg-logo-text { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 300; letter-spacing: 0.12em; text-transform: uppercase; color: var(--cream); }
        .rg-logo-dot { color: var(--gold); font-size: 24px; font-family: 'Cormorant Garamond', serif; }
        .rg-progress { display: flex; align-items: center; gap: 0; margin-bottom: 36px; }
        .rg-step { display: flex; align-items: center; gap: 10px; flex: 1; }
        .rg-step-circle { width: 28px; height: 28px; border: 1px solid rgba(37,99,235,0.2); background: var(--dark-3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; color: var(--muted); transition: all 0.3s; }
        .rg-step-circle.active { background: var(--gold); border-color: var(--gold); color: #0a0a0a; }
        .rg-step-circle.done { background: rgba(112,196,144,0.15); border-color: rgba(112,196,144,0.4); color: var(--success); }
        .rg-step-info { flex: 1; }
        .rg-step-label { font-family: 'DM Sans', sans-serif; font-size: 9px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
        .rg-step-label.active { color: var(--gold); }
        .rg-step-name { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 400; color: rgba(138,128,112,0.6); margin-top: 2px; }
        .rg-step-name.active { color: var(--cream); }
        .rg-step-connector { width: 32px; height: 1px; background: rgba(37,99,235,0.15); flex-shrink: 0; margin: 0 8px; position: relative; overflow: hidden; }
        .rg-step-connector::after { content: ''; position: absolute; inset: 0; background: var(--gold); transform: scaleX(0); transform-origin: left; transition: transform 0.5s ease; }
        .rg-step-connector.filled::after { transform: scaleX(1); }
        .rg-title { font-size: clamp(28px, 3vw, 40px); font-weight: 300; line-height: 1.08; letter-spacing: -0.025em; color: var(--cream); margin-bottom: 6px; }
        .rg-title em { font-style: italic; color: var(--gold-light); }
        .rg-subtitle { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 300; color: var(--muted); margin-bottom: 32px; }
        .rg-user-types { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); margin-bottom: 28px; }

        @media (max-width: 480px) {
          .rg-user-types {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
        .rg-user-type { background: var(--dark-3); padding: 14px 12px; cursor: pointer; transition: all 0.2s; border: none; text-align: left; position: relative; overflow: hidden; }
        .rg-user-type.active { background: rgba(37,99,235,0.08); }
        .rg-user-type::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: var(--gold); transform: scaleX(0); transform-origin: left; transition: transform 0.3s; }
        .rg-user-type.active::after { transform: scaleX(1); }
        .rg-user-type-label { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: var(--muted); letter-spacing: 0.06em; display: block; margin-bottom: 3px; }
        .rg-user-type.active .rg-user-type-label { color: var(--gold); }
        .rg-user-type-desc { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 300; color: rgba(138,128,112,0.5); }
        .rg-errors { background: rgba(224,112,112,0.05); border: 1px solid rgba(224,112,112,0.2); padding: 14px 16px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 6px; }
        .rg-error-row { display: flex; align-items: center; gap: 8px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 300; color: var(--error); }
        .rg-form { display: flex; flex-direction: column; gap: 0; }
        .rg-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); }
        .rg-field { background: var(--dark-2); border: 1px solid rgba(37,99,235,0.12); border-bottom: none; position: relative; transition: background 0.2s, border-color 0.2s; }
        .rg-field.last { border-bottom: 1px solid rgba(37,99,235,0.12); }
        .rg-field:focus-within { background: rgba(37,99,235,0.03); border-color: rgba(37,99,235,0.35); z-index: 1; }
        .rg-field-label { font-family: 'DM Sans', sans-serif; font-size: 9px; font-weight: 500; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold); padding: 12px 16px 0 44px; }
        .rg-field-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(138,128,112,0.45); display: flex; align-items: center; pointer-events: none; }
        .rg-input { width: 100%; background: transparent; border: none; outline: none; color: var(--cream); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 300; padding: 4px 16px 12px 44px; }
        .rg-input::placeholder { color: rgba(138,128,112,0.4); }
        .rg-eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--muted); display: flex; align-items: center; padding: 4px; transition: color 0.2s; }
        .rg-eye-btn:hover { color: var(--gold); }
        .rg-pw-strength { background: var(--dark-3); border: 1px solid rgba(37,99,235,0.08); border-top: none; padding: 16px; }
        .rg-strength-bar { display: flex; gap: 3px; margin-bottom: 12px; }
        .rg-strength-seg { flex: 1; height: 2px; background: rgba(37,99,235,0.1); transition: background 0.3s; }
        .rg-strength-seg.lit-1 { background: #e07070; }
        .rg-strength-seg.lit-2 { background: #e0a870; }
        .rg-strength-seg.lit-3 { background: #c9a84c; }
        .rg-strength-seg.lit-4 { background: #70c490; }
        .rg-pw-reqs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .rg-pw-req { display: flex; align-items: center; gap: 6px; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 300; color: rgba(138,128,112,0.5); transition: color 0.2s; }
        .rg-pw-req.met { color: var(--success); }
        .rg-pw-req-dot { width: 5px; height: 5px; border-radius: 50%; border: 1px solid rgba(138,128,112,0.3); flex-shrink: 0; transition: all 0.2s; }
        .rg-pw-req.met .rg-pw-req-dot { background: var(--success); border-color: var(--success); }
        .rg-terms { background: var(--dark-2); border: 1px solid rgba(37,99,235,0.12); border-top: none; padding: 16px; display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px; }
        .rg-checkbox { width: 14px; height: 14px; border: 1px solid rgba(37,99,235,0.22); background: rgba(37,99,235,0.04); display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer; margin-top: 2px; transition: all 0.2s; }
        .rg-checkbox.checked { background: rgba(37,99,235,0.15); border-color: var(--gold); }
        .rg-checkbox.checked::after { content: ''; width: 6px; height: 6px; background: var(--gold); }
        .rg-terms-text { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 300; line-height: 1.6; color: var(--muted); }
        .rg-terms-text a { color: var(--gold); text-decoration: none; transition: color 0.2s; }
        .rg-terms-text a:hover { color: var(--gold-light); }
        .rg-btn-row { display: flex; gap: 10px; }
        .rg-btn-back { display: flex; align-items: center; gap: 8px; background: transparent; border: 1px solid rgba(37,99,235,0.2); color: var(--muted); padding: 13px 20px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 400; letter-spacing: 0.08em; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
        .rg-btn-back:hover { color: var(--cream); border-color: rgba(37,99,235,0.45); }
        .rg-btn-primary { flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px; background: var(--gold); color: #0a0a0a; padding: 13px 24px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; border: none; cursor: pointer; transition: all 0.25s; clip-path: polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px)); }
        .rg-btn-primary:hover:not(:disabled) { background: var(--gold-light); gap: 14px; }
        .rg-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .rg-spinner { width: 13px; height: 13px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #0a0a0a; border-radius: 50%; animation: rg-spin 0.7s linear infinite; }
        @keyframes rg-spin { to { transform: rotate(360deg); } }
        .rg-footer { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 300; color: var(--muted); text-align: center; margin-top: 28px; }
        .rg-footer a { color: var(--gold); text-decoration: none; font-weight: 400; transition: color 0.2s; }
        .rg-footer a:hover { color: var(--gold-light); }
        @media (max-width: 960px) { .rg-left { display: none; } .rg-right { padding: 40px 24px; } }
        @media (max-width: 480px) { .rg-field-row { grid-template-columns: 1fr; } .rg-user-types { grid-template-columns: 1fr; } .rg-pw-reqs { grid-template-columns: 1fr; } }
      `}</style>

      {/* ── Left panel ── */}
      <div className="rg-left">
        <div className="rg-left-bg" />
        <div className="rg-left-grid" />
        <div className="rg-left-watermark">JOIN</div>
        <div className="rg-left-content">
          <div className="rg-left-eyebrow">Why Oweru</div>
          <h2 className="rg-left-title">Tanzania's<br /><em>Trusted</em><br />Rental Platform</h2>
          <p className="rg-left-desc">
            Join thousands of landlords, agents, and tenants already
            using Oweru to simplify property rental across Tanzania.
          </p>
          <div className="rg-benefits">
            {[
              { num: '01', title: 'Verified Listings',  desc: 'Every property reviewed by our team before going live.' },
              { num: '02', title: 'Secure Payments',    desc: 'End-to-end encrypted payment processing you can trust.' },
              { num: '03', title: 'Agent Dashboard',    desc: 'Track leads, commissions, and performance in real time.' },
              { num: '04', title: 'Fast Approvals',     desc: 'Landlords respond within 24 hours on average.' },
            ].map(b => (
              <div key={b.num} className="rg-benefit">
                <div className="rg-benefit-num">{b.num}</div>
                <div>
                  <div className="rg-benefit-title">{b.title}</div>
                  <div className="rg-benefit-desc">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form side ── */}
      <div className="rg-right">
        <div className="rg-panel">

          <Link to="/" className="rg-logo">
            <img src={LOGO} alt="OWERU" style={{ height: '36px', width: 'auto' }} loading="lazy" decoding="async" />
          </Link>

          {/* Step progress */}
          <div className="rg-progress">
            <div className="rg-step">
              <div className={`rg-step-circle${step === 1 ? ' active' : ' done'}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <div className="rg-step-info">
                <div className={`rg-step-label${step === 1 ? ' active' : ''}`}>Step 01</div>
                <div className={`rg-step-name${step === 1 ? ' active' : ''}`}>Your Details</div>
              </div>
            </div>
            <div className={`rg-step-connector${step >= 2 ? ' filled' : ''}`} />
            <div className="rg-step">
              <div className={`rg-step-circle${step === 2 ? ' active' : ''}`}>2</div>
              <div className="rg-step-info">
                <div className={`rg-step-label${step === 2 ? ' active' : ''}`}>Step 02</div>
                <div className={`rg-step-name${step === 2 ? ' active' : ''}`}>Set Password</div>
              </div>
            </div>
          </div>

          <h1 className="rg-title">
            {step === 1 ? (<>Create Your<br /><em>Account</em></>) : (<>Secure Your<br /><em>Account</em></>)}
          </h1>
          <p className="rg-subtitle">
            {step === 1 ? 'Tell us about yourself to get started' : 'Choose a strong password to protect your account'}
          </p>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <div className="rg-user-types">
                {userTypes.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    className={`rg-user-type${formData.userType === t.value ? ' active' : ''}`}
                    onClick={() => setFormData({ ...formData, userType: t.value })}
                  >
                    <span className="rg-user-type-label">{t.label}</span>
                    <span className="rg-user-type-desc">{t.desc}</span>
                  </button>
                ))}
              </div>

              {errors.length > 0 && (
                <div className="rg-errors">
                  {errors.map((e, i) => (
                    <div key={i} className="rg-error-row">
                      <AlertCircle size={12} style={{ flexShrink: 0 }} /> {e}
                    </div>
                  ))}
                </div>
              )}

              <div className="rg-form">
                <div className="rg-field-row">
                  <div className="rg-field">
                    <div className="rg-field-icon"><User size={13} /></div>
                    <div className="rg-field-label">First Name</div>
                    <input className="rg-input" type="text" name="firstName"
                      value={formData.firstName} onChange={handleChange} placeholder="First" required />
                  </div>
                  <div className="rg-field" style={{ borderLeft: '1px solid rgba(37,99,235,0.12)' }}>
                    <div className="rg-field-icon"><User size={13} /></div>
                    <div className="rg-field-label">Last Name</div>
                    <input className="rg-input" type="text" name="lastName"
                      value={formData.lastName} onChange={handleChange} placeholder="Last" required />
                  </div>
                </div>
                <div className="rg-field">
                  <div className="rg-field-icon"><Mail size={13} /></div>
                  <div className="rg-field-label">Email Address</div>
                  <input className="rg-input" type="email" name="email"
                    value={formData.email} onChange={handleChange} placeholder="your@email.com" required />
                </div>
                <div className="rg-field last">
                  <div className="rg-field-icon"><Phone size={13} /></div>
                  <div className="rg-field-label">Phone Number</div>
                  <input className="rg-input" type="tel" name="phone"
                    value={formData.phone} onChange={handleChange} placeholder="+255 XXX XXX XXX" required />
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <button type="button" className="rg-btn-primary" style={{ width: '100%' }} onClick={handleNext}>
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <>
              {errors.length > 0 && (
                <div className="rg-errors">
                  {errors.map((e, i) => (
                    <div key={i} className="rg-error-row">
                      <AlertCircle size={12} style={{ flexShrink: 0 }} /> {e}
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="rg-form">
                  <div className="rg-field">
                    <div className="rg-field-icon"><Lock size={13} /></div>
                    <div className="rg-field-label">Password</div>
                    <input
                      className="rg-input" style={{ paddingRight: 44 }}
                      type={showPassword ? 'text' : 'password'}
                      name="password" value={formData.password} onChange={handleChange}
                      placeholder="Create a password" required autoComplete="new-password"
                    />
                    <button type="button" className="rg-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  <div className="rg-field last">
                    <div className="rg-field-icon"><Lock size={13} /></div>
                    <div className="rg-field-label">Confirm Password</div>
                    <input
                      className="rg-input" style={{ paddingRight: 44 }}
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                      placeholder="Repeat your password" required autoComplete="new-password"
                    />
                    <button type="button" className="rg-eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                {formData.password && (
                  <div className="rg-pw-strength">
                    <div className="rg-strength-bar">
                      {[0,1,2,3].map(i => (
                        <div key={i} className={`rg-strength-seg${i < pwStrength ? ` lit-${pwStrength}` : ''}`} />
                      ))}
                    </div>
                    <div className="rg-pw-reqs">
                      {pwReqs.map(r => (
                        <div key={r.label} className={`rg-pw-req${r.met ? ' met' : ''}`}>
                          <div className="rg-pw-req-dot" />{r.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rg-terms">
                  <div
                    className={`rg-checkbox${formData.agreeToTerms ? ' checked' : ''}`}
                    onClick={() => setFormData({ ...formData, agreeToTerms: !formData.agreeToTerms })}
                  />
                  <p className="rg-terms-text">
                    I agree to the <a href="#">Terms and Conditions</a> and <a href="#">Privacy Policy</a>
                  </p>
                </div>

                <div className="rg-btn-row">
                  <button type="button" className="rg-btn-back" onClick={handleBack}>
                    <ArrowLeft size={13} /> Back
                  </button>
                  <button type="submit" className="rg-btn-primary" disabled={isLoading}>
                    {isLoading
                      ? <><div className="rg-spinner" />Creating…</>
                      : <>Create Account <ArrowRight size={13} /></>
                    }
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="rg-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;