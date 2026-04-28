import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';

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
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="settings-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        .settings-container {
          padding: 24px 32px;
        }

        .settings-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 32px;
          color: var(--text-primary, #fff);
        }

        .settings-description {
          font-size: 16px;
          color: var(--text-secondary, #9ca3af);
          margin-bottom: 24px;
        }

        .settings-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .settings-back-btn {
          padding: 12px 20px;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 768px) {
          .settings-container {
            padding: 16px;
          }

          .settings-title {
            font-size: 20px;
            margin-bottom: 20px;
          }

          .settings-description {
            font-size: 14px;
            margin-bottom: 18px;
          }

          .settings-actions {
            flex-direction: column;
            gap: 12px;
          }

          .settings-back-btn {
            width: 100%;
            justify-content: center;
            padding: 12px 16px;
            font-size: 14px;
            box-sizing: border-box;
          }
        }

        @media (max-width: 480px) {
          .settings-title {
            font-size: 18px;
          }

          .settings-description {
            font-size: 13px;
          }

          .settings-back-btn {
            font-size: 13px;
          }
        }
      `}</style>

      <h2 className="settings-title">Settings</h2>

      <p className="settings-description">
        Manage your account settings and preferences.
      </p>

      <div className="settings-actions">
        <Link to="/dashboard" className="settings-back-btn">
          <Settings size={16} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default SettingsPage;