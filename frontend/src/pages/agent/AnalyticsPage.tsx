import { useEffect, useState } from 'react';
import Api from '../../services/api';
import {
  descriptionStyle,
  formatCurrency,
  headingStyle,
  pageStyle,
  panelStyle,
  sectionTitleStyle,
  statCardStyle,
  statGridStyle,
  statLabelStyle,
  statValueStyle,
  tableStyle,
  tableWrapStyle,
  tdStyle,
  thStyle,
} from './agentPageStyles';

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await Api.getAgentAnalytics();
        setAnalytics(res.data || {});
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load analytics.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const topProperties = analytics?.revenue_metrics?.top_performing_properties || [];

  return (
    <div style={pageStyle}>
      <style>{`
        .analytics-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-top: 22px;
        }

        .analytics-stat-card {
          /* base styles come from statCardStyle() inline */
        }

        .analytics-table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .analytics-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 480px;
        }

        @media (max-width: 900px) {
          .analytics-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
        }

        @media (max-width: 768px) {
          .analytics-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-top: 14px;
          }

          .analytics-section {
            padding: 16px !important;
          }
        }

        @media (max-width: 480px) {
          .analytics-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .analytics-section h1 {
            font-size: 20px !important;
          }

          .analytics-section p {
            font-size: 13px !important;
          }
        }
      `}</style>

      <section className="analytics-section" style={panelStyle}>
        <div style={sectionTitleStyle}>Agent Workspace</div>
        <h1 style={headingStyle}>Analytics</h1>
        <p style={descriptionStyle}>
          Performance and revenue metrics from the Laravel agent analytics endpoint.
        </p>

        <div className="analytics-stats-grid">
          <div style={statCardStyle('#38bdf8')}>
            <div style={statLabelStyle}>Properties</div>
            <div style={statValueStyle}>
              {loading ? '...' : analytics?.performance_metrics?.total_properties || 0}
            </div>
          </div>
          <div style={statCardStyle('#22c55e')}>
            <div style={statLabelStyle}>Leads</div>
            <div style={statValueStyle}>
              {loading ? '...' : analytics?.performance_metrics?.total_leads || 0}
            </div>
          </div>
          <div style={statCardStyle('#f59e0b')}>
            <div style={statLabelStyle}>Conversion</div>
            <div style={statValueStyle}>
              {Number(analytics?.performance_metrics?.conversion_rate || 0).toFixed(1)}%
            </div>
          </div>
          <div style={statCardStyle('#fb7185')}>
            <div style={statLabelStyle}>Commissions</div>
            <div style={statValueStyle}>
              {formatCurrency(analytics?.revenue_metrics?.total_commissions)}
            </div>
          </div>
        </div>
      </section>

      <section className="analytics-section" style={panelStyle}>
        {error && (
          <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>
        )}
        <div className="analytics-table-wrap" style={tableWrapStyle}>
          <table className="analytics-table" style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Top Property</th>
                <th style={thStyle}>Applications</th>
                <th style={thStyle}>Leads</th>
                <th style={thStyle}>Price</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td style={tdStyle} colSpan={4}>
                    Loading analytics...
                  </td>
                </tr>
              ) : topProperties.length === 0 ? (
                <tr>
                  <td style={tdStyle} colSpan={4}>
                    No analytics records found.
                  </td>
                </tr>
              ) : (
                topProperties.map((item: any) => (
                  <tr key={item.id}>
                    <td style={tdStyle}>{item.title}</td>
                    <td style={tdStyle}>{item.applications}</td>
                    <td style={tdStyle}>{item.leads}</td>
                    <td style={tdStyle}>{formatCurrency(item.price)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsPage;