import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, X, Upload, MapPin, DollarSign, Home, Car, Calendar, Save, ChevronRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface Amenity { id: number; name: string; icon: string; }

interface FormData {
  title: string; description: string; type: string; location: string; address: string;
  price: number; price_type: string; parking_spaces: number; furnished: boolean;
  available_from: string; contact_phone: string; contact_email: string; amenities: number[];
}

const inputCls = "w-full px-4 py-3 bg-[#1E2D4A] border border-[#1E2D4A] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#C89128] transition-colors";
const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2";
const errorCls = "mt-1.5 text-xs text-red-400";

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#1E2D4A]">
      <span className="text-[#C89128]">{icon}</span>
      <h2 className="text-base font-semibold text-white">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const AddProperty: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    title: '', description: '', type: 'office', location: '', address: '',
    price: 0, price_type: 'monthly', parking_spaces: 0, furnished: false,
    available_from: '', contact_phone: '', contact_email: '', amenities: []
  });

  useEffect(() => { fetchAmenities(); }, []);

  const fetchAmenities = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/commercial/amenities`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.ok) setAmenities(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? Number(value) : value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const toggleAmenity = (id: number) =>
    setFormData(p => ({ ...p, amenities: p.amenities.includes(id) ? p.amenities.filter(x => x !== id) : [...p.amenities, id] }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    setImages(p => [...p, ...files]);
    files.forEach(file => {
      const r = new FileReader();
      r.onload = (ev) => setImagePreviews(p => [...p, ev.target?.result as string]);
      r.readAsDataURL(file);
    });
    if (errors.images) setErrors(p => ({ ...p, images: '' }));
  };

  const removeImage = (i: number) => {
    setImages(p => p.filter((_, idx) => idx !== i));
    setImagePreviews(p => p.filter((_, idx) => idx !== i));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.title.trim()) e.title = 'Title is required';
    if (!formData.description.trim()) e.description = 'Description is required';
    if (!formData.location.trim()) e.location = 'Location is required';
    if (!formData.address.trim()) e.address = 'Address is required';
    if (!formData.price || formData.price <= 0) e.price = 'Price must be greater than 0';
    if (!formData.available_from) e.available_from = 'Available date is required';
    if (!formData.contact_phone.trim()) e.contact_phone = 'Contact phone is required';
    if (!formData.contact_email.trim()) e.contact_email = 'Contact email is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.contact_email)) e.contact_email = 'Invalid email format';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k === 'amenities') (v as number[]).forEach(id => fd.append('amenities[]', id.toString()));
        else if (typeof v === 'boolean') fd.append(k, v ? '1' : '0');
        else fd.append(k, v.toString());
      });
      images.forEach((img, i) => fd.append(`images[${i}]`, img));
      const res = await fetch(`${API_BASE}/api/commercial/properties`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: fd
      });
      if (res.ok) {
        const propertyData = await res.json();
        navigate('/commercial/properties', { 
          state: { 
            message: '🎉 Property created successfully!',
            property: propertyData,
            type: 'success'
          } 
        });
      }
      else {
        const err = await res.json();
        if (err.errors) setErrors(err.errors);
        else setErrors({ submit: err.message || 'Failed to create property' });
      }
    } catch { setErrors({ submit: 'Network error. Please try again.' }); }
    finally { setLoading(false); }
  };

  const propertyTypes = [
    { value: 'office', label: 'Office Space' }, { value: 'retail', label: 'Retail Space' },
    { value: 'warehouse', label: 'Warehouse' }, { value: 'commercial', label: 'Commercial Building' },
    { value: 'industrial', label: 'Industrial Space' },
  ];

  const priceTypes = [
    { value: 'monthly', label: 'Per Month' }, { value: 'yearly', label: 'Per Year' }, { value: 'sale', label: 'For Sale' },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
            <span className="hover:text-slate-300 cursor-pointer" onClick={() => navigate('/commercial/properties')}>Properties</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-300">Add New</span>
          </div>
          <p className="text-xs font-semibold tracking-widest text-[#C89128] uppercase mb-1">New Listing</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Add Property</h1>
          <p className="text-slate-400 text-sm mt-1">List your commercial space on Oweru</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

          {/* Basic Info */}
          <Section icon={<Building2 className="w-4 h-4" />} title="Basic Information">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Property Title *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputCls} placeholder="e.g., Modern Office in Dar" />
                  {errors.title && <p className={errorCls}>{errors.title}</p>}
                </div>
                <div>
                  <label className={labelCls}>Property Type *</label>
                  <select name="type" value={formData.type} onChange={handleChange} className={inputCls}>
                    {propertyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Description *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className={`${inputCls} resize-none`} placeholder="Describe your property in detail…" />
                {errors.description && <p className={errorCls}>{errors.description}</p>}
              </div>
            </div>
          </Section>

          {/* Location */}
          <Section icon={<MapPin className="w-4 h-4" />} title="Location">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Area / City *</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} className={inputCls} placeholder="e.g., Dar es Salaam" />
                {errors.location && <p className={errorCls}>{errors.location}</p>}
              </div>
              <div>
                <label className={labelCls}>Full Address *</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputCls} placeholder="e.g., Ohio St, Upanga" />
                {errors.address && <p className={errorCls}>{errors.address}</p>}
              </div>
            </div>
          </Section>

          {/* Pricing */}
          <Section icon={<DollarSign className="w-4 h-4" />} title="Pricing">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Price (TZS) *</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} className={inputCls} placeholder="500000" />
                {errors.price && <p className={errorCls}>{errors.price}</p>}
              </div>
              <div>
                <label className={labelCls}>Price Type *</label>
                <select name="price_type" value={formData.price_type} onChange={handleChange} className={inputCls}>
                  {priceTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
          </Section>

          {/* Features */}
          <Section icon={<Home className="w-4 h-4" />} title="Property Features">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}><Car className="w-3.5 h-3.5 inline mr-1" />Parking Spaces</label>
                <input type="number" name="parking_spaces" value={formData.parking_spaces} onChange={handleChange} min="0" className={inputCls} placeholder="0" />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer group mt-5 sm:mt-6">
                  <div className={`w-11 h-6 rounded-full relative transition-colors ${formData.furnished ? 'bg-[#C89128]' : 'bg-[#1E2D4A]'}`}
                    onClick={() => setFormData(p => ({ ...p, furnished: !p.furnished }))}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.furnished ? 'left-6' : 'left-1'}`} />
                  </div>
                  <span className="text-sm text-slate-300">Furnished</span>
                </label>
              </div>
            </div>
          </Section>

          {/* Availability & Contact */}
          <Section icon={<Calendar className="w-4 h-4" />} title="Availability & Contact">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Available From *</label>
                <input type="date" name="available_from" value={formData.available_from} onChange={handleChange} className={inputCls} />
                {errors.available_from && <p className={errorCls}>{errors.available_from}</p>}
              </div>
              <div>
                <label className={labelCls}>Contact Phone *</label>
                <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className={inputCls} placeholder="+255712345678" />
                {errors.contact_phone && <p className={errorCls}>{errors.contact_phone}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Contact Email *</label>
                <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className={inputCls} placeholder="contact@company.com" />
                {errors.contact_email && <p className={errorCls}>{errors.contact_email}</p>}
              </div>
            </div>
          </Section>

          {/* Amenities */}
          {amenities.length > 0 && (
            <Section icon={<Plus className="w-4 h-4" />} title="Amenities">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {amenities.map(a => {
                  const active = formData.amenities.includes(a.id);
                  return (
                    <label key={a.id} onClick={() => toggleAmenity(a.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all text-sm ${active ? 'border-[#C89128]/60 bg-[#C89128]/10 text-[#C89128]' : 'border-[#1E2D4A] text-slate-400 hover:border-[#C89128]/30 hover:text-slate-200'}`}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${active ? 'bg-[#C89128] border-[#C89128]' : 'border-slate-600'}`}>
                        {active && <svg className="w-2.5 h-2.5 text-[#0F172A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      {a.name}
                    </label>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Images */}
          <Section icon={<Upload className="w-4 h-4" />} title="Property Images">
            <div>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="img-up" />
              <label htmlFor="img-up"
                className="flex flex-col items-center gap-2 border-2 border-dashed border-[#1E2D4A] hover:border-[#C89128]/40 rounded-xl p-8 cursor-pointer transition-colors group">
                <div className="w-12 h-12 bg-[#1E2D4A] rounded-xl flex items-center justify-center group-hover:bg-[#C89128]/10 transition-colors">
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#C89128] transition-colors" />
                </div>
                <p className="text-sm text-slate-300">Click to upload images</p>
                <p className="text-xs text-slate-500">PNG, JPG, GIF — max 2MB each</p>
              </label>
              {errors.images && <p className={errorCls}>{errors.images}</p>}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative group aspect-square">
                      <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                      <button type="button" onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/90 backdrop-blur-sm rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* Error & Actions */}
          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
              <X className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button type="button" onClick={() => navigate('/commercial/properties')}
              className="flex-1 sm:flex-none px-6 py-3 bg-[#162035] border border-[#1E2D4A] rounded-xl text-white text-sm font-medium hover:border-[#C89128]/30 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#C89128] text-[#0F172A] rounded-xl font-semibold text-sm hover:bg-[#D4A843] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#C89128]/20">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-[#0F172A]/30 border-t-[#0F172A] rounded-full animate-spin" />Creating…</>
              ) : (
                <><Save className="w-4 h-4" />Create Property</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddProperty;