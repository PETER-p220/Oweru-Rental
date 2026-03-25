import React from 'react';
import { Building, Users, TrendingUp, DollarSign, Eye, Link2 } from 'lucide-react';

const AgentDashboard = () => {
  const stats = [
    { label: 'Total Listings', value: '12', icon: Building, color: '#f59e0b' },
    { label: 'Active Leads', value: '48', icon: Users, color: '#60a5fa' },
    { label: 'This Month Commission', value: '2.4M TZS', icon: DollarSign, color: '#10b981' },
    { label: 'Property Views', value: '1,234', icon: Eye, color: '#f472b6' },
  ];

  const recentActivity = [
    { id: 1, type: 'New Lead', property: 'Modern Apartment - Masaki', time: '2 hours ago' },
    { id: 2, type: 'Viewing Request', property: 'Villa in Mikocheni', time: '5 hours ago' },
    { id: 3, type: 'Application', property: 'Studio House - Kinondoni', time: '1 day ago' },
    { id: 4, type: 'Commission Earned', property: '3BR House - Mbezi', time: '2 days ago' },
  ];

  return (
    <div style={{ padding: '20px', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .agent-dashboard {
          display: grid;
          gap: 24px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .stat-card {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-content h3 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 4px;
          color: #fff;
        }
        .stat-content p {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }
        .activity-section {
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 20px;
        }
        .activity-header {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #fff;
        }
        .activity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .activity-item:last-child {
          border-bottom: none;
        }
        .activity-left {
          flex: 1;
        }
        .activity-type {
          font-size: 14px;
          font-weight: 500;
          color: #fff;
          margin-bottom: 4px;
        }
        .activity-property {
          font-size: 12px;
          color: #9ca3af;
        }
        .activity-time {
          font-size: 11px;
          color: #6b7280;
        }
      `}</style>

      <div className="agent-dashboard">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '8px', color: '#fff' }}>
            Agent Dashboard
          </h1>
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
            Welcome back! Here's your business overview.
          </p>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div 
                className="stat-icon" 
                style={{ background: `${stat.color}20` }}
              >
                <stat.icon size={24} style={{ color: stat.color }} />
              </div>
              <div className="stat-content">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="activity-section">
          <h2 className="activity-header">Recent Activity</h2>
          {recentActivity.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-left">
                <div className="activity-type">{activity.type}</div>
                <div className="activity-property">{activity.property}</div>
              </div>
              <div className="activity-time">{activity.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
