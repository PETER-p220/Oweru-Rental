import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FileCheck, Search, MapPin, AlertCircle, Clock, CheckCircle, Home } from 'lucide-react';
import Api from '../../services/api';
import { formatCurrency, formatDate, getStatusColor } from './tenantPageStyles';

const B = {
  navy900: '#0F172A',
  navy800: '#162035',
  navy700: '#1E2D4A',
  gold: '#C89128',
  goldLt: '#D4A843',
  goldDim: 'rgba(200,145,40,0.12)',
  cream: '#F8F8F9',
  slate: '#94A3B8',
  border: 'rgba(200,145,40,0.18)',
  borderF: 'rgba(200,145,40,0.08)',
};

interface ApplicationItem {
  id: number;
  status?: string;
  message?: string;
  created_at?: string;
  property?: { title?: string; location?: string; price?: number | string };
  landlord?: { first_name?: string; last_name?: string; email?: string; phone?: string };
}

const ApplicationStatus = () => {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('id');
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        const response = await Api.getTenantApplications();
        setApplications(response.data || []);
      } catch (err: any) {
        console.error('Failed to load applications:', err);
        setError('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} style={{ color: B.gold }} />;
      case 'pending':
        return <Clock size={16} style={{ color: '#f59e0b' }} />;
      case 'rejected':
        return <AlertCircle size={16} style={{ color: '#ef4444' }} />;
      default:
        return <FileCheck size={16} style={{ color: B.slate }} />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Congratulations! Your application has been approved.';
      case 'pending':
        return 'Your application is being reviewed.';
      case 'rejected':
        return 'Your application was not approved.';
      default:
        return 'Application status unknown.';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        padding: '40px 20px',
        background: B.navy900,
        color: B.cream
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid ' + B.gold, 
            borderTop: '4px solid ' + B.gold,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '16px'
          }} />
          <div>
            <h3 style={{ marginBottom: '16px', color: B.gold }}>Loading Applications...</h3>
            <p style={{ color: B.slate }}>Please wait while we fetch your applications.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        padding: '40px 20px',
        background: B.navy900,
        color: B.cream
      }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '16px', color: B.gold }}>Error Loading Applications</h3>
          <p style={{ color: B.slate }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              background: B.gold,
              color: B.navy900,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              marginTop: '16px'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  } // ✅ FIX 1: removed the extra stray </div> that was here

  const selectedApplication = applications.find(app => app.id.toString() === applicationId);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: B.navy900, 
      color: B.cream,
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        padding: '0 20px',
        borderBottom: '1px solid ' + B.border
      }}>
        <Link to="/tenant/dashboard" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          color: B.cream,
          textDecoration: 'none'
        }}>
          <Home size={20} />
          <span style={{ fontSize: '18px', fontWeight: '600' }}>Back to Dashboard</span>
        </Link>
        
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: B.cream,
          margin: 0
        }}>
          Application Status
        </h1>
      </div>

      {/* Content */}
      {selectedApplication ? (
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto', 
          padding: '32px',
          background: B.navy800,
          borderRadius: '12px',
          border: '1px solid ' + B.border
        }}>
          {/* Status Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            {getStatusIcon(selectedApplication.status || 'unknown')}
            <div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: B.cream,
                margin: 0
              }}>
                Application {getStatusMessage(selectedApplication.status || 'unknown').split(' ')[0]}
              </h2>
              <div style={{ 
                fontSize: '14px', 
                color: B.slate,
                marginTop: '4px'
              }}>
                {getStatusMessage(selectedApplication.status || 'unknown')}
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Property Details */}
            <div style={{ 
              background: B.navy700, 
              padding: '20px', 
              borderRadius: '8px',
              border: '1px solid ' + B.borderF
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: B.gold, 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <MapPin size={16} style={{ color: B.gold }} />
                Property Details
              </h3>
              <div style={{ color: B.slate, lineHeight: '1.6' }}>
                <p><strong>Title:</strong> {selectedApplication.property?.title || 'N/A'}</p>
                <p><strong>Location:</strong> {selectedApplication.property?.location || 'N/A'}</p>
                <p><strong>Price:</strong> {selectedApplication.property?.price ? formatCurrency(selectedApplication.property.price) : 'N/A'}</p>
              </div>
            </div>

            {/* Landlord Details */}
            <div style={{ 
              background: B.navy700, 
              padding: '20px', 
              borderRadius: '8px',
              border: '1px solid ' + B.borderF
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: B.gold, 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  background: B.gold 
                }} />
                Landlord Details
              </h3>
              <div style={{ color: B.slate, lineHeight: '1.6' }}>
                <p><strong>Name:</strong> {selectedApplication.landlord?.first_name} {selectedApplication.landlord?.last_name || ''}</p>
                <p><strong>Email:</strong> {selectedApplication.landlord?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedApplication.landlord?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div style={{ 
            background: B.navy700, 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid ' + B.borderF
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: B.gold, 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Clock size={16} style={{ color: B.gold }} />
              Application Timeline
            </h3>
            <div style={{ color: B.slate }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '12px',
                marginBottom: '12px',
                padding: '12px',
                background: B.navy900,
                borderRadius: '6px'
              }}>
                <div style={{ 
                  minWidth: '120px', 
                  textAlign: 'right',
                  color: B.slate,
                  fontSize: '12px'
                }}>
                  {formatDate(selectedApplication.created_at)}
                </div>
                <div>
                  <div style={{ 
                    fontWeight: '600', 
                    color: B.cream,
                    marginBottom: '4px'
                  }}>
                    {selectedApplication.status === 'approved' ? 'Application Approved!' : 
                     selectedApplication.status === 'pending' ? 'Application Under Review' :
                     selectedApplication.status === 'rejected' ? 'Application Rejected' :
                     'Application Status Update'}
                  </div>
                  {selectedApplication.message && (
                    <div style={{ 
                      fontSize: '13px', 
                      color: B.slate,
                      marginTop: '4px'
                    }}>
                      {selectedApplication.message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Next Steps */}
            {selectedApplication.status === 'approved' && (
              <div style={{ 
                background: B.goldDim, 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid ' + B.gold,
                marginTop: '16px'
              }}>
                <h4 style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: B.gold, 
                  marginBottom: '8px'
                }}>
                  🎉 Next Steps
                </h4>
                <div style={{ color: B.slate, lineHeight: '1.6' }}>
                  <p><strong>1. Contact Your Landlord:</strong> Reach out to discuss next steps and signing the lease agreement.</p>
                  <p><strong>2. Review Lease Agreement:</strong> Carefully review all terms before signing.</p>
                  <p><strong>3. Schedule Move-in:</strong> Coordinate with your landlord for move-in dates and key collection.</p>
                  <p><strong>4. Complete Tenant Profile:</strong> Update your profile with current contact information.</p>
                </div>
              </div>
            )}

            {selectedApplication.status === 'pending' && (
              <div style={{ 
                background: B.goldDim, 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid ' + B.gold,
                marginTop: '16px'
              }}>
                <h4 style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: B.gold, 
                  marginBottom: '8px'
                }}>
                  ⏳ What's Next?
                </h4>
                <div style={{ color: B.slate, lineHeight: '1.6' }}>
                  <p><strong>Application Under Review:</strong> Your application is currently being reviewed by the landlord.</p>
                  <p><strong>Estimated Response Time:</strong> Usually 2-3 business days.</p>
                  <p><strong>What You Can Do:</strong> Ensure your contact information is up to date and be ready to respond quickly.</p>
                </div>
              </div>
            )}

            {selectedApplication.status === 'rejected' && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid ' + '#ef4444',
                marginTop: '16px'
              }}>
                <h4 style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#ef4444', 
                  marginBottom: '8px'
                }}>
                  ❌ Application Not Approved
                </h4>
                <div style={{ color: B.slate, lineHeight: '1.6' }}>
                  <p><strong>Reason:</strong> {selectedApplication.message || 'No specific reason provided'}</p>
                  <p><strong>What You Can Do:</strong></p>
                  <ul style={{ 
                    marginLeft: '20px', 
                    color: B.slate,
                    lineHeight: '1.6'
                  }}>
                    <li>Review the feedback provided and address any concerns</li>
                    <li>Consider improving your application for future properties</li>
                    <li>Update your profile with accurate information</li>
                    <li>Continue browsing for other available properties</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* ✅ FIX 2: Action Buttons are now correctly inside the main content card */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginTop: '24px'
          }}>
            <Link 
              to="/tenant/dashboard" 
              style={{
                flex: 1,
                padding: '12px 24px',
                background: 'transparent',
                color: B.cream,
                border: '1px solid ' + B.border,
                borderRadius: '8px',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Back to Dashboard
            </Link>
            
            {selectedApplication.status === 'approved' && (
              <button
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: B.gold,
                  color: B.navy900,
                  border: 'none',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Contact Landlord
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto', 
          padding: '32px',
          textAlign: 'center',
          background: B.navy800,
          borderRadius: '12px',
          border: '1px solid ' + B.border
        }}>
          <FileCheck size={48} style={{ color: B.slate, marginBottom: '16px' }} />
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: B.cream,
            marginBottom: '16px'
          }}>
            Application Not Found
          </h2>
          <p style={{ color: B.slate, marginBottom: '24px' }}>
            The application you're looking for could not be found or may have been removed.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link 
              to="/tenant/dashboard" 
              style={{
                padding: '12px 24px',
                background: B.gold,
                color: B.navy900,
                border: 'none',
                borderRadius: '8px',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Back to Dashboard
            </Link>
            <Link 
              to="/properties" 
              style={{
                padding: '12px 24px',
                background: 'transparent',
                color: B.cream,
                border: '1px solid ' + B.border,
                borderRadius: '8px',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Browse Properties
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationStatus;