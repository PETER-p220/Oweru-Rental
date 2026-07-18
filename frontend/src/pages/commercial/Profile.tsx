import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, MapPin, FileText, Save, Edit2, Check, X, Shield, Calendar } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
        setFormData({ 
          name: data.user.name, 
          phone: data.user.phone, 
          company_name: data.user.company_name, 
          business_license: data.user.business_license, 
          address: data.user.address, 
          description: data.user.description || '' 
        });
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
    setSaving(true); 
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/commercial/profile`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json', 
          'Accept': 'application/json' 
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user); 
        setEditing(false); 
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const err = await res.json();
        if (err.errors) setErrors(err.errors);
        else setErrors({ submit: err.message || 'Failed to update profile' });
      }
    } catch { 
      setErrors({ submit: 'Network error. Please try again.' }); 
    }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({ 
        name: user.name, 
        phone: user.phone, 
        company_name: user.company_name, 
        business_license: user.business_license, 
        address: user.address, 
        description: user.description || '' 
      });
    }
    setEditing(false); 
    setErrors({}); 
    setSuccess('');
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-TZ', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });

  if (loading) {
    return (
      <div className="cd-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748B' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cd-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .cd-page { background: #F1F5F9; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .cd-card { 
          background: #FFFFFF; 
          border: 1px solid #E2E8F0; 
          border-radius: 16px; 
          overflow: hidden; 
          box-shadow: 0 1px 3px rgba(15,23,42,0.04); 
        }
        .cd-form-input {
          width: 100%; 
          padding: 12px 14px; 
          border: 1px solid #CBD5E1; 
          border-radius: 10px; 
          font-size: 14px; 
          color: #0F172A; 
        }
        .cd-form-input:focus { 
          border-color: #3B82F6; 
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1); 
          outline: none; 
        }
        .cd-form-input:disabled { 
          background: #F8FAFC; 
          color: #64748B; 
        }
      `}</style>

      <div className="cd-wrap" style={{ maxWidth: 1100, padding: '32px 40px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#64748B', textTransform: 'uppercase' }}>
            ACCOUNT
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 28px)', fontWeight: 800, color: '#0F172A', margin: '8px 0 4px' }}>
            Company Profile
          </h1>
          <p style={{ color: '#64748B' }}>Manage your commercial business information</p>
        </div>

        {success && (
          <div style={{ background: '#DCFCE7', border: '1px solid #BBF7D0', color: '#166534', padding: '14px 20px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Check size={20} /> {success}
          </div>
        )}

        {errors.submit && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#B91C1C', padding: '14px 20px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <X size={20} /> {errors.submit}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, '@media (min-width: 1024px)': { gridTemplateColumns: '320px 1fr' } }}>

          {/* Left Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="cd-card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ width: 96, height: 96, background: '#EFF6FF', borderRadius: 20, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={48} style={{ color: '#3B82F6' }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{user?.name}</h2>
              <p style={{ color: '#64748B', marginTop: 4 }}>{user?.company_name}</p>

              <div style={{ marginTop: 20 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 16px',
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 700,
                  background: user?.verified ? '#DCFCE7' : '#FEF3C7',
                  color: user?.verified ? '#166534' : '#92400E',
                  border: `1px solid ${user?.verified ? '#BBF7D0' : '#FDE68A'}`
                }}>
                  {user?.verified ? <Shield size={14} /> : <X size={14} />}
                  {user?.verified ? 'Verified Business' : 'Pending Verification'}
                </span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="cd-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Contact Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { icon: <Mail size={18} />, label: 'Email', value: user?.email },
                  { icon: <Phone size={18} />, label: 'Phone', value: user?.phone },
                  { icon: <MapPin size={18} />, label: 'Address', value: user?.address },
                  { icon: <Calendar size={18} />, label: 'Member Since', value: user ? formatDate(user.created_at) : '' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ color: '#64748B', marginTop: 2 }}>{item.icon}</div>
                    <div>
                      <p style={{ fontSize: 12, color: '#64748B' }}>{item.label}</p>
                      <p style={{ color: '#0F172A', fontSize: 14 }}>{item.value || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="cd-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={20} style={{ color: '#3B82F6' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Business Information</h3>
              </div>

              {!editing ? (
                <button onClick={() => setEditing(true)} className="cd-btn" style={{ background: '#0F172A', color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Edit2 size={16} /> Edit Profile
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleCancel} className="cd-btn" style={{ border: '1px solid #CBD5E1', color: '#475569' }}>
                    Cancel
                  </button>
                  <button onClick={handleSubmit} disabled={saving} className="cd-btn" style={{ background: '#0F172A', color: 'white' }}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Business Name <span style={{color: '#EF4444'}}>*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} disabled={!editing} className="cd-form-input" />
                  {errors.name && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.name}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Phone Number <span style={{color: '#EF4444'}}>*</span></label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={!editing} className="cd-form-input" />
                  {errors.phone && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.phone}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Company Name <span style={{color: '#EF4444'}}>*</span></label>
                  <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} disabled={!editing} className="cd-form-input" />
                  {errors.company_name && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.company_name}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Business License <span style={{color: '#EF4444'}}>*</span></label>
                  <input type="text" name="business_license" value={formData.business_license} onChange={handleChange} disabled={!editing} className="cd-form-input" />
                  {errors.business_license && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.business_license}</p>}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Business Address <span style={{color: '#EF4444'}}>*</span></label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} disabled={!editing} className="cd-form-input" />
                  {errors.address && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.address}</p>}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Business Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} disabled={!editing} rows={4} className="cd-form-input" style={{ resize: 'vertical' }} />
                </div>
              </div>

              {/* Email (non-editable) */}
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #E2E8F0' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Email Address</label>
                <input type="email" value={user?.email || ''} disabled className="cd-form-input" />
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>Email cannot be changed from this page</p>
              </div>
            </form>
          </div>
        </div>

        {/* Verification Notice */}
        {!user?.verified && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12, padding: 24, marginTop: 24 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 48, height: 48, background: '#FBBF24', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={24} color="#92400E" />
              </div>
              <div>
                <h3 style={{ color: '#92400E', fontWeight: 700 }}>Verification Pending</h3>
                <p style={{ color: '#B45309', marginTop: 6 }}>Your business account is under review. This usually takes 1-3 business days.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;