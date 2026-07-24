import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePaymentPolling } from '../../hooks/usePaymentPolling';
import { getMyStaysPath } from '../../utils/bnbNav';

const GOLD = '#C89128';

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

  if (!orderId) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p>Missing payment reference.</p>
          <Link to="/" style={{ color: GOLD }}>Go home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9', fontFamily: 'DM Sans, sans-serif', padding: 24 }}>
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 32, maxWidth: 420, width: '100%', textAlign: 'center' }}>
        {!done && !failed && (
          <div style={{ width: 36, height: 36, border: `3px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <h1 style={{ fontSize: 20, margin: '0 0 10px', color: done ? '#16A34A' : failed ? '#DC2626' : '#0F172A' }}>
          {done ? 'Payment confirmed' : failed ? 'Payment incomplete' : 'Processing payment'}
        </h1>
        <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.5 }}>{message}</p>
        {(done || failed) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            {done && (
              <button
                type="button"
                onClick={() => navigate(getMyStaysPath(user))}
                style={{ padding: 12, background: GOLD, border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
              >
                View My Stays
              </button>
            )}
            {failed && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{ padding: 12, background: '#0F172A', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}
              >
                Try again
              </button>
            )}
            <Link to="/" style={{ color: GOLD, fontSize: 13 }}>Back to home</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BnbPaymentReturn;
