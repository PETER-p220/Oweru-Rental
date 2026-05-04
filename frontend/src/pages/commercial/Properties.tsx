import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Search, Filter, Eye, Edit, Trash2, MoreHorizontal, Star, MapPin, DollarSign } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

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
  status: string;
  views: number;
  images: Array<{
    id: number;
    image_path: string;
    is_primary: boolean;
  }>;
  amenities: Array<{
    id: number;
    name: string;
    icon: string;
  }>;
  created_at: string;
}

const Properties: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });

  useEffect(() => {
    fetchProperties();
  }, [search, statusFilter, typeFilter, pagination.current_page]);

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.current_page.toString(),
        per_page: pagination.per_page.toString(),
      });

      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`${API_BASE}/api/commercial/properties?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProperties(data.data);
        setPagination({
          current_page: data.current_page,
          last_page: data.last_page,
          per_page: data.per_page,
          total: data.total
        });
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/commercial/properties/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        fetchProperties();
      }
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/commercial/properties/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        fetchProperties();
      }
    } catch (error) {
      console.error('Error toggling property status:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'inactive': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'residential': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'commercial': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'office': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'retail': return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
      case 'warehouse': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'industrial': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getPrimaryImage = (property: Property) => {
    const primaryImage = property.images.find(img => img.is_primary);
    return primaryImage ? `${API_BASE}/storage/${primaryImage.image_path}` : undefined;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-white">Loading properties...</div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Properties</h1>
            <p className="text-gray-400">Manage your commercial rental properties</p>
          </div>
          <Link
            to="/commercial/properties/add"
            className="flex items-center gap-2 bg-gold text-navy-900 px-4 py-2 rounded-lg font-semibold hover:bg-gold-lt transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Property
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search properties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white focus:outline-none focus:border-gold"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white focus:outline-none focus:border-gold"
            >
              <option value="all">All Types</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="office">Office</option>
              <option value="retail">Retail</option>
              <option value="warehouse">Warehouse</option>
              <option value="industrial">Industrial</option>
            </select>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>{pagination.total} properties</span>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No properties found</h3>
              <p className="text-gray-400 mb-6">Get started by adding your first property</p>
              <Link
                to="/commercial/properties/add"
                className="inline-flex items-center gap-2 bg-gold text-navy-900 px-6 py-3 rounded-lg font-semibold hover:bg-gold-lt transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Your First Property
              </Link>
            </div>
          ) : (
            properties.map((property) => (
              <div key={property.id} className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden hover:border-gold/30 transition-all duration-300">
                {/* Property Image */}
                <div className="relative h-48 bg-navy-700">
                  {getPrimaryImage(property) ? (
                    <img
                      src={getPrimaryImage(property)}
                      alt={property.title}     
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(property.status)}`}>
                      {property.status}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(property.type)}`}>
                      {property.type}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <button className="p-2 bg-navy-800/80 backdrop-blur-sm rounded-lg text-white hover:bg-navy-700/80">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{property.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{property.description}</p>
                  
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{property.location}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xl font-bold text-gold">
                      {formatCurrency(property.price)}
                      <span className="text-sm text-gray-400 font-normal">
                        /{property.price_type === 'monthly' ? 'month' : property.price_type === 'yearly' ? 'year' : 'sale'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Eye className="w-4 h-4" />
                      <span>{property.views}</span>
                    </div>
                  </div>

                  {/* Property Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {property.bedrooms && (
                      <span className="inline-flex items-center px-2 py-1 bg-navy-700 rounded text-xs text-gray-300">
                        {property.bedrooms} Beds
                      </span>
                    )}
                    {property.bathrooms && (
                      <span className="inline-flex items-center px-2 py-1 bg-navy-700 rounded text-xs text-gray-300">
                        {property.bathrooms} Baths
                      </span>
                    )}
                    {property.area && (
                      <span className="inline-flex items-center px-2 py-1 bg-navy-700 rounded text-xs text-gray-300">
                        {property.area} m²
                      </span>
                    )}
                    {property.furnished && (
                      <span className="inline-flex items-center px-2 py-1 bg-navy-700 rounded text-xs text-gray-300">
                        Furnished
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/commercial/properties/${property.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-2 bg-navy-700 text-white px-3 py-2 rounded-lg hover:bg-navy-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                    {property.status === 'active' || property.status === 'inactive' ? (
                      <button
                        onClick={() => handleToggleStatus(property.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-navy-700 text-white px-3 py-2 rounded-lg hover:bg-navy-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        {property.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    ) : null}
                    <button
                      onClick={() => handleDelete(property.id)}
                      className="flex items-center justify-center gap-2 bg-red-500/20 text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPagination(prev => ({ ...prev, current_page: Math.max(1, prev.current_page - 1) }))}
              disabled={pagination.current_page === 1}
              className="px-4 py-2 bg-navy-800 border border-navy-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-gold/30 transition-colors"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, current_page: Math.min(prev.last_page, prev.current_page + 1) }))}
              disabled={pagination.current_page === pagination.last_page}
              className="px-4 py-2 bg-navy-800 border border-navy-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-gold/30 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;
