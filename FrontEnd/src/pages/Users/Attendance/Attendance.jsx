import { useState, useEffect } from 'react';
import { Sidebar, ChatPanel } from '../../../components/UserLayout/LayoutComponents';
import { Clock, Calendar, CheckCircle, LogOut, LogIn, Activity, RefreshCw } from 'lucide-react';
import axios from '../../../config/axiosConfig';
import { toast } from 'react-toastify';
import '../Tasks/Tasks.css'; // Reusing general layout styles
import './Attendance.css';

export default function Attendance({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/attendance');
      setRecords(data || []);

      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      const foundToday = data.find(r => r.date === today);
      setTodayRecord(foundToday || null);
    } catch (err) {
      console.error(err);
      toast.error("We couldn't load your attendance records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAttendance();
    }
  }, [user]);

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      const { data } = await axios.post('/api/attendance/clock-in');
      toast.success('Successfully checked-in for today!');
      fetchAttendance();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "We couldn't clock you in. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      const { data } = await axios.post('/api/attendance/clock-out');
      toast.success('Successfully clocked out!');
      fetchAttendance();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "We couldn't clock you out. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (!user) return null;

  const isClockedIn = todayRecord !== null;
  const isClockedOut = todayRecord?.clockOut != null;

  const totalOvertime = records.reduce((acc, curr) => {
    if (curr.totalHours && curr.totalHours > 7.5) {
      return acc + (curr.totalHours - 7.5);
    }
    return acc;
  }, 0).toFixed(1);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-dashboard">
        <header className="attendance-header">
          <div>
            <h1 className="attendance-header-title">Your Attendance</h1>
            <p className="attendance-header-subtitle">Log your hours and view attendance history.</p>
          </div>
          <button onClick={fetchAttendance} disabled={loading} className="attendance-refresh-btn">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </header>

        <section className="attendance-grid">

          {/* Action Card */}
          <div className="attendance-action-card">
            <div className={`attendance-action-icon ${isClockedOut ? 'is-clocked-out' : isClockedIn ? 'is-clocked-in' : 'is-pending'}`}>
              <Clock size={40} />
            </div>
            <h2 className="attendance-status-heading">Current Status</h2>

            {!isClockedIn && (
              <>
                <p className="attendance-action-text">You have not clocked in yet today.</p>
                <button
                  onClick={handleClockIn}
                  disabled={actionLoading}
                  className="attendance-btn-clock-in"
                >
                  <LogIn size={18} /> {actionLoading ? 'Processing...' : 'Clock In Now'}
                </button>
              </>
            )}

            {isClockedIn && !isClockedOut && (
              <>
                <p className="attendance-action-text">You clocked in at <strong>{formatTime(todayRecord.clockIn)}</strong>.</p>
                <button
                  onClick={handleClockOut}
                  disabled={actionLoading}
                  className="attendance-btn-clock-out"
                >
                  <LogOut size={18} /> {actionLoading ? 'Processing...' : 'Clock Out'}
                </button>
              </>
            )}

            {isClockedOut && (
              <>
                <p className="attendance-action-text">Shift completed! Total hours: <strong>{todayRecord.totalHours}h</strong></p>
                <div className="attendance-badge-completed">
                  <CheckCircle size={18} /> Completed for Today
                </div>
              </>
            )}
          </div>

          {/* Stats Cards */}
          <div className="attendance-stats-container">
            <div className="attendance-stats-row">
              <div className="attendance-stat-card">
                <div className="attendance-stat-title">
                  <Calendar size={16} /> Total Days Present
                </div>
                <div className="attendance-stat-value">{records.length}</div>
              </div>
              <div className="attendance-stat-card">
                <div className="attendance-stat-title">
                  <Activity size={16} /> Avg Hours / Day
                </div>
                <div className="attendance-stat-value">
                  {records.length > 0 ? (records.reduce((acc, curr) => acc + (curr.totalHours || 0), 0) / records.length).toFixed(1) : '0.0'}
                </div>
              </div>
            </div>

            <div className="attendance-weekly-card">
              <div className="attendance-stat-title">
                <Clock size={16} /> Your Total Overtime (All Time)
              </div>
              <div className="attendance-stat-value">
                {totalOvertime}h
              </div>
              {parseFloat(totalOvertime) > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.875rem', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', fontSize: '0.875rem', color: '#065f46', lineHeight: '1.5' }}>
                  🎉 <strong>Congratulations {user?.name || 'User'}!</strong> You have logged <strong>{totalOvertime} hours</strong> of overtime. Special appreciation for your hard work and dedication!
                </div>
              )}
            </div>
          </div>
        </section>

        {/* History Table */}
        <section className="attendance-history-section">
          <div className="attendance-history-header">
            <h2 className="attendance-history-title">Recent History</h2>
          </div>

          {loading ? (
            <div className="attendance-empty-state">Loading records...</div>
          ) : records.length === 0 ? (
            <div className="attendance-empty-state">No attendance records found.</div>
          ) : (
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr className="attendance-th-row">
                    <th className="attendance-th">Date</th>
                    <th className="attendance-th">Check In</th>
                    <th className="attendance-th">Check Out</th>
                    <th className="attendance-th">Total Hours</th>
                    <th className="attendance-th">Overtime</th>
                    <th className="attendance-th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...records].sort((a, b) => new Date(a.date) - new Date(b.date)).map(record => (
                    <tr key={record._id} className="attendance-tr">
                      <td className="attendance-td-date">{formatDate(record.date)}</td>
                      <td className="attendance-td">{formatTime(record.clockIn)}</td>
                      <td className="attendance-td">{formatTime(record.clockOut)}</td>
                      <td className="attendance-td-hours">{record.totalHours ? `${record.totalHours} hrs` : '-'}</td>
                      <td className="attendance-td-hours">{record.overtime ? `${record.overtime}hrs` : '0 hrs'}</td>
                      <td className="attendance-td">
                        {record.clockOut ? (
                          record.totalHours >= 7.5 ? (
                            <span className="attendance-status-badge" style={{ background: 'white', color: '#166534' }}>
                              Full Day
                            </span>
                          ) : (
                            <span className="attendance-status-badge" style={{ background: 'white', color: '#991b1b' }}>
                              Incomplete ({record.totalHours} ‹ 7.5h)
                            </span>
                          )
                        ) : (
                          <span className="attendance-status-badge" style={{ background: 'white', color: '#3730a3' }}>
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
      {/* <ChatPanel user={user} /> */}
    </div>
  );
}
