import { useEffect, useState } from 'react';
import Api from '../../services/api';
import {
  buttonStyle,
  descriptionStyle,
  formatCurrency,
  formatDate,
  getStatusColor,
  headingStyle,
  pageStyle,
  panelStyle,
  sectionTitleStyle,
  statusPillStyle,
  tableStyle,
  tableWrapStyle,
  tdStyle,
  thStyle,
} from './landlordPageStyles';

interface ReceiptItem {
  id: number;
  amount?: number | string;
  status?: string;
  type?: string;
  created_at?: string;
  property?: { title?: string };
  tenant?: { user?: { first_name?: string; last_name?: string; email?: string } };
}

const ReceiptsPage = () => {
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await Api.getReceipts();
        setReceipts(Array.isArray(response.data) ? response.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load receipts.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleDownload = async (id: number) => {
    try {
      setInfo('');
      await Api.downloadOwnerReceipt(id);
      setInfo('Receipt request sent.');
    } catch (err: any) {
      setInfo(err?.response?.data?.message || 'Receipt download is not available yet.');
    }
  };

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Landlord Workspace</div>
        <h1 style={headingStyle}>Payment Receipts</h1>
        <p style={descriptionStyle}>
          Browse completed payment records from the owner receipts endpoint and trigger receipt downloads when the system supports them.
        </p>
      </section>

      <section style={panelStyle}>
        {error && <div style={{ marginBottom: '16px', color: '#e07070' }}>{error}</div>}
        {info && <div style={{ marginBottom: '16px', color: '#c9a84c' }}>{info}</div>}
        {loading ? (
          <div style={{ color: '#9f9587' }}>Loading receipts...</div>
        ) : receipts.length === 0 ? (
          <div style={{ color: '#9f9587' }}>No completed receipts found.</div>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Tenant</th>
                  <th style={thStyle}>Property</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td style={tdStyle}>
                      <div>{receipt.tenant?.user?.first_name} {receipt.tenant?.user?.last_name}</div>
                      <div style={{ color: 'var(--secondary-text-color)', marginTop: '4px' }}>{receipt.tenant?.user?.email || 'No email'}</div>
                    </td>
                    <td style={tdStyle}>{receipt.property?.title || 'Untitled property'}</td>
                    <td style={tdStyle}>{receipt.type || 'payment'}</td>
                    <td style={tdStyle}>{formatCurrency(receipt.amount)}</td>
                    <td style={tdStyle}>{formatDate(receipt.created_at)}</td>
                    <td style={tdStyle}>
                      <span style={statusPillStyle(getStatusColor(receipt.status))}>{receipt.status || 'unknown'}</span>
                    </td>
                    <td style={tdStyle}>
                      <button style={buttonStyle('secondary')} onClick={() => handleDownload(receipt.id)}>
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ReceiptsPage;
