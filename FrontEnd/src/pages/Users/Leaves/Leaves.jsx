import { Sidebar, NotificationPanel } from '../../../components/UserLayout/LayoutComponents';
import '../Tasks/Tasks.css';

export default function Leaves({ user }) {
  if (!user) return null;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-dashboard">
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Leave Requests</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Submit and track your leave applications.</p>
        </header>
        <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          Leave management module coming soon...
        </div>
      </main>
      <NotificationPanel />
    </div>
  );
}
