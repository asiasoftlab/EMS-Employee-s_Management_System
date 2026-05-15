import { Sidebar, NotificationPanel } from '../../../components/UserLayout/LayoutComponents';
import '../Tasks/Tasks.css';

export default function Profile({ user }) {
  if (!user) return null;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-dashboard">
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>User Profile</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your personal information and account settings.</p>
        </header>
        <div className="tasks-container" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{user?.name || 'User'}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{user?.email || 'N/A'}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Role</label>
              <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>Employee</div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Department</label>
              <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>{user?.department || 'Not Assigned'}</div>
            </div>
          </div>
        </div>
      </main>
      <NotificationPanel />
    </div>
  );
}
