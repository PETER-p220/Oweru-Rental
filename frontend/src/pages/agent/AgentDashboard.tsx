import React, { useEffect, useState } from 'react';
import { Building, Users, TrendingUp, DollarSign, Eye, Link2 } from 'lucide-react';
import Api from '../../services/api';

interface AgentStats {
  total_listings?: number;
  active_leads?: number;
  monthly_commission?: number;
  property_views?: number;
  total_applications?: number;
}

interface ActivityItem {
  id: number;
  type: string;
  property?: string;
  property_title?: string;
  time?: string;
  created_at?: string;
  message?: string;
}

const AgentDashboard = () => {
  const [stats, setStats] = useState<AgentStats>({});
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAgentData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch agent dashboard data
        const [statsResponse, activityResponse] = await Promise.all([
          Api.getAgentDashboard().catch(() => ({ data: {} })), // Handle if endpoint doesn't exist yet
          Api.getAgentNotifications().catch(() => ({ data: [] })), // Use notifications as activity
        ]);

        const agentStats = statsResponse.data || {};
        const activities = Array.isArray(activityResponse.data) ? activityResponse.data : [];

        setStats(agentStats);
        setRecentActivity(activities.slice(0, 5)); // Show recent 5 activities
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load agent dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadAgentData();
  }, []);

  // Format stats for display
  const statsCards = [
    { 
      label: 'Total Listings', 
      value: stats.total_listings?.toString() || '0', 
      icon: Building, 
      color: '#f59e0b' 
    },
    { 
      label: 'Active Leads', 
      value: stats.active_leads?.toString() || '0', 
      icon: Users, 
      color: '#60a5fa' 
    },
    { 
      label: 'This Month Commission', 
      value: stats.monthly_commission ? `${stats.monthly_commission.toLocaleString()} TZS` : '0 TZS', 
      icon: DollarSign, 
      color: '#10b981' 
    },
    { 
      label: 'Property Views', 
      value: stats.property_views?.toString() || '0', 
      icon: Eye, 
      color: '#f472b6' 
    },
  ];

  // Format activity time
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Format activity display
  const formatActivity = (activity: ActivityItem) => {
    const property = activity.property_title || activity.property || 'Unknown Property';
    const time = formatTime(activity.created_at || activity.time);
    
    return {
      ...activity,
      property,
      time
    };
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', color: '#9ca3af' }}>
        Loading agent dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#ef4444' }}>
        {error}
      </div>
    );
  }

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
          {statsCards.map((stat, index) => (
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
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => {
              const formattedActivity = formatActivity(activity);
              return (
                <div key={activity.id} className="activity-item">
                  <div className="activity-left">
                    <div className="activity-type">
                      {activity.type || activity.message || 'Activity'}
                    </div>
                    <div className="activity-property">{formattedActivity.property}</div>
                  </div>
                  <div className="activity-time">{formattedActivity.time}</div>
                </div>
              );
            })
          ) : (
            <div style={{ 
              padding: '40px 20px', 
              textAlign: 'center', 
              color: '#9ca3af',
              fontSize: '14px'
            }}>
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
