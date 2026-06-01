import { useState } from 'react';
import { Sidebar } from '../../../components/UserLayout/LayoutComponents';
import { RefreshCw } from 'lucide-react';
import '../Tasks/Tasks.css';

export default function Leaves({ user }) {
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };
  if (!user) return null;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-dashboard">
        <header style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Leave Requests (Under Maintenance)</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Submit and track your leave applications.</p>
          </div>
          <button onClick={handleRefresh} disabled={loading} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 shadow-sm cursor-pointer transition-colors text-slate-600">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </header>
        <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          Leave management module coming soon...
        </div>
      </main>
    </div>
  );
}
