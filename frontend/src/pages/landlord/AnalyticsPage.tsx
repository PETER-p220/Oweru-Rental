import { useEffect, useState } from 'react';
import Api from '../../services/api';
import {
  descriptionStyle,
  formatCurrency,
  headingStyle,
  metricCardStyle,
  metricGridStyle,
  pageStyle,
  panelStyle,
  sectionTitleStyle,
} from './landlordPageStyles';

interface AnalyticsPayload {
  property_performance?: {
    total_properties?: number;
    occupied_properties?: number;
    available_properties?: number;
    avg_rent?: number;
    occupancy_rate?: number;
  };
  financial_metrics?: {
    total_revenue?: number;
    monthly_revenue?: number;
    total_commissions?: number;
  };
  tenant_metrics?: {
    total_tenants?: number;
    new_tenants_this_month?: number;
  };
}

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<AnalyticsPayload>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await Api.getOwnerAnalytics();
        setAnalytics(response.data || {});
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load analytics.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const property = analytics.property_performance || {};
  const financial = analytics.financial_metrics || {};
  const tenant = analytics.tenant_metrics || {};

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Landlord Workspace</div>
        <h1 style={headingStyle}>Analytics</h1>
        <p style={descriptionStyle}>
          Live performance metrics from the owner analytics endpoint, focused on occupancy, rent pricing, and landlord portfolio health.
        </p>
      </section>

      <section style={panelStyle}>
        {error && <div style={{ marginBottom: '16px', color: 'var(--error-color)' }}>{error}</div>}
        {loading ? (
          <div style={{ color: 'var(--loading-color)' }}>Loading analytics...</div>
        ) : (
          <div style={metricGridStyle}>
            <div style={metricCardStyle}>
              <div style={{ color: 'var(--primary-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Total properties</div>
              <div style={{ fontSize: '30px', marginTop: '8px' }}>{property.total_properties ?? 0}</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ color: 'var(--primary-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Occupied</div>
              <div style={{ fontSize: '30px', marginTop: '8px' }}>{property.occupied_properties ?? 0}</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ color: 'var(--primary-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Available</div>
              <div style={{ fontSize: '30px', marginTop: '8px' }}>{property.available_properties ?? 0}</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ color: 'var(--primary-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Average rent</div>
              <div style={{ fontSize: '30px', marginTop: '8px' }}>{formatCurrency(property.avg_rent)}</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ color: 'var(--primary-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Occupancy rate</div>
              <div style={{ fontSize: '30px', marginTop: '8px' }}>{Number(property.occupancy_rate ?? 0).toFixed(1)}%</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ color: 'var(--primary-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Total revenue</div>
              <div style={{ fontSize: '30px', marginTop: '8px' }}>{formatCurrency(financial.total_revenue)}</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ color: 'var(--primary-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Monthly revenue</div>
              <div style={{ fontSize: '30px', marginTop: '8px' }}>{formatCurrency(financial.monthly_revenue)}</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ color: 'var(--primary-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Total tenants</div>
              <div style={{ fontSize: '30px', marginTop: '8px' }}>{tenant.total_tenants ?? 0}</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ color: 'var(--primary-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>New tenants this month</div>
              <div style={{ fontSize: '30px', marginTop: '8px' }}>{tenant.new_tenants_this_month ?? 0}</div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AnalyticsPage;
