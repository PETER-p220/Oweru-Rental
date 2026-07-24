import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getBnbPaymentReturnPath,
  getBnbPropertyPath,
  getBnbPropertyPathForLogin,
} from '../../utils/bnbNav';

/** Legacy public /bnb/:id — send guests to login, signed-in users to dashboard property page */
export const BnbPropertyPublicRedirect = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();

  if (!id) return <Navigate to="/login" replace />;

  if (isAuthenticated && user) {
    return <Navigate to={getBnbPropertyPath(user, id)} replace />;
  }

  const loginRedirect = encodeURIComponent(getBnbPropertyPathForLogin(id));
  return <Navigate to={`/login?redirect=${loginRedirect}`} replace />;
};

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
