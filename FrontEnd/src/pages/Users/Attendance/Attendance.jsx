import { Sidebar } from '../../../components/UserLayout/LayoutComponents';
import '../Tasks/Tasks.css';

export default function Attendance({ user }) {
  if (!user) return null;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-dashboard">
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Attendance Tracking(Under Maintenance)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View and manage your daily attendance logs.</p>
        </header>
        <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          Attendance module coming soon...
        </div>
      </main>

    </div>
  );
}
