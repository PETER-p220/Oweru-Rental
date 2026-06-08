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
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: '#F1F5F9',
      color: '#0F172A',
      minHeight: '100vh',
      padding: '0'
    }}>
      {/* Header */}
      <div style={{ background: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '52px 40px 44px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C89128', marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(200,145,40,0.10)', border: '1px solid rgba(200,145,40,0.28)', padding: '4px 12px' }}>
              Agent Workspace
            </div>
            <h1 style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#FFFFFF', margin: 0 }}>Leads</h1>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px', fontWeight: 400, color: '#94A3B8', margin: '8px 0 0' }}>
              Manage and track all your property leads and client inquiries.
            </p>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div style={{ maxWidth: '1280px', margin: '24px auto 0', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Phone</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Property</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '12px', color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif" }}>{lead.name}</td>
                  <td style={{ padding: '12px', color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif" }}>{lead.email}</td>
                  <td style={{ padding: '12px', color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif" }}>{lead.phone}</td>
                  <td style={{ padding: '12px', color: '#0F172A', fontFamily: "'DM Sans', system-ui, sans-serif" }}>{lead.property}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      ...(statusConfig[lead.status as keyof typeof statusConfig] || statusConfig.new)
                    }}>
                      {lead.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#64748B', fontFamily: "'DM Sans', system-ui, sans-serif" }}>{lead.created}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{
                        padding: '6px 12px',
                        background: 'rgba(200,145,40,0.1)',
                        border: '1px solid rgba(200,145,40,0.28)',
                        borderRadius: '6px',
                        color: '#C89128',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontFamily: "'DM Sans', system-ui, sans-serif"
                      }}>
                        <Mail size={14} />
                      </button>
                      <button style={{
                        padding: '6px 12px',
                        background: 'rgba(200,145,40,0.1)',
                        border: '1px solid rgba(200,145,40,0.28)',
                        borderRadius: '6px',
                        color: '#C89128',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontFamily: "'DM Sans', system-ui, sans-serif"
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
