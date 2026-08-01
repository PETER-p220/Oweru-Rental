import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  agentWorkspace,
  lightTdStyle,
  lightThStyle,
} from './agentWorkspaceTheme';

const formatDate = (dateString: string, locale: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(locale === 'sw' ? 'sw-TZ' : 'en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

type LeadsAndVisitorsSectionProps = {
  showStats?: boolean;
  maxRows?: number;
  embedded?: boolean;
};

const LeadsAndVisitorsSection = ({
  showStats = true,
  maxRows,
  embedded = false,
}: LeadsAndVisitorsSectionProps) => {
  const { t, locale } = useLanguage();
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [leadsRes, statsRes] = await Promise.all([Api.getLeads(), Api.getLeadStats()]);
        const leadsData = leadsRes.data || leadsRes || [];
        setLeads(Array.isArray(leadsData) ? leadsData : []);
        setStats(statsRes.data || statsRes || {});
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || t('agent.leads.loadError'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const list = leads.filter((item) =>
      `${item.name || ''} ${item.user?.first_name || ''} ${item.user?.last_name || ''} ${item.property?.title || ''} ${item.status || ''}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
    return maxRows != null ? list.slice(0, maxRows) : list;
  }, [leads, search, maxRows]);

  const statCards = [
    { label: t('agent.leads.totalLeads'), value: stats?.total_leads || 0, accent: '#38bdf8' },
    { label: t('agent.leads.newToday'), value: stats?.new_leads || 0, accent: '#22c55e' },
    { label: t('agent.leads.converted'), value: stats?.converted_leads || 0, accent: '#f59e0b' },
    {
      label: t('agent.leads.conversionRate'),
      value: `${Number(stats?.conversion_rate || 0).toFixed(1)}%`,
      accent: '#fb7185',
    },
  ];

  return (
    <div style={embedded ? undefined : { marginTop: embedded ? 0 : 24 }}>
      {showStats && (
        <div className="lv-stat-grid" style={{ marginBottom: 20 }}>
          {statCards.map((card) => (
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
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: card.accent,
                }}
              />
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
                  fontSize: '28px',
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
      )}

      <div
        style={{
          background: agentWorkspace.cardBg,
          border: `1px solid ${agentWorkspace.border}`,
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px' }}>
          {!embedded && (
            <input
              style={{
                width: '100%',
                maxWidth: '340px',
                padding: '10px 14px',
                border: `1px solid ${agentWorkspace.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                marginBottom: '16px',
                outline: 'none',
              }}
              placeholder={t('agent.leads.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}

          {embedded && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: agentWorkspace.text,
                  letterSpacing: '-0.01em',
                }}
              >
                {t('agent.leads.title')}
              </h2>
              <input
                style={{
                  width: '100%',
                  maxWidth: '280px',
                  padding: '10px 14px',
                  border: `1px solid ${agentWorkspace.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  outline: 'none',
                }}
                placeholder={t('agent.leads.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {error && (
            <div
              style={{
                color: '#dc2626',
                marginBottom: '16px',
                padding: '12px 16px',
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.25)',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ overflowX: 'auto' }} className="desktop-table">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={lightThStyle}>{t('agent.dashboard.lead')}</th>
                  <th style={lightThStyle}>{t('agent.leads.propertyCol')}</th>
                  <th style={lightThStyle}>{t('agent.dashboard.status')}</th>
                  <th style={lightThStyle}>{t('agent.leads.created')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: agentWorkspace.textSub }}>
                      {t('agent.leads.loading')}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: agentWorkspace.textSub }}>
                      {t('agent.leads.empty')}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${agentWorkspace.border}` }}>
                      <td style={lightTdStyle}>
                        <div style={{ fontWeight: 600 }}>{item.name || item.user?.first_name || t('agent.dashboard.lead')}</div>
                        <div style={{ color: agentWorkspace.textMuted, marginTop: '4px', fontSize: '12px', fontStyle: 'italic' }}>
                          {t('agent.leads.contactProtected')}
                        </div>
                      </td>
                      <td style={lightTdStyle}>
                        <div>{item.property?.title || t('agent.leads.generalInterest')}</div>
                        {item.property?.id && (
                          <div style={{ marginTop: '8px' }}>
                            <Link
                              to={`/property/${item.property.id}`}
                              style={{ color: agentWorkspace.link, textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}
                            >
                              {t('agent.leads.openProperty')}
                            </Link>
                          </div>
                        )}
                      </td>
                      <td style={lightTdStyle}>{item.status || 'new'}</td>
                      <td style={lightTdStyle}>{formatDate(item.created_at, locale)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {embedded && (
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
              <Link
                to="/dashboard/agent/leads"
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
                {t('agent.dashboard.viewAllLeads')}
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .lv-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 900px) {
          .lv-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
      `}</style>
    </div>
  );
};

export default LeadsAndVisitorsSection;
