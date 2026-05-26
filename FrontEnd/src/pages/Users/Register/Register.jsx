import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../../config/axiosConfig';
import { toast } from 'react-toastify';
import './Register.css';

export default function Register({ setUser }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    department: 'Engineering'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
  );

  const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return toast.error('Full name is required');
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      return toast.error('Please enter a valid email address');
    }
    if (!formData.email.toLowerCase().endsWith('@asiasoftlab.in')) {
      return toast.error('Please check your email address');
    }
    const phoneClean = formData.phone.replace(/\D/g, '');
    if (phoneClean.length < 10 || phoneClean.length > 15) {
      return toast.error('Please enter a valid mobile number (10-15 digits)');
    }
    if (formData.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      await axios.post('/api/auth/register', formData);
      toast.success('Registration successful! Please sign in with your new credentials.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="glass-card">
        <h1 className="card-title">Create Account</h1>
        <p className="card-subtitle">Join the Employee Management System (EMS)</p>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required placeholder="Enter your full name" />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required placeholder="Enter your email" />
          </div>
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input type="tel" name="phone" className="form-input" value={formData.phone} onChange={handleChange} required placeholder="Enter your mobile number" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? "text" : "password"} name="password" className="form-input" value={formData.password} onChange={handleChange} required placeholder="Enter your password" style={{ paddingRight: '2.5rem' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <input type="text" name="department" className="form-input" value={formData.department} onChange={handleChange} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="form-footer">
          Already have an account? <Link to="/login" className="form-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
