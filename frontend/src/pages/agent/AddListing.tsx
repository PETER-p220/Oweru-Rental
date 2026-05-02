import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building, Plus, Camera, MapPin, Home, Save, ArrowLeft, FileText, X, User, Phone } from 'lucide-react';
import Api from '../../services/api';

interface PropertyData {
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: string;
  featured: boolean;
  available: boolean;
  images: string[];
  owner_id: number;
  landlord_name: string;
  landlord_phone: string;
}

const AddListing: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<PropertyData>({
    title: '',
    description: '',
    price: 0,
    location: '',
    bedrooms: 1,
    bathrooms: 1,
    area: 1,
    type: 'house',
    featured: false,
    available: true,
    images: [],
    owner_id: user?.id || 0,
    landlord_name: '',
    landlord_phone: ''
  });

  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        if (parsedUser?.id) {
          setFormData(prev => ({
            ...prev,
            owner_id: parsedUser.id
          }));
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const propertyTypes = [
    { value: 'house', label: 'House' },
    { value: 'Master-bedroom', label: 'Master-bedroom' },
    { value: 'Single-room', label: 'Single room' }, 
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
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) return false;
      const maxSizeInBytes = 2 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        setError(`File ${file.name} is too large. Maximum size is 2MB.`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length + uploadedImages.length > 6) {
      setError('You can upload up to 6 images maximum');
      return;
    }
    
    setUploadedImages(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.price || formData.price <= 0) return 'Price must be greater than 0';
    if (!formData.location.trim()) return 'Location is required';
    if (!formData.bedrooms || formData.bedrooms <= 0) return 'Bedrooms must be greater than 0';
    if (!formData.bathrooms || formData.bathrooms <= 0) return 'Bathrooms must be greater than 0';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key !== 'images') {
          formDataToSend.append(key, String(formData[key as keyof PropertyData]));
        }
      });
      
      uploadedImages.forEach((file, index) => {
        formDataToSend.append(`images[${index}]`, file);
      });

      let response;
      if (user?.userType === 'agent') {
        console.log('🏠 Creating agent listing with data:', {
          ...Object.fromEntries(formDataToSend.entries()),
          owner_id: user?.id,
          user_id: user?.id
        });
        response = await Api.agentCreateProperty(formDataToSend);
      } else {
        response = await Api.createProperty(formDataToSend);
      }
      
      if (response.data) {
        setSuccess(true);
        setTimeout(() => {
          if (user?.userType === 'agent') {
            navigate('/dashboard/agent/my-listings');
          } else {
            navigate('/dashboard/landlord/my-properties');
          }
        }, 2000);
      } else {
        throw new Error('Failed to create listing');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          flexDirection: 'column',
          gap: 20
        }}>
          <div style={{
            width: 64,
            height: 64,
            background: 'rgba(112,196,144,0.1)',
            border: '2px solid rgba(112,196,144,0.3)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#70c490'
          }}>
            <Save size={32} />
          </div>
          <div style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 32,
            fontWeight: 300,
            color: '#f5f0e8',
            textAlign: 'center'
          }}>
            Listing Created Successfully!
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: '#8a8070',
            textAlign: 'center'
          }}>
            Redirecting to your listings...
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; }

        :root {
          --gold: #c9a84c;
          --gold-light: rgba(201,168,76,0.1);
          --gold-border: rgba(201,168,76,0.25);
          --success: #70c490;
          --success-light: rgba(112,196,144,0.1);
          --success-border: rgba(112,196,144,0.25);
          --error: #e07070;
          --error-light: rgba(224,112,112,0.1);
          --error-border: rgba(224,112,112,0.25);
          --dark: #0a0a0a;
          --dark-secondary: #111;
          --border: rgba(201,168,76,0.15);
          --text-primary: #f5f0e8;
          --text-secondary: #8a8070;
        }

        .al-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0;
        }

        .al-header {
          margin-bottom: 40px;
        }

        .al-back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          margin-bottom: 20px;
          transition: color 0.2s;
        }

        .al-back-link:hover {
          color: var(--gold);
        }

        .al-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 36px;
          font-weight: 300;
          color: var(--text-primary);
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .al-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 300;
        }

        .al-form {
          display: grid;
          gap: 32px;
        }

        .al-section {
          background: var(--dark-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 32px;
        }

        .al-section-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 24px;
          font-weight: 300;
          color: var(--text-primary);
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .al-grid {
          display: grid;
          gap: 24px;
        }

        .al-grid-2 {
          grid-template-columns: 1fr 1fr;
        }

        .al-grid-3 {
          grid-template-columns: 1fr 1fr 1fr;
        }

        .al-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .al-form-group.full-width {
          grid-column: 1 / -1;
        }

        .al-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .al-input,
        .al-textarea,
        .al-select {
          background: var(--dark);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 12px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          border-radius: 8px;
          transition: all 0.2s;
          appearance: none;
          -webkit-appearance: none;
        }

        .al-input:focus,
        .al-textarea:focus,
        .al-select:focus {
          outline: none;
          border-color: var(--gold);
          background: rgba(201,168,76,0.03);
        }

        /* Dropdown options — explicit dark background + light text for cross-browser visibility */
        .al-select option {
          background-color: #1c1c1c;
          color: #f5f0e8;
          padding: 10px 12px;
          font-size: 14px;
        }

        .al-select option:checked,
        .al-select option:hover {
          background-color: #2a2218;
          color: #c9a84c;
        }

        .al-textarea {
          min-height: 120px;
          resize: vertical;
        }

        .al-checkbox-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .al-checkbox {
          width: 20px;
          height: 20px;
          accent-color: var(--gold);
        }

        .al-checkbox-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: var(--text-primary);
          font-weight: 300;
        }

        .al-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 32px;
        }

        .al-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
          border: none;
        }

        .al-btn-primary {
          background: var(--gold);
          color: var(--dark);
        }

        .al-btn-primary:hover:not(:disabled) {
          background: #b39643;
          transform: translateY(-1px);
        }

        .al-btn-secondary {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .al-btn-secondary:hover {
          color: var(--text-primary);
          border-color: var(--gold);
        }

        .al-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .al-error {
          background: var(--error-light);
          border: 1px solid var(--error-border);
          color: var(--error);
          padding: 16px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .al-grid-2,
          .al-grid-3 {
            grid-template-columns: 1fr;
          }

          .al-section {
            padding: 24px;
          }

          .al-title {
            font-size: 28px;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="al-container">
        <div className="al-header">
          <Link to={user?.userType === 'agent' ? '/my-listings' : '/my-properties'} className="al-back-link">
            <ArrowLeft size={16} />
            Back to {user?.userType === 'agent' ? 'My Listings' : 'My Properties'}
          </Link>
          <h1 className="al-title">Add New Property</h1>
          <p className="al-subtitle">List your property for rent and reach potential tenants</p>
        </div>

        {error && (
          <div className="al-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="al-form">
          {/* Basic Information */}
          <div className="al-section">
            <h2 className="al-section-title">
              <Building size={20} />
              Basic Information
            </h2>
            <div className="al-grid al-grid-2">
              <div className="al-form-group">
                <label className="al-label">Property Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="al-input"
                  placeholder="e.g., Modern 2-Bedroom Apartment in Masaki"
                  required
                />
              </div>
              <div className="al-form-group">
                <label className="al-label">Property Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="al-select"
                  required
                >
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="al-form-group full-width">
                <label className="al-label">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="al-textarea"
                  placeholder="Describe your property, including key features, amenities, and nearby attractions..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Location & Pricing */}
          <div className="al-section">
            <h2 className="al-section-title">
              <MapPin size={20} />
              Location & Pricing
            </h2>
            <div className="al-grid al-grid-2">
              <div className="al-form-group">
                <label className="al-label">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="al-input"
                  placeholder="e.g., Masaki, Dar es Salaam"
                  required
                />
              </div>
              <div className="al-form-group">
                <label className="al-label">Monthly Rent (TZS) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="al-input"
                  placeholder="500000"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="al-section">
            <h2 className="al-section-title">
              <Home size={20} />
              Property Details
            </h2>
            <div className="al-grid al-grid-3">
              <div className="al-form-group">
                <label className="al-label">Bedrooms *</label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  className="al-input"
                  min="1"
                  required
                />
              </div>
              <div className="al-form-group">
                <label className="al-label">Bathrooms *</label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  className="al-input"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Property Status */}
          <div className="al-section">
            <h2 className="al-section-title">
              <FileText size={20} />
              Property Status
            </h2>
            <div className="al-grid">
              <div className="al-checkbox-group">
                <input
                  type="checkbox"
                  name="available"
                  id="available"
                  checked={formData.available}
                  onChange={handleInputChange}
                  className="al-checkbox"
                />
                <label htmlFor="available" className="al-checkbox-label">
                  Available for rent
                </label>
              </div>
              <div className="al-checkbox-group">
                <input
                  type="checkbox"
                  name="featured"
                  id="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="al-checkbox"
                />
                <label htmlFor="featured" className="al-checkbox-label">
                  Featured property (highlight in search results)
                </label>
              </div>
            </div>
          </div>

          {/* Landlord Information */}
          <div className="al-section">
            <h2 className="al-section-title">
              <User size={20} />
              Landlord Information
              <span style={{ 
                fontSize: '12px', 
                color: 'var(--text-secondary)', 
                fontWeight: '300',
                marginLeft: '8px',
                fontStyle: 'italic'
              }}>
                (For your reference only)
              </span>
            </h2>
            <div className="al-grid al-grid-2">
              <div className="al-form-group">
                <label className="al-label">
                  <User size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Landlord Name
                </label>
                <input
                  type="text"
                  name="landlord_name"
                  value={formData.landlord_name}
                  onChange={handleInputChange}
                  className="al-input"
                  placeholder="e.g., John Smith"
                />
              </div>
              <div className="al-form-group">
                <label className="al-label">
                  <Phone size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Landlord Phone
                </label>
                <input
                  type="tel"
                  name="landlord_phone"
                  value={formData.landlord_phone}
                  onChange={handleInputChange}
                  className="al-input"
                  placeholder="e.g., 0712 345 678"
                />
              </div>
            </div>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              marginTop: '12px'
            }}>
              This information helps you remember which landlord owns this property. It won't be displayed to tenants.
            </p>
          </div>

          {/* Images */}
          <div className="al-section">
            <h2 className="al-section-title">
              <Camera size={20} />
              Property Images
            </h2>
            <div className="al-form-group">
              <label className="al-label">Upload Images (up to 6 images)</label>
              
              <div style={{
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '20px',
                background: 'var(--dark)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold)';
                e.currentTarget.style.background = 'rgba(201,168,76,0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--dark)';
              }}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
                <label htmlFor="image-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  <Camera size={48} style={{ color: 'var(--gold)', marginBottom: '16px' }} />
                  <div style={{ color: 'var(--text-primary)', fontSize: '16px', marginBottom: '8px' }}>
                    Click to upload images
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    PNG, JPG, GIF up to 2MB each • Maximum 6 images
                  </div>
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: 'var(--dark)',
                      border: '1px solid var(--border)'
                    }}>
                      <img
                        src={preview}
                        alt={`Property ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(0,0,0,0.7)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#fff',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(224,112,112,0.9)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(0,0,0,0.7)';
                        }}
                      >
                        <X size={14} />
                      </button>
                      <div style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        right: '0',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                        color: '#fff',
                        padding: '8px',
                        fontSize: '12px',
                        textAlign: 'center'
                      }}>
                        {uploadedImages[index]?.name || `Image ${index + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {uploadedImages.length === 0 && (
                <div style={{
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  textAlign: 'center',
                  padding: '20px',
                  background: 'var(--dark)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}>
                  No images uploaded yet. Add at least one image to showcase your property.
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="al-actions">
            <Link 
              to={user?.userType === 'agent' ? '/my-listings' : '/my-properties'} 
              className="al-btn al-btn-secondary"
            >
              Cancel
            </Link>
            <button type="submit" className="al-btn al-btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <div style={{
                    width: 16,
                    height: 16,
                    border: '2px solid var(--dark)',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Creating Listing...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Create Listing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddListing;