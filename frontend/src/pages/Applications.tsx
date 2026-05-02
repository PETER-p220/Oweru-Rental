import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, Mail, Phone, CheckCircle, X, Search, MapPin, ArrowRight, RotateCcw } from 'lucide-react';
import Api from '../services/api';

type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'viewed';

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: any; // Lucide icon component           
}

const statusConfig: Record<ApplicationStatus, StatusConfig> = {
  pending:  { label: 'Pending',  color: '#c9a84c', bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.25)',  icon: Calendar },
  approved: { label: 'Approved', color: '#70c490', bg: 'rgba(112,196,144,0.08)', border: 'rgba(112,196,144,0.25)', icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#e07070', bg: 'rgba(224,112,112,0.08)', border: 'rgba(224,112,112,0.25)', icon: X },
  viewed:   { label: 'Viewed',   color: '#8a8070', bg: 'rgba(138,128,112,0.06)', border: 'rgba(138,128,112,0.2)',  icon: FileText },
};

interface Application {
  id: number;
  property: {
    id: number;
    title: string;
    images?: string[];
    location: string;
    price: number;
    type: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    image?: string | null;
  };
  applicant: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    occupation: string;
    income: number;
    references: string[];
    idNumber: string;
  };
  status: ApplicationStatus;
  appliedDate: string;
  message: string;
  documents: string[];
}

const filters = ['all', 'pending', 'approved', 'rejected'] as const;

