import { useEffect } from 'react';
import axios from '../../config/axiosConfig';
import './Loading.css';

export default function Loading({ setUser, setLoading }) {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        const { data } = await axios.get('/api/auth/me');
        setUser(data);
      } catch (err) {
        console.log("Not logged in");
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [setUser, setLoading]);

  return (
    <div className="loading-container">
      <h2 className="loading-text">Loading...</h2>
    </div>
  );
}
