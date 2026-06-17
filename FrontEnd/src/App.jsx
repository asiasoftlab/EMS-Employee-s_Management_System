import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import axios from './config/axiosConfig';
import Navbar from './pages/Users/Navbar/Navbar';
import Login from './pages/Users/Login/Login';
import Register from './pages/Users/Register/Register';
import Tasks from './pages/Users/Tasks/Tasks';
import Attendance from './pages/Users/Attendance/Attendance';
import Leaves from './pages/Users/Leaves/Leaves';
import Profile from './pages/Users/Profile/Profile';
import NoticeBoard from './pages/Users/NoticeBoard/notice';
import ForgotPassword from './pages/Users/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/Users/ResetPassword/ResetPassword';
import ReadMe from './pages/Users/Readme/readMe';
import Loading from './components/Loading/Loading';
import AdminDashboard from './pages/Admin/Dashboard/AdminDashboard';
import AdminLogin from './pages/Admin/Login/AdminLogin';
import AdminLeaves from './pages/Admin/Leaves/AdminLeaves';
import PWAPrompt from './components/PWAPrompt/PWAPrompt';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import { useLocation } from 'react-router-dom';
import useAutoLogout from './hooks/useAutoLogout';
import useHeartbeat from './hooks/useHeartbeat';
import useGlobalNotifications from './hooks/useGlobalNotifications';

const NavWrapper = ({ user, setUser }) => {
  const location = useLocation();
  const noNavbarPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/admin/login', '/readme'];
  const shouldHide = noNavbarPaths.includes(location.pathname) || location.pathname.startsWith('/admin');
  if (shouldHide) return null;
  return <Navbar user={user} setUser={setUser} />;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [toastPos, setToastPos] = useState(window.innerWidth <= 768 ? 'bottom-center' : 'top-center');

  useEffect(() => {
    const handleResize = () => {
      setToastPos(window.innerWidth <= 768 ? 'bottom-center' : 'top-center');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- HEARTBEAT TRACKING ---
  useHeartbeat(user);

  // --- GLOBAL DESKTOP NOTIFICATIONS ---
  useGlobalNotifications(user);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // --- AUTO LOGOUT & ALERT TRACKING ---
  useAutoLogout(user, setUser);

  if (loading) {
    return <Loading setUser={setUser} setLoading={setLoading} />;
  }

  return (
    <div className="app-container">
      <PWAPrompt />
      <ToastContainer position={toastPos} autoClose={3000} hideProgressBar={true} closeButton={false} toastClassName="nextjs-toast" bodyClassName="nextjs-toast-body"/>
      <NavWrapper user={user} setUser={setUser} />
      <main className="main-content" key={location.pathname}>
        <Routes>
          <Route path="/" element={user ? (user.role === 'employee' ? <Attendance user={user} /> : <Navigate to="/admin" replace />) : (<Navigate to="/login" replace />)} />
          <Route path="/tasks" element={user ? (user.role === "employee" ? <Tasks user={user} /> : <Navigate to="/admin" replace />) : <Navigate to="/login" replace />} />
          <Route path="/attendance" element={user ? (user.role === "employee" ? <Attendance user={user} /> : <Navigate to="/admin" replace />) : <Navigate to="/login" replace />} />
          <Route path="/leaves" element={user ? (user.role === "employee" ? <Leaves user={user} /> : <Navigate to="/admin" replace />) : <Navigate to="/login" replace />} />
          <Route path="/notice" element={user ? (user.role === "employee" ? <NoticeBoard user={user} /> : <Navigate to="/admin" replace />) : <Navigate to="/login" replace />} />
          <Route path="/profile" element={user ? (user.role === "employee" ? <Profile user={user} /> : <Navigate to="/admin" replace />) : <Navigate to="/login" replace />} />
          <Route path="/admin" element={user && (user.role === 'admin' || user.role === 'manager') ? (<AdminDashboard user={user} />) : (<Navigate to={user ? "/" : "/admin/login"} />)} />
          <Route path="/admin/leaves" element={user && (user.role === 'admin' || user.role === 'manager') ? (<AdminLeaves user={user} />) : (<Navigate to={user ? "/" : "/admin/login"} />)} />
          <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/admin/login" element={user && (user.role === 'admin' || user.role === 'manager') ? (<Navigate to="/admin" replace />) : (<AdminLogin setUser={setUser} />)} />
          <Route path="/register" element={!user ? <Register setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
          <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to="/" />} />
          <Route path="/readme" element={<ReadMe />} />
        </Routes>
      </main>
    </div>
  );
}
