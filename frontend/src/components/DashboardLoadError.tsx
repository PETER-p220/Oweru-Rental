import React from 'react';

type Props = {
  message: string;
  onRetry?: () => void;
};

const DashboardLoadError: React.FC<Props> = ({ message, onRetry }) => (
  <div
    style={{
      minHeight: '50vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}
  >
    <div style={{ textAlign: 'center', maxWidth: 420 }}>
      <p style={{ color: '#DC2626', fontSize: 14, marginBottom: onRetry ? 12 : 0 }}>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: '8px 18px',
            background: '#0F172A',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Try again
        </button>
      )}
    </div>
  </div>
);

export default DashboardLoadError;
