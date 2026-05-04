import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, MapPin, FileText, Save, Edit2, Check, X, Shield, Calendar } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface CommercialUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  business_license: string;
  address: string;
  description: string;
  verified: boolean;
  created_at: string;
}

interface FormData {
  name: string;
  phone: string;
  company_name: string;
  business_license: string;
  address: string;
  description: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<CommercialUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    company_name: '',
    business_license: '',
    address: '',
    description: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/commercial/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Initialize form data
        setFormData({
          name: data.user.name,
          phone: data.user.phone,
          company_name: data.user.company_name,
          business_license: data.user.business_license,
          address: data.user.address,
          description: data.user.description || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.company_name.trim()) newErrors.company_name = 'Company name is required';
    if (!formData.business_license.trim()) newErrors.business_license = 'Business license is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/commercial/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setEditing(false);
        setSuccess('Profile updated successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        if (errorData.errors) {
          setErrors(errorData.errors);
        } else {
          setErrors({ submit: errorData.message || 'Failed to update profile' });
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-white mb-2">Company Profile</h1>
          <p className="text-gray-400">Manage your commercial property business information</p>
        </div>

        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <p className="text-green-400">{success}</p>
            </div>
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{errors.submit}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-12 h-12 text-gold" />
                </div>
                
                <h2 className="text-xl font-semibold text-white mb-2">{user?.name}</h2>
                <p className="text-gray-400 mb-4">{user?.company_name}</p>
                
                <div className="flex items-center justify-center gap-2 mb-6">
                  {user?.verified ? (
                    <>
                      <Shield className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm">Verified Business</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">Pending Verification</span>
                    </>
                  )}
                </div>

                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3 text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{user?.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{user?.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Member since {user && formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Business Information</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gold text-navy-900 rounded-lg font-semibold hover:bg-gold-lt transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 bg-navy-700 text-white rounded-lg hover:bg-navy-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-gold text-navy-900 rounded-lg font-semibold hover:bg-gold-lt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold disabled:opacity-50"
                      placeholder="Your business name"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold disabled:opacity-50"
                      placeholder="+255712345678"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold disabled:opacity-50"
                      placeholder="Your company name"
                    />
                    {errors.company_name && <p className="mt-1 text-sm text-red-400">{errors.company_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Business License *
                    </label>
                    <input
                      type="text"
                      name="business_license"
                      value={formData.business_license}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold disabled:opacity-50"
                      placeholder="BL-2024-COM-001"
                    />
                    {errors.business_license && <p className="mt-1 text-sm text-red-400">{errors.business_license}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Business Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold disabled:opacity-50"
                      placeholder="Full business address"
                    />
                    {errors.address && <p className="mt-1 text-sm text-red-400">{errors.address}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Business Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      disabled={!editing}
                      rows={4}
                      className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold disabled:opacity-50"
                      placeholder="Tell us about your business and the types of properties you offer..."
                    />
                  </div>
                </div>

                {/* Account Info */}
                <div className="border-t border-navy-700 pt-6">
                  <h3 className="text-lg font-medium text-white mb-4">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white disabled:opacity-50"
                        placeholder="your@email.com"
                      />
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed here</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Account Status
                      </label>
                      <div className="flex items-center gap-2 h-10">
                        {user?.verified ? (
                          <>
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <span className="text-green-400">Verified Business</span>
                          </>
                        ) : (
                          <>
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            <span className="text-yellow-400">Pending Verification</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Business Verification Info */}
        {!user?.verified && (
          <div className="mt-8 bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Business Verification Pending</h3>
                <p className="text-gray-300 mb-4">
                  Your business account is currently pending verification. This process typically takes 1-3 business days. 
                  Once verified, you'll have full access to all commercial features.
                </p>
                <div className="bg-navy-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Verification Requirements:</h4>
                  <ul className="text-gray-300 space-y-1 text-sm">
                    <li>• Valid business license</li>
                    <li>• Complete business information</li>
                    <li>• Active property listings</li>
                    <li>• Contact verification</li>
                  </ul>
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
