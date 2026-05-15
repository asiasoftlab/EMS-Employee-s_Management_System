import { NavLink } from 'react-router-dom';

export const Sidebar = () => (
  <aside className="sidebar">
    <div className="sidebar-header">
      <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>EMS Portal</h2>
    </div>
    <nav className="sidebar-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
        My Tasks
      </NavLink>
      <NavLink to="/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"></path><path d="m4.93 4.93 14.14 14.14M4.93 19.07 19.07 4.93"></path></svg>
        Attendance
      </NavLink>
      <NavLink to="/leaves" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path><path d="M13 13h4"></path><path d="M13 17h4"></path></svg>
        Leave Requests
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        Profile
      </NavLink>
    </nav>
    <div style={{ marginTop: 'auto' }}>
      <div className="stat-card" style={{ background: 'rgba(59, 130, 246, 0.05)', border: 'none' }}>
        <span className="stat-label">System Status</span>
        <span className="stat-value" style={{ fontSize: '1rem', color: '#10b981' }}>● Online</span>
      </div>
    </div>
  </aside>
);

export const NotificationPanel = () => (
  <aside className="notification-panel">
    <div className="panel-title">
      Notifications
      <span style={{ fontSize: '0.75rem', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>0 New</span>
    </div>
    <div className="notification-list">
      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        No new notifications.
      </div>
    </div>
  </aside>
);
