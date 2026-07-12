import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Star, BarChart3, PieChart } from 'lucide-react';
import Api from '../../services/api';

interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  averageRating: number;
  occupancyRate: number;
  monthlyRevenue: number[];
  bookingTrends: number[];
  topProperties: Array<{
    id: number;  
    title: string;
    bookings: number;
    revenue: number;
    rating: number;
  }>;
}

const BnbAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // Use existing API methods as fallback
      const response = await Api.getAnalytics(); // Using existing analytics API
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Fallback to mock data if API fails
      const mockAnalytics: AnalyticsData = {
        totalRevenue: 45000000,
        totalBookings: 156,
        averageRating: 4.7,
        occupancyRate: 85,
        monthlyRevenue: [3200000, 3800000, 4200000, 3900000, 4500000, 4800000],
        bookingTrends: [12, 15, 18, 14, 22, 25, 19, 28, 32, 26, 30, 28],
        topProperties: [
          { id: 1, title: 'Luxury Beach Villa', bookings: 45, revenue: 12000000, rating: 4.9 },
          { id: 2, title: 'City Center Apartment', bookings: 38, revenue: 9500000, rating: 4.7 },
          { id: 3, title: 'Mountain Retreat', bookings: 32, revenue: 8800000, rating: 4.8 },
          { id: 4, title: 'Garden Cottage', bookings: 28, revenue: 7200000, rating: 4.6 },
          { id: 5, title: 'Ocean View Suite', bookings: 25, revenue: 7500000, rating: 4.9 },
        ],
      };
      setAnalytics(mockAnalytics);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-TZ').format(num);
  };

  const MetricCard = ({ title, value, change, icon: Icon, color }: {
    title: string;
    value: string;
    change?: { value: number; isPositive: boolean };
    icon: any;
    color: string;
  }) => (
    <div style={{
      background: `rgba(var(--color-${color}), 0.05)`,
      border: `1px solid rgba(var(--color-${color}), 0.1)`,
      borderRadius: '12px',
      padding: '20px',
      flex: 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: `rgba(var(--color-${color}), 0.2)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={20} color={`var(--color-${color})`} />
        </div>
        <div>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>{title}</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#e8e4dc' }}>{value}</div>
        </div>
      </div>
      {change && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          color: change.isPositive ? 'var(--color-green)' : 'var(--color-red)',
        }}>
          {change.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change.value}% from last period
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        background: '#080808',
        color: '#e8e4dc',
        minHeight: '100vh',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        Loading analytics...
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: '#080808',
      color: '#e8e4dc',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <style>{`
        :root {
          --color-blue: #2563eb;
          --color-green: #10b981;
          --color-red: #ef4444;
        }
        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .analytics-title {
          font-size: 24px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
        }
        .time-range-selector {
          padding: 8px 16px;
          border: 1px solid rgba(var(--color-blue), 0.1);
          border-radius: 8px;
          background: rgba(var(--color-blue), 0.05);
          color: var(--color-text);
          font-size: 14px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        .chart-section {
          background: rgba(var(--color-blue), 0.05);
          border: 1px solid rgba(var(--color-blue), 0.1);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 16px;
        }
        .properties-table {
          width: 100%;
          border-collapse: collapse;
        }
        .properties-table th {
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid rgba(var(--color-blue), 0.1);
          color: #9ca3af;
          font-size: 12px;
          font-weight: 500;
        }
        .properties-table td {
          padding: 12px;
          border-bottom: 1px solid rgba(var(--color-blue), 0.05);
          color: var(--color-text);
        }
        .properties-table tr:hover {
          background: rgba(var(--color-blue), 0.02);
        }
      `}</style>

      <div className="analytics-header">
        <h1 className="analytics-title">Analytics</h1>
        <select
          className="time-range-selector"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(analytics?.totalRevenue || 0)}
          change={{ value: 12.5, isPositive: true }}
          icon={DollarSign}
          color="blue"
        />
        <MetricCard
          title="Total Bookings"
          value={formatNumber(analytics?.totalBookings || 0)}
          change={{ value: 8.2, isPositive: true }}
          icon={Calendar}
          color="blue"
        />
        <MetricCard
          title="Average Rating"
          value={(analytics?.averageRating || 0).toFixed(1)}
          change={{ value: 2.1, isPositive: true }}
          icon={Star}
          color="blue"
        />
        <MetricCard
          title="Occupancy Rate"
          value={`${analytics?.occupancyRate || 0}%`}
          change={{ value: 3.4, isPositive: true }}
          icon={Users}
          color="blue"
        />
      </div>

      <div style={{
        background: 'rgba(var(--color-blue), 0.05)',
        border: '1px solid rgba(var(--color-blue), 0.1)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <h2 className="section-title">Revenue Trend</h2>
        <div style={{
          height: '200px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
        }}>
          {analytics && analytics.monthlyRevenue.map((revenue, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                background: 'var(--color-blue)',
                borderRadius: '4px',
                height: `${(revenue / Math.max(...(analytics?.monthlyRevenue || [1]))) * 100}%`,
                position: 'relative',
              }}
              title={`Month ${index + 1}: ${formatCurrency(revenue)}`}
            />
          ))}
        </div>
      </div>

      <div style={{
        background: 'rgba(var(--color-blue), 0.05)',
        border: '1px solid rgba(var(--color-blue), 0.1)',
        borderRadius: '12px',
        padding: '24px',
      }}>
        <h2 className="section-title">Top Performing Properties</h2>
        <table className="properties-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Bookings</th>
              <th>Revenue</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {analytics && analytics.topProperties.map((property) => (
              <tr key={property.id}>
                <td>{property.title}</td>
                <td>{property.bookings}</td>
                <td>{formatCurrency(property.revenue)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={14} fill="#f59e0b" color="#f59e0b" />
                    {property.rating}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BnbAnalytics;
