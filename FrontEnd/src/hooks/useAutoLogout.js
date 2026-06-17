import { useEffect } from 'react';
import axios from '../config/axiosConfig';
import { toast } from 'react-toastify';

export default function useAutoLogout(user, setUser) {
  useEffect(() => {
    if (!user) return;

    const checkTime = async () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      if (hours >= 18) {
        // Automatically logout at or after 6:00 PM
        try {
          await axios.post('/api/auth/logout');
        } catch (err) {
          console.error(err);
        }
        localStorage.removeItem('token');
        setUser(null);
        toast.info('You have been automatically logged out for the day (6:00 PM).', { autoClose: false });
        
        // Redirect to login based on role
        if (user.role === 'admin' || user.role === 'manager') {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/login';
        }
      } else if (hours === 17 && minutes >= 30) {
        // Show alert message if after 5:30 PM
        if (!window.hasShownEODAlert) {
          toast.warning('Friendly reminder: The platform will automatically log-out at 6:00 PM.', { autoClose: false });
          window.hasShownEODAlert = true;
        }
      } else {
        window.hasShownEODAlert = false;
      }
    };

    const interval = setInterval(checkTime, 60000);
    checkTime();

    return () => clearInterval(interval);
  }, [user, setUser]);
}
