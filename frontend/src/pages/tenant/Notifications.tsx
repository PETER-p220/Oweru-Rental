import { useEffect, useMemo, useState } from 'react';
import Api from '../../services/api';
import { buttonStyle, descriptionStyle, formatDate, headingStyle, inputStyle, pageStyle, panelStyle, sectionTitleStyle, tableStyle, tableWrapStyle, tdStyle, thStyle } from './tenantPageStyles';

const Notifications = () => {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [itemsRes, statsRes] = await Promise.all([Api.getNotifications(), Api.getNotificationStats()]);
      setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
      setStats(statsRes.data || {});
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load notifications.');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter((item) => `${item.title || ''} ${item.message || ''}`.toLowerCase().includes(search.toLowerCase())), [items, search]);

  return (
    <div style={pageStyle}>
      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Tenant Workspace</div>
        <h1 style={headingStyle}>Notifications</h1>
        <p style={descriptionStyle}>Live tenant notifications with read and archive actions.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginTop: '22px' }}>
          <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}><div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase' }}>Total</div><div style={{ fontSize: '30px', marginTop: '8px' }}>{stats.total ?? 0}</div></div>
          <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}><div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase' }}>Unread</div><div style={{ fontSize: '30px', marginTop: '8px' }}>{stats.unread ?? 0}</div></div>
          <div style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}><div style={{ color: '#9f9587', fontSize: '12px', textTransform: 'uppercase' }}>This week</div><div style={{ fontSize: '30px', marginTop: '8px' }}>{stats.this_week ?? 0}</div></div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '18px', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '360px', flex: 1 }}><input style={inputStyle} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notifications" /></div>
          <button style={buttonStyle('secondary')} onClick={() => Api.markAllNotificationsAsRead().then(load)}>Mark all read</button>
        </div>
      </section>
      <section style={panelStyle}>
        {error && <div style={{ color: '#e07070', marginBottom: '16px' }}>{error}</div>}
        {loading ? <div style={{ color: '#9f9587' }}>Loading notifications...</div> : filtered.length === 0 ? <div style={{ color: '#9f9587' }}>No notifications found.</div> : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}><thead><tr><th style={thStyle}>Title</th><th style={thStyle}>Type</th><th style={thStyle}>Date</th><th style={thStyle}>Actions</th></tr></thead>
            <tbody>{filtered.map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}><div>{item.title}</div><div style={{ color: '#9f9587', marginTop: '4px' }}>{item.message}</div></td>
                <td style={tdStyle}>{item.type || 'system'}</td>
                <td style={tdStyle}>{formatDate(item.created_at)}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {!item.read_at && <button style={buttonStyle('secondary')} onClick={() => Api.markNotificationAsRead(item.id).then(load)}>Read</button>}
                    <button style={buttonStyle('secondary')} onClick={() => Api.archiveNotification(item.id).then(load)}>Archive</button>
                    <button style={buttonStyle('danger')} onClick={() => Api.deleteNotification(item.id).then(load)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}</tbody></table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Notifications;
