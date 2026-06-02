import { useState } from 'react';
import { Sidebar } from '../../../components/UserLayout/LayoutComponents';
import axios from '../../../config/axiosConfig';
import { toast } from 'react-toastify';
import { Edit2, Save, X, RefreshCw } from 'lucide-react';
import '../Tasks/Tasks.css';
import './Profile.css';

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

  // We use the .profile-input class from Profile.css for form elements

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-dashboard overflow-y-auto">
        <header className="profile-header">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">User Profile</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your personal information and account settings.</p>
          </div>
          <div className="profile-header-actions">
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
        <div className="tasks-container p-4 sm:p-8 relative">
          <div className="profile-info-section">
            <div className="profile-avatar shadow-sm">
              {(formData.name || user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 w-full max-w-md">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="profile-input !text-xl !font-semibold !p-2 !mb-1"
                  placeholder="Enter full name"
                />
              ) : (
                <h2 className="text-xl font-semibold">{user?.name || 'User'}</h2>
              )}
              <p style={{ color: 'var(--text-secondary)' }}>{user?.email || 'N/A'}</p>
            </div>
          </div>
          <div className="profile-details-grid">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Role</label>
              <div className="profile-field-value">{user?.role || 'Employee'}</div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Department</label>
              <div className="profile-field-value">{user?.department || 'Not Assigned'}</div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Phone</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="profile-input"
                  placeholder="Enter phone number"
                />
              ) : (
                <div className="profile-field-value">{user?.phone || 'Not Assigned'}</div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Gender</label>
              {isEditing ? (
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="profile-input"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              ) : (
                <div className="profile-field-value">{user?.gender || 'Not Assigned'}</div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.dob}
                  onChange={e => setFormData({ ...formData, dob: e.target.value })}
                  className="profile-input"
                />
              ) : (
                <div className="profile-field-value">{user?.dob || 'Not Assigned'}</div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Blood Group</label>
              {isEditing ? (
                <select
                  value={formData.bloodGroup}
                  onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="profile-input"
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
                <div className="profile-field-value">{user?.bloodGroup || 'Not Assigned'}</div>
              )}
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Address</label>
              {isEditing ? (
                <textarea
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="profile-input resize-none h-[100px]"
                  placeholder="Enter full address"
                />
              ) : (
                <div className="profile-field-value !items-start min-h-[100px]">{user?.address || 'Not Assigned'}</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
