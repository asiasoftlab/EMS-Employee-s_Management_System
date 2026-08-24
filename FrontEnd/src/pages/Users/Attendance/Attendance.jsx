import { useState, useEffect } from 'react';
import { Sidebar, ChatPanel } from '../../../components/UserLayout/LayoutComponents';
import { Clock, Calendar, CheckCircle, LogOut, LogIn, Home,Activity, RefreshCw } from 'lucide-react';
import axios from '../../../config/axiosConfig';
import { toast } from 'react-toastify';
import '../Tasks/Tasks.css'; // Reusing general layout styles
import './Attendance.css';
import { importantDays, companyHolidays } from '../../../utils/importantDays';

export default function Attendance({ user }) {
  const [records, setRecords] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const todayDateObj = new Date();
  const monthStr = String(todayDateObj.getMonth() + 1).padStart(2, '0');
  const dayStr = String(todayDateObj.getDate()).padStart(2, '0');
  const todayKey = `${monthStr}-${dayStr}`;
  const todayEvent = importantDays[todayKey];
  const isCompanyHoliday = !!companyHolidays[todayKey];
  const holidayName = companyHolidays[todayKey];
  const [showHolidayModal, setShowHolidayModal] = useState(isCompanyHoliday);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getLiveDuration = (clockIn) => {
    if (!clockIn) return '0h 0m 0s';
    const clockInDate = new Date(clockIn);

    const diffMs = Math.max(0, currentTime - clockInDate);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const getLiveOvertime = (clockIn) => {
    if (!clockIn) return '0h 0m 0s';
    const clockInDate = new Date(clockIn);

    const diffMs = Math.max(0, currentTime - clockInDate);
    const hours = diffMs / (1000 * 60 * 60);
    if (hours > 7.5) {
      const overtimeMs = diffMs - (7.5 * 60 * 60 * 1000);
      const ohours = Math.floor(overtimeMs / (1000 * 60 * 60));
      const ominutes = Math.floor((overtimeMs % (1000 * 60 * 60)) / (1000 * 60));
      const oseconds = Math.floor((overtimeMs % (1000 * 60)) / 1000);
      return `${ohours}h ${ominutes}m ${oseconds}s`;
    }
    return '0h 0m 0s';
  };
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const [attendanceRes, tasksRes, leavesRes] = await Promise.all([
        axios.get('/api/attendance'),
        axios.get('/api/tasks').catch(() => ({ data: [] })),
        axios.get('/api/leaves').catch(() => ({ data: [] }))
      ]);
      setRecords(attendanceRes.data || []);
      setTasks(tasksRes.data || []);
      setLeaves(leavesRes.data || []);

      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      const foundToday = (attendanceRes.data || []).find(r => r.date === today);
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

  const currentMonthRecords = records.filter(r => {
    if (!r.date) return false;
    const d = new Date(r.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalOvertime = currentMonthRecords.reduce((acc, curr) => {
    let overtime = curr.overtime != null ? parseFloat(curr.overtime) : (curr.totalHours && curr.totalHours > 7.5 ? curr.totalHours - 7.5 : 0);
    if (!curr.clockOut && curr.clockIn) {
      const clockInDate = new Date(curr.clockIn);

      const diffMs = Math.max(0, currentTime - clockInDate);
      const hours = diffMs / (1000 * 60 * 60);
      if (hours > 7.5) {
        overtime += (hours - 7.5);
      }
    }
    return acc + overtime;
  }, 0).toFixed(1);

  const overtimeRecords = currentMonthRecords.filter(curr => {
    let overtime = curr.overtime != null ? parseFloat(curr.overtime) : (curr.totalHours && curr.totalHours > 7.5 ? curr.totalHours - 7.5 : 0);
    if (!curr.clockOut && curr.clockIn) {
      const clockInDate = new Date(curr.clockIn);
      const diffMs = Math.max(0, currentTime - clockInDate);
      const hours = diffMs / (1000 * 60 * 60);
      if (hours > 7.5) {
        overtime += (hours - 7.5);
      }
    }
    return overtime > 0;
  });

  const overtimeDatesArray = overtimeRecords.map(r => r.date).sort((a, b) => new Date(a) - new Date(b));
  const overtimeTooltipText = overtimeDatesArray.length > 0
    ? "Overtime Dates:\n" + overtimeDatesArray.map(dateStr => new Date(dateStr).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric' })).join('\n')
    : "No overtime days this month";

  const uniqueLeaveDates = new Set();
  leaves.filter(l => l.status !== 'Rejected' && l.leaveType !== 'WFH').forEach(l => {
    if (!l.startDate || !l.endDate) return;
    const start = new Date(l.startDate);
    const end = new Date(l.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0) continue; // skip sundays
      const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
      const dObj = new Date(dateStr);
      const now = new Date();
      if (dObj.getMonth() === now.getMonth() && dObj.getFullYear() === now.getFullYear()) {
        uniqueLeaveDates.add(dateStr);
      }
    }
  });

  const numberOfLeaves = uniqueLeaveDates.size;
  const leaveDatesArray = Array.from(uniqueLeaveDates).sort((a, b) => new Date(a) - new Date(b));
  const leaveTooltipText = leaveDatesArray.length > 0
    ? "Leave Dates:\n" + leaveDatesArray.map(dateStr => new Date(dateStr).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric' })).join('\n')
    : "No leave days this month";

  const uniqueWFHDates = tasks.filter(t => {
    if (t.location !== 'Work from home') return false;
    let deadlineStr = '';
    if (t.deadline) {
      if (typeof t.deadline === 'string') deadlineStr = t.deadline.split('T')[0];
      else if (typeof t.deadline === 'object' && t.deadline._seconds !== undefined) {
        deadlineStr = new Date(t.deadline._seconds * 1000).toISOString().split('T')[0];
      } else {
        try { deadlineStr = new Date(t.deadline).toISOString().split('T')[0]; } catch(e) {}
      }
    }
    if (!deadlineStr) return false;
    const d = new Date(deadlineStr);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((uniqueDays, t) => {
    let deadlineStr = '';
    if (typeof t.deadline === 'string') deadlineStr = t.deadline.split('T')[0];
    else if (typeof t.deadline === 'object' && t.deadline._seconds !== undefined) {
      deadlineStr = new Date(t.deadline._seconds * 1000).toISOString().split('T')[0];
    } else {
      deadlineStr = new Date(t.deadline).toISOString().split('T')[0];
    }
    uniqueDays.add(deadlineStr);
    return uniqueDays;
  }, new Set());

  const numberOfWFH = uniqueWFHDates.size;
  const wfhDatesArray = Array.from(uniqueWFHDates).sort((a, b) => new Date(a) - new Date(b));
  const wfhTooltipText = wfhDatesArray.length > 0 
    ? "WFH Dates:\n" + wfhDatesArray.map(dateStr => new Date(dateStr).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric' })).join('\n')
    : "No WFH days this month";
  
  const workedDays = currentMonthRecords.filter(r => r.totalHours > 0 || r.clockIn).length;
  const avgHours = workedDays > 0 ? (currentMonthRecords.reduce((acc, curr) => acc + (curr.totalHours || 0), 0) / workedDays).toFixed(1) : '0.0';
  const presentRecords = currentMonthRecords.filter(r => r.totalHours > 0 || r.clockIn || r.status === 'Present');
  const totalDaysPresent = presentRecords.length;

  const presentDatesArray = presentRecords.map(r => r.date).sort((a, b) => new Date(a) - new Date(b));
  const presentTooltipText = presentDatesArray.length > 0
    ? "Present Dates:\n" + presentDatesArray.map(dateStr => new Date(dateStr).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric' })).join('\n')
    : "No present days this month";

  return (
    <div className="dashboard-container">
      <Sidebar user={user} />
      <main className="main-dashboard">
        <header className="attendance-header">
          <div>
            <h1 className="attendance-header-title">Your Attendance</h1>
            <p className="attendance-header-subtitle">Log your hours and view attendance history.</p>
            {todayEvent && (
              <p style={{ marginTop: '0.25rem', fontWeight: '500', color: '#059669', fontSize: '0.9rem' }}>
                Today : {todayEvent}
              </p>
            )}
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

            {isCompanyHoliday && !isClockedIn && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p className="attendance-action-text">Today is a Company Holiday: <strong>{holidayName}</strong></p>
                <div className="attendance-badge-completed" style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#34d399', marginBottom: '1rem' }}>
                  Enjoy your day off!
                </div>
                <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Working anyway? You can still clock in below.</p>
              </div>
            )}

            {isCompanyHoliday && isClockedIn && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px' }}>
                <p style={{ margin: 0, color: '#b45309', fontWeight: '500', fontSize: '0.95rem' }}>
                  🌟 Special Appreciation!
                </p>
                <p style={{ margin: '0.25rem 0 0', color: '#92400e', fontSize: '0.85rem' }}>
                  Thank you for your dedication to work on <strong>{holidayName}</strong>. Your effort doesn't go unnoticed!
                </p>
              </div>
            )}

            {!isClockedIn && (
              <>
                {!isCompanyHoliday && <p className="attendance-action-text">You have not clocked in yet today.</p>}
                <button
                  onClick={handleClockIn}
                  disabled={actionLoading}
                  className="attendance-btn-clock-in"
                >
                  <LogIn size={18} /> {actionLoading ? 'Processing...' : 'Check In Now'}
                </button>
              </>
            )}

            {isClockedIn && !isClockedOut && (
              <>
                <p className="attendance-action-text">You check-in at <strong>{formatTime(todayRecord.clockIn)}</strong>.</p>
                <p className="attendance-action-text" style={{ marginTop: '0.5rem' }}>
                  Live Hours : <strong>{getLiveDuration(todayRecord.clockIn)}</strong>
                </p>
                <button
                  onClick={handleClockOut}
                  disabled={actionLoading}
                  className="attendance-btn-clock-out"
                >
                  <LogOut size={18} /> {actionLoading ? 'Processing...' : 'Check Out'}
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
            <h2 className="attendance-status-heading" style={{ margin: '0 0 0.5rem 0', textAlign: 'left' }}>Monthly Attendance Summary🔻</h2>
            <div className="attendance-stats-row">
              <div className="attendance-stat-card" title={presentTooltipText} style={{ cursor: 'pointer' }}>
                <div className="attendance-stat-title">
                  <Calendar size={16} /> Total Days Present
                </div>
                <div className="attendance-stat-value">
                  {totalDaysPresent}/{new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} ({new Date().toLocaleString('default', { month: 'short' })})
                </div>
              </div>
              <div className="attendance-stat-card">
                <div className="attendance-stat-title">
                  <Activity size={16} /> Avg Hours / Day
                </div>
                <div className="attendance-stat-value">
                  {avgHours}
                </div>
              </div>
            </div>

            <div className="attendance-stats-row">
              <div className="attendance-stat-card" title={overtimeTooltipText} style={{ cursor: 'pointer' }}>
                <div className="attendance-stat-title">
                  <Clock size={16} /> Total Overtime
                </div>
                <div className="attendance-stat-value">
                  {totalOvertime}h <span style={{ fontSize: '1rem', color: '#161718ff' }}>({overtimeDatesArray.length} days)</span>
                </div>
              </div>

              <div className="attendance-stat-card" title={wfhTooltipText} style={{ cursor: 'pointer' }}>
                <div className="attendance-stat-title">
                  <Home size={16} /> Work From Home
                </div>
                <div className="attendance-stat-value">
                  {numberOfWFH}
                </div>
              </div>
              <div className="attendance-stat-card" title={leaveTooltipText} style={{ cursor: 'pointer' }}>
                <div className="attendance-stat-title">
                  <Calendar size={16} /> Number of Leaves
                </div>
                <div className="attendance-stat-value">
                  {numberOfLeaves}
                </div>
              </div>
            </div>
            {parseFloat(totalOvertime) > 0 && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', fontSize: '0.875rem', color: '#065f46', lineHeight: '1.5' }}>
                🎉 <strong>Congratulations {user?.name || 'User'}!</strong> You have logged <strong>{totalOvertime} hours</strong> of overtime. Special appreciation for your hard work and dedication!
              </div>
            )}
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
                  {(() => {
                    const allRecords = [...records];
                    const existingDates = new Set(allRecords.map(r => r.date));
                    const todayObj = new Date();
                    for (let d = 1; d <= todayObj.getDate(); d++) {
                      const tempDate = new Date(todayObj.getFullYear(), todayObj.getMonth(), d);
                      if (tempDate.getDay() === 0) {
                        const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(tempDate);
                        if (!existingDates.has(dateStr)) {
                          allRecords.push({
                            _id: `sunday-${dateStr}`,
                            date: dateStr,
                            status: 'Holiday',
                            totalHours: 0
                          });
                        }
                      }
                    }
                    return allRecords.sort((a, b) => new Date(b.date) - new Date(a.date)).map(record => {
                      const rowDate = new Date(record.date);
                      const rowMonth = String(rowDate.getMonth() + 1).padStart(2, '0');
                      const rowDay = String(rowDate.getDate()).padStart(2, '0');
                      const rowKey = `${rowMonth}-${rowDay}`;
                      const isRecordHoliday = companyHolidays[rowKey];
                      const isSunday = rowDate.getDay() === 0;
                      const rowOvertime = record.overtime != null ? parseFloat(record.overtime) : (record.totalHours && record.totalHours > 7.5 ? record.totalHours - 7.5 : 0);
                      return (
                        <tr key={record._id} className="attendance-tr">
                          <td className="attendance-td-date">{formatDate(record.date)}</td>
                          <td className="attendance-td">{formatTime(record.clockIn)}</td>
                          <td className="attendance-td">{formatTime(record.clockOut)}</td>
                          <td className="attendance-td-hours">
                            {record.totalHours
                              ? `${record.totalHours} hrs`
                              : (record.clockIn && !record.clockOut
                                ? <span>{getLiveDuration(record.clockIn)}</span>
                                : '-')}
                          </td>
                          <td className="attendance-td-hours">
                            {record.clockOut
                              ? (rowOvertime > 0 ? `${rowOvertime.toFixed(1)} hrs` : '0 hrs')
                              : (record.clockIn
                                ? <span>{getLiveOvertime(record.clockIn)}</span>
                                : '0 hrs')}
                          </td>
                          <td className="attendance-td">
                            {isSunday && !record.clockIn ? (
                              <span className="attendance-status-badge" style={{ background: 'white', color: 'black' }}>
                                Holiday
                              </span>
                            ) : isRecordHoliday && !record.clockIn ? (
                              <span className="attendance-status-badge" style={{ background: 'white', color: 'black' }}>
                                Company Holiday ({isRecordHoliday})
                              </span>
                            ) : record.status && record.status !== 'Present' ? (
                              <span className="attendance-status-badge" style={{ background: 'white', color: '#d97706' }}>
                                {record.status}
                              </span>
                            ) : record.clockOut ? (
                              record.totalHours >= 7.5 ? (
                                <span className="attendance-status-badge" style={{ background: 'white', color: '#166534' }}>
                                  Full Day
                                </span>
                              ) : (
                                <span className="attendance-status-badge" style={{ background: 'white', color: '#991b1b' }}>
                                  Incomplete ({record.totalHours} ‹ 7.5h)
                                </span>
                              )
                            ) : record.clockIn ? (
                              <span className="attendance-status-badge" style={{ background: 'white', color: '#3730a3' }}>
                                In Progress
                              </span>
                            ) : (
                              <span className="attendance-status-badge" style={{ background: 'white', color: '#6b7280' }}>
                                {record.status || 'Absent'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
      <ChatPanel user={user} />

      {/* Holiday Modal */}
      {showHolidayModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111827' }}>Company Holiday</h3>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Today is <strong>{holidayName}</strong>, You are not required to mark attendance or submit tasks today. Enjoy your day off!
            </p>
            <button
              onClick={() => setShowHolidayModal(false)}
              style={{ background: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
            >
              Got it, Thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
