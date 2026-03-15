import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Calendar, Download, Filter } from 'lucide-react';
import Api from '../services/api';

// TypeScript compilation fix trigger
const TYPE_FIX = true;

// Define types locally to avoid import issues
interface AnalyticsData {
  totalViews: number;
  totalClicks: number;
  totalInquiries: number;
  conversionRate: number;
  monthlyViews: number;
  monthlyInquiries: number;
  monthlyRevenue: number;
  topProperties: Array<{
    id: number;
    title: string;
    views: number;
    clicks: number;
    inquiries: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    views: number;
    inquiries: number;
    revenue: number;
  }>;
}

const Analytics: React.FC = () => {
  console.log('Analytics rendered - this should appear in console when clicking Analytics link');
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await Api.getAnalytics();
      if (response.data) {
        setAnalyticsData(response.data);
      }
    } catch (error: any) {
      console.error('Error loading analytics data:', error);
      setError('Failed to load analytics data');
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div>Loading analytics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</div>
        <button 
          onClick={loadAnalyticsData}
          style={{ 
            padding: '8px 16px', 
            background: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            Analytics
          </h1>
          
          {/* Time Range Selector */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
              style={{ 
                padding: '8px 12px', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <BarChart3 size={24} style={{ color: '#3b82f6', marginRight: '12px' }} />
              <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Total Views</h3>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {formatNumber(analyticsData?.totalViews || 0)}
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <TrendingUp size={24} style={{ color: '#10b981', marginRight: '12px' }} />
              <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Total Clicks</h3>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {formatNumber(analyticsData?.totalClicks || 0)}
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <Users size={24} style={{ color: '#f59e0b', marginRight: '12px' }} />
              <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Total Inquiries</h3>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {formatNumber(analyticsData?.totalInquiries || 0)}
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <DollarSign size={24} style={{ color: '#8b5cf6', marginRight: '12px' }} />
              <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Conversion Rate</h3>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {analyticsData?.conversionRate || 0}%
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginBottom: '32px' }}>
          {/* Monthly Trend Chart */}
          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              Monthly Trend
            </h3>
            <div style={{ height: '200px', background: 'var(--bg-tertiary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                <BarChart3 size={24} />
                <p style={{ marginTop: '8px', fontSize: '12px' }}>Chart visualization would go here</p>
              </div>
            </div>
          </div>

          {/* Top Properties */}
          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
              Top Properties
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {(analyticsData?.topProperties || []).map((property, index) => (
                <div 
                  key={property.id}
                  style={{ 
                    background: 'var(--bg-tertiary)', 
                    padding: '16px', 
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {index + 1}. {property.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {formatNumber(property.views)} views • {formatNumber(property.clicks)} clicks • {formatNumber(property.inquiries)} inquiries
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                    {formatNumber(property.views)} views
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px 20px', 
              background: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <Download size={16} />
            Export Analytics Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
