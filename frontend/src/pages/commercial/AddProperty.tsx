import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, X, Upload, MapPin, DollarSign, Home, Car, Square, Calendar, Save } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface Amenity {
  id: number;
  name: string;
  icon: string;
}

interface FormData {
  title: string;
  description: string;
  type: string;
  location: string;
  address: string;
  price: number;
  price_type: string;
  parking_spaces: number;
  furnished: boolean;
  available_from: string;
  contact_phone: string;
  contact_email: string;
  amenities: number[];
}

const AddProperty: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: 'office',
    location: '',
    address: '',
    price: 0,
    price_type: 'monthly',
    parking_spaces: 0,
    furnished: false,
    available_from: '',
    contact_phone: '',
    contact_email: '',
    amenities: []
  });

  useEffect(() => {
    fetchAmenities();
  }, []);

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

    setImages(prev => [...prev, ...validFiles]);

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

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Price must be greater than 0';
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

      // Add images
      images.forEach((image, index) => {
        formDataToSend.append(`images[${index}]`, image);
      });

      const response = await fetch(`${API_BASE}/api/commercial/properties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formDataToSend
      });

      if (response.ok) {
        navigate('/commercial/properties', {
          state: { message: 'Property created successfully and is pending approval' }
        });
      } else {
        const errorData = await response.json();
        if (errorData.errors) {
          setErrors(errorData.errors);
        } else {
          setErrors({ submit: errorData.message || 'Failed to create property' });
        }
      }
    } catch (error) {
      console.error('Error creating property:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const propertyTypes = [
    { value: 'office', label: 'Office Space' },
    { value: 'retail', label: 'Retail Space' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'commercial', label: 'Commercial Building' },
    { value: 'industrial', label: 'Industrial Space' }
  ];

  const priceTypes = [
    { value: 'monthly', label: 'Per Month' },
    { value: 'yearly', label: 'Per Year' },
    { value: 'sale', label: 'For Sale' }
  ];

  return (
    <div className="min-h-screen bg-navy-900">
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
          <h1 className="text-3xl font-bold text-white mb-2">Add New Property</h1>
          <p className="text-gray-400">List your commercial space (office, retail, warehouse) on Oweru</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Property Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold"
                  placeholder="e.g., Modern Office Space in Kigali"
                />
                {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Property Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white focus:outline-none focus:border-gold"
                >
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-400">{errors.type}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold"
                  placeholder="Describe your property in detail..."
                />
                {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location/Area *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold"
                  placeholder="e.g., Kigali, Rwanda"
                />
                {errors.location && <p className="mt-1 text-sm text-red-400">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold"
                  placeholder="e.g., KN 123 St, Kigali"
                />
                {errors.address && <p className="mt-1 text-sm text-red-400">{errors.address}</p>}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price (TZS) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold"
                  placeholder="500000"
                />
                {errors.price && <p className="mt-1 text-sm text-red-400">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price Type *
                </label>
                <select
                  name="price_type"
                  value={formData.price_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white focus:outline-none focus:border-gold"
                >
                  {priceTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.price_type && <p className="mt-1 text-sm text-red-400">{errors.price_type}</p>}
              </div>
            </div>
          </div>

          {/* Property Features */}
          <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Home className="w-5 h-5" />
              Property Features
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Car className="w-4 h-4 inline mr-1" />
                  Parking Spaces
                </label>
                <input
                  type="number"
                  name="parking_spaces"
                  value={formData.parking_spaces}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Square className="w-4 h-4 inline mr-1" />
                  Furnished
                </label>
                <div className="flex items-center h-10">
                  <input
                    type="checkbox"
                    name="furnished"
                    checked={formData.furnished}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-gold bg-navy-700 border-navy-600 rounded focus:ring-gold"
                  />
                  <span className="ml-2 text-gray-300">Furnished</span>
                </div>
              </div>
            </div>
          </div>

          {/* Availability & Contact */}
          <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Availability & Contact
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Available From *
                </label>
                <input
                  type="date"
                  name="available_from"
                  value={formData.available_from}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold"
                />
                {errors.available_from && <p className="mt-1 text-sm text-red-400">{errors.available_from}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold"
                  placeholder="+255712345678"
                />
                {errors.contact_phone && <p className="mt-1 text-sm text-red-400">{errors.contact_phone}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold"
                  placeholder="contact@example.com"
                />
                {errors.contact_email && <p className="mt-1 text-sm text-red-400">{errors.contact_email}</p>}
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Amenities</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {amenities.map((amenity) => (
                <label
                  key={amenity.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.amenities.includes(amenity.id)
                      ? 'border-gold bg-gold/10'
                      : 'border-navy-600 bg-navy-700 hover:border-navy-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity.id)}
                    onChange={() => handleAmenityToggle(amenity.id)}
                    className="w-4 h-4 text-gold bg-navy-700 border-navy-600 rounded focus:ring-gold"
                  />
                  <span className="text-gray-300">{amenity.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Property Images
            </h2>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-navy-600 rounded-lg p-8 text-center">
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
                  <span className="text-gray-300 mb-2">Click to upload images</span>
                  <span className="text-gray-500 text-sm">PNG, JPG, GIF up to 2MB each</span>
                </label>
              </div>

              {errors.images && <p className="text-sm text-red-400">{errors.images}</p>}

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500/80 backdrop-blur-sm rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/commercial/properties')}
              className="px-6 py-3 bg-navy-800 border border-navy-700 rounded-lg text-white hover:border-navy-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gold text-navy-900 rounded-lg font-semibold hover:bg-gold-lt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>Creating...</>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Property
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

export default AddProperty;
