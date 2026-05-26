import { useState } from 'react';
import { Sidebar } from '../../../components/UserLayout/LayoutComponents';
import axios from '../../../config/axiosConfig';
import { toast } from 'react-toastify';
import { Edit2, Save, X } from 'lucide-react';
import '../Tasks/Tasks.css';

export default function Profile({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    gender: user?.gender || '',
    dob: user?.dob || '',
    address: user?.address || '',
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
          <div>
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
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
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
                  onChange={e => setFormData({...formData, gender: e.target.value})} 
                  style={inputStyle}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
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
                  onChange={e => setFormData({...formData, dob: e.target.value})} 
                  style={inputStyle}
                />
              ) : (
                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>{user?.dob || 'Not Assigned'}</div>
              )}
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Address</label>
              {isEditing ? (
                <textarea 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  style={{...inputStyle, resize: 'none', height: '100px'}}
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
