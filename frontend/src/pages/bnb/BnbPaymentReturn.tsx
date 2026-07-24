import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePaymentPolling } from '../../hooks/usePaymentPolling';
import { getBrowseBnbPath, getMyStaysPath } from '../../utils/bnbNav';
import { DASHBOARD_LISTING_CSS } from '../../styles/dashboardListingStyles';

const BnbPaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const orderId = searchParams.get('order_id') || '';
  const [message, setMessage] = useState('Verifying your bank/card payment…');
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const pollFn = useCallback(async () => {
    const res = await Api.checkBnbBookingPaymentStatus(orderId);
    return { data: res.data || {}, message: res.message };
  }, [orderId]);

  usePaymentPolling(!!orderId && !done && !failed, orderId, pollFn, {
    onPaid: (msg) => {
      setMessage(msg || 'Payment confirmed!');
      setDone(true);
    },
    onFailed: (msg) => {
      setMessage(msg || 'Payment was not completed.');
      setFailed(true);
    },
    onTimeout: (msg) => setMessage(msg),
  });

  return (
    <div className="dlp-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{DASHBOARD_LISTING_CSS}</style>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {!orderId ? (
        <div style={{ background: 'var(--white)', border: '1px solid var(--slate-200)', borderRadius: 12, padding: 32, textAlign: 'center', maxWidth: 420 }}>
          <p style={{ color: 'var(--slate-600)', marginBottom: 16 }}>Missing payment reference.</p>
          <button type="button" className="dlp-btn" style={{ maxWidth: 220, margin: '0 auto' }} onClick={() => navigate(getBrowseBnbPath(user))}>
            Browse BnB stays
          </button>
        </div>
      ) : (
        <div style={{ background: 'var(--white)', border: '1px solid var(--slate-200)', borderRadius: 12, padding: 32, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          {!done && !failed && (
            <div style={{ width: 36, height: 36, border: '3px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          )}
          <h1 style={{ fontSize: 20, margin: '0 0 10px', color: done ? '#16A34A' : failed ? '#DC2626' : 'var(--slate-900)' }}>
            {done ? 'Payment confirmed' : failed ? 'Payment incomplete' : 'Processing payment'}
          </h1>
          <p style={{ color: 'var(--slate-600)', fontSize: 14, lineHeight: 1.5 }}>{message}</p>
          {(done || failed) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              {done && (
                <button type="button" className="dlp-btn" onClick={() => navigate(getMyStaysPath(user))}>
                  View My Stays
                </button>
              )}
              {failed && (
                <button
                  type="button"
                  className="dlp-btn"
                  style={{ background: 'var(--slate-800)', color: 'var(--white)' }}
                  onClick={() => navigate(getBrowseBnbPath(user))}
                >
                  Browse stays & try again
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate(getBrowseBnbPath(user))}
                style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
              >
                Back to Browse BnB Stays
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BnbPaymentReturn;
