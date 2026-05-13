import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Save, User, Mail } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // In a real app, this would be an API call to /api/user
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setFormData({
          name: parsedUser.name || '',
          email: parsedUser.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    
    try {
      // In a real app, this would be an API call to /api/settings/profile
      // and /api/settings/password depending on which fields are modified
      // Also need to handle email verification request if email is changed
      
      setStatusMessage({
        type: 'success',
        message: 'Profile updated successfully. In a real app, this would be an API call to your backend.'
      });
      
      // Update user data in local storage
      const updatedUser = {
        ...user,
        name: formData.name,
        email: formData.email
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error saving changes:', error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to save changes. Please try again.'
      });
    } finally {
      setIsSaving(false);
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

      <h2 className="settings-title">Account Settings</h2>

      <p className="settings-description">
        Manage your account settings and preferences. Update your profile information below.
      </p>

      {statusMessage && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '24px',
          borderRadius: '8px',
          backgroundColor: statusMessage.type === 'success' ? '#d1fae5' : '#fee2e2',
          border: '1px solid',
          borderColor: statusMessage.type === 'success' ? '#a7f3d0' : '#fecdd3',
          color: statusMessage.type === 'success' ? '#065f46' : '#9f1a1c',
        }}>
          {statusMessage.message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Name
          </label>
          <div style={{ position: 'relative' }}>
            <User 
              size={18} 
              style={{ position: 'absolute', left: '12px', top: '12px', color: '#6b7280' }} 
            />
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px 40px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Email
          </label>
          <div style={{ position: 'relative' }}>
            <Mail 
              size={18} 
              style={{ position: 'absolute', left: '12px', top: '12px', color: '#6b7280' }} 
            />
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px 40px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="currentPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Current Password (required to save changes)
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            value={formData.currentPassword}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '10px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            New Password (optional)
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '10px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '10px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              padding: '12px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>

          <Link 
            to="/dashboard" 
            style={{
              padding: '12px 20px',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#3b82f6',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Settings size={16} />
            Cancel
          </Link>
        </div>
      </form>

      <div className="settings-actions">
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
              // In a real app, this would be an API call to /api/settings/profile with DELETE method
              alert('Account deleted successfully. In a real app, this would delete your account.');
            }
          }}
          style={{
            padding: '12px 20px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;