const Applications = () => {
  console.log('Applications rendered - this should appear in console when clicking Applications link');
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [filter,       setFilter]       = useState('all');
  const [searchTerm,   setSearchTerm]   = useState('');

  useEffect(() => { loadApplications(); }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      
      // Mock data for now since API doesn't exist yet
      const mockApplications: Application[] = [
        {
          id: 1,
          property: {
            id: 1,
            title: 'Modern 2-Bedroom Apartment',
            location: 'Masaki, Dar es Salaam',
            price: 800000,
            type: 'apartment',
            bedrooms: 2,
            bathrooms: 2,
            area: 120,
            image: null
          },
          applicant: {
            id: 1,
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'alice@example.com',
            phone: '+255123456789',
            occupation: 'Software Engineer',
            income: 1500000,
            references: ['John Doe - +255987654321'],
            idNumber: '1234567890123'
          },
          status: 'pending',
          appliedDate: '2024-03-15',
          message: 'I am looking for a comfortable apartment for me and my partner. We both work in the tech industry and have stable income.',
          documents: ['id-proof.pdf', 'income-proof.pdf', 'reference-letter.pdf']
        },
        {
          id: 2,
          property: {
            id: 2,
            title: 'Cozy Studio in Mikocheni',
            location: 'Mikocheni, Dar es Salaam',
            price: 350000,
            type: 'studio',
            bedrooms: 1,
            bathrooms: 1,
            area: 45,
            image: null
          },
          applicant: {
            id: 2,
            firstName: 'Bob',
            lastName: 'Smith',
            email: 'bob@example.com',
            phone: '+255987654321',
            occupation: 'Marketing Manager',
            income: 800000,
            references: ['Jane Williams - +255555666777'],
            idNumber: '9876543210987'
          },
          status: 'approved',
          appliedDate: '2024-03-10',
          message: 'I am a young professional looking for an affordable studio close to my workplace.',
          documents: ['id-proof.pdf', 'income-proof.pdf']
        },
        {
          id: 3,
          property: {
            id: 3,
            title: 'Spacious House with Garden',
            location: 'Upanga, Dar es Salaam',
            price: 1500000,
            type: 'house',
            bedrooms: 3,
            bathrooms: 2,
            area: 200,
            image: null
          },
          applicant: {
            id: 3,
            firstName: 'Carol',
            lastName: 'Davis',
            email: 'carol@example.com',
            phone: '+255555444333',
            occupation: 'Teacher',
            income: 600000,
            references: ['Michael Brown - +255777888999'],
            idNumber: '4567890123456'
          },
          status: 'rejected',
          appliedDate: '2024-03-05',
          message: 'Looking for a family home with garden for my children.',
          documents: ['id-proof.pdf', 'income-proof.pdf', 'reference-letter.pdf']
        }
      ];
      
      setApplications(mockApplications);
      
      // Uncomment when API is ready:
      // const response = await Api.getApplications();
      // if (response.data) setApplications(response.data);
    } catch (e) {
      console.error('Failed to load applications:', e);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await Api.approveApplication(id);
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a));
    } catch (e) { console.error(e); }
  };

  const handleReject = async (id: number) => {
    try {
      await Api.rejectApplication(id, 'Application rejected');
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a));
    } catch (e) { console.error(e); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(n);

  const formatDate = (d: string | Date) => new Date(d).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' });

  const counts = {
    all: applications.length,
    pending:  applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const visible = applications
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a =>
      a.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.applicant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.applicant.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '1px solid rgba(37,99,235,0.3)', borderTop: '1px solid #c9a84c', borderRadius: '50%', animation: 'ap-spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#8a8070', fontWeight: 300 }}>Loading applications…</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div style={{ textAlign: 'center', padding: 64 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#e07070', marginBottom: 20 }}>{error}</p>
          <button onClick={loadApplications} style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', color: '#c9a84c', padding: '10px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Retry
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes ap-spin { to { transform: rotate(360deg); } }

        .ap-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #c9a84c; margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }
        .ap-eyebrow::after { content: ''; flex: 1; height: 1px; background: rgba(37,99,235,0.15); }

        /* Toolbar */
        .ap-toolbar {
          display: flex; align-items: center; gap: 10px;
          flex-wrap: wrap; margin-bottom: 32px;
        }

        .ap-search {
          display: flex; align-items: center; gap: 0;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(37,99,235,0.12);
          flex: 1; min-width: 200px;
          transition: border-color 0.2s;
        }
        .ap-search:focus-within { border-color: rgba(37,99,235,0.35); }

        .ap-search-icon {
          padding: 0 12px; color: #8a8070;
          display: flex; align-items: center; flex-shrink: 0;
        }

        .ap-search-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: #f5f0e8; font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 300;
          padding: 10px 12px 10px 0;
        }
        .ap-search-input::placeholder { color: rgba(138,128,112,0.4); }

        /* Filter tabs */
        .ap-filters {
          display: flex; gap: 0;
          border: 1px solid rgba(37,99,235,0.12);
          overflow: hidden;
        }

        .ap-filter-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 14px;
          background: transparent; border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 400;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #8a8070; cursor: pointer;
          border-right: 1px solid rgba(37,99,235,0.12);
          transition: all 0.2s; white-space: nowrap;
        }

        .ap-filter-btn:last-child { border-right: none; }
        .ap-filter-btn:hover:not(.active) { color: #f5f0e8; background: rgba(37,99,235,0.04); }
        .ap-filter-btn.active { background: rgba(37,99,235,0.1); color: #c9a84c; }

        .ap-filter-count {
          background: rgba(37,99,235,0.15); color: #c9a84c;
          font-size: 9px; font-weight: 500;
          padding: 2px 5px; min-width: 16px; text-align: center;
        }

        .ap-filter-btn.active .ap-filter-count {
          background: rgba(37,99,235,0.25);
        }

        /* Cards */
        .ap-list { display: flex; flex-direction: column; gap: 1px; background: rgba(37,99,235,0.12); border: 1px solid rgba(37,99,235,0.12); }

        .ap-card {
          background: #111;
          padding: 22px 24px;
          transition: background 0.2s;
          position: relative;
          overflow: hidden;
        }

        .ap-card::before {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 2px; background: transparent;
          transition: background 0.3s;
        }

        .ap-card:hover { background: rgba(18,18,14,0.98); }
        .ap-card:hover::before { background: var(--ap-status-color, #c9a84c); }

        .ap-card-top {
          display: grid;
          grid-template-columns: auto 1fr auto 1fr;
          gap: 20px;
          align-items: start;
          margin-bottom: 14px;
        }

        /* property thumbnail */
        .ap-prop-thumb {
          width: 72px; height: 52px;
          background: rgba(37,99,235,0.05);
          border: 1px solid rgba(37,99,235,0.1);
          object-fit: cover;
          filter: brightness(0.8) saturate(0.7);
          flex-shrink: 0;
        }

        .ap-prop-info {}

        .ap-prop-title {
          font-size: 15px; font-weight: 400; color: #f5f0e8;
          letter-spacing: -0.01em; margin-bottom: 5px;
        }

        .ap-prop-meta {
          display: flex; align-items: center; gap: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 300; color: #8a8070;
          margin-bottom: 5px;
        }

        .ap-prop-price {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px; font-weight: 300; color: #c9a84c;
        }

        /* divider */
        .ap-col-div {
          width: 1px; background: rgba(37,99,235,0.08);
          align-self: stretch;
        }

        /* applicant */
        .ap-applicant-info {}

        .ap-avatar {
          width: 32px; height: 32px;
          background: rgba(37,99,235,0.08);
          border: 1px solid rgba(37,99,235,0.2);
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500;
          color: #c9a84c; margin-bottom: 8px;
          float: left; margin-right: 10px;
        }

        .ap-applicant-name {
          font-size: 15px; font-weight: 400; color: #f5f0e8;
          letter-spacing: -0.01em; margin-bottom: 4px;
        }

        .ap-contact-row {
          display: flex; align-items: center; gap: 5px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 300; color: rgba(138,128,112,0.7);
          margin-bottom: 3px;
        }

        /* card footer */
        .ap-card-footer {
          display: flex; align-items: center;
          justify-content: space-between; gap: 12px;
          padding-top: 14px;
          border-top: 1px solid rgba(37,99,235,0.06);
          flex-wrap: wrap;
        }

        .ap-status-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.15em; text-transform: uppercase;
          padding: 4px 10px; border: 1px solid;
          flex-shrink: 0;
        }

        .ap-date {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 300;
          color: rgba(138,128,112,0.5);
          letter-spacing: 0.04em;
        }

        .ap-actions { display: flex; align-items: center; gap: 6px; margin-left: auto; }

        .ap-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s;
          text-decoration: none;
        }

        .ap-btn.ghost {
          background: transparent;
          border: 1px solid rgba(37,99,235,0.15);
          color: #8a8070;
        }
        .ap-btn.ghost:hover { border-color: rgba(37,99,235,0.4); color: #f5f0e8; }

        .ap-btn.approve {
          background: rgba(112,196,144,0.1);
          border: 1px solid rgba(112,196,144,0.25);
          color: #70c490;
        }
        .ap-btn.approve:hover { background: rgba(112,196,144,0.18); }

        .ap-btn.reject {
          background: rgba(224,112,112,0.1);
          border: 1px solid rgba(224,112,112,0.25);
          color: #e07070;
        }
        .ap-btn.reject:hover { background: rgba(224,112,112,0.18); }

        /* message */
        .ap-message {
          margin-top: 14px;
          padding: 12px 14px;
          background: rgba(37,99,235,0.03);
          border-left: 2px solid rgba(37,99,235,0.2);
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 300;
          color: rgba(138,128,112,0.8);
          line-height: 1.6;
        }

        .ap-message-label {
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: #c9a84c; margin-bottom: 5px;
        }

        /* Empty */
        .ap-empty {
          background: #111; border: 1px solid rgba(37,99,235,0.1);
          padding: 72px 24px; text-align: center;
        }

        .ap-empty-icon {
          width: 52px; height: 52px;
          background: rgba(37,99,235,0.06);
          border: 1px solid rgba(37,99,235,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #c9a84c; margin: 0 auto 20px;
        }

        .ap-empty-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px; font-weight: 300;
          color: #f5f0e8; margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .ap-empty-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 300; color: #8a8070;
        }

        @media (max-width: 900px) {
          .ap-card-top { grid-template-columns: auto 1fr; }
          .ap-col-div { display: none; }
        }

        @media (max-width: 600px) {
          .ap-toolbar { flex-direction: column; align-items: stretch; }
          .ap-filters { overflow-x: auto; }
          .ap-card { padding: 16px; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div className="ap-eyebrow">Rental Applications</div>

        {/* Toolbar */}
        <div className="ap-toolbar">
          <div className="ap-search">
            <span className="ap-search-icon"><Search size={14} /></span>
            <input
              className="ap-search-input"
              type="text"
              placeholder="Search by property or applicant…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="ap-filters">
            {filters.map(f => (
              <button
                key={f}
                className={`ap-filter-btn${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                <span className="ap-filter-count">{counts[f]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {visible.length > 0 ? (
          <div className="ap-list">
            {visible.map((app) => {
              const sc = statusConfig[app.status] || statusConfig.viewed;
              const StatusIcon = sc.icon;
              const initials = `${app.applicant.firstName.charAt(0)}${app.applicant.lastName.charAt(0)}`;

              return (
                <div
                  key={app.id}
                  className="ap-card"
                  style={{ '--ap-status-color': sc.color } as React.CSSProperties}
                >
                  <div className="ap-card-top">
                    {/* Property thumb */}
                    {app.property.images?.[0]
                      ? <img 
                          src={app.property.images[0]} 
                          alt={app.property.title} 
                          className="ap-prop-thumb" 
                          loading="lazy" 
                          decoding="async"
                          width="120"
                          height="90"
                          style={{ backgroundColor: '#0e0e0e' }}
                        />
                      : <div className="ap-prop-thumb" />
                    }

                    {/* Property info */}
                    <div className="ap-prop-info">
                      <div className="ap-prop-title">{app.property.title}</div>
                      <div className="ap-prop-meta">
                        <MapPin size={10} style={{ color: '#c9a84c' }} />
                        {app.property.location}
                      </div>
                      <div className="ap-prop-price">
                        {fmt(app.property.price)}
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 300, color: 'rgba(138,128,112,0.55)' }}>/mo</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="ap-col-div" />

                    {/* Applicant */}
                    <div className="ap-applicant-info">
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div className="ap-avatar">{initials}</div>
                        <div>
                          <div className="ap-applicant-name">
                            {app.applicant.firstName} {app.applicant.lastName}
                          </div>
                          <div className="ap-contact-row">
                            <Mail size={10} style={{ color: '#c9a84c', flexShrink: 0 }} />
                            {app.applicant.email}
                          </div>
                          <div className="ap-contact-row">
                            <Phone size={10} style={{ color: '#c9a84c', flexShrink: 0 }} />
                            {app.applicant.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {app.message && (
                    <div className="ap-message">
                      <div className="ap-message-label">Message</div>
                      {app.message}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="ap-card-footer">
                    <div
                      className="ap-status-badge"
                      style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
                    >
                      <StatusIcon size={10} />
                      {sc.label}
                    </div>

                    <div className="ap-date">{formatDate((app as any).submittedAt || (app as any).created_at || new Date())}</div>

                    <div className="ap-actions">
                      <Link to={`/properties/${app.property.id}`} className="ap-btn ghost">
                        View Property
                      </Link>
                      {app.status === 'pending' && (
                        <>
                          <button className="ap-btn approve" onClick={() => handleApprove(app.id)}>
                            <CheckCircle size={11} /> Approve
                          </button>
                          <button className="ap-btn reject" onClick={() => handleReject(app.id)}>
                            <X size={11} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="ap-empty">
            <div className="ap-empty-icon"><FileText size={20} /></div>
            <div className="ap-empty-title">No applications found</div>
            <p className="ap-empty-desc">
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Applications will appear here once tenants apply.'}
            </p>
          </div>
        )}

      </div>
    </>
  );
};

export default Applications;