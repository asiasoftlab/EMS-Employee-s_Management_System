import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../../config/axiosConfig';
import Clock from '../../../components/Clock/Clock';
import './Navbar.css';

export default function Navbar({ user, setUser }) {
  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      localStorage.removeItem('token');
      setUser(null);
      toast.info('Logged out successfully');
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">EMS</Link>
      <div className="nav-links">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span className="user-name" style={{ fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.2' }}>"Hello,👋{user.name}"</span>
              <span className="user-email" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.2' }}>{user.email}</span>
            </div>

            <span className="dept-badge">
              {user.department}
            </span>

            <button onClick={handleLogout} className="logout-btn" style={{ marginLeft: '0.5rem' }}>Logout</button>
          </div>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link" style={{
              background: 'var(--primary)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '8px'
            }}>Sign Up</Link>
          </>
        )}
        <Clock />
      </div>
    </nav>
  );
}
