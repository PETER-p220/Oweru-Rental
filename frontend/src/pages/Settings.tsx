import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, Bell, Shield, Moon, Sun } from 'lucide-react';
import Api from '../services/api';

const SettingsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div>Loading settings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</div>
        <button 
          onClick={loadUserData}
          style={{ 
            padding: '8px 16px', 
            background: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: 'var(--text-primary)' }}>
        Settings
      </h2>
      
      <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Manage your account settings and preferences.
      </p>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Link 
          to="/dashboard"
          style={{ 
            padding: '12px 20px', 
            background: '#3b82f6', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <Settings size={16} style={{ marginRight: '8px' }} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default SettingsPage;
