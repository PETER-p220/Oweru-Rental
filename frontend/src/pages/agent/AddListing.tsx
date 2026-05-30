import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building, Camera, MapPin, Home, Save, ArrowLeft, FileText, X, User, Phone, CheckCircle } from 'lucide-react';
import Api from '../../services/api';

interface PropertyData {
  title: string; description: string; price: number; location: string;
  bedrooms: number; bathrooms: number; area: number; type: string;
  featured: boolean; available: boolean; images: string[];
  owner_id: number; landlord_name: string; landlord_phone: string;
}

const AddListing: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<PropertyData>({
    title: '', description: '', price: 0, location: '',
    bedrooms: 1, bathrooms: 1, area: 1, type: 'house',
    featured: false, available: true, images: [],
    owner_id: 0, landlord_name: '', landlord_phone: ''
  });
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const p = JSON.parse(userData);
        setUser(p);
        if (p?.id) setFormData(prev => ({ ...prev, owner_id: p.id }));
      } catch (e) { console.error(e); }
    }
  }, []);

  const propertyTypes = [
    { value: 'house', label: 'House' }, { value: 'Master-bedroom', label: 'Master-bedroom' },
    { value: 'Single-room', label: 'Single room' }, { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' }, { value: 'studio', label: 'Studio' },
    { value: 'commercial', label: 'Commercial' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) :
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      if (!f.type.startsWith('image/')) return false;
      if (f.size > 2 * 1024 * 1024) { setError(`${f.name} exceeds 2MB.`); return false; }
      return true;
    });
    if (valid.length + uploadedImages.length > 6) { setError('Max 6 images allowed'); return; }
    setUploadedImages(prev => [...prev, ...valid]);
    valid.forEach(f => {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i: number) => {
    setUploadedImages(uploadedImages.filter((_, idx) => idx !== i));
    setImagePreviews(imagePreviews.filter((_, idx) => idx !== i));
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.price || formData.price <= 0) return 'Price must be greater than 0';
    if (!formData.location.trim()) return 'Location is required';
    if (!formData.bedrooms || formData.bedrooms <= 0) return 'Bedrooms must be > 0';
    if (!formData.bathrooms || formData.bathrooms <= 0) return 'Bathrooms must be > 0';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateForm();
    if (err) { setError(err); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.keys(formData).forEach(k => { if (k !== 'images') fd.append(k, String(formData[k as keyof PropertyData])); });
      uploadedImages.forEach((f, i) => fd.append(`images[${i}]`, f));
      const res = user?.userType === 'agent' ? await Api.agentCreateProperty(fd) : await Api.createProperty(fd);
      if (res.data) {
        setSuccess(true);
        setTimeout(() => navigate(user?.userType === 'agent' ? '/dashboard/agent/my-listings' : '/dashboard/landlord/my-properties'), 2200);
      } else throw new Error('Failed');
    } catch (e: any) {
      setError(e.message || 'Failed to create listing.');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,300;0,400;1,300&display=swap');
          @keyframes succ-pop { from{transform:scale(.5);opacity:0} to{transform:scale(1);opacity:1} }
          @keyframes fade-up  { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        `}</style>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:480, flexDirection:'column', gap:24 }}>
          <div style={{ width:80, height:80, background:'rgba(16,185,129,.12)', border:'2px solid rgba(16,185,129,.3)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#10b981', animation:'succ-pop .5s cubic-bezier(.16,1,.3,1) both' }}>
            <CheckCircle size={36} />
          </div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:300, color:'#F8F8F9', textAlign:'center', animation:'fade-up .5s .15s both' }}>Listing Created Successfully!</div>
          <div style={{ fontFamily:"'Jost',sans-serif", fontSize:14, color:'#94A3B8', animation:'fade-up .5s .25s both' }}>Redirecting to your listings…</div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,300;0,400;1,300&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{
          --n9:#0F172A;--n8:#162035;--n7:#1E2D4A;
          --gold:#C89128;--gl:#D4A843;--gd:rgba(200,145,40,.12);--gb:rgba(200,145,40,.18);
          --cream:#F8F8F9;--slate:#94A3B8;--bdr:rgba(200,145,40,.18);
          --ok:#10b981;--err:#ef4444;
          --sans:'Jost',system-ui,sans-serif;--serif:'Playfair Display',Georgia,serif;
        }
        .al-wrap{max-width:860px;margin:0 auto;padding:0 0 60px;}
        .al-back{display:inline-flex;align-items:center;gap:8px;color:var(--slate);text-decoration:none;font-family:var(--sans);font-size:13px;font-weight:500;margin-bottom:24px;transition:color .2s;letter-spacing:.04em;}
        .al-back:hover{color:var(--gold);}
        .al-eyebrow{display:inline-flex;align-items:center;gap:6px;font-family:var(--sans);font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);background:var(--gd);border:1px solid var(--bdr);padding:4px 12px;margin-bottom:12px;}
        .al-title{font-family:var(--serif);font-size:clamp(26px,4vw,40px);font-weight:300;color:var(--cream);margin-bottom:8px;letter-spacing:-.02em;line-height:1.1;}
        .al-title em{font-style:italic;color:var(--gold);}
        .al-subtitle{font-family:var(--sans);font-size:14px;color:var(--slate);font-weight:300;margin-bottom:36px;}

        /* Form */
        .al-form{display:flex;flex-direction:column;gap:20px;}

        /* Section card */
        .al-sec{background:var(--n8);border:1px solid var(--bdr);border-radius:14px;overflow:hidden;}
        .al-sec-head{display:flex;align-items:center;gap:12px;padding:18px 26px;background:linear-gradient(135deg,var(--n9) 0%,var(--n8) 100%);border-bottom:1px solid var(--bdr);position:relative;}
        .al-sec-head::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gold),var(--gl));}
        .al-sec-icon{width:34px;height:34px;border-radius:8px;background:var(--gd);border:1px solid var(--bdr);display:flex;align-items:center;justify-content:center;color:var(--gold);flex-shrink:0;}
        .al-sec-title{font-family:var(--serif);font-size:19px;font-weight:400;color:var(--cream);letter-spacing:-.01em;}
        .al-sec-body{padding:24px 26px;}

        /* Grids */
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
        .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;}
        .gfull{grid-column:1/-1;}

        /* Fields */
        .al-fld{display:flex;flex-direction:column;gap:6px;}
        .al-lbl{font-family:var(--sans);font-size:10px;font-weight:700;color:var(--slate);text-transform:uppercase;letter-spacing:.14em;display:flex;align-items:center;gap:5px;}
        .al-inp,.al-ta,.al-sel{background:var(--n7);border:1px solid var(--bdr);color:var(--cream);padding:11px 14px;font-family:var(--sans);font-size:14px;font-weight:400;border-radius:8px;transition:border-color .2s,box-shadow .2s;appearance:none;-webkit-appearance:none;outline:none;width:100%;}
        .al-inp:focus,.al-ta:focus,.al-sel:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(200,145,40,.1);}
        .al-inp::placeholder,.al-ta::placeholder{color:rgba(148,163,184,.4);}
        .al-sel option{background:var(--n7);color:var(--cream);}
        .al-ta{min-height:120px;resize:vertical;line-height:1.65;}

        /* Toggle rows */
        .al-tog-row{display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--n7);border:1px solid var(--bdr);border-radius:10px;cursor:pointer;transition:border-color .2s;margin-bottom:10px;}
        .al-tog-row:last-child{margin-bottom:0;}
        .al-tog-row:hover{border-color:rgba(200,145,40,.4);}
        .al-tog{width:44px;height:24px;border-radius:12px;background:var(--n9);border:1px solid var(--bdr);position:relative;transition:background .2s,border-color .2s;flex-shrink:0;cursor:pointer;appearance:none;-webkit-appearance:none;outline:none;}
        .al-tog::after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:var(--slate);transition:transform .22s,background .22s;}
        .al-tog:checked{background:var(--gold);border-color:var(--gold);}
        .al-tog:checked::after{transform:translateX(20px);background:var(--n9);}
        .al-tog-main{font-family:var(--sans);font-size:14px;font-weight:600;color:var(--cream);margin-bottom:2px;}
        .al-tog-sub{font-family:var(--sans);font-size:12px;color:var(--slate);font-weight:300;}

        /* Upload */
        .al-upload{border:2px dashed var(--bdr);border-radius:12px;padding:36px;text-align:center;cursor:pointer;transition:all .2s;background:var(--n7);margin-bottom:18px;display:block;}
        .al-upload:hover{border-color:var(--gold);background:rgba(200,145,40,.04);}
        .al-img-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;}
        .al-img-item{position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;background:var(--n9);border:1px solid var(--bdr);}
        .al-img-item img{width:100%;height:100%;object-fit:cover;display:block;}
        .al-img-del{position:absolute;top:7px;right:7px;background:rgba(9,15,29,.8);border:none;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cream);transition:background .2s;}
        .al-img-del:hover{background:rgba(239,68,68,.85);}
        .al-img-lbl{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(9,15,29,.85),transparent);color:var(--cream);padding:8px 10px;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--sans);}

        /* Error */
        .al-err{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);color:var(--err);padding:13px 16px;border-radius:10px;font-family:var(--sans);font-size:13px;margin-bottom:8px;display:flex;align-items:center;gap:10px;}

        /* Actions */
        .al-acts{display:flex;gap:12px;justify-content:flex-end;padding:18px 26px;background:var(--n9);border:1px solid var(--bdr);border-radius:14px;}
        .al-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;font-family:var(--sans);font-size:13px;font-weight:700;border-radius:8px;cursor:pointer;transition:all .2s;text-decoration:none;border:none;letter-spacing:.04em;}
        .al-btn-p{background:var(--gold);color:var(--n9);}
        .al-btn-p:hover:not(:disabled){background:var(--gl);transform:translateY(-1px);}
        .al-btn-s{background:transparent;color:var(--slate);border:1px solid var(--bdr) !important;}
        .al-btn-s:hover{color:var(--cream);border-color:var(--gold) !important;}
        .al-btn:disabled{opacity:.5;cursor:not-allowed;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{width:15px;height:15px;border:2px solid var(--n9);border-top-color:transparent;border-radius:50%;animation:spin .7s linear infinite;}

        @media(max-width:700px){
          .g2,.g3{grid-template-columns:1fr;}
          .al-sec-body{padding:18px 16px;}
          .al-sec-head{padding:15px 16px;}
          .al-acts{flex-direction:column;padding:14px;}
          .al-btn{justify-content:center;}
        }
      `}</style>

      <div className="al-wrap">
        <div>
          <Link to={user?.userType === 'agent' ? '/dashboard/agent/my-listings' : '/dashboard/landlord/my-properties'} className="al-back">
            <ArrowLeft size={14} /> Back to {user?.userType === 'agent' ? 'My Listings' : 'My Properties'}
          </Link>
          <div className="al-eyebrow"><Building size={10} /> New Listing</div>
          <h1 className="al-title">Add New <em>Property</em></h1>
          <p className="al-subtitle">List your property for rent and reach potential tenants across Africa</p>
        </div>

        {error && <div className="al-err"><X size={15} style={{flexShrink:0}}/>{error}</div>}

        <form onSubmit={handleSubmit} className="al-form">

          {/* Basic Info */}
          <div className="al-sec">
            <div className="al-sec-head">
              <div className="al-sec-icon"><Building size={16}/></div>
              <div className="al-sec-title">Basic Information</div>
            </div>
            <div className="al-sec-body">
              <div className="g2">
                <div className="al-fld">
                  <label className="al-lbl">Property Title *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="al-inp" placeholder="e.g., Modern 2-Bedroom in Masaki" required />
                </div>
                <div className="al-fld">
                  <label className="al-lbl">Property Type *</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className="al-sel" required>
                    {propertyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="al-fld gfull">
                  <label className="al-lbl">Description *</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} className="al-ta" placeholder="Describe key features, amenities, and nearby attractions…" required />
                </div>
              </div>
            </div>
          </div>

          {/* Location & Pricing */}
          <div className="al-sec">
            <div className="al-sec-head">
              <div className="al-sec-icon"><MapPin size={16}/></div>
              <div className="al-sec-title">Location & Pricing</div>
            </div>
            <div className="al-sec-body">
              <div className="g2">
                <div className="al-fld">
                  <label className="al-lbl">Location *</label>
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="al-inp" placeholder="e.g., Masaki, Dar es Salaam" required />
                </div>
                <div className="al-fld">
                  <label className="al-lbl">Monthly Rent (TZS) *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="al-inp" placeholder="500000" min="0" required />
                </div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="al-sec">
            <div className="al-sec-head">
              <div className="al-sec-icon"><Home size={16}/></div>
              <div className="al-sec-title">Property Details</div>
            </div>
            <div className="al-sec-body">
              <div className="g3">
                <div className="al-fld">
                  <label className="al-lbl">Bedrooms *</label>
                  <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} className="al-inp" min="1" required />
                </div>
                <div className="al-fld">
                  <label className="al-lbl">Bathrooms *</label>
                  <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} className="al-inp" min="1" required />
                </div>
                <div className="al-fld">
                  <label className="al-lbl">Area (m²)</label>
                  <input type="number" name="area" value={formData.area} onChange={handleInputChange} className="al-inp" min="1" />
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="al-sec">
            <div className="al-sec-head">
              <div className="al-sec-icon"><FileText size={16}/></div>
              <div className="al-sec-title">Property Status</div>
            </div>
            <div className="al-sec-body">
              <label className="al-tog-row" htmlFor="available">
                <input type="checkbox" name="available" id="available" checked={formData.available} onChange={handleInputChange} className="al-tog" />
                <div><div className="al-tog-main">Available for Rent</div><div className="al-tog-sub">Visible to tenants searching for rentals</div></div>
              </label>
              <label className="al-tog-row" htmlFor="featured">
                <input type="checkbox" name="featured" id="featured" checked={formData.featured} onChange={handleInputChange} className="al-tog" />
                <div><div className="al-tog-main">Featured Property</div><div className="al-tog-sub">Highlighted in search results and homepage</div></div>
              </label>
            </div>
          </div>

          {/* Landlord Info */}
          <div className="al-sec">
            <div className="al-sec-head">
              <div className="al-sec-icon"><User size={16}/></div>
              <div className="al-sec-title">Landlord Information <span style={{fontSize:12,color:'var(--slate)',fontWeight:300,marginLeft:8,fontStyle:'italic'}}>(private reference)</span></div>
            </div>
            <div className="al-sec-body">
              <div className="g2">
                <div className="al-fld">
                  <label className="al-lbl"><User size={10}/> Landlord Name</label>
                  <input type="text" name="landlord_name" value={formData.landlord_name} onChange={handleInputChange} className="al-inp" placeholder="e.g., John Smith" />
                </div>
                <div className="al-fld">
                  <label className="al-lbl"><Phone size={10}/> Landlord Phone</label>
                  <input type="tel" name="landlord_phone" value={formData.landlord_phone} onChange={handleInputChange} className="al-inp" placeholder="e.g., 0712 345 678" />
                </div>
              </div>
              <p style={{fontFamily:'var(--sans)',fontSize:12,color:'var(--slate)',fontStyle:'italic',marginTop:14,lineHeight:1.6}}>
                This information is private — it helps you track which landlord owns this property and won't be shown to tenants.
              </p>
            </div>
          </div>

          {/* Images */}
          <div className="al-sec">
            <div className="al-sec-head">
              <div className="al-sec-icon"><Camera size={16}/></div>
              <div className="al-sec-title">Property Images</div>
            </div>
            <div className="al-sec-body">
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{display:'none'}} id="image-upload" />
              <label htmlFor="image-upload" className="al-upload">
                <Camera size={38} style={{color:'var(--gold)',marginBottom:12,opacity:.85}} />
                <div style={{fontFamily:'var(--sans)',fontSize:16,fontWeight:600,color:'var(--cream)',marginBottom:5}}>Click to upload images</div>
                <div style={{fontFamily:'var(--sans)',fontSize:13,color:'var(--slate)'}}>PNG, JPG up to 2MB · Max 6 images</div>
              </label>
              {imagePreviews.length > 0 ? (
                <div className="al-img-grid">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="al-img-item">
                      <img src={src} alt={`Property ${i+1}`} />
                      <button type="button" onClick={() => removeImage(i)} className="al-img-del"><X size={12}/></button>
                      <div className="al-img-lbl">{uploadedImages[i]?.name || `Image ${i+1}`}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{color:'var(--slate)',fontSize:13,textAlign:'center',padding:'14px 20px',background:'var(--n9)',border:'1px solid var(--bdr)',borderRadius:8,fontFamily:'var(--sans)'}}>
                  No images yet. Add at least one to showcase your property.
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="al-acts">
            <Link to={user?.userType === 'agent' ? '/dashboard/agent/my-listings' : '/dashboard/landlord/my-properties'} className="al-btn al-btn-s">Cancel</Link>
            <button type="submit" className="al-btn al-btn-p" disabled={loading}>
              {loading ? <><div className="spin"/> Creating…</> : <><Save size={14}/> Create Listing</>}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddListing;