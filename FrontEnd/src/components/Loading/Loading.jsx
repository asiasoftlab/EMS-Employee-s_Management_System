import { useEffect } from 'react';
import axios from '../../config/axiosConfig';
import './Loading.css';

export default function Loading({ setUser, setLoading }) {
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get('/api/auth/me');
        setUser(data);
      } catch (err) {
        console.log("Not logged in");
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [setUser, setLoading]);

  return (
    <div className="loading-container">
      <h2 className="loading-text">Loading...</h2>
    </div>
  );
}
