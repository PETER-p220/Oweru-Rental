import { useEffect, useState } from 'react';
import { FileText, MapPin, Calendar, DollarSign, Download, AlertCircle, CheckCircle } from 'lucide-react';
import Api from '../../services/api';
import {
  buttonStyle, descriptionStyle, formatCurrency, formatDate, getStatusColor,
  headingStyle, pageStyle, palette, panelStyle, sectionTitleStyle, statusPillStyle,
} from './tenantPageStyles';

const Contract = () => {
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await Api.getMyContract();
        setContract(res.data || null);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'No active contract found.');
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div style={{ ...pageStyle, padding: '0' }}>
      {/* Header */}
      <section style={{ ...panelStyle }}>
        <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: '2px', background: `linear-gradient(90deg, transparent, ${palette.amber}, transparent)` }} />
        <div style={sectionTitleStyle}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.amber, display: 'inline-block' }} />
          Tenant Workspace
        </div>
        <h1 style={headingStyle}>My Contract</h1>
        <p style={descriptionStyle}>Your active tenancy contract from the tenant API.</p>
      </section>

      {/* Content */}
      <section style={{ ...panelStyle }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: palette.muted, padding: '40px 0' }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${palette.amber}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading contract...
          </div>
        ) : error || !contract ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '16px', color: palette.muted }}>
            <AlertCircle size={48} style={{ opacity: 0.3 }} />
            <div style={{ fontSize: '16px' }}>{error || 'No active contract found'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '24px' }}>

            {/* Status + dates row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={statusPillStyle(getStatusColor(contract.status))}>
                <CheckCircle size={10} />
                {contract.status || 'unknown'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: palette.muted, fontSize: '13px' }}>
                <Calendar size={13} />
                {formatDate(contract.start_date)} — {formatDate(contract.end_date)}
              </div>
            </div>

            {/* Property card */}
            <div style={{
              borderRadius: '16px',
              background: 'rgba(15,23,42,0.5)',
              border: '1px solid rgba(148,163,184,0.08)',
              overflow: 'hidden',
            }}>
              {/* Amber accent top */}
              <div style={{ height: '3px', background: `linear-gradient(90deg, ${palette.amber}, transparent)` }} />
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.amber }}>
                      <FileText size={15} />
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: palette.cream }}>{contract.property?.title || 'Untitled property'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: palette.muted, fontSize: '13px' }}>
                    <MapPin size={12} />
                    {contract.property?.location || 'No location'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: palette.muted, marginBottom: '6px' }}>Monthly Rent</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: palette.amber, letterSpacing: '-0.5px' }}>{formatCurrency(contract.rent_amount)}</div>
                </div>
              </div>
            </div>

            {/* Terms */}
            {contract.terms && (
              <div style={{
                borderRadius: '14px',
                background: 'rgba(15,23,42,0.4)',
                border: '1px solid rgba(148,163,184,0.06)',
                padding: '20px 24px',
              }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: palette.muted, marginBottom: '12px', fontWeight: 600 }}>Contract Terms</div>
                <p style={{ color: palette.muted, lineHeight: 1.8, fontSize: '14px', margin: 0 }}>{contract.terms}</p>
              </div>
            )}

            {/* Action */}
            <div>
              <button
                style={{ ...buttonStyle('primary'), padding: '12px 24px', fontSize: '14px', borderRadius: '12px' }}
                onClick={() => Api.downloadContract(contract.id).catch(() => {})}
              >
                <Download size={15} />
                Download Contract PDF
              </button>
            </div>
          </div>
        )}
      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Contract;