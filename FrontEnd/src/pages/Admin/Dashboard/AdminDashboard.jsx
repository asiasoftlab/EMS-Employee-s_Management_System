import axios from '../../../config/axiosConfig';
import './AdminDashboard.css';

export default function AdminDashboard({ user }) {
  if (!user || !user.isAdmin) return null;

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    } catch (err) {
      console.error('Logout failed', err);
      // Fallback: clear local storage and redirect anyway
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Control Panel</h1>
        <p>Welcome back, {user.name}</p>
      </header>
      <div>
        <button className="admin-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
