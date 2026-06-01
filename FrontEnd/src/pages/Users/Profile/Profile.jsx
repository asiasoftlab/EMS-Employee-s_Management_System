import { useState } from 'react';
import { Sidebar } from '../../../components/UserLayout/LayoutComponents';
import axios from '../../../config/axiosConfig';
import { toast } from 'react-toastify';
import { Edit2, Save, X, RefreshCw } from 'lucide-react';
import '../Tasks/Tasks.css';

export default function Profile({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    dob: user?.dob || '',
    address: user?.address || '',
    bloodGroup: user?.bloodGroup || '',
  });

  if (!user) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put('/api/auth/profile', formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      // Reload to fetch fresh user data in parent component
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    width: '100%',
    outline: 'none',
    fontSize: '0.875rem'
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-dashboard">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>User Profile</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage your personal information and account settings.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              onClick={() => window.location.reload()} 
              disabled={loading} 
              style={{ padding: '0.625rem', borderRadius: '0.75rem', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} color="#475569" />
            </button>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <Edit2 size={16} /> Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#e2e8f0', color: '#475569', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#10b981', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="tasks-container" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', flexShrink: 0 }}>
              {(formData.name || user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, maxWidth: '400px' }}>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ ...inputStyle, fontSize: '1.25rem', fontWeight: '600', padding: '0.5rem', marginBottom: '0.25rem' }}
                  placeholder="Enter full name"
                />
              ) : (
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{user?.name || 'User'}</h2>
              )}
              <p style={{ color: 'var(--text-secondary)' }}>{user?.email || 'N/A'}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Role</label>
              <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>{user?.role || 'Employee'}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Department</label>
              <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>{user?.department || 'Not Assigned'}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Phone</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  style={inputStyle}
                  placeholder="Enter phone number"
                />
              ) : (
                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>{user?.phone || 'Not Assigned'}</div>
              )}
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Gender</label>
              {isEditing ? (
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              ) : (
                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>{user?.gender || 'Not Assigned'}</div>
              )}
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.dob}
                  onChange={e => setFormData({ ...formData, dob: e.target.value })}
                  style={inputStyle}
                />
              ) : (
                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>{user?.dob || 'Not Assigned'}</div>
              )}
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Blood Group</label>
              {isEditing ? (
                <select
                  value={formData.bloodGroup}
                  onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              ) : (
                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>{user?.bloodGroup || 'Not Assigned'}</div>
              )}
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Address</label>
              {isEditing ? (
                <textarea
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  style={{ ...inputStyle, resize: 'none', height: '100px' }}
                  placeholder="Enter full address"
                />
              ) : (
                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', minHeight: '100px' }}>{user?.address || 'Not Assigned'}</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
