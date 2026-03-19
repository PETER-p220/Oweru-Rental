import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const EditPropertySimple = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  
  console.log('EditPropertySimple - Auth check:', { user, isAuthenticated, id });
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0e0e0e',
      color: '#e8e4dc',
      fontFamily: 'DM Sans, sans-serif',
      padding: '20px'
    }}>
      <h1>Edit Property</h1>
      <p>Property ID: {id}</p>
      <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      <p>User: {user ? JSON.stringify(user) : 'Not logged in'}</p>
      <p>User Type: {user?.userType || user?.user_type || user?.role || 'Unknown'}</p>
      
      <div style={{ marginTop: '20px' }}>
        <a 
          href="/dashboard/landlord/my-properties"
          style={{
            color: '#c9a84c',
            textDecoration: 'none',
            padding: '10px 20px',
            border: '1px solid #c9a84c',
            borderRadius: '4px',
            display: 'inline-block'
          }}
        >
          Back to Properties
        </a>
      </div>
    </div>
  );
};

export default EditPropertySimple;
