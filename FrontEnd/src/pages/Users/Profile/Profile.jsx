import { useState, useEffect } from 'react';
import { Sidebar } from '../../../components/UserLayout/LayoutComponents';
import axios from '../../../config/axiosConfig';
import { toast } from 'react-toastify';
import { Edit2, Save, X, RefreshCw, Camera } from 'lucide-react';
import '../Tasks/Tasks.css';
import './Profile.css';

export default function Profile({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(user);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    emergencyContact: user?.emergencyContact || '',
    gender: user?.gender || '',
    dob: user?.dob || '',
    address: user?.address || '',
    bloodGroup: user?.bloodGroup || '',
    profilePic: user?.profilePic || '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profilePic || null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get('/api/auth/me');
        setProfileData(data);
          setFormData({
            name: data?.name || '',
            phone: data?.phone || '',
            emergencyContact: data?.emergencyContact || '',
            gender: data?.gender || '',
            dob: data?.dob || '',
            address: data?.address || '',
            bloodGroup: data?.bloodGroup || '',
            profilePic: data?.profilePic || '',
            profilePicUpdateDates: data?.profilePicUpdateDates || [],
          });
          setPreviewUrl(data?.profilePic || null);
      } catch (error) {
        console.error("Failed to fetch fresh profile data", error);
      }
    };
    fetchProfile();
  }, []);

  if (!user) return null;

  const currentYear = new Date().getFullYear();
  const updatesThisYear = (profileData?.profilePicUpdateDates || []).filter(date => new Date(date).getFullYear() === currentYear).length;
  const chancesLeft = 3 - updatesThisYear;

  const handleSave = async () => {
    setLoading(true);
    try {
      let updatedProfilePic = formData.profilePic;

      if (selectedFile) {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        
        if (!cloudName || !uploadPreset || cloudName === 'your_cloud_name_here') {
          toast.error("Cloudinary credentials not configured. Please check .env.development");
          setLoading(false);
          return;
        }

        const uploadData = new FormData();
        uploadData.append("file", selectedFile);
        uploadData.append("upload_preset", uploadPreset);

        const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: uploadData,
        });

        const cloudinaryData = await cloudinaryResponse.json();
        
        if (cloudinaryData.secure_url) {
          updatedProfilePic = cloudinaryData.secure_url;
        } else {
          throw new Error("Failed to upload image to Cloudinary");
        }
      }

      const payload = { ...formData, profilePic: updatedProfilePic };
      await axios.put('/api/auth/profile', payload);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      
      // Re-fetch data locally instead of reloading the whole page
      const { data } = await axios.get('/api/auth/me');
      
      if (selectedFile) {
        const newUpdatesThisYear = (data?.profilePicUpdateDates || []).filter(date => new Date(date).getFullYear() === currentYear).length;
        const newChancesLeft = 3 - newUpdatesThisYear;
        toast.info(`You have ${newChancesLeft} profile picture changes remaining this year.`);
      }

      setSelectedFile(null);
      setProfileData(data);
      setFormData({
        name: data?.name || '',
        phone: data?.phone || '',
        emergencyContact: data?.emergencyContact || '',
        gender: data?.gender || '',
        dob: data?.dob || '',
        address: data?.address || '',
        bloodGroup: data?.bloodGroup || '',
        profilePic: data?.profilePic || '',
      });
      setPreviewUrl(data?.profilePic || null);
    } catch (error) {
      console.error(error);
      toast.error("We couldn't update your profile right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // We use the .profile-input class from Profile.css for form elements

  return (
    <div className="dashboard-container profile-page-container">
      <Sidebar user={user} />
      <main className="main-dashboard overflow-y-auto">
        <header className="profile-header">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
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
                onClick={() => {
                  setIsEditing(true);
                  if (chancesLeft > 0) {
                    toast.info(`Note: You can change your profile picture ${chancesLeft} more time(s) this year.`, { autoClose: 4000 });
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <Edit2 size={16} /> Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedFile(null);
                    setPreviewUrl(profileData?.profilePic || null);
                  }}
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
            <div className="profile-avatar shadow-sm" style={{ position: 'relative', overflow: 'hidden' }}>
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (formData.name || profileData?.name || 'U').charAt(0).toUpperCase()
              )}
              {isEditing && (
                <label style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)',
                  color: 'white', display: 'flex', justifyContent: 'center', padding: '0.25rem', cursor: 'pointer'
                }}>
                  <Camera size={16} />
                  <input type="file" accept="image/*" style={{ display: 'none' }} onClick={(e) => {
                    if (chancesLeft <= 0) {
                      e.preventDefault();
                      toast.error("You have reached the maximum limit of 3 profile picture changes this year.");
                    }
                  }} onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const sizeKb = (file.size / 1024).toFixed(2);
                      toast.info(`Selected image size: ${sizeKb} KB`);
                      setSelectedFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }} />
                </label>
              )}
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
                <h2 className="text-xl font-semibold">{profileData?.name || 'User'}</h2>
              )}
              <p style={{ color: 'var(--text-secondary)' }}>{profileData?.email || 'N/A'}</p>
            </div>
          </div>
          <div className="profile-details-grid">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Role</label>
              <div className="profile-field-value">{profileData?.role || 'Employee'}</div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Department</label>
              <div className="profile-field-value">{profileData?.department || 'Not Assigned'}</div>
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
                <div className="profile-field-value">{profileData?.phone || 'Not Assigned'}</div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Emergency Contact</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="profile-input"
                  placeholder="Enter emergency number"
                />
              ) : (
                <div className="profile-field-value">{profileData?.emergencyContact || 'Not Assigned'}</div>
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
                <div className="profile-field-value">{profileData?.gender || 'Not Assigned'}</div>
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
                <div className="profile-field-value">{profileData?.dob || 'Not Assigned'}</div>
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
                <div className="profile-field-value">{profileData?.bloodGroup || 'Not Assigned'}</div>
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
                <div className="profile-field-value !items-start min-h-[100px]">{profileData?.address || 'Not Assigned'}</div>
              )}
            </div>
          </div>



        </div>
      </main>

      <div className="profile-right-panel">
        <h3 className="text-lg font-bold text-slate-800 mb-4">App Settings</h3>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h4 className="font-semibold text-slate-800">Download Mobile App</h4>
            <p className="text-sm text-slate-500 mt-1">Install the EMS application on your device for quick access.</p>
          </div>
          <button
            onClick={() => {
              if (window.deferredPWAInstallPrompt) {
                window.deferredPWAInstallPrompt.prompt();
              } else {
                toast.info("App is already installed or your browser doesn't support installation.");
              }
            }}
            style={{ background: 'var(--primary)', color: 'white', padding: '0.625rem 1.25rem', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  );
}
