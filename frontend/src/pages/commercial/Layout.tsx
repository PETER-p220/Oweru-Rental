import React from 'react';
import { Outlet } from 'react-router-dom';
import CommercialNavigation from '../components/Commercial/Navigation';

const CommercialLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-900">
      <style>{`
        :root {
          --navy-900: #0F172A;
          --navy-800: #162035;
          --navy-700: #1E2D4A;
          --gold: #C89128;
          --gold-lt: #D4A843;
          --gold-dim: rgba(200,145,40,0.12);
          --cream: #F8F8F9;
          --slate: #94A3B8;
          --border: rgba(200,145,40,0.18);
        }
      `}</style>

      <CommercialNavigation />

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="lg:pt-0 pt-16">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CommercialLayout;
