import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Plus, X, Upload, MapPin, DollarSign, Home, Car, Bed, Bath, Square, Calendar, Save, ArrowLeft } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface Amenity {
  id: number;
  name: string;
  icon: string;
}

interface Property {
  id: number;
  title: string;
  description: string;
  type: string;
  location: string;
  address: string;
  price: number;
  price_type: string;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_spaces?: number;
  furnished: boolean;
  available_from: string;
  contact_phone: string;
  contact_email: string;
  latitude?: number;
  longitude?: number;
  amenities: Array<{
    id: number;
    name: string;
    icon: string;
  }>;
  images: Array<{
    id: number;
    image_path: string;
    is_primary: boolean;
  }>;
}

interface FormData {
  title: string;
  description: string;
  type: string;
  location: string;
  address: string;
  price: number;
  price_type: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking_spaces: number;                    
  furnished: boolean;
  available_from: string;                    
  contact_phone: string;
  contact_email: string;
  latitude: number;
  longitude: number;
  amenities: number[];
}

const EditProperty: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: 'residential',
    location: '',
    address: '',
    price: 0,
    price_type: 'monthly',
    area: 0,
    bedrooms: 0,
    bathrooms: 0,
    parking_spaces: 0,
    furnished: false,
    available_from: '',
    contact_phone: '',
    contact_email: '',
    latitude: 0,
    longitude: 0,
    amenities: []
  });

  useEffect(() => {
    if (id) {
      fetchProperty();
      fetchAmenities();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/commercial/properties/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProperty(data);
        
        // Populate form data
        setFormData({
          title: data.title,
          description: data.description,
          type: data.type,
          location: data.location,
          address: data.address,
          price: data.price,
          price_type: data.price_type,
          area: data.area,
          bedrooms: data.bedrooms || 0,
          bathrooms: data.bathrooms || 0,
          parking_spaces: data.parking_spaces || 0,
          furnished: data.furnished,
          available_from: data.available_from,
          contact_phone: data.contact_phone,
          contact_email: data.contact_email,
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          amenities: data.amenities.map((a: any) => a.id)
        });
      } else {
        navigate('/commercial/properties');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      navigate('/commercial/properties');
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchAmenities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/commercial/amenities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAmenities(data);
      }
    } catch (error) {
      console.error('Error fetching amenities:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? Number(value) : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAmenityToggle = (amenityId: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      setErrors(prev => ({ ...prev, images: 'Only image files are allowed' }));
      return;
    }

    setNewImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Clear error
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: number) => {
    setDeletedImages(prev => [...prev, imageId]);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (!formData.area || formData.area <= 0) newErrors.area = 'Area must be greater than 0';
    if (!formData.available_from) newErrors.available_from = 'Available date is required';
    if (!formData.contact_phone.trim()) newErrors.contact_phone = 'Contact phone is required';
    if (!formData.contact_email.trim()) newErrors.contact_email = 'Contact email is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.contact_email)) newErrors.contact_email = 'Invalid email format';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'amenities') {
          value.forEach((amenityId: number) => {
            formDataToSend.append('amenities[]', amenityId.toString());
          });
        } else if (typeof value === 'boolean') {
          formDataToSend.append(key, value ? '1' : '0');
        } else {
          formDataToSend.append(key, value.toString());
        }
      });

      // Add new images
      newImages.forEach((image, index) => {
        formDataToSend.append(`images[${index}]`, image);
      });

      // Add deleted images
      deletedImages.forEach((imageId, index) => {
        formDataToSend.append(`deleted_images[${index}]`, imageId.toString());
      });

      const response = await fetch(`${API_BASE}/api/commercial/properties/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formDataToSend
      });

      if (response.ok) {
        navigate('/commercial/properties', {
          state: { message: 'Property updated successfully and is pending approval' }
        });
      } else {
        const errorData = await response.json();
        if (errorData.errors) {
          setErrors(errorData.errors);
        } else {
          setErrors({ submit: errorData.message || 'Failed to update property' });
        }
      }
    } catch (error) {
      console.error('Error updating property:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const propertyTypes = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'office', label: 'Office' },
    { value: 'retail', label: 'Retail' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'industrial', label: 'Industrial' }
  ];

  const priceTypes = [
    { value: 'monthly', label: 'Per Month' },
    { value: 'yearly', label: 'Per Year' },
    { value: 'sale', label: 'For Sale' }
  ];

  const getExistingImages = () => {
    if (!property) return [];
    return property.images.filter(img => !deletedImages.includes(img.id));
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-[#F1EDD8]">Loading property...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <style>{`
        :root {
          --navy-900: #0F172A;
          --navy-800: #162035;
          --navy-700: #1E2D4A;
          --gold: #C89128;
          --gold-lt: #D4A843;
          --gold-dim: rgba(200,145,40,0.12);
          --cream: #F8F8F9;
          --slate: #94A3B8;
          --border: rgba(200,145,40,0.18);
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/commercial/properties')}
            className="flex items-center gap-2 text-[#4A5568] hover:text-[#F1EDD8] mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Properties
          </button>
          <h1 className="text-3xl font-bold text-[#F1EDD8] mb-2">Edit Property</h1>
          <p className="text-[#4A5568]">Update your commercial rental property details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-[#162035] border border-[#1E2D4A] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[#F1EDD8] mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#E2D5B0] mb-2">
                  Property Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#F1EDD8] placeholder-[#4A5568] focus:outline-none focus:border-[#D4AF37]"
                  placeholder="e.g., Modern Office Space in Kigali"
                />
                {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#E2D5B0] mb-2">
                  Property Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#F1EDD8] focus:outline-none focus:border-[#D4AF37]"
                >
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-400">{errors.type}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#E2D5B0] mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#F1EDD8] placeholder-[#4A5568] focus:outline-none focus:border-[#D4AF37]"
                  placeholder="Describe your property in detail..."
                />
                {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-[#162035] border border-[#1E2D4A] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[#F1EDD8] mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#E2D5B0] mb-2">
                  Location/Area *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#F1EDD8] placeholder-[#4A5568] focus:outline-none focus:border-[#D4AF37]"
                  placeholder="e.g., Kigali, Rwanda"
                />
                {errors.location && <p className="mt-1 text-sm text-red-400">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#E2D5B0] mb-2">
                  Full Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#F1EDD8] placeholder-[#4A5568] focus:outline-none focus:border-[#D4AF37]"
                  placeholder="e.g., KN 123 St, Kigali"
                />
                {errors.address && <p className="mt-1 text-sm text-red-400">{errors.address}</p>}
              </div>
            </div>
          </div>

          {/* Pricing & Size */}
          <div className="bg-[#162035] border border-[#1E2D4A] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[#F1EDD8] mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing & Size
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#E2D5B0] mb-2">
                  Price (TZS) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#F1EDD8] placeholder-[#4A5568] focus:outline-none focus:border-[#D4AF37]"
                  placeholder="500000"
                />
                {errors.price && <p className="mt-1 text-sm text-red-400">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#E2D5B0] mb-2">
                  Price Type *
                </label>
                <select
                  name="price_type"
                  value={formData.price_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#F1EDD8] focus:outline-none focus:border-[#D4AF37]"
                >
                  {priceTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.price_type && <p className="mt-1 text-sm text-red-400">{errors.price_type}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#E2D5B0] mb-2">
                  Area (m²) *
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#F1EDD8] placeholder-[#4A5568] focus:outline-none focus:border-[#D4AF37]"
                  placeholder="120"
                />
                {errors.area && <p className="mt-1 text-sm text-red-400">{errors.area}</p>}
              </div>
            </div>
          </div>

          {/* Property Features */}
          <div className="bg-[#162035] border border-[#1E2D4A] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[#F1EDD8] mb-6 flex items-center gap-2">
              <Home className="w-5 h-5" />
              Property Features
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#E2D5B0] mb-2">
                  <Bed className="w-4 h-4 inline mr-1" />
                  Bedrooms
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#F1EDD8] placeholder-[#4A5568] focus:outline-none focus:border-[#D4AF37]"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#E2D5B0] mb-2">
                  <Bath className="w-4 h-4 inline mr-1" />
                  Bathrooms
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#F1EDD8] placeholder-[#4A5568] focus:outline-none focus:border-[#D4AF37]"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#E2D5B0] mb-2">
                  <Car className="w-4 h-4 inline mr-1" />
                  Parking Spaces
                </label>
                <input
                  type="number"
                  name="parking_spaces"
                  value={formData.parking_spaces}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#F1EDD8] placeholder-[#4A5568] focus:outline-none focus:border-[#D4AF37]"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#E2D5B0] mb-2">
                  <Square className="w-4 h-4 inline mr-1" />
                  Furnished
                </label>
                <div className="flex items-center h-10">
                  <input
                    type="checkbox"
                    name="furnished"
                    checked={formData.furnished}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gold bg-[#1E2D4A] border-[#1E2D4A] rounded focus:ring-gold"
                  />
                  <span className="ml-2 text-[#E2D5B0]">Furnished</span>
                </div>
              </div>
            </div>
          </div>

          {/* Availability & Contact */}
          <div className="bg-[#162035] border border-[#1E2D4A] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[#F1EDD8] mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Availability & Contact
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#E2D5B0] mb-2">
                  Available From *
                </label>
                <input
                  type="date"
                  name="available_from"
                  value={formData.available_from}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#F1EDD8] placeholder-[#4A5568] focus:outline-none focus:border-[#D4AF37]"
                />
                {errors.available_from && <p className="mt-1 text-sm text-red-400">{errors.available_from}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#E2D5B0] mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#F1EDD8] placeholder-[#4A5568] focus:outline-none focus:border-[#D4AF37]"
                  placeholder="+255712345678"
                />
                {errors.contact_phone && <p className="mt-1 text-sm text-red-400">{errors.contact_phone}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#E2D5B0] mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[#1E2D4A] border border-[#1E2D4A] rounded-lg text-[#F1EDD8] placeholder-[#4A5568] focus:outline-none focus:border-[#D4AF37]"
                  placeholder="contact@example.com"
                />
                {errors.contact_email && <p className="mt-1 text-sm text-red-400">{errors.contact_email}</p>}
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-[#162035] border border-[#1E2D4A] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[#F1EDD8] mb-6">Amenities</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {amenities.map((amenity) => (
                <label
                  key={amenity.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.amenities.includes(amenity.id)
                      ? 'border-gold bg-gold/10'
                      : 'border-[#1E2D4A] bg-[#1E2D4A] hover:border-navy-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity.id)}
                    onChange={() => handleAmenityToggle(amenity.id)}
                    className="w-4 h-4 text-gold bg-[#1E2D4A] border-[#1E2D4A] rounded focus:ring-gold"
                  />
                  <span className="text-[#E2D5B0]">{amenity.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="bg-[#162035] border border-[#1E2D4A] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[#F1EDD8] mb-6 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Property Images
            </h2>
            
            <div className="space-y-6">
              {/* Existing Images */}
              {getExistingImages().length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[#E2D5B0] mb-4">Current Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {getExistingImages().map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={`${API_BASE}/storage/${image.image_path}`}
                          alt={`Property image ${image.id}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        {image.is_primary && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-gold text-navy-900 text-xs font-medium rounded">
                            Primary
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingImage(image.id)}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 backdrop-blur-sm rounded-lg text-[#F1EDD8] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              <div>
                <h3 className="text-sm font-medium text-[#E2D5B0] mb-4">Add New Images</h3>
                <div className="border-2 border-dashed border-[#1E2D4A] rounded-lg p-8 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <span className="text-[#E2D5B0] mb-2">Click to upload images</span>
                    <span className="text-gray-500 text-sm">PNG, JPG, GIF up to 2MB each</span>
                  </label>
                </div>

                {errors.images && <p className="mt-1 text-sm text-red-400">{errors.images}</p>}

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`New preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 backdrop-blur-sm rounded-lg text-[#F1EDD8] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/commercial/properties')}
              className="px-6 py-3 bg-[#162035] border border-[#1E2D4A] rounded-lg text-[#F1EDD8] hover:border-[#1E2D4A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gold text-navy-900 rounded-lg font-semibold hover:bg-gold-lt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>Updating...</>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Update Property
                </>
              )}
            </button>
          </div>

          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400">{errors.submit}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditProperty;
