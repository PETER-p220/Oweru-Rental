import { useEffect, useState } from 'react';
import Api from '../../services/api';
import { buttonStyle, descriptionStyle, formatCurrency, formatDate, getStatusColor, headingStyle, pageStyle, panelStyle, sectionTitleStyle, statusPillStyle } from './tenantPageStyles';

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
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Tenant Workspace</div>
        <h1 style={headingStyle}>My Contract</h1>
        <p style={descriptionStyle}>Your active tenancy contract from the Laravel tenant API.</p>
      </section>
      <section style={panelStyle}>
        {loading ? <div style={{ color: '#9f9587' }}>Loading contract...</div> : error || !contract ? <div style={{ color: '#9f9587' }}>{error}</div> : (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={statusPillStyle(getStatusColor(contract.status))}>{contract.status || 'unknown'}</span>
              <span style={{ color: '#9f9587' }}>From {formatDate(contract.start_date)} to {formatDate(contract.end_date)}</span>
            </div>
            <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '20px' }}>{contract.property?.title || 'Untitled property'}</div>
              <div style={{ color: '#9f9587', marginTop: '4px' }}>{contract.property?.location || 'No location'}</div>
              <div style={{ color: '#c9a84c', marginTop: '8px', fontSize: '18px' }}>{formatCurrency(contract.rent_amount)}</div>
            </div>
            <div style={{ color: '#9f9587', lineHeight: 1.7 }}>{contract.terms || 'No terms available.'}</div>
            <div><button style={buttonStyle('secondary')} onClick={() => Api.downloadContract(contract.id).catch(() => {})}>Download Contract</button></div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Contract;
