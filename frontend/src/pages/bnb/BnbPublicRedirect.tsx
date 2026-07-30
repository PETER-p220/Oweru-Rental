import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getBnbPaymentReturnPath } from '../../utils/bnbNav';

/** Legacy public /bnb/payment/return — keep bank checkout return working */
export const BnbPaymentReturnPublicRedirect = () => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const qs = searchParams.toString();
  const suffix = qs ? `?${qs}` : '';

  if (isAuthenticated && user) {
    return <Navigate to={`${getBnbPaymentReturnPath(user)}${suffix}`} replace />;
  }

  const loginRedirect = encodeURIComponent(`/dashboard/tenant/bnb-payment-return${suffix}`);
  return <Navigate to={`/login?redirect=${loginRedirect}`} replace />;
};
