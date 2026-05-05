import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, MapPin, FileText, Save, Edit2, Check, X, Shield, Calendar } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface CommercialUser {
  id: number; name: string; email: string; phone: string; company_name: string;
  business_license: string; address: string; description: string; verified: boolean; created_at: string;
}

interface FormData {
  name: string; phone: string; company_name: string; business_license: string; address: string; description: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<CommercialUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<FormData>({
    name: '', phone: '', company_name: '', business_license: '', address: '', description: ''
  });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/commercial/profile`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setFormData({ name: data.user.name, phone: data.user.phone, company_name: data.user.company_name, business_license: data.user.business_license, address: data.user.address, description: data.user.description || '' });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = 'Name is required';
    if (!formData.phone.trim()) e.phone = 'Phone is required';
    if (!formData.company_name.trim()) e.company_name = 'Company name is required';
    if (!formData.business_license.trim()) e.business_license = 'Business license is required';
    if (!formData.address.trim()) e.address = 'Address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/commercial/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user); setEditing(false); setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const err = await res.json();
        if (err.errors) setErrors(err.errors);
        else setErrors({ submit: err.message || 'Failed to update profile' });
      }
    } catch { setErrors({ submit: 'Network error. Please try again.' }); }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    if (user) setFormData({ name: user.name, phone: user.phone, company_name: user.company_name, business_license: user.business_license, address: user.address, description: user.description || '' });
    setEditing(false); setErrors({}); setSuccess('');
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-TZ', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2px solid rgba(212,175,55,0.15)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#4A5568', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Loading profile…</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#080E1A', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .form-input {
          width: 100%; padding: 11px 16px;
          background: #0C1420; border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; color: #E2D5B0; font-size: 13px;
          font-family: 'DM Sans', sans-serif; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input::placeholder { color: #2D3748; }
        .form-input:not(:disabled):focus { border-color: rgba(212,175,55,0.5); box-shadow: 0 0 0 3px rgba(212,175,55,0.07); }
        .form-input:disabled { opacity: 0.45; cursor: not-allowed; }
        .form-label { display: block; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #4A5568; margin-bottom: 8px; }
        .card-panel { background: #0F1829; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden; }
        .panel-header { padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: space-between; }
        .gold-dot { width: 7px; height: 7px; border-radius: 50%; background: #D4AF37; flex-shrink: 0; box-shadow: 0 0 8px rgba(212,175,55,0.5); }
        .panel-body { padding: 22px; }
        .field-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .error-text { margin-top: 5px; font-size: 11px; color: #F87171; }
        .quick-info-row { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .quick-info-row:last-child { border-bottom: none; padding-bottom: 0; }
        .quick-info-row:first-child { padding-top: 0; }
        .btn-edit { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); color: #080E1A; border: none; border-radius: 12px; font-size: 12px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 16px rgba(212,175,55,0.2); }
        .btn-edit:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(212,175,55,0.3); }
        .btn-cancel { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: #94A3B8; font-size: 12px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
        .btn-cancel:hover { border-color: rgba(212,175,55,0.3); color: #E2D5B0; }
        .btn-save { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); color: #080E1A; border: none; border-radius: 12px; font-size: 12px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 16px rgba(212,175,55,0.2); }
        .btn-save:hover { transform: translateY(-1px); }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(8,14,26,0.3); border-top-color: #080E1A; border-radius: 50%; animation: spin 0.8s linear infinite; }
        .success-banner { display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); border-radius: 14px; margin-bottom: 20px; }
        .err-banner { display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 14px; margin-bottom: 20px; }
        .profile-avatar { width: 80px; height: 80px; background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.15); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .verified-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
        .status-row { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 12px; border: 1px solid; font-size: 13px; font-weight: 600; }
        .warn-banner { background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.2); border-radius: 20px; padding: 20px 22px; margin-top: 16px; }
        .warn-icon { width: 44px; height: 44px; background: rgba(245,158,11,0.1); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .check-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 14px; }
        @media (min-width: 640px) { .check-grid { grid-template-columns: repeat(4, 1fr); } }
        .layout-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 1024px) { .layout-grid { grid-template-columns: 300px 1fr; } }
        @media (max-width: 640px) { .field-grid-2 { grid-template-columns: 1fr !important; } }
        select option { background: #0C1420; color: #E2D5B0; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#D4AF37', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Account</span>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700, color: '#F1EDD8', fontFamily: "'Playfair Display', serif", lineHeight: 1.1, marginBottom: 4 }}>
            Company Profile
          </h1>
          <p style={{ color: '#4A5568', fontSize: 13 }}>Manage your commercial business information</p>
        </div>

        {/* Alerts */}
        {success && (
          <div className="success-banner">
            <Check size={16} color="#10B981" style={{ flexShrink: 0 }} />
            <p style={{ color: '#10B981', fontSize: 13 }}>{success}</p>
          </div>
        )}
        {errors.submit && (
          <div className="err-banner">
            <X size={16} color="#F87171" style={{ flexShrink: 0 }} />
            <p style={{ color: '#F87171', fontSize: 13 }}>{errors.submit}</p>
          </div>
        )}

        <div className="layout-grid">

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Avatar card */}
            <div className="card-panel" style={{ padding: '28px 22px', textAlign: 'center' }}>
              <div className="profile-avatar">
                <Building2 size={36} color="#D4AF37" />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F1EDD8', marginBottom: 4 }}>{user?.name}</h2>
              <p style={{ color: '#4A5568', fontSize: 13, marginBottom: 16 }}>{user?.company_name}</p>
              <span className="verified-badge" style={{
                background: user?.verified ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${user?.verified ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                color: user?.verified ? '#10B981' : '#F59E0B'
              }}>
                {user?.verified ? <><Shield size={11} />Verified Business</> : <><X size={11} />Pending Verification</>}
              </span>
            </div>

            {/* Quick info */}
            <div className="card-panel">
              <div className="panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="gold-dot" />
                  <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Contact Info</span>
                </div>
              </div>
              <div style={{ padding: '16px 22px' }}>
                {[
                  { icon: <Mail size={14} />, value: user?.email },
                  { icon: <Phone size={14} />, value: user?.phone },
                  { icon: <MapPin size={14} />, value: user?.address },
                  { icon: <Calendar size={14} />, value: user && `Since ${formatDate(user.created_at)}` },
                ].map((item, i) => (
                  <div key={i} className="quick-info-row">
                    <span style={{ color: '#4A5568', marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, color: '#94A3B8', wordBreak: 'break-all', lineHeight: 1.4 }}>{item.value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — form */}
          <div className="card-panel">
            <div className="panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="gold-dot" />
                <span style={{ color: '#E2D5B0', fontWeight: 600, fontSize: 14 }}>Business Information</span>
              </div>
              {!editing ? (
                <button className="btn-edit" onClick={() => setEditing(true)}>
                  <Edit2 size={13} />Edit
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-cancel" onClick={handleCancel}><X size={13} />Cancel</button>
                  <button className="btn-save" onClick={handleSubmit} disabled={saving}>
                    {saving ? <div className="spinner-sm" /> : <Save size={13} />}
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="panel-body">
              <div className="field-grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <label className="form-label">Business Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} disabled={!editing} className="form-input" placeholder="Your business name" />
                  {errors.name && <p className="error-text">{errors.name}</p>}
                </div>
                <div>
                  <label className="form-label">Phone Number *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={!editing} className="form-input" placeholder="+255712345678" />
                  {errors.phone && <p className="error-text">{errors.phone}</p>}
                </div>
                <div>
                  <label className="form-label">Company Name *</label>
                  <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} disabled={!editing} className="form-input" placeholder="Company Ltd." />
                  {errors.company_name && <p className="error-text">{errors.company_name}</p>}
                </div>
                <div>
                  <label className="form-label">Business License *</label>
                  <input type="text" name="business_license" value={formData.business_license} onChange={handleChange} disabled={!editing} className="form-input" placeholder="BL-2024-COM-001" />
                  {errors.business_license && <p className="error-text">{errors.business_license}</p>}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Business Address *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} disabled={!editing} className="form-input" placeholder="Full business address" />
                  {errors.address && <p className="error-text">{errors.address}</p>}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Business Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} disabled={!editing} rows={3} className="form-input" style={{ resize: 'none' }} placeholder="Tell us about your business…" />
                </div>
              </div>

              {/* Account section */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 20 }}>
                <div className="field-grid-2">
                  <div>
                    <label className="form-label">Email Address</label>
                    <input type="email" value={user?.email || ''} disabled className="form-input" />
                    <p style={{ marginTop: 5, fontSize: 10, color: '#2D3748' }}>Email cannot be changed here</p>
                  </div>
                  <div>
                    <label className="form-label">Account Status</label>
                    <div className="status-row" style={{
                      borderColor: user?.verified ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                      background: user?.verified ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)',
                      color: user?.verified ? '#10B981' : '#F59E0B'
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: user?.verified ? '#10B981' : '#F59E0B', boxShadow: `0 0 8px ${user?.verified ? '#10B98180' : '#F59E0B80'}` }} />
                      {user?.verified ? 'Verified Business' : 'Pending Verification'}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Verification Banner */}
        {!user?.verified && (
          <div className="warn-banner">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div className="warn-icon">
                <Shield size={20} color="#F59E0B" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F59E0B', marginBottom: 6 }}>Verification Pending</h3>
                <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 0 }}>Your account is under review. This typically takes 1–3 business days.</p>
                <div className="check-grid">
                  {['Valid business license', 'Complete information', 'Active listings', 'Contact verified'].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#64748B' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(245,158,11,0.5)', flexShrink: 0 }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;