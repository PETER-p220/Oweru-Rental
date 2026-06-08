import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Api from '../../services/api';

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const LeadsAndVisitors = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        console.log('🔍 Loading leads data...');
        
        const [leadsRes, statsRes] = await Promise.all([Api.getLeads(), Api.getLeadStats()]);
        
        console.log('📊 Leads API Response:', leadsRes);
        console.log('📈 Stats API Response:', statsRes);
        
        const leadsData = leadsRes.data || leadsRes || [];
        const statsData = statsRes.data || statsRes || {};
        
        console.log('📋 Processed leads:', leadsData);
        console.log('📊 Processed stats:', statsData);
        
        // Use real data if available, otherwise show sample leads
        const finalLeads = Array.isArray(leadsData) && leadsData.length > 0 
          ? leadsData 
          : [
              {
                id: 'sample-1',
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+255 712 345 678',
                status: 'new',
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                property: {
                  id: 1,
                  title: 'Modern Apartment in Dar es Salaam',
                  location: 'Dar es Salaam'
                }
              },
              {
                id: 'sample-2',
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                phone: '+255 765 432 109',
                status: 'contacted',
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                property: {
                  id: 2,
                  title: 'Cozy House in Arusha',
                  location: 'Arusha'
                }
              }
            ];
        
        setLeads(finalLeads);
        setStats(statsData);
      } catch (err: any) {
        console.error('❌ Error loading leads:', err);
        setError(err?.response?.data?.message || err?.message || 'Unable to load leads.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => 
    leads.filter((item) => 
      `${item.name || ''} ${item.email || ''} ${item.property?.title || ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
    ), 
    [leads, search]
  );

  return (
    <div style={{ 
      fontFamily: "'DM Sans', system-ui, sans-serif", 
      background: '#F1F5F9', 
      color: '#0F172A', 
      minHeight: '100vh', 
      padding: '0' 
    }}>
      {/* Header */}
      <div style={{ background: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          padding: '52px 40px 44px', 
          display: 'flex', 
          alignItems: 'flex-end', 
          justifyContent: 'space-between', 
          gap: '20px', 
          flexWrap: 'wrap' 
        }}>
          <div>
            <div style={{ 
              fontSize: '10px', 
              fontWeight: 600, 
              letterSpacing: '0.22em', 
              textTransform: 'uppercase', 
              color: '#C89128', 
              marginBottom: '10px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '10px', 
              background: 'rgba(200,145,40,0.10)', 
              border: '1px solid rgba(200,145,40,0.28)', 
              padding: '4px 12px' 
            }}>
              Agent Workspace
            </div>
            <h1 style={{ 
              fontSize: 'clamp(20px,3.5vw,28px)', 
              fontWeight: 800, 
              lineHeight: 1.15, 
              letterSpacing: '-0.02em', 
              color: '#FFFFFF', 
              margin: 0 
            }}>
              Leads & Visitors
            </h1>
            <p style={{ 
              fontSize: '13px', 
              fontWeight: 400, 
              color: '#94A3B8', 
              margin: '8px 0 0' 
            }}>
              Track your latest lead conversions here. Expanded visitor summaries are currently in development.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        maxWidth: '1280px', 
        margin: '24px auto 0', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: 16 
      }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#38bdf8' }} />
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>Total Leads</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            {stats?.total_leads || 0}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#22c55e' }} />
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>New Today</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            {stats?.new_leads || 0}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#f59e0b' }} />
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>Converted</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            {stats?.converted_leads || 0}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#fb7185' }} />
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>Conversion Rate</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            {Number(stats?.conversion_rate || 0).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        maxWidth: '1280px', 
        margin: '24px auto 0', 
        background: '#FFFFFF', 
        border: '1px solid #E2E8F0', 
        borderRadius: '12px', 
        overflow: 'hidden' 
      }}>
        <div style={{ padding: '20px' }}>
          <input 
            style={{ 
              width: '100%', 
              maxWidth: '340px', 
              padding: '10px 14px', 
              border: '1px solid #E2E8F0', 
              borderRadius: '8px', 
              fontSize: '14px', 
              fontFamily: "'DM Sans', system-ui, sans-serif", 
              marginBottom: '16px', 
              outline: 'none' 
            }} 
            placeholder="Search leads" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />

          {error && (
            <div style={{ 
              color: '#dc2626', 
              marginBottom: '16px', 
              padding: '12px 16px', 
              background: 'rgba(220,38,38,0.08)', 
              border: '1px solid rgba(220,38,38,0.25)', 
              borderRadius: '8px', 
              fontSize: '14px' 
            }}>
              {error}
            </div>
          )}

          {/* Desktop Table */}
          <div style={{ overflowX: 'auto' }} className="desktop-table">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lead</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Property</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading leads...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No leads found.</td></tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600 }}>{item.name || item.user?.first_name || 'Lead'}</div>
                        <div style={{ color: '#94A3B8', marginTop: '4px', fontSize: '13px' }}>{item.email}</div>
                        {item.phone && <div style={{ color: '#94A3B8', marginTop: '4px', fontSize: '13px' }}>{item.phone}</div>}
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        <div>{item.property?.title || 'General interest'}</div>
                        {item.property?.id && (
                          <div style={{ marginTop: '8px' }}>
                            <Link to={`/property/${item.property.id}`} style={{ color: '#2563eb', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                              Open property
                            </Link>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>{item.status || 'new'}</td>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        <div>{formatDate(item.created_at)}</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                          {item.email && (
                            <a href={`mailto:${item.email}`} style={{ padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', textDecoration: 'none', color: '#64748B', fontSize: '13px', fontWeight: 500 }}>
                              Email
                            </a>
                          )}
                          {item.phone && (
                            <a href={`tel:${item.phone}`} style={{ padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', textDecoration: 'none', color: '#64748B', fontSize: '13px', fontWeight: 500 }}>
                              Call
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div style={{ display: 'none' }} className="mobile-cards">
            {loading ? (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading leads...</div>
            ) : filtered.length === 0 ? (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#64748B' }}>No leads found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filtered.map((item) => (
                  <div key={item.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px' }}>
                    {/* Mobile card content remains the same as your original */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: '0 0 4px' }}>
                          {item.name || item.user?.first_name || 'Lead'}
                        </h3>
                        <div style={{ color: '#94A3B8', fontSize: '13px' }}>{item.email}</div>
                        {item.phone && <div style={{ color: '#94A3B8', fontSize: '13px', marginTop: '2px' }}>{item.phone}</div>}
                      </div>
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: '100px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: item.status === 'new' ? '#f0fdf4' : 
                                    item.status === 'contacted' ? '#eff6ff' : 
                                    item.status === 'interested' ? '#fffbeb' : 
                                    item.status === 'converted' ? '#f0fdf4' : '#fef2f2',
                        color: item.status === 'new' ? '#16a34a' : 
                               item.status === 'contacted' ? '#2563eb' : 
                               item.status === 'interested' ? '#d97706' : 
                               item.status === 'converted' ? '#16a34a' : '#dc2626'
                      }}>
                        {item.status || 'new'}
                      </div>
                    </div>

                    {item.property && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>Property</div>
                        <div style={{ color: '#0F172A', fontSize: '14px' }}>{item.property.title}</div>
                        {item.property.id && (
                          <Link to={`/property/${item.property.id}`} style={{ color: '#2563eb', textDecoration: 'none', fontSize: '13px', fontWeight: 600, marginTop: '6px', display: 'inline-block' }}>
                            View Property
                          </Link>
                        )}
                      </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>Created</div>
                      <div style={{ color: '#0F172A', fontSize: '14px' }}>{formatDate(item.created_at)}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {item.email && (
                        <a href={`mailto:${item.email}`} style={{ flex: 1, padding: '10px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', textDecoration: 'none', color: '#64748B', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                          Email
                        </a>
                      )}
                      {item.phone && (
                        <a href={`tel:${item.phone}`} style={{ flex: 1, padding: '10px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', textDecoration: 'none', color: '#64748B', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-table {
            display: none !important;
          }
          .mobile-cards {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LeadsAndVisitors;