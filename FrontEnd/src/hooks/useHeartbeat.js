import { useEffect } from 'react';
import axios from '../config/axiosConfig';

export default function useHeartbeat(user) {
  useEffect(() => {
    if (!user || user.role !== 'employee') return;
    
    let isActive = true; // initially active
    
    const updateActivity = () => {
      isActive = true;
    };
    
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    
    const heartbeatInterval = setInterval(async () => {
      if (isActive) {
        try {
          await axios.post('/api/auth/activity');
          isActive = false; // reset until next user interaction
        } catch (err) {
          console.error('Failed to update activity heartbeat', err);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Initial ping
    axios.post('/api/auth/activity').catch(() => {});
    
    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      clearInterval(heartbeatInterval);
    };
  }, [user]);
}
