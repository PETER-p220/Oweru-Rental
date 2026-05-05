import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, TrendingUp, Users, DollarSign, Eye, Calendar, Star, Plus, ArrowUp, ArrowDown } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/dashboard/commercial`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
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
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' });

  const getStatusStyle = (status: string) => {
    const map: Record<string, string> = {
      active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
      pending: 'text-amber-400 bg-amber-400/10 border-amber-400/25',
      confirmed: 'text-blue-400 bg-blue-400/10 border-blue-400/25',
      inactive: 'text-slate-400 bg-slate-400/10 border-slate-400/25',
    };
    return map[status] || 'text-slate-400 bg-slate-400/10 border-slate-400/25';
  };

  const statCards = [
    { title: 'Total Properties', value: stats?.total_properties || 0, icon: <Building2 className="w-5 h-5" />, change: 12, up: true },
    { title: 'Active Listings', value: stats?.active_properties || 0, icon: <TrendingUp className="w-5 h-5" />, change: 8, up: true },
    { title: 'Total Bookings', value: stats?.total_bookings || 0, icon: <Users className="w-5 h-5" />, change: 15, up: true },
    { title: 'Total Revenue', value: formatCurrency(stats?.total_revenue || 0), icon: <DollarSign className="w-5 h-5" />, change: 23, up: true },
    { title: 'Avg. Rating', value: `${stats?.average_rating?.toFixed(1) || '0.0'} ★`, icon: <Star className="w-5 h-5" />, change: 5, up: true },
    { title: 'Occupancy Rate', value: `${stats?.occupancy_rate || 0}%`, icon: <Eye className="w-5 h-5" />, change: 3, up: true },
  ];

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#C89128]/30 border-t-[#C89128] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-base font-medium">Loading commercial dashboard...</p>
          <p className="text-slate-500 text-sm mt-1">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 text-[#C89128] mx-auto mb-4">
            <Calendar className="w-12 h-12" />
          </div>
          <p className="text-slate-400 text-base font-medium">Error loading dashboard</p>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <style>{`
        :root {
          --navy-900:#0F172A; --navy-800:#162035; --navy-700:#1E2D4A;
          --gold:#C89128; --gold-lt:#D4A843; --gold-dim:rgba(200,145,40,0.12);
          --cream:#F8F8F9; --slate:#94A3B8; --border:rgba(200,145,40,0.18);
        }
        .stat-card { transition: transform .2s, border-color .2s; }
        .stat-card:hover { transform: translateY(-2px); border-color: rgba(200,145,40,.4) !important; }
        .bar-item { transition: opacity .2s; }
        .bar-item:hover .bar-fill { opacity: .9; }
        .bar-item:hover .bar-tooltip { opacity: 1; pointer-events: auto; }
        .bar-tooltip { opacity:0; pointer-events:none; transition: opacity .15s; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#C89128] uppercase mb-1">Commercial Portal</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-400 text-sm">Welcome back, <span className="text-white font-medium">{user?.name || 'User'}</span></p>
              {user?.verified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/25">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>
          <Link
            to="/commercial/properties/add"
            className="inline-flex items-center gap-2 bg-[#C89128] text-[#0F172A] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#D4A843] transition-colors self-start sm:self-auto shadow-lg shadow-[#C89128]/20"
          >
            <Plus className="w-4 h-4" />
            Add Property
          </Link>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {statCards.map((card, i) => (
            <div key={i} className="stat-card bg-[#162035] border border-[#1E2D4A] rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="p-2 bg-[#C89128]/10 rounded-xl text-[#C89128]">{card.icon}</div>
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${card.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {card.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {card.change}%
                </span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-white leading-tight">{card.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.title}</p>
            </div>
          ))}
        </div>

        {/* ── Two Column Section ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Recent Bookings */}
          <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E2D4A] flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Recent Bookings</h2>
              <span className="text-xs text-slate-500">{recentBookings.length} total</span>
            </div>
            <div className="divide-y divide-[#1E2D4A]">
              {recentBookings.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No recent bookings</p>
                </div>
              ) : recentBookings.map((b) => (
                <div key={b.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[#1E2D4A]/40 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-[#C89128]/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-[#C89128]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{b.property.title}</p>
                    <p className="text-xs text-slate-400 truncate">{b.customer_name} · {formatDate(b.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-[#C89128]">{formatCurrency(b.total_amount)}</p>
                    <span className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${getStatusStyle(b.status)}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Properties */}
          <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E2D4A] flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Top Properties</h2>
              <span className="text-xs text-slate-500">{popularProperties.length} listed</span>
            </div>
            <div className="divide-y divide-[#1E2D4A]">
              {popularProperties.length === 0 ? (
                <div className="py-12 text-center">
                  <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No properties yet</p>
                </div>
              ) : popularProperties.map((p, idx) => (
                <div key={p.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[#1E2D4A]/40 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-[#1E2D4A] flex items-center justify-center flex-shrink-0">
                    {p.image
                      ? <img src={p.image} alt="" className="w-full h-full object-cover rounded-xl" />
                      : <span className="text-xs font-bold text-[#C89128]">#{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.title}</p>
                    <p className="text-xs text-slate-400 truncate">{p.location}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-[#C89128]">{formatCurrency(p.price)}</p>
                    <p className="text-[10px] text-slate-500 flex items-center justify-end gap-0.5 mt-0.5">
                      <Eye className="w-3 h-3" />{p.views}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Revenue Chart ── */}
        <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1E2D4A] flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Monthly Revenue</h2>
            <span className="text-xs text-slate-500">{monthlyRevenue.length} months</span>
          </div>
          <div className="p-5">
            {monthlyRevenue.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-slate-500 text-sm">No revenue data</p>
              </div>
            ) : (
              <div className="h-48 sm:h-56 flex items-end gap-1.5 sm:gap-2.5">
                {monthlyRevenue.map((m, i) => {
                  const pct = Math.max((m.revenue / maxRevenue) * 100, 4);
                  return (
                    <div key={i} className="bar-item flex-1 flex flex-col items-center gap-1.5 relative" style={{ height: '100%', justifyContent: 'flex-end' }}>
                      <div
                        className="bar-tooltip absolute -top-9 left-1/2 -translate-x-1/2 bg-[#0F172A] border border-[#1E2D4A] rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap z-10 shadow-lg"
                      >
                        {formatCurrency(m.revenue)}
                      </div>
                      <div
                        className="bar-fill w-full rounded-t-lg bg-gradient-to-t from-[#C89128]/60 to-[#C89128]/20 border-t-2 border-[#C89128]/60 cursor-pointer"
                        style={{ height: `${pct}%` }}
                      />
                      <span className="text-[10px] text-slate-500 font-medium">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;