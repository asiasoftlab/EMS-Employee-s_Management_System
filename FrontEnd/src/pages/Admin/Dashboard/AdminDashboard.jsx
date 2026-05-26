import { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../../../config/axiosConfig';
import { socket } from '../../../config/socket';
import { Power, RefreshCw, Briefcase, Filter, ClipboardList, Clock, X, CheckCircle2, Circle, AlertCircle, User, Calendar, Tag, FileText, AlignLeft, Hash, MapPin, MessageSquare, Send } from 'lucide-react';
import { toast } from 'react-toastify';
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

export default function AdminDashboard({ user }) {
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empTasks, setEmpTasks] = useState([]);
  const [empTasksLoading, setEmpTasksLoading] = useState(false);
  const [allTasks, setAllTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef(null);
  const chatInputRef = useRef(null);

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

  const fetchEmpTasks = useCallback(async (emp) => {
    setSelectedEmp(emp);
    setEmpTasks([]);
    setEmpTasksLoading(true);
    try {
      const res = await axios.get(`/api/manager/employee/${emp._id}/tasks`);
      setEmpTasks(res.data || []);
    } catch (err) {
      console.error('Error fetching employee tasks:', err);
      setEmpTasks([]);
    } finally {
      setEmpTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchAllTasksSummary();
  }, []);

  useEffect(() => {
    socket.connect();
    
    const handleTaskUpdated = () => {
      fetchAllTasksSummary();
      if (selectedEmp) {
        fetchEmpTasks(selectedEmp);
      }
    };
    
    socket.on('task_updated', handleTaskUpdated);
    
    return () => {
      socket.off('task_updated', handleTaskUpdated);
      socket.disconnect(); // Disconnect only when the entire dashboard unmounts
    };
  }, [selectedEmp, fetchEmpTasks]); // Re-bind when selectedEmp changes so fetchEmpTasks uses the right emp

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
    } else {
      setChatMessages([]);
      setChatInput('');
    }
  }, [showChatModal]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    } catch (err) {
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
    return matchSearch && matchDept;
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
  const priorityClass = { High: 'priority-high', Medium: 'priority-medium', Low: 'priority-low' };
  const priorityColor = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

  

  return (
    <div className="admin-dashboard-container">
      {/* ── LEFT SIDEBAR ── */}
      <aside className="admin-sidebar-pane">
        <div className="sidebar-header">
          <div className="sidebar-title-wrapper">
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
                const counts = taskCountMap[emp._id] || { total: 0, completed: 0, active: 0 };
                const isSelected = selectedEmp?._id === emp._id;
                return (
                  <div
                    key={emp._id}
                    className={`emp-card ${isSelected ? 'emp-card--selected' : ''} ${emp.isOnline ? 'emp-card--online' : 'emp-card--offline'}`}
                    onClick={() => fetchEmpTasks(emp)}
                    title={`View ${emp.name}'s tasks`}
                  >
                    <div className="emp-card-top">
                      <div className="emp-card-avatar-wrap">
                        <div className={`emp-card-avatar ${emp.isOnline ? 'avatar-present' : 'avatar-absent'}`}>
                          {getInitials(emp.name)}
                        </div>
                        <span className={`emp-card-status-dot ${emp.isOnline ? 'dot-online' : 'dot-offline'}`}></span>
                      </div>
                      <div className="emp-card-info">
                        <span className="emp-card-name">{emp.name}</span>
                        <span className="emp-card-dept">
                          <Briefcase size={11} className="inline-icon" />
                          {emp.department || 'General'}
                        </span>
                      </div>
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
          <div className="admin-identity">
            <div>
              <h3>Asia Softlab Employee's</h3>
              <p>{user.email}</p>
            </div>
          </div>
          <div className="header-actions">
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
                <div className={`tasks-header-avatar ${selectedEmp.isOnline ? 'avatar-present' : 'avatar-absent'}`}>
                  {getInitials(selectedEmp.name)}
                </div>
                <div>
                  <h2>{selectedEmp.name}</h2>
                  <p className="tasks-header-sub">{selectedEmp.email} · {selectedEmp.department || 'General'}</p>
                </div>
                <span className="tasks-count-badge">{empTasksLoading ? '…' : empTasks.length} tasks</span>
              </div>
              <div className="tasks-header-actions">
                <button className="chat-with-btn" title={`Send Notification to ${selectedEmp.name}`} onClick={() => setShowChatModal(true)}>
                  <MessageSquare size={14} className="inline-icon" />
                  Chat
                </button>
                <button className="tasks-close-btn" onClick={() => { setSelectedEmp(null); setEmpTasks([]); }} title="Close">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Tasks Body */}
            {empTasksLoading ? (
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
                      <th>Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empTasks.map(task => {
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
              <span className={`task-priority-badge ${priorityClass[selectedTask.priority] || 'priority-medium'}`}>
                {selectedTask.priority || 'Medium'} Priority
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
                    Due Date
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
              <div className="admin-chat-avatar">
                {getInitials(selectedEmp.name)}
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
    </div>
  );
}
