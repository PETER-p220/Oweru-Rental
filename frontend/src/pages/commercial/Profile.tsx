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

const inputCls = (disabled: boolean) =>
  `w-full px-4 py-3 bg-[#1E2D4A] border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none transition-colors ${disabled ? 'opacity-50 cursor-not-allowed border-[#1E2D4A]' : 'border-[#1E2D4A] focus:border-[#C89128]'}`;

const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2";

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
    setSaving(true);
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/commercial/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
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
    } catch { setErrors({ submit: 'Network error. Please try again.' }); }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    if (user) setFormData({ name: user.name, phone: user.phone, company_name: user.company_name, business_license: user.business_license, address: user.address, description: user.description || '' });
    setEditing(false); setErrors({}); setSuccess('');
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-TZ', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#C89128] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading profile…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-widest text-[#C89128] uppercase mb-1">Account</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Company Profile</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your commercial business information</p>
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-5 flex items-center gap-3 px-4 py-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-emerald-400 text-sm">{success}</p>
          </div>
        )}
        {errors.submit && (
          <div className="mb-5 flex items-center gap-3 px-4 py-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
            <X className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl p-6 text-center">
              <div className="w-20 h-20 bg-[#C89128]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-[#C89128]" />
              </div>
              <h2 className="text-lg font-semibold text-white">{user?.name}</h2>
              <p className="text-slate-400 text-sm mt-0.5 mb-4">{user?.company_name}</p>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${user?.verified ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'}`}>
                {user?.verified ? <><Shield className="w-3 h-3" />Verified Business</> : <><X className="w-3 h-3" />Pending Verification</>}
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl p-5 space-y-3">
              {[
                { icon: <Mail className="w-4 h-4" />, value: user?.email },
                { icon: <Phone className="w-4 h-4" />, value: user?.phone },
                { icon: <MapPin className="w-4 h-4" />, value: user?.address },
                { icon: <Calendar className="w-4 h-4" />, value: user && `Since ${formatDate(user.created_at)}` },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-slate-500 mt-0.5 flex-shrink-0">{item.icon}</span>
                  <span className="text-sm text-slate-300 break-all">{item.value || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1E2D4A] flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Business Information</h2>
                {!editing ? (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#C89128] text-[#0F172A] rounded-xl text-xs font-semibold hover:bg-[#D4A843] transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleCancel}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#1E2D4A] text-white rounded-xl text-xs font-medium hover:bg-[#1E2D4A]/80 transition-colors">
                      <X className="w-3.5 h-3.5" />Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#C89128] text-[#0F172A] rounded-xl text-xs font-semibold hover:bg-[#D4A843] transition-colors disabled:opacity-50">
                      {saving ? <div className="w-3.5 h-3.5 border-2 border-[#0F172A]/30 border-t-[#0F172A] rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Business Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} disabled={!editing} className={inputCls(!editing)} placeholder="Your business name" />
                    {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number *</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={!editing} className={inputCls(!editing)} placeholder="+255712345678" />
                    {errors.phone && <p className="mt-1.5 text-xs text-red-400">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Company Name *</label>
                    <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} disabled={!editing} className={inputCls(!editing)} placeholder="Company Ltd." />
                    {errors.company_name && <p className="mt-1.5 text-xs text-red-400">{errors.company_name}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Business License *</label>
                    <input type="text" name="business_license" value={formData.business_license} onChange={handleChange} disabled={!editing} className={inputCls(!editing)} placeholder="BL-2024-COM-001" />
                    {errors.business_license && <p className="mt-1.5 text-xs text-red-400">{errors.business_license}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Business Address *</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} disabled={!editing} className={inputCls(!editing)} placeholder="Full business address" />
                    {errors.address && <p className="mt-1.5 text-xs text-red-400">{errors.address}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Business Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} disabled={!editing} rows={3} className={`${inputCls(!editing)} resize-none`} placeholder="Tell us about your business…" />
                  </div>
                </div>

                {/* Account section */}
                <div className="border-t border-[#1E2D4A] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Email Address</label>
                    <input type="email" value={user?.email || ''} disabled className={inputCls(true)} />
                    <p className="mt-1.5 text-[10px] text-slate-600">Email cannot be changed here</p>
                  </div>
                  <div>
                    <label className={labelCls}>Account Status</label>
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${user?.verified ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-400' : 'border-amber-400/20 bg-amber-400/5 text-amber-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${user?.verified ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {user?.verified ? 'Verified Business' : 'Pending Verification'}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Verification Banner */}
        {!user?.verified && (
          <div className="mt-5 bg-amber-400/8 border border-amber-400/20 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-amber-400 mb-1">Verification Pending</h3>
                <p className="text-slate-300 text-sm mb-3">Your account is under review. This typically takes 1–3 business days.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Valid business license', 'Complete information', 'Active listings', 'Contact verified'].map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <div className="w-1.5 h-1.5 bg-amber-400/50 rounded-full flex-shrink-0" />
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