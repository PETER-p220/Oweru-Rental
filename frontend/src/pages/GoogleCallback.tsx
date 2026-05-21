import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userType = searchParams.get('user_type');

    if (token && userType) {
      // Store the token
      localStorage.setItem('TOKEN_KEY', token);
      
      // Get user data from backend
      fetch('https://rental.oweru.com/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })
        .then(res => res.json())
        .then(data => {
          const user = data.data;
          login(user, token);
          navigate(`/dashboard/${userType}`);
        })
        .catch(err => {
          console.error('Failed to fetch user data:', err);
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
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
