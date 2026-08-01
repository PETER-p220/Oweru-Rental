import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Api, { TOKEN_KEY } from '../services/api';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userType = searchParams.get('user_type');

    if (!token || !userType) {
      navigate('/login', { replace: true });
      return;
    }

    const decodedToken = decodeURIComponent(token);

    let cancelled = false;

    (async () => {
      try {
        localStorage.setItem(TOKEN_KEY, decodedToken);
        const response = await Api.getUser();
        if (cancelled) return;
        const user = response.data;
        login(user, decodedToken);
        navigate(`/dashboard/${userType}`, { replace: true });
      } catch (err) {
        console.error('Failed to complete Google sign-in:', err);
        localStorage.removeItem(TOKEN_KEY);
        if (!cancelled) navigate('/login', { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
        <p className="text-white">Completing authentication...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
