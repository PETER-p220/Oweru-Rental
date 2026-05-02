import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home, MapPin, Bed, Bath, DollarSign, Camera,
  ChevronLeft, ChevronRight, Check, X, Plus, Trash2,
  Wifi, Car, Waves, Dumbbell, Coffee, Shield, Trees, ArrowLeft, ArrowRight, AlertCircle, Building, Store, Upload
} from 'lucide-react';
import Api from '../../services/api';

interface ImageFile {
  file: File;
  preview: string;
}

const AddProperty = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: '',
    description: '',
    type: 'house',
    location: '',
    address: '',
    
    // Step 2: Property Details
    price: '',
    bedrooms: 1,
    bathrooms: 1,
    area: '',
    
    // Step 3: Features
    amenities: [] as string[],
    images: [] as ImageFile[],
    featured: false,
    
    // Location coordinates
    latitude: '',
    longitude: '',
  });

  const propertyTypes = [
    { value: 'house', label: 'House', icon: Home },
    { value: 'Master-bedroom', label: 'Masterbedroom', icon: Building },
    { value: 'Single-room', label: 'Single room', icon: Home },
  ];

  const commonAmenities = [
    'Parking', 'Security', 'Gym', 'Pool', 'Garden', 'Balcony',
    'Air Conditioning', 'Heating', 'WiFi', 'Kitchen', 'Laundry',
    'Elevator', 'Storage', 'Pet Friendly', 'Furnished'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = event.target?.result as string;
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, { file, preview }]
          }));
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Clear the input value to allow uploading the same file again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateStep = () => {
    const errs: string[] = [];
    
    if (step === 1) {
      if (!formData.title.trim()) errs.push('Property title is required');
      if (!formData.description.trim()) errs.push('Description is required');
      if (!formData.location.trim()) errs.push('Location is required');
      if (!formData.address.trim()) errs.push('Address is required');
    }
    
    if (step === 2) {
      if (!formData.price || Number(formData.price) <= 0) errs.push('Price must be greater than 0');
      if (!formData.area || Number(formData.area) <= 0) errs.push('Area must be greater than 0');
    }
    
    if (step === 3) {
      if (formData.images.length === 0) errs.push('At least one image is required');
    }
    
    setErrors(errs);
    return errs.length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setErrors([]);
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setErrors([]);
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setIsLoading(true);
    setErrors([]);

    try {
      // Check if this is an Oweru property request from admin
      const isOweruProperty = window.location.pathname === '/dashboard/admin/add-oweru-property';
      
      // Check if current user is admin
      const isAdmin = user?.userType === 'admin' || user?.user_type === 'admin' || user?.role === 'admin';
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add all property fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('type', isOweruProperty ? 'oweru_rental' : formData.type);
      formDataToSend.append('bedrooms', formData.bedrooms.toString());
      formDataToSend.append('bathrooms', formData.bathrooms.toString());
      formDataToSend.append('featured', formData.featured.toString());
      
      // Add amenities as JSON
      formDataToSend.append('amenities', JSON.stringify(formData.amenities));
      
      // Add images
      formData.images.forEach((imageFile, index) => {
        formDataToSend.append(`images[${index}]`, imageFile.file);
      });

      // Use different API endpoints based on user role
      let response;
      if (isAdmin) {
        // Debug: Log user object to check available fields
        console.log('User object:', user);
        console.log('User ID:', user?.id);
        console.log('Images to upload:', formData.images);
        
        // For admin users, we need to handle images separately
        let uploadedImages: string[] = [];
        
        // Upload images first if any
        if (formData.images.length > 0) {
          console.log('Uploading images for admin property...');
          const imageFormData = new FormData();
          
          formData.images.forEach((imageFile, index) => {
            imageFormData.append(`images[${index}]`, imageFile.file);
          });
          
          try {
            const imageResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/properties/upload-images`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Accept': 'application/json',
              },
              body: imageFormData,
            });
            
            if (imageResponse.ok) {
              const imageResult = await imageResponse.json();
              uploadedImages = imageResult.images || [];
              console.log('Images uploaded successfully:', uploadedImages);
            } else {
              console.error('Image upload failed:', imageResponse.statusText);
            }
          } catch (error) {
            console.error('Error uploading images:', error);
          }
        }
        
        // Admin uses admin API (JSON format)
        const propertyData = {
          title: formData.title,
          description: formData.description,
          price: formData.price,
          location: formData.location,
          address: formData.address,
          type: isOweruProperty ? 'oweru_rental' : formData.type,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          area: formData.area,
          featured: formData.featured,
          latitude: formData.latitude,
          longitude: formData.longitude,
          amenities: formData.amenities.join(', '), // Convert array to string for admin API
          owner_id: user?.id || 1, // Add admin user ID as owner, fallback to 1 if undefined
          landlord_name: 'Oweru Rental', // Set default landlord name for Oweru properties
          landlord_phone: '+255 712 345 678', // Set default phone for Oweru properties
          images: uploadedImages, // Use uploaded image URLs
        };
        
        console.log('Property data being sent:', propertyData);
        response = await Api.createAdminProperty(propertyData);
      } else {
        // Landlord uses owner API (FormData format)
        response = await Api.createOwnerProperty(formDataToSend);
      }
      
      if (response.data) {
        // Navigate based on user role
        if (isAdmin) {
          navigate('/dashboard/admin/properties', { 
            state: { success: 'Oweru property added successfully!' } 
          });
        } else {
          navigate('/dashboard/landlord/my-properties', { 
            state: { success: 'Property added successfully!' } 
          });
        }
      } else {
        throw new Error('Failed to create property');
      }
    } catch (err: any) {
      console.error('Property creation error:', err);
      
      // Log the full error response for debugging
      if (err?.response) {
        console.error('Error response:', err.response);
        console.error('Error data:', err.response.data);
      }
      
      const laravelErrors = err?.response?.data?.errors;
      if (laravelErrors) {
        const msgs = Object.values(laravelErrors).flat() as string[];
        setErrors(msgs);
      } else {
        setErrors([
          err?.response?.data?.message ||
          err?.message ||
          'Failed to create property. Please try again.'
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <style>{`
        .ap-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .ap-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        
        .ap-title {
          font-size: 32px;
          font-weight: 300;
          color: var(--text-primary);
        }
        
        .ap-steps {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 40px;
        }
        
        .ap-step {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .ap-step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid var(--accent-color);
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all 0.3s;
        }
        
        .ap-step-circle.active {
          background: var(--accent-color);
          color: var(--bg-primary);
        }
        
        .ap-step-circle.completed {
          background: var(--accent-light);
          color: var(--bg-primary);
        }
        
        .ap-step-line {
          width: 60px;
          height: 2px;
          background: var(--border-color);
          transition: all 0.3s;
        }
        
        .ap-step-line.completed {
          background: var(--accent-color);
        }
        
        .ap-form-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 32px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .ap-form-section {
            padding: 24px;
            margin-bottom: 20px;
          }
        }

        @media (max-width: 480px) {
          .ap-form-section {
            padding: 20px;
            margin-bottom: 16px;
            border-radius: 8px;
          }
        }
        
        .ap-section-title {
          font-size: clamp(20px, 4vw, 24px);
          font-weight: 300;
          margin-bottom: 20px;
          color: var(--text-primary);
        }

        @media (max-width: 480px) {
          .ap-section-title {
            font-size: clamp(18px, 5vw, 20px);
            margin-bottom: 16px;
          }
        }
        
        .ap-form-group {
          margin-bottom: 20px;
        }

        @media (max-width: 480px) {
          .ap-form-group {
            margin-bottom: 16px;
          }
        }
        
        .ap-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--text-primary);
        }
        
        .ap-input, .ap-textarea, .ap-select {
          width: 100%;
          padding: 12px 16px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 16px;
          transition: all 0.2s;
        }
        
        .ap-input:focus, .ap-textarea:focus, .ap-select:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.1);
        }
        
        .ap-textarea {
          min-height: 120px;
          resize: vertical;
        }
        
        .ap-property-types {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }
        
        .ap-property-type {
          background: var(--bg-primary);
          border: 2px solid var(--border-color);
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        
        .ap-property-type:hover {
          border-color: var(--accent-color);
        }
        
        .ap-property-type.selected {
          border-color: var(--accent-color);
          background: rgba(201, 168, 76, 0.1);
        }
        
        .ap-property-type-icon {
          font-size: 24px;
          margin-bottom: 8px;
          color: var(--accent-color);
        }
        
        .ap-property-type-label {
          font-weight: 500;
          color: var(--text-primary);
        }
        
        .ap-number-inputs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
        }
        
        .ap-amenities {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        
        .ap-amenity {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .ap-amenity:hover {
          border-color: var(--accent-color);
        }
        
        .ap-amenity.selected {
          border-color: var(--accent-color);
          background: rgba(201, 168, 76, 0.1);
        }
        
        .ap-amenity-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid var(--accent-color);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .ap-amenity.selected .ap-amenity-checkbox {
          background: var(--accent-color);
        }
        
        .ap-images {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .ap-image-item {
          position: relative;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .ap-image-preview {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }
        
        .ap-image-remove {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .ap-image-remove:hover {
          background: rgba(0, 0, 0, 0.9);
        }
        
        .ap-add-image {
          background: var(--bg-primary);
          border: 2px dashed var(--border-color);
          border-radius: 8px;
          height: 150px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .ap-add-image:hover {
          border-color: var(--accent-color);
        }
        
        .ap-checkbox-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .ap-checkbox {
          width: 20px;
          height: 20px;
          accent-color: var(--accent-color);
        }
        
        .ap-errors {
          background: rgba(224, 112, 112, 0.1);
          border: 1px solid rgba(224, 112, 112, 0.3);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        
        .ap-error {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #e07070;
          margin-bottom: 8px;
        }
        
        .ap-error:last-child {
          margin-bottom: 0;
        }
        
        .ap-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        
        .ap-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 480px) {
          .ap-btn {
            padding: 10px 20px;
            font-size: 16px;
          }
        }
        
        .ap-btn-primary {
          background: var(--accent-color);
          color: var(--bg-primary);
        }
        
        .ap-btn-primary:hover:not(:disabled) {
          background: var(--accent-light);
        }
        
        .ap-btn-secondary {
          background: var(--bg-primary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }
        
        .ap-btn-secondary:hover {
          border-color: var(--accent-color);
        }
        
        .ap-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .ap-container {
            padding: 20px 16px;
          }
          
          .ap-header {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
          
          .ap-steps {
            flex-wrap: wrap;
            justify-content: center;
          }
          
          .ap-form-section {
            padding: 24px 16px;
          }
          
          .ap-property-types {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .ap-actions {
            flex-direction: column;
          }
          
          .ap-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div className="ap-container">
        <div className="ap-header">
          <Link to="/dashboard/landlord" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          <h1 className="ap-title">Add New Property</h1>
        </div>

        <div className="ap-steps">
          <div className="ap-step">
            <div className={`ap-step-circle ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              {step > 1 ? <Check size={16} /> : '1'}
            </div>
            <span>Basic Info</span>
          </div>
          <div className={`ap-step-line ${step > 1 ? 'completed' : ''}`}></div>
          <div className="ap-step">
            <div className={`ap-step-circle ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              {step > 2 ? <Check size={16} /> : '2'}
            </div>
            <span>Details</span>
          </div>
          <div className={`ap-step-line ${step > 2 ? 'completed' : ''}`}></div>
          <div className="ap-step">
            <div className={`ap-step-circle ${step >= 3 ? 'active' : ''}`}>
              {step > 3 ? <Check size={16} /> : '3'}
            </div>
            <span>Features</span>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="ap-errors">
            {errors.map((error, index) => (
              <div key={index} className="ap-error">
                <AlertCircle size={16} />
                {error}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="ap-form-section">
              <h2 className="ap-section-title">Basic Information</h2>
              
              <div className="ap-form-group">
                <label className="ap-label">Property Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="ap-input"
                  placeholder="e.g., Modern 2BR Apartment in Masaki"
                  required
                />
              </div>

              <div className="ap-form-group">
                <label className="ap-label">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="ap-textarea"
                  placeholder="Describe your property, highlighting key features and amenities..."
                  required
                />
              </div>

              <div className="ap-form-group">
                <label className="ap-label">Property Type *</label>
                <div className="ap-property-types">
                  {propertyTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <div
                        key={type.value}
                        className={`ap-property-type ${formData.type === type.value ? 'selected' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                      >
                        <Icon className="ap-property-type-icon" />
                        <div className="ap-property-type-label">{type.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="ap-form-group">
                <label className="ap-label">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="ap-input"
                  placeholder="e.g., Dar es Salaam, Masaki"
                  required
                />
              </div>

              <div className="ap-form-group">
                <label className="ap-label">Full Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="ap-input"
                  placeholder="e.g., 34 Toure Drive, Masaki, Dar es Salaam"
                  required
                />
              </div>

              <div className="ap-actions">
                <div></div>
                <button type="button" onClick={handleNext} className="ap-btn ap-btn-primary">
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Property Details */}
          {step === 2 && (
            <div className="ap-form-section">
              <h2 className="ap-section-title">Property Details</h2>
              
              <div className="ap-form-group">
                <label className="ap-label">Monthly Price (TZS) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="ap-input"
                  placeholder="e.g., 800000"
                  min="0"
                  required
                />
              </div>


              <div className="ap-form-group">
                <label className="ap-label">Bedrooms & Bathrooms</label>
                <div className="ap-number-inputs">
                  <div>
                    <label className="ap-label" style={{ fontSize: '14px', marginBottom: '4px' }}>Bedrooms</label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      className="ap-input"
                      min="0"
                      max="20"
                    />
                  </div>
                  <div>
                    <label className="ap-label" style={{ fontSize: '14px', marginBottom: '4px' }}>Bathrooms</label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      className="ap-input"
                      min="0"
                      max="20"
                    />
                  </div>
                </div>
              </div>

              <div className="ap-form-group">
                <label className="ap-label">Location Coordinates (Optional)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    className="ap-input"
                    placeholder="Latitude"
                    step="any"
                  />
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    className="ap-input"
                    placeholder="Longitude"
                    step="any"
                  />
                </div>
              </div>

              <div className="ap-actions">
                <button type="button" onClick={handleBack} className="ap-btn ap-btn-secondary">
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="button" onClick={handleNext} className="ap-btn ap-btn-primary">
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Features */}
          {step === 3 && (
            <div className="ap-form-section">
              <h2 className="ap-section-title">Property Features</h2>
              
              <div className="ap-form-group">
                <label className="ap-label">Amenities</label>
                <div className="ap-amenities">
                  {commonAmenities.map(amenity => (
                    <div
                      key={amenity}
                      className={`ap-amenity ${formData.amenities.includes(amenity) ? 'selected' : ''}`}
                      onClick={() => handleAmenityToggle(amenity)}
                    >
                      <div className="ap-amenity-checkbox">
                        {formData.amenities.includes(amenity) && <Check size={12} />}
                      </div>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ap-form-group">
                <label className="ap-label">Property Images *</label>
                <div className="ap-images">
                  {formData.images.map((imageFile, index) => (
                    <div key={index} className="ap-image-item">
                      <img src={imageFile.preview} alt={`Property ${index + 1}`} className="ap-image-preview" />
                      <button
                        type="button"
                        className="ap-image-remove"
                        onClick={() => removeImage(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <label className="ap-add-image">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <Upload size={32} color="var(--text-secondary)" />
                    <span style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>Upload Images</span>
                  </label>
                </div>
              </div>

              <div className="ap-form-group">
                <div className="ap-checkbox-group">
                  <input
                    type="checkbox"
                    name="featured"
                    id="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="ap-checkbox"
                  />
                  <label htmlFor="featured" className="ap-label" style={{ margin: 0 }}>
                    Feature this property
                  </label>
                </div>
              </div>

              <div className="ap-actions">
                <button type="button" onClick={handleBack} className="ap-btn ap-btn-secondary">
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="submit" className="ap-btn ap-btn-primary" disabled={isLoading}>
                  {isLoading ? (
                    <>Creating Property...</>
                  ) : (
                    <>Create Property <Plus size={16} /></>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddProperty;
