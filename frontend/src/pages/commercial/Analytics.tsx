import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Eye, DollarSign, Users, Building2, Calendar, BarChart3, PieChart, Activity } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface AnalyticsData {
  total_properties: number;
  active_properties: number;
  total_bookings: number;
  total_revenue: number;
  average_rating: number;
  occupancy_rate: number;
  monthly_revenue: Array<{ month: string; revenue: number }>;
  property_performance: Array<{
    id: number;
    title: string;
    views: number;
    bookings: number;
    revenue: number;
    rating: number;
  }>;
  booking_trends: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/commercial/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    return value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-400';
  };

  const getChangeIcon = (value: number) => {
    return value > 0 ? <TrendingUp className="w-4 h-4" /> : value < 0 ? <TrendingDown className="w-4 h-4" /> : null;
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: number;
    changeLabel?: string;
  }> = ({ title, value, icon, change, changeLabel }) => (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 hover:border-gold/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gold/10 rounded-lg text-gold">
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-sm ${getChangeColor(change)}`}>
            {getChangeIcon(change)}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
      {changeLabel && (
        <div className="text-xs text-gray-500 mt-1">{changeLabel}</div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-white">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Track your commercial property performance</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 bg-navy-800 border border-navy-700 rounded-lg text-white focus:outline-none focus:border-gold"
        >
          <option value="1month">Last Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(data?.total_revenue || 0)}
          icon={<DollarSign className="w-6 h-6" />}
          change={23.5}
          changeLabel="vs last period"
        />
        <MetricCard
          title="Total Bookings"
          value={data?.total_bookings || 0}
          icon={<Users className="w-6 h-6" />}
          change={15.2}
          changeLabel="vs last period"
        />
        <MetricCard
          title="Occupancy Rate"
          value={formatPercentage(data?.occupancy_rate || 0)}
          icon={<Activity className="w-6 h-6" />}
          change={5.8}
          changeLabel="vs last period"
        />
        <MetricCard
          title="Average Rating"
          value={(data?.average_rating || 0).toFixed(1)}
          icon={<TrendingUp className="w-6 h-6" />}
          change={2.1}
          changeLabel="vs last period"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Revenue Trend
            </h2>
            <div className="text-sm text-gray-400">
              {formatCurrency(data?.monthly_revenue.reduce((sum, item) => sum + item.revenue, 0) || 0)} total
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2">
            {data?.monthly_revenue.map((month, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-gold/40 to-gold/20 rounded-t-lg relative group cursor-pointer"
                  style={{
                    height: `${(month.revenue / Math.max(...data.monthly_revenue.map(m => m.revenue))) * 100}%`
                  }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-navy-700 border border-navy-600 rounded px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatCurrency(month.revenue)}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2">{month.month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Property Performance */}
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Top Performing Properties
            </h2>
          </div>
          
          <div className="space-y-4">
            {data?.property_performance.slice(0, 5).map((property, index) => (
              <div key={property.id} className="flex items-center justify-between p-4 bg-navy-700/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gold/20 rounded-lg flex items-center justify-center text-gold font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-white">{property.title}</div>
                    <div className="text-sm text-gray-400">{property.views} views</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gold">{formatCurrency(property.revenue)}</div>
                  <div className="text-xs text-gray-400">{property.bookings} bookings</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Trends */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Booking Trends
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Monthly Bookings</h3>
            <div className="h-48 flex items-end justify-between gap-2">
              {data?.booking_trends.map((trend, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500/20 rounded-t-lg relative group cursor-pointer"
                    style={{
                      height: `${(trend.bookings / Math.max(...data.booking_trends.map(t => t.bookings))) * 100}%`
                    }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-navy-700 border border-navy-600 rounded px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {trend.bookings} bookings
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">{trend.month}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Key Insights</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-medium">Peak Performance</div>
                  <div className="text-sm text-gray-400">Best booking month: {data?.booking_trends.reduce((max, trend) => trend.bookings > max.bookings ? trend : max).month}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-medium">Growth Opportunity</div>
                  <div className="text-sm text-gray-400">Consider increasing marketing during slower months</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <div className="text-white font-medium">Average Booking Value</div>
                  <div className="text-sm text-gray-400">{formatCurrency((data?.total_revenue || 0) / (data?.total_bookings || 1))} per booking</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
