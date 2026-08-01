import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import LeadsAndVisitorsSection from './LeadsAndVisitorsSection';
import { useAuthenticatedEffect } from '../../hooks/useAuthenticatedEffect';
import { getApiErrorMessage, rejectedReason, retryAsync } from '../../utils/apiErrors';
import DashboardLoadError from '../../components/DashboardLoadError';
import {
  agentEyebrowStyle,
  agentHeaderInnerStyle,
  agentSubtitleStyle,
  agentTitleStyle,
  agentWorkspace,
  lightTdStyle,
  lightThStyle,
} from './agentWorkspaceTheme';
import { formatCurrency } from './agentPageStyles';

const AgentDashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!localStorage.getItem('token')) return;

    try {
      setLoading(true);
      setError('');

      await retryAsync(async () => {
        const [dashboardRes, listingsRes] = await Promise.allSettled([
          Api.getAgentDashboard(),
          Api.getMyListings(),
        ]);

        if (dashboardRes.status === 'rejected') {
          throw rejectedReason(dashboardRes);
        }

        setStats(dashboardRes.value.data || {});

        if (listingsRes.status === 'fulfilled') {
          setListings(Array.isArray(listingsRes.value.data) ? listingsRes.value.data.slice(0, 5) : []);
        }
      });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, t('agent.dashboard.loadError')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useAuthenticatedEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <div
      style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: agentWorkspace.pageBg,
        color: agentWorkspace.text,
        minHeight: '100vh',
        padding: 0,
      }}
    >
      <style>{`
        .agent-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .agent-pad { padding-left: 40px; padding-right: 40px; }
        @media (max-width: 900px) {
          .agent-pad { padding-left: 20px; padding-right: 20px; }
        }
        @media (max-width: 640px) {
          .agent-stat-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .agent-pad { padding-left: 14px; padding-right: 14px; }
          .agent-header-inner { padding: 28px 14px 24px !important; }
        }
      `}</style>

      <div style={{ background: agentWorkspace.headerBg, borderBottom: `1px solid ${agentWorkspace.border}` }}>
        <div className="agent-header-inner agent-pad" style={agentHeaderInnerStyle}>
          <div>
            <div style={agentEyebrowStyle}>{t('agent.workspace')}</div>
            <h1 style={agentTitleStyle}>{t('agent.dashboard.title')}</h1>
            <p style={agentSubtitleStyle}>{t('agent.dashboard.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="agent-pad" style={{ maxWidth: agentWorkspace.maxContent, margin: '0 auto', paddingTop: 24 }}>
        <div className="agent-stat-grid">
          {[
            { label: t('agent.dashboard.listings'), value: loading ? '—' : stats?.total_listings || 0, accent: '#2563eb' },
            { label: t('agent.dashboard.activeListings'), value: loading ? '—' : stats?.active_listings || 0, accent: '#16a34a' },
            { label: t('agent.dashboard.leads'), value: loading ? '—' : stats?.total_leads || 0, accent: '#d97706' },
            {
              label: t('agent.dashboard.commissions'),
              value: loading ? '—' : formatCurrency(stats?.total_commissions),
              accent: agentWorkspace.gold,
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: agentWorkspace.cardBg,
                border: `1px solid ${agentWorkspace.border}`,
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: card.accent }} />
              <div
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                  color: agentWorkspace.textMuted,
                  marginBottom: '8px',
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontSize: card.label === t('agent.dashboard.commissions') ? 'clamp(16px,3vw,28px)' : '28px',
                  fontWeight: 800,
                  color: agentWorkspace.text,
                  letterSpacing: '-0.02em',
                }}
              >
                {card.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ maxWidth: agentWorkspace.maxContent, margin: '24px auto 0' }} className="agent-pad">
          <DashboardLoadError message={error} onRetry={() => void loadDashboard()} />
        </div>
      )}

      <div
        className="agent-pad"
        style={{ maxWidth: agentWorkspace.maxContent, margin: '24px auto 0', paddingBottom: 24 }}
      >
        <div
          style={{
            background: agentWorkspace.cardBg,
            border: `1px solid ${agentWorkspace.border}`,
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <h2
            style={{
              margin: '0 0 16px',
              fontSize: '18px',
              fontWeight: 700,
              color: agentWorkspace.text,
              letterSpacing: '-0.01em',
            }}
          >
            {t('agent.dashboard.recentListings')}
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={lightThStyle}>{t('agent.dashboard.property')}</th>
                  <th style={lightThStyle}>{t('agent.dashboard.owner')}</th>
                  <th style={lightThStyle}>{t('agent.dashboard.price')}</th>
                </tr>
              </thead>
              <tbody>
                {listings.length === 0 ? (
                  <tr>
                    <td style={{ ...lightTdStyle, color: agentWorkspace.textMuted, fontStyle: 'italic' }} colSpan={3}>
                      {t('agent.dashboard.noListings')}
                    </td>
                  </tr>
                ) : (
                  listings.map((item) => (
                    <tr
                      key={item.id}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={lightTdStyle}>
                        <div style={{ fontWeight: 500 }}>{item.title}</div>
                        <div style={{ color: agentWorkspace.textMuted, fontSize: '12px', marginTop: '3px' }}>{item.location}</div>
                      </td>
                      <td style={lightTdStyle}>
                        <div style={{ color: agentWorkspace.textSub }}>
                          {item.owner?.first_name} {item.owner?.last_name}
                        </div>
                      </td>
                      <td style={{ ...lightTdStyle, fontWeight: 600, color: agentWorkspace.link }}>
                        {formatCurrency(item.price)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <Link
              to="/dashboard/agent/my-listings"
              style={{
                color: agentWorkspace.link,
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {t('agent.dashboard.viewAllListings')}
            </Link>
          </div>
        </div>
      </div>

      <div
        className="agent-pad"
        style={{ maxWidth: agentWorkspace.maxContent, margin: '0 auto', paddingBottom: 40 }}
      >
        <LeadsAndVisitorsSection showStats embedded maxRows={8} />
      </div>
    </div>
  );
};

export default AgentDashboard;
