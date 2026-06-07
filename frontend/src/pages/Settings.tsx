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
    <div className="settings-container" style={{ maxWidth: '1200px', margin: '0 auto', background: '#F1F5F9', minHeight: '100vh' }}>
      <style>{`
        .settings-container {
          padding: 24px 32px;
        }

        .settings-title {
          font-size: clamp(24px, 4vw, 28px);
          font-weight: 800;
          margin-bottom: 8px;
          color: #0F172A;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: -0.02em;
        }

        .settings-description {
          font-size: 16px;
          color: #475569;
          margin-bottom: 32px;
          font-family: 'DM Sans', sans-serif;
        }

        .settings-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .settings-back-btn {
          padding: 12px 20px;
          background: #C89128;
          color: white;
          text-decoration: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(200,145,40,0.28);
          font-family: 'DM Sans', sans-serif;
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
          borderRadius: '10px',
          backgroundColor: statusMessage.type === 'success' ? '#DCFCE7' : '#FFE4E6',
          border: '1px solid',
          borderColor: statusMessage.type === 'success' ? 'rgba(22,163,74,0.28)' : 'rgba(220,38,38,0.28)',
          color: statusMessage.type === 'success' ? '#16A34A' : '#DC2626',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
        }}>
          {statusMessage.message}
        </div>
      )}

      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#0F172A', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
              Name
            </label>
            <div style={{ position: 'relative' }}>
              <User 
                size={18} 
                style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} 
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
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'DM Sans, sans-serif',
                  backgroundColor: '#F1F5F9',
                  color: '#0F172A',
                  outline: 'none',
                  transition: 'border-color 0.18s',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#0F172A', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail 
                size={18} 
                style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} 
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
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'DM Sans, sans-serif',
                  backgroundColor: '#F1F5F9',
                  color: '#0F172A',
                  outline: 'none',
                  transition: 'border-color 0.18s',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="currentPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#0F172A', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
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
                border: '1.5px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'DM Sans, sans-serif',
                backgroundColor: '#F1F5F9',
                color: '#0F172A',
                outline: 'none',
                transition: 'border-color 0.18s',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#0F172A', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
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
                border: '1.5px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'DM Sans, sans-serif',
                backgroundColor: '#F1F5F9',
                color: '#0F172A',
                outline: 'none',
                transition: 'border-color 0.18s',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#0F172A', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
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
                border: '1.5px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'DM Sans, sans-serif',
                backgroundColor: '#F1F5F9',
                color: '#0F172A',
                outline: 'none',
                transition: 'border-color 0.18s',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '12px 20px',
                background: '#C89128',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
                fontFamily: 'DM Sans, sans-serif',
                boxShadow: '0 4px 14px rgba(200,145,40,0.28)',
              }}
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>

            <Link 
              to="/dashboard" 
              style={{
                padding: '12px 20px',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#475569',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'DM Sans, sans-serif',
                backgroundColor: '#FFFFFF',
              }}
            >
              <Settings size={16} />
              Cancel
            </Link>
          </div>
        </form>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '12px', fontFamily: 'DM Sans, sans-serif' }}>Danger Zone</h3>
        <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px', fontFamily: 'DM Sans, sans-serif' }}>
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
              alert('Account deleted successfully. In a real app, this would delete your account.');
            }
          }}
          style={{
            padding: '12px 20px',
            background: '#DC2626',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;