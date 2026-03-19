import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import React from 'react';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requireAuth?: boolean;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  requiredRole, 
  requireAuth = true 
}) => {
  const { user, isAuthenticated } = useAuth();

  // Check if authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if specific role is required
  if (requiredRole && user) {
    const userRole = user.userType || user.user_type || user.role || 'tenant';
    
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(userRole)) {
        // Redirect to appropriate dashboard based on user's actual role
        return <Navigate to={`/dashboard`} replace />;
      }
    } else {
      if (userRole !== requiredRole) {
        // Redirect to appropriate dashboard based on user's actual role
        return <Navigate to={`/dashboard`} replace />;
      }
    }
  }

  return <>{children}</>;
};

export default RouteGuard;
