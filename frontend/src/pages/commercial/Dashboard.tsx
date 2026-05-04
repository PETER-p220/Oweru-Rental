import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, TrendingUp, Users, DollarSign, Eye, Calendar, Star, Plus, ArrowUp, ArrowDown, MoreHorizontal } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface DashboardStats {
  total_properties: number;
  active_properties: number;
  total_bookings: number;
  total_revenue: number;
  average_rating: number;
  occupancy_rate: number;
}

interface Property {
  id: number;
  title: string;
  type: string;
  location: string;
  price: number;
  status: string;
  views: number;
  image?: string;
}

interface Booking {
  id: number;
  property: Property;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface CommercialUser {
  name: string;
  email: string;
  company_name: string;
  business_license: string;
  verified: boolean;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [popularProperties, setPopularProperties] = useState<Property[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [user, setUser] = useState<CommercialUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/commercial/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentBookings(data.recent_bookings);
        setPopularProperties(data.popular_properties);
        setMonthlyRevenue(data.monthly_revenue);
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: number;
    changeType?: 'increase' | 'decrease';
  }> = ({ title, value, icon, change, changeType }) => (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 hover:border-gold/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gold/10 rounded-lg text-gold">
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-sm ${
            changeType === 'increase' ? 'text-green-400' : 'text-red-400'
          }`}>
            {changeType === 'increase' ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
            {change}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Commercial Dashboard</h1>
              <p className="text-gray-400">
                Welcome back, {user?.name}
                {user?.verified && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-400/10 text-green-400 border border-green-400/20">
                    ✓ Verified
                  </span>
                )}
              </p>
            </div>
            <Link
              to="/commercial/properties/add"
              className="flex items-center gap-2 bg-gold text-navy-900 px-4 py-2 rounded-lg font-semibold hover:bg-gold-lt transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Property
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Properties"
            value={stats?.total_properties || 0}
            icon={<Building2 className="w-6 h-6" />}
            change={12}
            changeType="increase"
          />
          <StatCard
            title="Active Properties"
            value={stats?.active_properties || 0}
            icon={<TrendingUp className="w-6 h-6" />}
            change={8}
            changeType="increase"
          />
          <StatCard
            title="Total Bookings"
            value={stats?.total_bookings || 0}
            icon={<Users className="w-6 h-6" />}
            change={15}
            changeType="increase"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.total_revenue || 0)}
            icon={<DollarSign className="w-6 h-6" />}
            change={23}
            changeType="increase"
          />
          <StatCard
            title="Average Rating"
            value={stats?.average_rating?.toFixed(1) || '0.0'}
            icon={<Star className="w-6 h-6" />}
            change={5}
            changeType="increase"
          />
          <StatCard
            title="Occupancy Rate"
            value={`${stats?.occupancy_rate || 0}%`}
            icon={<Eye className="w-6 h-6" />}
            change={3}
            changeType="increase"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Bookings */}
          <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Bookings</h2>
            <div className="space-y-4">
              {recentBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No recent bookings
                </div>
              ) : (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-navy-700/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-white">{booking.property.title}</div>
                      <div className="text-sm text-gray-400">{booking.customer_name}</div>
                      <div className="text-xs text-gray-500">{formatDate(booking.created_at)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gold">{formatCurrency(booking.total_amount)}</div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Popular Properties */}
          <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Popular Properties</h2>
            <div className="space-y-4">
              {popularProperties.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No properties available
                </div>
              ) : (
                popularProperties.map((property) => (
                  <div key={property.id} className="flex items-center justify-between p-4 bg-navy-700/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      {property.image && (
                        <img
                          src={property.image}
                          alt={property.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium text-white">{property.title}</div>
                        <div className="text-sm text-gray-400">{property.location}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gold">{formatCurrency(property.price)}</div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {property.views} views
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Monthly Revenue</h2>
          <div className="h-64 flex items-end justify-between gap-4">
            {monthlyRevenue.map((month, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gold/20 rounded-t-lg relative"
                  style={{
                    height: `${(month.revenue / Math.max(...monthlyRevenue.map(m => m.revenue))) * 100}%`
                  }}
                >
                  <div className="absolute inset-0 bg-gold/40 rounded-t-lg" />
                </div>
                <div className="text-xs text-gray-400 mt-2">{month.month}</div>
                <div className="text-xs text-gold font-medium">{formatCurrency(month.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
