import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, AlertCircle, CheckCircle, Clock, Calendar, DollarSign, Home, User, Shield, Mail, Phone } from 'lucide-react';
import Api from '../../services/api';

interface Contract {
  id: number;
  propertyId: number;
  property: {
    title: string;
    location: string;
    address: string;
    type: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
  };
  landlord: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName?: string;
  };
  tenant: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    idNumber: string;
  };
  terms: {
    startDate: string;
    endDate: string;
    monthlyRent: number;
    securityDeposit: number;
    paymentDueDay: number;
    noticePeriod: number;
    lateFee: number;
    maintenanceResponsibility: 'landlord' | 'tenant' | 'shared';
    utilitiesIncluded: string[];
    restrictions: string[];
  };
  status: 'draft' | 'pending' | 'active' | 'expired' | 'terminated';
  createdAt: string;
  signedAt?: string;
  documents: {
    contract: string;
    idProof: string;
    references?: string[];
  };
}

const Contract = () => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContract();
  }, []);

  const loadContract = async () => {
    try {
      setLoading(true);
      // Mock data for now since API doesn't exist yet
      const mockContract: Contract = {
        id: 1,
        propertyId: 1,
        property: {
          title: 'Modern 2-Bedroom Apartment',
          location: 'Masaki, Dar es Salaam',
          address: '123 Kimweri Avenue, Masaki, Dar es Salaam',
          type: 'apartment',
          bedrooms: 2,
          bathrooms: 2,
          area: 120
        },
        landlord: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'landlord@example.com',
          phone: '+255123456789',
          companyName: 'Doe Properties Ltd'
        },
        tenant: {
          id: 1,
          firstName: 'Peter',
          lastName: 'Mushy',
          email: 'mushyp420@gmail.com',
          phone: '0753511713',
          idNumber: '1234567890123'
        },
        terms: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          monthlyRent: 800000,
          securityDeposit: 1600000,
          paymentDueDay: 1,
          noticePeriod: 30,
          lateFee: 50000,
          maintenanceResponsibility: 'landlord',
          utilitiesIncluded: ['Water', 'Garbage Collection'],
          restrictions: ['No pets allowed', 'No smoking indoors', 'Quiet hours after 10 PM']
        },
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        signedAt: '2024-01-01T10:00:00Z',
        documents: {
          contract: '/contracts/contract-1.pdf',
          idProof: '/documents/id-proof-1.pdf',
          references: ['/documents/reference-1.pdf', '/documents/reference-2.pdf']
        }
      };
      
      setContract(mockContract);
      
      // Uncomment when API is ready:
      // const response = await Api.getMyContract();
      // if (response.data) {
      //   setContract(response.data);
      // }
    } catch (e) {
      console.error('Failed to load contract:', e);
      setError('Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const downloadContract = async () => {
    if (!contract) return;
    
    try {
      const response = await Api.downloadContract(contract.id);
      // Create download link
      const blob = new Blob([response.data as any], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contract.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      setError('Failed to download contract');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'draft': return '#6b7280';
      case 'expired': return '#ef4444';
      case 'terminated': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'pending': return Clock;
      case 'draft': return FileText;
      case 'expired': return AlertCircle;
      case 'terminated': return AlertCircle;
      default: return FileText;
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { 
    style: 'currency', 
    currency: 'TZS', 
    minimumFractionDigits: 0 
  }).format(n);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-TZ', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #e8e4dc', 
            borderTop: '3px solid #c9a84c', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#7a7060', fontFamily: 'DM Sans, sans-serif' }}>Loading contract...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
        <h2 style={{ color: '#e8e4dc', marginBottom: '8px' }}>Contract Not Found</h2>
        <p style={{ color: '#7a7060', marginBottom: '24px' }}>
          {error || 'No active contract found. Contact your landlord or browse available properties.'}
        </p>
        <Link 
          to="/properties" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: '#c9a84c',
            color: '#080808',
            textDecoration: 'none',
            borderRadius: '4px',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: '500'
          }}
        >
          <Home size={16} />
          Browse Properties
        </Link>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(contract.status);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={28} style={{ color: '#c9a84c' }} />
            <h1 style={{ color: '#e8e4dc', fontSize: '28px', fontWeight: '500', margin: 0 }}>
              My Rental Contract
            </h1>
          </div>
          <button
            onClick={downloadContract}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: 'rgba(201, 168, 76, 0.1)',
              border: '1px solid rgba(201, 168, 76, 0.3)',
              color: '#c9a84c',
              borderRadius: '6px',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(201, 168, 76, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(201, 168, 76, 0.1)';
            }}
          >
            <Download size={16} />
            Download PDF
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusIcon size={16} style={{ color: getStatusColor(contract.status) }} />
          <span style={{ 
            color: getStatusColor(contract.status), 
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {contract.status}
          </span>
          {contract.signedAt && (
            <span style={{ 
              color: '#7a7060', 
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px'
            }}>
              • Signed on {formatDate(contract.signedAt)}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Property Details */}
        <div style={{
          backgroundColor: '#0e0e0e',
          border: '1px solid rgba(201, 168, 76, 0.12)',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Home size={18} style={{ color: '#c9a84c' }} />
            Property Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                Property Title
              </p>
              <p style={{ color: '#e8e4dc', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                {contract.property.title}
              </p>
            </div>
            <div>
              <p style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                Address
              </p>
              <p style={{ color: '#e8e4dc', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                {contract.property.address}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                  Type
                </p>
                <p style={{ color: '#e8e4dc', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                  {contract.property.type}
                </p>
              </div>
              <div>
                <p style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                  Area
                </p>
                <p style={{ color: '#e8e4dc', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                  {contract.property.area} m²
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                  Bedrooms
                </p>
                <p style={{ color: '#e8e4dc', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                  {contract.property.bedrooms}
                </p>
              </div>
              <div>
                <p style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                  Bathrooms
                </p>
                <p style={{ color: '#e8e4dc', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                  {contract.property.bathrooms}
                </p>
              </div>
              <div>
                <p style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                  Monthly Rent
                </p>
                <p style={{ color: '#c9a84c', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', margin: 0 }}>
                  {fmt(contract.terms.monthlyRent)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div style={{
          backgroundColor: '#0e0e0e',
          border: '1px solid rgba(201, 168, 76, 0.12)',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} style={{ color: '#c9a84c' }} />
            Contract Parties
          </h3>
          
          {/* Landlord */}
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(201, 168, 76, 0.12)' }}>
            <p style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
              Landlord / Property Owner
            </p>
            <p style={{ color: '#e8e4dc', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', margin: '0 0 4px' }}>
              {contract.landlord.firstName} {contract.landlord.lastName}
              {contract.landlord.companyName && (
                <span style={{ color: '#7a7060', fontSize: '14px', fontWeight: '400', marginLeft: '8px' }}>
                  ({contract.landlord.companyName})
                </span>
              )}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} style={{ color: '#7a7060' }} />
                <span style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                  {contract.landlord.email}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} style={{ color: '#7a7060' }} />
                <span style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                  {contract.landlord.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Tenant */}
          <div>
            <p style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
              Tenant
            </p>
            <p style={{ color: '#e8e4dc', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', margin: '0 0 4px' }}>
              {contract.tenant.firstName} {contract.tenant.lastName}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} style={{ color: '#7a7060' }} />
                <span style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                  {contract.tenant.email}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} style={{ color: '#7a7060' }} />
                <span style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                  {contract.tenant.phone}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={14} style={{ color: '#7a7060' }} />
                <span style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                  ID: {contract.tenant.idNumber}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Terms */}
      <div style={{
        backgroundColor: '#0e0e0e',
        border: '1px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <h3 style={{ color: '#e8e4dc', fontSize: '18px', fontWeight: '500', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} style={{ color: '#c9a84c' }} />
          Contract Terms & Conditions
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div>
            <h4 style={{ color: '#c9a84c', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Rental Period
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} style={{ color: '#7a7060' }} />
                <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>Start Date:</span>
                <span style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                  {formatDate(contract.terms.startDate)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} style={{ color: '#7a7060' }} />
                <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>End Date:</span>
                <span style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                  {formatDate(contract.terms.endDate)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={14} style={{ color: '#7a7060' }} />
                <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>Payment Due:</span>
                <span style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                  Day {contract.terms.paymentDueDay} of each month
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#c9a84c', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Financial Terms
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={14} style={{ color: '#7a7060' }} />
                <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>Monthly Rent:</span>
                <span style={{ color: '#c9a84c', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500' }}>
                  {fmt(contract.terms.monthlyRent)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={14} style={{ color: '#7a7060' }} />
                <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>Security Deposit:</span>
                <span style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                  {fmt(contract.terms.securityDeposit)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={14} style={{ color: '#7a7060' }} />
                <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>Late Fee:</span>
                <span style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
                  {fmt(contract.terms.lateFee)} per day
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#c9a84c', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Responsibilities
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>Maintenance:</span>
                <span style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginLeft: '8px', textTransform: 'capitalize' }}>
                  {contract.terms.maintenanceResponsibility}
                </span>
              </div>
              <div>
                <span style={{ color: '#7a7060', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>Notice Period:</span>
                <span style={{ color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginLeft: '8px' }}>
                  {contract.terms.noticePeriod} days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Utilities Included */}
        {contract.terms.utilitiesIncluded.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ color: '#c9a84c', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Utilities Included
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {contract.terms.utilitiesIncluded.map((utility, index) => (
                <span
                  key={index}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: 'rgba(201, 168, 76, 0.1)',
                    border: '1px solid rgba(201, 168, 76, 0.2)',
                    color: '#c9a84c',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontFamily: 'DM Sans, sans-serif'
                  }}
                >
                  {utility}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Restrictions */}
        {contract.terms.restrictions.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ color: '#c9a84c', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: '500', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Property Restrictions
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#e8e4dc', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
              {contract.terms.restrictions.map((restriction, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>
                  {restriction}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link
          to="/dashboard/payments"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: 'rgba(201, 168, 76, 0.1)',
            border: '1px solid rgba(201, 168, 76, 0.3)',
            color: '#c9a84c',
            textDecoration: 'none',
            borderRadius: '6px',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          <DollarSign size={16} />
          Make Payment
        </Link>
        
        <Link
          to="/dashboard/payment-history"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            textDecoration: 'none',
            borderRadius: '6px',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          <Clock size={16} />
          Payment History
        </Link>

        <Link
          to="/dashboard/messages"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            color: '#f87171',
            textDecoration: 'none',
            borderRadius: '6px',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          <Mail size={16} />
          Contact Landlord
        </Link>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Contract;
