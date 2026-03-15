import React from 'react';
import { Phone, Mail } from 'lucide-react';

const AgentLeadsPage: React.FC = () => {
  console.log('AgentLeadsPage rendered - this should appear in console when clicking Leads link');
  
  const leads = [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+255123456789', property: 'Modern Apartment', status: 'new', created: '2024-03-14' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+255987654321', property: 'Beach House', status: 'contacted', created: '2024-03-13' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '+255456789123', property: 'City Villa', status: 'interested', created: '2024-03-12' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', phone: '+255789123456', property: 'Modern Apartment', status: 'new', created: '2024-03-14' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', phone: '+255321654987', property: 'Beach House', status: 'contacted', created: '2024-03-11' },
  ];

  const statusConfig = {
    new: { label: 'New', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
    contacted: { label: 'Contacted', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
    interested: { label: 'Interested', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
  };

  return (
    <div style={{
      padding: '24px',
      fontFamily: "'DM Sans', sans-serif",
      background: '#111',
      color: '#f5f0e8',
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#c9a84c' }}>
          Leads Management
        </h2>
        <p style={{ color: '#8a8070', marginBottom: '24px' }}>
          Manage and track all your property leads and client inquiries.
        </p>
      </div>

      <div style={{
        background: 'rgba(201,168,76,0.05)',
        border: '1px solid rgba(201,168,76,0.1)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#8a8070', fontWeight: '500' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#8a8070', fontWeight: '500' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#8a8070', fontWeight: '500' }}>Phone</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#8a8070', fontWeight: '500' }}>Property</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#8a8070', fontWeight: '500' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#8a8070', fontWeight: '500' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#8a8070', fontWeight: '500' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: '1px solid rgba(201,168,76,0.05)' }}>
                  <td style={{ padding: '12px', color: '#f5f0e8' }}>{lead.name}</td>
                  <td style={{ padding: '12px', color: '#f5f0e8' }}>{lead.email}</td>
                  <td style={{ padding: '12px', color: '#f5f0e8' }}>{lead.phone}</td>
                  <td style={{ padding: '12px', color: '#f5f0e8' }}>{lead.property}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      ...(statusConfig[lead.status as keyof typeof statusConfig] || statusConfig.new)
                    }}>
                      {lead.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#8a8070' }}>{lead.created}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{
                        padding: '6px 12px',
                        background: 'rgba(201,168,76,0.1)',
                        border: '1px solid rgba(201,168,76,0.2)',
                        borderRadius: '6px',
                        color: '#f5f0e8',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}>
                        <Mail size={14} />
                      </button>
                      <button style={{
                        padding: '6px 12px',
                        background: 'rgba(201,168,76,0.1)',
                        border: '1px solid rgba(201,168,76,0.2)',
                        borderRadius: '6px',
                        color: '#f5f0e8',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}>
                        <Phone size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgentLeadsPage;
