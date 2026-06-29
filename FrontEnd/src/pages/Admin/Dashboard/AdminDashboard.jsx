import { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../../../config/axiosConfig';
import { socket } from '../../../config/socket';
import { Power, RefreshCw, Briefcase, Filter, ClipboardList, Clock, X, CheckCircle2, Circle, AlertCircle, User, Calendar, Tag, FileText, AlignLeft, Hash, MapPin, MessageSquare, Send, Megaphone, Trash2, Download, FileSpreadsheet, BookOpen } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminDashboard.css';

const formatDate = (ts) => {
  if (!ts) return '—';
  // Already a plain ISO string or YYYY-MM-DD
  if (typeof ts === 'string') return ts;
  const secs = ts._seconds ?? ts.seconds;
  if (secs !== undefined) return new Date(secs * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  try { return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return '—'; }
};

const formatTs = (ms) => {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const LiveWorkingHours = ({ todayHours = 0, totalHours = 0, currentClockIn, className }) => {
  const [liveToday, setLiveToday] = useState(todayHours);
  const [liveTotal, setLiveTotal] = useState(totalHours);

  useEffect(() => {
    if (!currentClockIn) {
      setLiveToday(todayHours);
      setLiveTotal(totalHours);
      return;
    }

    const interval = setInterval(() => {
      const clockInMs = new Date(currentClockIn).getTime();
      const diffHrs = (Date.now() - clockInMs) / (1000 * 60 * 60);
      setLiveToday(todayHours + diffHrs);
      setLiveTotal(totalHours + diffHrs);
    }, 1000);

    return () => clearInterval(interval);
  }, [todayHours, totalHours, currentClockIn]);

  const formatHours = (hrs, showSeconds = false) => {
    if (!showSeconds) return `${hrs.toFixed(2)}h`;
    const h = Math.floor(hrs);
    const m = Math.floor((hrs - h) * 60);
    const s = Math.floor((hrs - h - m / 60) * 3600);
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <span className={`flex items-center gap-1 ${className || ''}`} title={`Total: ${liveTotal.toFixed(2)}h`}>
      <Clock size={11} className={currentClockIn ? "text-green-500 animate-pulse" : ""} />
      {formatHours(liveToday, !!currentClockIn)}
    </span>
  );
};

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empTasks, setEmpTasks] = useState([]);
  const [empTasksLoading, setEmpTasksLoading] = useState(false);
  const [empAttendance, setEmpAttendance] = useState([]);
  const [empAttendanceLoading, setEmpAttendanceLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [allTasks, setAllTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef(null);
  const chatInputRef = useRef(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [adminNotices, setAdminNotices] = useState([]);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticesLoading, setNoticesLoading] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  // Leave Management State
  const [adminLeaves, setAdminLeaves] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const getEmployeeStatus = (emp) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOnLeave = adminLeaves.some(leave => {
      if (leave.userName !== emp.name || leave.status !== 'Approved') return false;
      const start = new Date(leave.startDate?._seconds ? leave.startDate._seconds * 1000 : leave.startDate);
      const end = new Date(leave.endDate?._seconds ? leave.endDate._seconds * 1000 : leave.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
    });

    if (isOnLeave) return 'On Leave';
    if (!emp.isOnline) return 'Offline';

    if (emp.lastActiveAt) {
      const lastActive = new Date(emp.lastActiveAt._seconds ? emp.lastActiveAt._seconds * 1000 : emp.lastActiveAt).getTime();
      if (Date.now() - lastActive > 15 * 60 * 1000) return 'Away';
    }
    return 'Online';
  };

  const exportEmployeesExcel = () => {
    if (!employees || employees.length === 0) return toast.warning('No employees to export');
    const data = employees.map(emp => ({
      Date: formatDate(emp.createdAt),
      Name: emp.name || '',
      Email: emp.email || '',
      Department: emp.department || 'General',
      Role: emp.role || 'employee',
      Status: getEmployeeStatus(emp)
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    XLSX.writeFile(workbook, "employees_list.xlsx");
    setShowDownloadMenu(false);
  };

  const exportEmployeesPDF = () => {
    if (!employees || employees.length === 0) return toast.warning('No employees to export');
    const doc = new jsPDF();
    doc.text("Employees List", 14, 15);
    const tableData = employees.map(emp => [
      formatDate(emp.createdAt),
      emp.name || '',
      emp.email || '',
      emp.department || 'General',
      emp.role || 'employee',
      getEmployeeStatus(emp)
    ]);
    autoTable(doc, {
      head: [['Date', 'Name', 'Email', 'Department', 'Role', 'Status']],
      body: tableData,
      startY: 20
    });
    doc.save("employees_list.pdf");
    setShowDownloadMenu(false);
  };

  const exportTasksExcel = () => {
    if (!selectedEmp) return toast.warning('Please select an employee first');
    if (!empTasks || empTasks.length === 0) return toast.warning('No tasks to export');
    const data = empTasks.map(task => ({
      Title: task.title || '',
      Description: task.description || task.notes || '',
      Status: task.status || '',
      Priority: task.priority || '',
      Date: task.deadline ? formatDate(task.deadline) : '',
      Location: task.location || ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
    XLSX.writeFile(workbook, `${selectedEmp.name.replace(/\s+/g, '_')}_tasks.xlsx`);
    setShowDownloadMenu(false);
  };

  const exportTasksPDF = () => {
    if (!selectedEmp) return toast.warning('Please select an employee first');
    if (!empTasks || empTasks.length === 0) return toast.warning('No tasks to export');
    const doc = new jsPDF();
    doc.text(`${selectedEmp.name} - Tasks`, 14, 15);
    const tableData = empTasks.map(task => [
      task.title || '',
      task.status || '',
      task.priority || '',
      task.deadline ? formatDate(task.deadline) : '',
      task.location || ''
    ]);
    autoTable(doc, {
      head: [['Title', 'Status', 'Priority', 'Date', 'Location']],
      body: tableData,
      startY: 20
    });
    doc.save(`${selectedEmp.name.replace(/\s+/g, '_')}_tasks.pdf`);
    setShowDownloadMenu(false);
  };


  const exportAttendancePDF = () => {
    if (!selectedEmp) return toast.warning('Please select an employee first');
    if (!empAttendance || empAttendance.length === 0) return toast.warning('No attendance records to export');
    const doc = new jsPDF();
    doc.text(`${selectedEmp.name} - Attendance`, 14, 15);
    const tableData = empAttendance.map(record => [
      formatDate(record.date),
      formatTs(record.clockIn).split(', ')[1] || formatTs(record.clockIn) || '—',
      formatTs(record.clockOut).split(', ')[1] || formatTs(record.clockOut) || (record.clockIn ? 'Working...' : '—'),
      (record.totalHours || 0).toFixed(2) + 'h',
      record.status || 'Present'
    ]);
    autoTable(doc, {
      head: [['Date', 'Check In', 'Check Out', 'Total Hrs', 'Status']],
      body: tableData,
      startY: 20
    });
    doc.save(`${selectedEmp.name.replace(/\s+/g, '_')}_attendance.pdf`);
    setShowDownloadMenu(false);
  };

  const exportAllDataExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Employees Sheet
    const empData = employees.map(emp => ({ Date: formatDate(emp.createdAt), Name: emp.name, Email: emp.email, Department: emp.department, Status: getEmployeeStatus(emp) }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(empData), "Employees");

    // Tasks Sheet
    const tasksData = allTasks.map(task => ({
      EmployeeId: typeof task.employeeId === 'string' ? task.employeeId : task.employeeId?._id,
      Title: task.title || '',
      Status: task.status || '',
      Date: task.deadline ? formatDate(task.deadline) : ''
    }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(tasksData), "Tasks");

    // Leaves Sheet
    const leavesData = adminLeaves.map(leave => ({
      EmployeeName: leave.userName || '',
      Type: leave.leaveType || '',
      Status: leave.status || '',
      StartDate: formatDate(leave.startDate),
      EndDate: formatDate(leave.endDate)
    }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(leavesData), "Leaves");

    XLSX.writeFile(workbook, "all_system_data.xlsx");
    setShowDownloadMenu(false);
  };

  const fetchNoticesAdmin = async () => {
    setNoticesLoading(true);
    try {
      const res = await axios.get('/api/notices');
      setAdminNotices(res.data || []);
    } catch (err) {
      toast.error("We couldn't load the notices. Please try again.");
    } finally {
      setNoticesLoading(false);
    }
  };

  const fetchLeavesAdmin = async () => {
    setLeavesLoading(true);
    try {
      const res = await axios.get('/api/leaves/all');
      setAdminLeaves(res.data || []);
    } catch (err) {
      toast.error("We couldn't load the leave requests. Please try again.");
    } finally {
      setLeavesLoading(false);
    }
  };

  const pendingLeavesCount = adminLeaves.filter(l => l.status === 'Pending').length;

  useEffect(() => {
    if (showNoticeModal) fetchNoticesAdmin();
  }, [showNoticeModal]);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    try {
      const res = await axios.post('/api/notices', { title: noticeTitle, content: noticeContent });
      setAdminNotices([res.data, ...adminNotices]);
      setNoticeTitle('');
      setNoticeContent('');
      toast.success('Notice published');
      // Broadcast update could be done here if needed
    } catch (err) {
      toast.error("We couldn't create the notice. Please try again.");
    }
  };

  const handleDeleteNotice = async (id) => {
    try {
      await axios.delete(`/api/notices/${id}`);
      setAdminNotices(adminNotices.filter(n => n.id !== id));
      toast.success('Notice deleted');
    } catch (err) {
      toast.error("We couldn't delete the notice. Please try again.");
    }
  };

  const fetchEmployees = async (showRef = false) => {
    if (showRef) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await axios.get('/api/manager/employees');
      setEmployees(res.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Could not retrieve employee list.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAllTasksSummary = async () => {
    try {
      const res = await axios.get('/api/manager/tasks');
      setAllTasks(res.data || []);
    } catch (err) {
      console.error('Error fetching task summary:', err);
    }
  };

  const fetchEmpData = useCallback(async (emp) => {
    setSelectedEmp(emp);
    setEmpTasks([]);
    setEmpAttendance([]);
    setEmpTasksLoading(true);
    setEmpAttendanceLoading(true);
    try {
      const [tasksRes, attRes] = await Promise.all([
        axios.get(`/api/manager/employee/${emp._id}/tasks`),
        axios.get(`/api/manager/employee/${emp._id}/attendance`)
      ]);
      setEmpTasks(tasksRes.data || []);
      setEmpAttendance(attRes.data || []);
    } catch (err) {
      console.error('Error fetching employee data:', err);
      setEmpTasks([]);
      setEmpAttendance([]);
    } finally {
      setEmpTasksLoading(false);
      setEmpAttendanceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchAllTasksSummary();
    fetchLeavesAdmin();
  }, []);

  useEffect(() => {
    socket.connect();

    const handleTaskUpdated = () => {
      fetchAllTasksSummary();
      if (selectedEmp) {
        fetchEmpData(selectedEmp);
      }
    };

    socket.on('task_updated', handleTaskUpdated);

    return () => {
      socket.off('task_updated', handleTaskUpdated);
      socket.disconnect(); // Disconnect only when the entire dashboard unmounts
    };
  }, [selectedEmp, fetchEmpData]); // Re-bind when selectedEmp changes so fetchEmpData uses the right emp

  // Subscribe to chat messages for selected employee
  useEffect(() => {
    if (!showChatModal || !selectedEmp) return;

    socket.emit('join_room', selectedEmp._id);

    axios.get(`/api/chat/${selectedEmp._id}/messages`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setChatMessages(res.data);
        }
      })
      .catch(err => console.error('Failed to load chat history:', err));

    const handleReceiveMessage = (msg) => {
      setChatMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      // DO NOT disconnect socket here, as we still want task updates!
    };
  }, [showChatModal, selectedEmp]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (showChatModal) {
      setTimeout(() => chatInputRef.current?.focus(), 100);
    }
  }, [showChatModal]);

  useEffect(() => {
    if (!showChatModal) {
      setChatMessages([]);
      setChatInput('');
    }
  }, [showChatModal, setChatMessages, setChatInput]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    } catch (err) {
      console.error(err);
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
  };

  const departments = ['All', ...new Set(employees.map(e => e.department).filter(Boolean))];

  const filteredEmployees = employees.filter(e => {
    const matchSearch =
      e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = filterDept === 'All' || e.department === filterDept;
    const empStatus = getEmployeeStatus(e);
    const matchStatus = filterStatus === 'All' || empStatus === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  // Pre-compute task counts per employee from the all-tasks summary
  const taskCountMap = {};
  allTasks.forEach(t => {
    const id = typeof t.employeeId === 'string' ? t.employeeId : t.employeeId?._id;
    if (!id) return;
    if (!taskCountMap[id]) taskCountMap[id] = { total: 0, completed: 0, active: 0 };
    taskCountMap[id].total++;
    if (t.status === 'Completed') taskCountMap[id].completed++;
    else taskCountMap[id].active++;
  });

  const locationMap = {};
  allTasks.forEach(t => {
    const id = typeof t.employeeId === 'string' ? t.employeeId : t.employeeId?._id;
    if (!id || !t.location) return;

    let ts = 0;
    if (t.createdAt) {
      ts = typeof t.createdAt === 'number' ? t.createdAt : (t.createdAt._seconds ? t.createdAt._seconds * 1000 : new Date(t.createdAt).getTime());
    }

    if (!locationMap[id] || ts > locationMap[id].ts) {
      locationMap[id] = { location: t.location, ts };
    }
  });

  const handleSendChatMessage = async (e) => {
    e?.preventDefault();
    const text = chatInput.trim();
    if (!text || sendingChat || !selectedEmp) return;

    setSendingChat(true);
    setChatInput('');

    socket.emit('send_message', {
      roomId: selectedEmp._id,
      text,
      senderId: 'admin',
      senderName: user.name || 'Admin',
      senderRole: 'admin',
    });

    setSendingChat(false);
    chatInputRef.current?.focus();
  };

  const formatChatTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatChatDateLabel = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const groupedChatMessages = [];
  let lastLabel = null;
  chatMessages.forEach((msg) => {
    const label = msg.createdAt ? formatChatDateLabel(msg.createdAt) : '';
    if (label && label !== lastLabel) {
      groupedChatMessages.push({ type: 'date', label });
      lastLabel = label;
    }
    groupedChatMessages.push({ type: 'msg', msg });
  });
  const statusClass = { Pending: 'status-pending', 'In Progress': 'status-inprogress', Completed: 'status-completed' };
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;

  return (
    <div className="admin-dashboard-container">
      {/* ── LEFT SIDEBAR ── */}
      <aside className={`admin-sidebar-pane ${!showMobileSidebar ? 'mobile-hidden' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title-wrapper">
            <img src="/ems-logo.png" alt="EMS Logo" style={{ height: '60px', objectFit: 'contain' }} />
            <h2>Employee Directory</h2>
          </div>
        </div>

        <div className="search-filter-section">
          <div className="search-input-wrapper">
            <input type="text" placeholder="Search by name, email…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-field" />
          </div>
          <div className="filter-dropdown-wrapper">
            <Filter className="filter-icon" size={14} />
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="dept-select">
              {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>
          <div className="filter-dropdown-wrapper" style={{ marginTop: '8px' }}>
            <Filter className="filter-icon" size={14} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="dept-select">
              <option value="All">All Statuses</option>
              <option value="Online">Online</option>
              <option value="Away">Away</option>
              <option value="Offline">Offline</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
        </div>

        <div className="status-legend" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px 1.5rem', borderBottom: '1px solid var(--border-light)', fontSize: '11px', color: 'var(--text-gray)', background: '#f8fafc', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Logged in and active"><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Online</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Inactive for 15+ mins"><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span> Away</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Offline or logged out"><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></span> Offline</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="On approved leave"><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span> On Leave</div>
        </div>

        <div className="presence-lists-scrollable">
          {loading ? (
            <div className="pane-loader">
              <RefreshCw className="spinner-icon animate-spin" size={24} />
              <p>Syncing directory…</p>
            </div>
          ) : error ? (
            <div className="pane-error">
              <p>{error}</p>
              <button onClick={() => fetchEmployees(true)} className="retry-btn">Retry</button>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="pane-empty"><p>No employees match the filters.</p></div>
          ) : (
            <div className="emp-card-grid">
              {filteredEmployees.map(emp => {
                const isSelected = selectedEmp?._id === emp._id;
                const status = getEmployeeStatus(emp);
                const statusClass = status === 'Online' ? 'online' : status === 'Away' ? 'away' : status === 'On Leave' ? 'on-leave' : 'offline';
                return (
                  <div
                    key={emp._id}
                    className={`emp-card ${isSelected ? 'emp-card--selected' : ''} emp-card--${statusClass}`}
                    onClick={() => { fetchEmpData(emp); setShowMobileSidebar(false); setActiveTab('tasks'); }}
                    title={`Status: ${status}`}
                  >
                    <div className="emp-card-top">
                      <div className="emp-card-avatar-wrap">
                        <div className={`emp-card-avatar avatar-${statusClass}`} style={{ overflow: 'hidden' }}>
                          {emp.profilePic ? (
                            <img src={emp.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            getInitials(emp.name)
                          )}
                        </div>
                        <span className={`emp-card-status-dot dot-${statusClass}`} title={status}></span>
                      </div>
                      <div className="emp-card-info">
                        <span className="emp-card-name">{emp.name}</span>
                        <span className="emp-card-dept flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Briefcase size={11} className="inline-icon" />
                            {emp.department || 'General'}
                          </span>
                          <LiveWorkingHours todayHours={emp.todayWorkingHours} totalHours={emp.totalWorkingHours} currentClockIn={emp.currentClockIn} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200 shadow-sm" />
                        </span>
                      </div>

                      {/* Latest Location Badge (only for online employees) */}
                      {emp.isOnline && locationMap[emp._id]?.location && (
                        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-1000 self-center" title={locationMap[emp._id].location}>
                          <MapPin size={12} className="shrink-0" />
                          <span className="truncate max-w-[80px]">{locationMap[emp._id].location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN PANE ── */}
      <main className="admin-main-pane">
        {/* Header */}
        <header className="main-pane-header">
          <div className="admin-identity flex items-center gap-2">
            <button className="mobile-menu-toggle mr-2 block lg:hidden" onClick={() => setShowMobileSidebar(!showMobileSidebar)}>
              <AlignLeft size={20} />
            </button>

            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', overflow: 'hidden', flexShrink: 0
            }}>
              {user.profilePic ? (
                <img src={user.profilePic} alt="Admin Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (user.name || 'A').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3>Asia Softlab Employee's</h3>
              <p>{user.email}</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="refresh-btn"
              onClick={() => navigate('/admin/leaves')}
              title="Manage Leaves"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'auto', padding: '0 12px', position: 'relative' }}
            >
              <Calendar size={16} /> Leaves
              {pendingLeavesCount > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                  {pendingLeavesCount}
                </span>
              )}
            </button>
            <button
              className="refresh-btn"
              onClick={() => setShowNoticeModal(true)}
              title="Manage Notices"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'auto', padding: '0 12px' }}
            >
              <Megaphone size={16} /> Notices
            </button>
            <button
              className="refresh-btn"
              onClick={() => navigate('/readme')}
              title="View Policies"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'auto', padding: '0 12px' }}
            >
              <BookOpen size={16} /> Policy
            </button>
            <div style={{ position: 'relative' }}>
              <button
                className="refresh-btn"
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                title="Download Data"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'auto', padding: '0 12px' }}
              >
                <Download size={16} /> Download
              </button>
              {showDownloadMenu && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', zIndex: 50, minWidth: '220px', overflow: 'hidden' }}>
                  <button
                    onClick={exportEmployeesExcel}
                    style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseOver={(e) => e.target.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                  >
                    <FileSpreadsheet size={14} color="#10b981" /> Employees (Excel)
                  </button>
                  <button
                    onClick={exportEmployeesPDF}
                    style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseOver={(e) => e.target.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                  >
                    <FileText size={14} color="#ef4444" /> Employees (PDF)
                  </button>
                  <button
                    onClick={exportTasksExcel}
                    disabled={!selectedEmp}
                    style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid #e2e8f0', cursor: !selectedEmp ? 'not-allowed' : 'pointer', fontSize: '13px', color: !selectedEmp ? '#94a3b8' : '#334155', display: 'flex', alignItems: 'center', gap: '8px', opacity: !selectedEmp ? 0.6 : 1 }}
                    onMouseOver={(e) => !selectedEmp ? null : e.target.style.background = '#f8fafc'}
                    onMouseOut={(e) => !selectedEmp ? null : e.target.style.background = 'transparent'}
                  >
                    <FileSpreadsheet size={14} color="#10b981" /> Selected Employee (Excel)
                  </button>
                  <button
                    onClick={exportTasksPDF}
                    disabled={!selectedEmp}
                    style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid #e2e8f0', cursor: !selectedEmp ? 'not-allowed' : 'pointer', fontSize: '13px', color: !selectedEmp ? '#94a3b8' : '#334155', display: 'flex', alignItems: 'center', gap: '8px', opacity: !selectedEmp ? 0.6 : 1 }}
                    onMouseOver={(e) => !selectedEmp ? null : e.target.style.background = '#f8fafc'}
                    onMouseOut={(e) => !selectedEmp ? null : e.target.style.background = 'transparent'}
                  >
                    <FileText size={14} color="#ef4444" /> Selected Employee (PDF)
                  </button>
                  <button
                    onClick={exportAllDataExcel}
                    style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseOver={(e) => e.target.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                  >
                    <FileSpreadsheet size={14} color="#10b981" /> All Data (Excel)
                  </button>
                </div>
              )}
            </div>
            <button
              className={`refresh-btn ${refreshing ? 'loading' : ''}`}
              onClick={() => { fetchEmployees(true); fetchAllTasksSummary(); if (selectedEmp) fetchEmpTasks(selectedEmp); }}
              disabled={refreshing || loading}
              title="Refresh"
            >
              <RefreshCw className={refreshing ? 'animate-spin' : ''} size={18} />
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <Power size={18} />
              Logout
            </button>
          </div>
        </header>

        {/* Tasks Panel */}
        {!selectedEmp ? (
          <div className="tasks-empty-state">
            <div className="tasks-empty-icon-wrap">
              <User size={40} strokeWidth={1.5} />
            </div>
            <h3>Select an Employee</h3>
            <p>Click any employee card on the left to view their submitted tasks.</p>
          </div>
        ) : (
          <section className="tasks-section">
            {/* Tasks Section Header */}
            <div className="tasks-section-header">
              <div className="tasks-section-title">
                <div className={`tasks-header-avatar ${selectedEmp.isOnline ? 'avatar-present' : 'avatar-absent'}`} style={{ overflow: 'hidden' }}>
                  {selectedEmp.profilePic ? (
                    <img src={selectedEmp.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(selectedEmp.name)
                  )}
                </div>
                <div>
                  <h2>{selectedEmp.name}</h2>
                  <div className="tasks-header-sub flex items-center gap-2 flex-wrap">
                    <span>{selectedEmp.email} · {selectedEmp.department || 'General'}</span>
                  </div>
                </div>
                <span className="tasks-count-badge">{empTasksLoading ? '…' : empTasks.length} tasks</span>
              </div>
              <div className="tasks-header-actions">
                <button className="chat-with-btn" title={`Send Notification to ${selectedEmp.name}`} onClick={() => setShowChatModal(true)}>
                  <MessageSquare size={14} className="inline-icon" />
                  Chat
                </button>
                <button className="tasks-close-btn" onClick={() => { setSelectedEmp(null); setEmpTasks([]); setEmpAttendance([]); }} title="Close">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="emp-tabs" style={{ display: 'flex', gap: '1.5rem', padding: '0 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
              <button
                className={`emp-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => setActiveTab('tasks')}
                style={{ padding: '0.75rem 0', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'tasks' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'tasks' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'tasks' ? '600' : '500' }}
              >
                Tasks ({empTasks.length})
              </button>
              <button
                className={`emp-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                onClick={() => setActiveTab('attendance')}
                style={{ padding: '0.75rem 0', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'attendance' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'attendance' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'attendance' ? '600' : '500' }}
              >
                Attendance Records ({empAttendance.length})
              </button>
              {activeTab === 'attendance' && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <button
                    onClick={() => {
                      // We can use a simple prompt or just create a mini dropdown here, 
                      // but since we have two formats (Excel and PDF), we can provide a small dropdown
                      const menu = document.getElementById('attendance-download-menu');
                      if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', color: '#334155', cursor: 'pointer', fontWeight: '500' }}
                  >
                    <Download size={14} /> Download
                  </button>
                  <div id="attendance-download-menu" style={{ display: 'none', position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '150px', overflow: 'hidden' }}>
                    <button
                      onClick={(e) => { e.target.parentElement.style.display = 'none'; exportAttendancePDF(); }}
                      style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onMouseOver={(e) => e.target.style.background = '#f8fafc'}
                      onMouseOut={(e) => e.target.style.background = 'transparent'}
                    >
                      <FileText size={12} color="#ef4444" /> PDF Format
                    </button>
                  </div>
                </div>
              )}
              {activeTab === 'tasks' && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <button
                    onClick={() => {
                      const menu = document.getElementById('tasks-download-menu');
                      if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', color: '#334155', cursor: 'pointer', fontWeight: '500' }}
                  >
                    <Download size={14} /> Download
                  </button>
                  <div id="tasks-download-menu" style={{ display: 'none', position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '150px', overflow: 'hidden' }}>

                    <button
                      onClick={(e) => { e.target.parentElement.style.display = 'none'; exportTasksPDF(); }}
                      style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onMouseOver={(e) => e.target.style.background = '#f8fafc'}
                      onMouseOut={(e) => e.target.style.background = 'transparent'}
                    >
                      <FileText size={12} color="#ef4444" /> PDF Format
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tasks Body */}
            {activeTab === 'tasks' && (
              empTasksLoading ? (
                <div className="tasks-loader">
                  <RefreshCw className="spinner-icon animate-spin" size={22} />
                  <p>Loading tasks…</p>
                </div>
              ) : empTasks.length === 0 ? (
                <div className="tasks-empty">
                  <AlertCircle size={32} className="tasks-empty-icon" />
                  <p>No tasks submitted by this employee yet.</p>
                </div>
              ) : (
                <div className="tasks-table-wrapper">
                  <table className="tasks-table">
                    <thead>
                      <tr>
                        <th>Task Title</th>
                        <th>Description</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Total Working Hrs</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empTasks.map((task, index) => {
                        // title fallback: if stored title is a plain date string, show description instead
                        const displayTitle = task.title && !/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/.test(task.title)
                          ? task.title
                          : (task.description || task.notes || task.title || '—');
                        return (
                          <tr key={task._id} className="tasks-row tasks-row--clickable" onClick={() => setSelectedTask(task)}>
                            <td className="task-title-cell">{displayTitle}</td>
                            <td className="task-desc-cell">{task.description || task.notes || '—'}</td>
                            <td className="task-location-cell">
                              {task.location ? (
                                <span className="task-location-tag">
                                  <MapPin size={11} />
                                  {task.location}
                                </span>
                              ) : '—'}
                            </td>
                            <td>
                              <span className={`task-status-badge ${statusClass[task.status] || 'status-pending'}`}>
                                {task.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <LiveWorkingHours
                                  todayHours={task.todayWorkingHours || 0}
                                  totalHours={0}
                                  currentClockIn={task.currentClockIn}
                                  className="task-working-hours-badge"
                                />
                                {index === 0 && <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Today</span>}
                              </div>
                            </td>

                            <td className="task-date-cell">
                              <Clock size={12} className="inline-icon" />
                              {formatDate(task.deadline)}
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}

            {/* Attendance Body */}
            {activeTab === 'attendance' && (
              empAttendanceLoading ? (
                <div className="tasks-loader">
                  <RefreshCw className="spinner-icon animate-spin" size={22} />
                  <p>Loading attendance…</p>
                </div>
              ) : empAttendance.length === 0 ? (
                <div className="tasks-empty">
                  <AlertCircle size={32} className="tasks-empty-icon" />
                  <p>No attendance records for this employee yet.</p>
                </div>
              ) : (
                <div className="tasks-table-wrapper">
                  <table className="tasks-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Total Hrs</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empAttendance.map((record) => (
                        <tr key={record._id} className="tasks-row">
                          <td className="task-date-cell" style={{ fontWeight: '600' }}>
                            <Calendar size={12} className="inline-icon" style={{ marginRight: '4px' }} />
                            {formatDate(record.date)}
                          </td>
                          <td>{formatTs(record.clockIn).split(', ')[1] || formatTs(record.clockIn) || '—'}</td>
                          <td>{formatTs(record.clockOut).split(', ')[1] || formatTs(record.clockOut) || (record.clockIn ? 'Working...' : '—')}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {record.clockIn && !record.clockOut ? (
                                <LiveWorkingHours
                                  todayHours={record.totalHours || 0}
                                  totalHours={0}
                                  currentClockIn={record.clockIn}
                                  className="task-working-hours-badge"
                                />
                              ) : (
                                <span className="task-working-hours-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                                  {(record.totalHours || 0).toFixed(2)}h
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`task-status-badge ${record.status === 'Present' ? 'status-completed' : record.status === 'Holiday' ? 'status-inprogress' : 'status-pending'}`}>
                              {record.status || 'Present'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

          </section>
        )}
      </main>

      {/* ── TASK DETAIL MODAL ── */}
      {selectedTask && (
        <div className="task-modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="task-modal" onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="task-modal-header">
              <div className="task-modal-header-left">
                <div className="task-modal-icon">
                  <FileText size={18} />
                </div>
                <div>
                  <h2 className="task-modal-title">{selectedTask.title || 'Untitled Task'}</h2>
                  <p className="task-modal-emp">{selectedEmp?.name} · {selectedEmp?.department || 'General'}</p>
                </div>
              </div>
              <button className="task-modal-close" onClick={() => setSelectedTask(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Badges Row */}
            <div className="task-modal-badges">
              <span className={`task-status-badge ${statusClass[selectedTask.status] || 'status-pending'}`}>
                {selectedTask.status}
              </span>
            </div>

            {/* Body */}
            <div className="task-modal-body">

              {/* Description / Notes */}
              <div className="task-modal-section">
                <div className="task-modal-section-label">
                  <AlignLeft size={14} />
                  Description
                </div>
                <p className="task-modal-description">
                  {selectedTask.description || selectedTask.notes || 'No description provided.'}
                </p>
              </div>

              {/* Subtasks */}
              {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                <div className="task-modal-section">
                  <div className="task-modal-section-label">
                    <Hash size={14} />
                    Checklist
                    <span className="task-modal-sub-count">
                      {selectedTask.subtasks.filter(s => s.completed).length}/{selectedTask.subtasks.length}
                    </span>
                  </div>
                  <div className="task-modal-subtasks">
                    {selectedTask.subtasks.map((sub, i) => (
                      <div key={sub.id || i} className={`task-modal-subtask ${sub.completed ? 'subtask--done' : ''}`}>
                        <div className={`subtask-checkbox ${sub.completed ? 'subtask-checkbox--checked' : ''}`}>
                          {sub.completed && <CheckCircle2 size={14} />}
                        </div>
                        <span>{sub.text}</span>
                      </div>
                    ))}
                  </div>
                  {/* Subtask progress bar */}
                  <div className="task-modal-progress-wrap">
                    <div className="task-modal-progress-bar">
                      <div
                        className="task-modal-progress-fill"
                        style={{ width: `${(selectedTask.subtasks.filter(s => s.completed).length / selectedTask.subtasks.length) * 100}%` }}
                      />
                    </div>
                    <span className="task-modal-progress-label">
                      {Math.round((selectedTask.subtasks.filter(s => s.completed).length / selectedTask.subtasks.length) * 100)}% complete
                    </span>
                  </div>
                </div>
              )}

              {/* Notes (separate from description) */}
              {selectedTask.notes && selectedTask.notes !== selectedTask.description && (
                <div className="task-modal-section">
                  <div className="task-modal-section-label">
                    <Tag size={14} />
                    Notes
                  </div>
                  <p className="task-modal-notes">{selectedTask.notes}</p>
                </div>
              )}

              {/* Meta Grid */}
              <div className="task-modal-meta-grid">
                <div className="task-modal-meta-item">
                  <span className="meta-label">
                    <Calendar size={13} />
                    Date
                  </span>
                  <span className="meta-value">{formatDate(selectedTask.deadline) || '—'}</span>
                </div>
                <div className="task-modal-meta-item">
                  <span className="meta-label">
                    <MapPin size={13} />
                    Location
                  </span>
                  <span className="meta-value">{selectedTask.location || '—'}</span>
                </div>
                <div className="task-modal-meta-item">
                  <span className="meta-label">
                    <Clock size={13} />
                    Created
                  </span>
                  <span className="meta-value">{formatTs(selectedTask.createdAt)}</span>
                </div>
                <div className="task-modal-meta-item">
                  <span className="meta-label">
                    <Clock size={13} />
                    Last Updated
                  </span>
                  <span className="meta-value">{formatTs(selectedTask.updatedAt)}</span>
                </div>
                <div className="task-modal-meta-item">
                  <span className="meta-label">
                    <User size={13} />
                    Employee
                  </span>
                  <span className="meta-value">{selectedTask.employeeName || selectedEmp?.name || '—'}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="task-modal-footer">
              <button className="task-modal-dismiss" onClick={() => setSelectedTask(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REAL-TIME CHAT SIDE PANEL ── */}
      {showChatModal && selectedEmp && (
        <div className="admin-chat-overlay" onClick={() => setShowChatModal(false)}>
          <div className="admin-chat-panel" onClick={e => e.stopPropagation()}>
            {/* Panel Header */}
            <div className="admin-chat-header">
              <div className="admin-chat-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                {selectedEmp.profilePic ? (
                  <img src={selectedEmp.profilePic} alt={selectedEmp.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  getInitials(selectedEmp.name)
                )}
              </div>
              <div className="admin-chat-header-info">
                <h3>{selectedEmp.name}</h3>
                <p>{selectedEmp.email}</p>
              </div>
              <button className="admin-chat-close" onClick={() => setShowChatModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="admin-chat-messages">
              {groupedChatMessages.length === 0 && (
                <div className="admin-chat-empty">
                  <MessageSquare size={32} strokeWidth={1.5} />
                  <p>No messages yet. Say hello!</p>
                </div>
              )}
              {groupedChatMessages.map((item, idx) => {
                if (item.type === 'date') {
                  return (
                    <div key={`dl-${idx}`} className="admin-chat-date-label">
                      <span>{item.label}</span>
                    </div>
                  );
                }
                const { msg } = item;
                const isSelf = msg.senderRole === 'admin';
                return (
                  <div key={msg.id} className={`admin-chat-bubble-row ${isSelf ? 'admin-bubble-self' : 'admin-bubble-other'}`}>
                    {!isSelf && (
                      <div className="admin-chat-bubble-avatar">
                        {(msg.senderName || 'E')[0].toUpperCase()}
                      </div>
                    )}
                    <div className={`admin-chat-bubble ${isSelf ? 'admin-chat-bubble--self' : 'admin-chat-bubble--other'}`}>
                      <p>{msg.text}</p>
                      <span>{formatChatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Input bar */}
            <form className="admin-chat-input-bar" onSubmit={handleSendChatMessage}>
              <textarea
                ref={chatInputRef}
                className="admin-chat-input"
                placeholder="Type a message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChatMessage(); } }}
                rows={1}
                disabled={sendingChat}
              />
              <button
                type="submit"
                className={`admin-chat-send-btn ${chatInput.trim() ? 'admin-chat-send-btn--active' : ''}`}
                disabled={!chatInput.trim() || sendingChat}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
      {/* ── MANAGE NOTICES MODAL ── */}
      {showNoticeModal && (
        <div className="task-modal-overlay" onClick={() => setShowNoticeModal(false)}>
          <div className="task-modal" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div className="task-modal-header">
              <div className="task-modal-header-left">
                <div className="task-modal-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                  <Megaphone size={18} />
                </div>
                <div>
                  <h2 className="task-modal-title">Notice Board Management</h2>
                  <p className="task-modal-emp">Broadcast announcements to all employees</p>
                </div>
              </div>
              <button className="task-modal-close" onClick={() => setShowNoticeModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="task-modal-body" style={{ overflowY: 'auto', padding: '20px' }}>
              <form onSubmit={handleCreateNotice} style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#334155' }}>Create New Notice</h3>
                <input
                  type="text"
                  placeholder="Notice Title"
                  value={noticeTitle}
                  onChange={e => setNoticeTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', outline: 'none', fontSize: '13px' }}
                  required
                />
                <textarea
                  placeholder="Notice Content"
                  value={noticeContent}
                  onChange={e => setNoticeContent(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', outline: 'none', fontSize: '13px', minHeight: '80px', resize: 'vertical' }}
                  required
                />
                <button type="submit" style={{ background: '#0f172a', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                  Publish Notice
                </button>
              </form>

              <h3 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#334155' }}>Recent Notices</h3>
              {noticesLoading ? (
                <p style={{ fontSize: '12px', color: '#64748b' }}>Loading...</p>
              ) : adminNotices.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#64748b' }}>No notices published yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {adminNotices.map(notice => (
                    <div key={notice.id} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', position: 'relative' }}>
                      <button
                        onClick={() => handleDeleteNotice(notice.id)}
                        style={{ position: 'absolute', top: '15px', right: '15px', background: '#fef2f2', color: '#ef4444', border: 'none', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="Delete Notice"
                      >
                        <Trash2 size={14} />
                      </button>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginBottom: '5px', paddingRight: '30px' }}>{notice.title}</h4>
                      <p style={{ fontSize: '12px', color: '#475569', marginBottom: '10px', whiteSpace: 'pre-wrap' }}>{notice.content}</p>
                      <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>
                        {formatDate(notice.createdAt)} • By {notice.authorName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
