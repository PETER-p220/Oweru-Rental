import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type ErrorKey = 'user_not_found' | 'account_inactive' | 'wrong_user_type' | 'auth_failed' | 'unknown';

interface ErrorConfig {
  title: string;
  message: string;
  detail: string;
  primaryLabel: string;
  secondaryLabel: string;
  primaryAction: () => void;
  secondaryAction: () => void;
  icon: React.ReactNode;
}

const AlertTriangleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const WifiOffIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/>
    <path d="M5 12.55a10.94 10.94 0 015.17-2.39"/>
    <path d="M10.71 5.05A16 16 0 0122.56 9"/>
    <path d="M1.42 9a15.91 15.91 0 014.7-2.88"/>
    <path d="M8.53 16.11a6 6 0 016.95 0"/>
    <line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const AuthError = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const [visible, setVisible] = useState(false);

  const error = (searchParams.get('error') || 'unknown') as ErrorKey;
  const registeredType = searchParams.get('registered_type') || '';
  const message = searchParams.get('message') || '';

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const errorConfigs: Record<ErrorKey, Omit<ErrorConfig, 'primaryAction' | 'secondaryAction'>> = {
    user_not_found: {
      title: 'Account not found',
      message: "We couldn't find an account linked to this Google email.",
      detail:
        'Make sure you are using the same Google account you registered with, or sign up for a new account to get started.',
      primaryLabel: 'Create an account',
      secondaryLabel: 'Sign in with email',
      icon: <AlertTriangleIcon />,
    },
    account_inactive: {
      title: 'Account deactivated',
      message: 'Your account has been deactivated and cannot be used to sign in.',
      detail:
        'If you believe this is a mistake, please reach out to our support team and we will work to get your account reinstated.',
      primaryLabel: 'Contact support',
      secondaryLabel: 'Try a different account',
      icon: <LockIcon />,
    },
    wrong_user_type: {
      title: 'Account type mismatch',
      message: registeredType
        ? `This Google account is registered as a ${registeredType}.`
        : 'This Google account is registered under a different account type.',
      detail:
        'Please use the login option that matches the account type you originally registered with.',
      primaryLabel: 'Go to login',
      secondaryLabel: 'Register a new account',
      icon: <UsersIcon />,
    },
    auth_failed: {
      title: 'Authentication failed',
      message: message || 'Something went wrong while connecting with Google.',
      detail:
        'This is usually temporary. Try again in a moment, or sign in with your email and password instead.',
      primaryLabel: 'Try again',
      secondaryLabel: 'Sign in with email',
      icon: <WifiOffIcon />,
    },
    unknown: {
      title: 'Something went wrong',
      message: 'An unexpected error occurred during authentication.',
      detail:
        'Please try again. If the problem persists, contact support and we will help you get access.',
      primaryLabel: 'Try again',
      secondaryLabel: 'Sign in with email',
      icon: <AlertTriangleIcon />,
    },
  };

  const primaryActions: Record<ErrorKey, () => void> = {
    user_not_found: () => navigate('/register'),
    account_inactive: () => navigate('/contact'),
    wrong_user_type: () => navigate('/login'),
    auth_failed: () => navigate(-1),
    unknown: () => navigate(-1),
  };

  const secondaryActions: Record<ErrorKey, () => void> = {
    user_not_found: () => navigate('/login'),
    account_inactive: () => navigate('/login'),
    wrong_user_type: () => navigate('/register'),
    auth_failed: () => navigate('/login'),
    unknown: () => navigate('/login'),
  };

  const config = errorConfigs[error] ?? errorConfigs.unknown;
  const primaryAction = primaryActions[error] ?? primaryActions.unknown;
  const secondaryAction = secondaryActions[error] ?? secondaryActions.unknown;

  const progressPercent = ((10 - countdown) / 10) * 100;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=DM+Serif+Display&display=swap');

        .ae-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background-color: #f5f4f0;
          font-family: 'DM Sans', sans-serif;
        }

        .ae-wrap {
          width: 100%;
          max-width: 420px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }

        .ae-wrap.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .ae-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e8e6e0;
          overflow: hidden;
        }

        .ae-progress-bar {
          height: 3px;
          background: #ece9e2;
          position: relative;
        }

        .ae-progress-fill {
          height: 100%;
          background: #1a1a1a;
          transition: width 1s linear;
          border-radius: 0 2px 2px 0;
        }

        .ae-body {
          padding: 2rem 2rem 1.75rem;
        }

        .ae-icon-ring {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: #f5f4f0;
          border: 1px solid #e8e6e0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          color: #1a1a1a;
        }

        .ae-eyebrow {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #9e9b92;
          margin-bottom: 0.4rem;
        }

        .ae-title {
          font-family: 'DM Serif Display', serif;
          font-size: 22px;
          font-weight: 400;
          color: #1a1a1a;
          line-height: 1.2;
          margin-bottom: 0.6rem;
        }

        .ae-message {
          font-size: 14px;
          color: #6b6860;
          line-height: 1.65;
          margin-bottom: 1.25rem;
        }

        .ae-detail {
          background: #f9f8f5;
          border-left: 2px solid #d4d0c8;
          border-radius: 0 8px 8px 0;
          padding: 0.875rem 1rem;
          margin-bottom: 1.5rem;
        }

        .ae-detail p {
          font-size: 13px;
          color: #7a7770;
          line-height: 1.6;
          margin: 0;
        }

        .ae-divider {
          height: 1px;
          background: #ece9e2;
          margin-bottom: 1.25rem;
        }

        .ae-btn-primary {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0.8125rem 1.25rem;
          background: #1a1a1a;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          margin-bottom: 0.625rem;
          transition: background 0.15s, transform 0.1s;
          letter-spacing: 0.01em;
        }

        .ae-btn-primary:hover {
          background: #2d2d2d;
        }

        .ae-btn-primary:active {
          transform: scale(0.985);
        }

        .ae-btn-secondary {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0.8125rem 1.25rem;
          background: transparent;
          color: #4a4845;
          border: 1px solid #dedad2;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 400;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
          letter-spacing: 0.01em;
        }

        .ae-btn-secondary:hover {
          background: #f5f4f0;
          border-color: #ccc9c0;
        }

        .ae-btn-secondary:active {
          transform: scale(0.985);
        }

        .ae-footer {
          padding: 1rem 2rem;
          border-top: 1px solid #ece9e2;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ae-countdown {
          font-size: 12px;
          color: #9e9b92;
        }

        .ae-countdown strong {
          color: #4a4845;
          font-weight: 500;
        }

        .ae-support-link {
          font-size: 12px;
          color: #9e9b92;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: color 0.15s;
        }

        .ae-support-link:hover {
          color: #4a4845;
        }

        @media (prefers-color-scheme: dark) {
          .ae-root { background-color: #111110; }
          .ae-card { background: #1c1c1b; border-color: #2a2a28; }
          .ae-progress-bar { background: #2a2a28; }
          .ae-progress-fill { background: #e8e6e0; }
          .ae-icon-ring { background: #252523; border-color: #2e2e2c; color: #e8e6e0; }
          .ae-eyebrow { color: #5a5855; }
          .ae-title { color: #f0ede8; }
          .ae-message { color: #8a8780; }
          .ae-detail { background: #222220; border-left-color: #383734; }
          .ae-detail p { color: #6a6760; }
          .ae-divider { background: #2a2a28; }
          .ae-btn-primary { background: #e8e6e0; color: #1a1a1a; }
          .ae-btn-primary:hover { background: #d4d0c8; }
          .ae-btn-secondary { color: #b0ada8; border-color: #2e2e2c; }
          .ae-btn-secondary:hover { background: #222220; border-color: #3a3a38; }
          .ae-footer { border-top-color: #2a2a28; }
          .ae-countdown { color: #5a5855; }
          .ae-countdown strong { color: #a0a09a; }
          .ae-support-link { color: #5a5855; }
          .ae-support-link:hover { color: #a0a09a; }
        }
      `}</style>

      <div className="ae-root">
        <div className={`ae-wrap ${visible ? 'visible' : ''}`}>
          <div className="ae-card">

            <div className="ae-progress-bar">
              <div
                className="ae-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="ae-body">
              <div className="ae-icon-ring" aria-hidden="true">
                {config.icon}
              </div>

              <p className="ae-eyebrow">Authentication error</p>
              <h1 className="ae-title">{config.title}</h1>
              <p className="ae-message">{config.message}</p>

              <div className="ae-detail">
                <p>{config.detail}</p>
              </div>

              <div className="ae-divider" />

              <button
                className="ae-btn-primary"
                onClick={primaryAction}
                type="button"
              >
                {config.primaryLabel}
                <ArrowRightIcon />
              </button>

              <button
                className="ae-btn-secondary"
                onClick={secondaryAction}
                type="button"
              >
                {config.secondaryLabel}
              </button>
            </div>

            <div className="ae-footer">
              <p className="ae-countdown">
                Redirecting in <strong>{countdown}s</strong>
              </p>
              <a href="/contact" className="ae-support-link">
                Contact support
                <ExternalLinkIcon />
              </a>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default AuthError;