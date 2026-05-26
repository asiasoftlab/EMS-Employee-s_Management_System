import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../../config/axiosConfig';
import { toast } from 'react-toastify';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length < 10 || phoneClean.length > 15) {
      return toast.error('Please enter a valid mobile number (10-15 digits)');
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/forgot-password', { phone });
      toast.success('OTP sent to your mobile number!');
      navigate('/reset-password', { state: { phone } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="glass-card forgot-password-card">
        <h1 className="card-title">Forgot Password</h1>
        <p className="card-subtitle">Enter your registered mobile number and we will send you an OTP to reset your password.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="Enter your mobile number"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
        <div className="form-footer">
          Remember your password? <Link to="/login" className="form-link">Login</Link>
        </div>
      </div>
    </div>
  );
}
