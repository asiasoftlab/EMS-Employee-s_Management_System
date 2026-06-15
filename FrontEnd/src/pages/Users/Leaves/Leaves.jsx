import { useState, useEffect } from 'react';
import { Sidebar } from '../../../components/UserLayout/LayoutComponents';
import { RefreshCw, Plus, X, Calendar as CalendarIcon, FileText } from 'lucide-react';
import axios from '../../../config/axiosConfig';
import { toast } from 'react-toastify';
import '../Tasks/Tasks.css';
import './Leaves.css';

export default function Leaves({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState(null);

  const [formData, setFormData] = useState({
    leaveType: 'Casual',
    startDate: '',
    endDate: '',
    reason: '',
    halfDayShift: 'FirstHalf'
  });

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/leaves');
      setLeaves(data || []);
    } catch (err) {
      console.error(err);
      toast.error("We couldn't load your leave history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeaves();
    }
  }, [user]);

  const getTodayString = () => {
    const d = new Date();
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'leaveType' && value === 'HalfDay') {
        newData.endDate = newData.startDate;
        if (!newData.halfDayShift) newData.halfDayShift = 'FirstHalf';
      }
      if (name === 'startDate' && newData.leaveType === 'HalfDay') {
        newData.endDate = value;
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please fill out all the required fields to proceed.');
      return;
    }

    const todayStr = getTodayString();
    if (formData.startDate < todayStr) {
      toast.error('The start date must be today or in the future.');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('The end date must be after your start date.');
      return;
    }

    const reqStart = new Date(formData.startDate);
    const reqEnd = new Date(formData.endDate);

    // Check if they only selected Sundays
    let hasWorkingDays = false;
    for (let d = new Date(reqStart); d <= reqEnd; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0) {
        hasWorkingDays = true;
        break;
      }
    }

    if (!hasWorkingDays) {
      toast.error('Nice try! 😅 Sunday is already a holiday, go enjoy your weekend! 🌴', {
        icon: '😂'
      });
      return;
    }

    // Overlap checking (skip checking against the leave being edited)
    const hasOverlap = leaves.some(leave => {
      if (leave.status === 'Rejected') return false;
      if (editingLeaveId && leave._id === editingLeaveId) return false;
      const existingStart = new Date(leave.startDate);
      const existingEnd = new Date(leave.endDate);
      const newStart = new Date(formData.startDate);
      const newEnd = new Date(formData.endDate);
      return newStart <= existingEnd && newEnd >= existingStart;
    });

    if (hasOverlap) {
      toast.error("It looks like you've already requested a leave during these dates.");
      return;
    }

    const startObj = new Date(formData.startDate);
    const startMonth = startObj.getMonth();
    const startYear = startObj.getFullYear();

    // Specific rules
    if (formData.leaveType === 'Casual') {
      const todayObj = new Date(todayStr);
      const daysDiff = (startObj - todayObj) / (1000 * 60 * 60 * 24);
      if (daysDiff < 3) {
        toast.error('Please request casual leaves at least 3 days in advance.');
        return;
      }

      const casualLeavesThisMonth = leaves.filter(leave => {
        if (leave.status === 'Rejected' || leave.leaveType !== 'Casual') return false;
        if (editingLeaveId && leave._id === editingLeaveId) return false;
        const leaveMonth = new Date(leave.startDate).getMonth();
        const leaveYear = new Date(leave.startDate).getFullYear();
        return leaveMonth === startMonth && leaveYear === startYear;
      });

      if (casualLeavesThisMonth.length >= 1) {
        toast.error("You've already used your casual leave for this month.");
        return;
      }
    }

    setActionLoading(true);
    try {
      if (editingLeaveId) {
        await axios.put(`/api/leaves/${editingLeaveId}`, formData);
        toast.success('Leave updated successfully!');
      } else {
        await axios.post('/api/leaves', formData);
        toast.success('Leave applied successfully!');
      }
      setModalOpen(false);
      setEditingLeaveId(null);
      setFormData({
        leaveType: 'Casual',
        startDate: '',
        endDate: '',
        reason: '',
        halfDayShift: 'FirstHalf'
      });
      fetchLeaves();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || (editingLeaveId ? "We couldn't update your leave request. Please try again." : "We couldn't submit your leave request. Please try again."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (leave) => {
    setEditingLeaveId(leave._id);
    setFormData({
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      halfDayShift: leave.halfDayShift || 'FirstHalf'
    });
    setModalOpen(true);
  };

  const handleCancelLeave = (leaveId) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#1e293b' }}>
            Are you sure you want to cancel this leave request?
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={async () => {
                closeToast();
                try {
                  await axios.delete(`/api/leaves/${leaveId}`);
                  toast.success('Leave cancelled successfully');
                  fetchLeaves();
                } catch (err) {
                  console.error(err);
                  toast.error(err.response?.data?.message || "We couldn't cancel your leave request. Please try again.");
                }
              }}
              style={{ padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Yes, Cancel
            </button>
            <button
              onClick={closeToast}
              style={{ padding: '4px 12px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              No
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved': return 'leave-status-approved';
      case 'Rejected': return 'leave-status-rejected';
      default: return 'leave-status-pending';
    }
  };

  if (!user) return null;

  // Calculate Leave Stats
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  let totalLeavesThisYear = 0;
  let casualLeavesThisMonth = 0;
  let unpaidLeaves = 0;

  leaves.forEach(leave => {
    if (leave.status === 'Rejected') return;
    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);

    let days = 0;
    if (leave.leaveType === 'HalfDay') {
      // HalfDay is always single day
      if (leaveStart.getDay() !== 0) days = 0.5;
    } else {
      for (let d = new Date(leaveStart); d <= leaveEnd; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0) { // 0 is Sunday
          days += 1;
        }
      }
    }

    if (days === 0) return; // if all days were Sundays, don't count

    if (leaveStart.getFullYear() === currentYear) {
      totalLeavesThisYear += days;
    }

    if (leave.leaveType === 'Casual' && leaveStart.getMonth() === currentMonth && leaveStart.getFullYear() === currentYear) {
      casualLeavesThisMonth += days;
    }
  });

  if (totalLeavesThisYear > 12) {
    unpaidLeaves = totalLeavesThisYear - 12;
  }

  return (
    <div className="dashboard-container">
      <Sidebar user={user} />
      <main className="main-dashboard">
        <header className="leaves-header">
          <div>
            <h1 className="leaves-header-title">Leave Management</h1>
            <p className="leaves-header-subtitle">Apply for leaves and track your requests.</p>
          </div>
          <div className="leaves-action-group">
            <button
              onClick={fetchLeaves}
              disabled={loading}
              className="leaves-refresh-btn"
              title="Refresh History"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => {
                setEditingLeaveId(null);
                setFormData({
                  leaveType: 'Casual',
                  startDate: '',
                  endDate: '',
                  reason: '',
                  halfDayShift: 'FirstHalf'
                });
                setModalOpen(true);
              }}
              className="leaves-apply-btn"
            >
              <Plus size={18} /> Apply Leave
            </button>
          </div>
        </header>

        <div className="leave-stats-container">
          <div className="leave-stat-card">
            <div className="leave-stat-title">Annual Leaves Used</div>
            <div className={`leave-stat-value ${totalLeavesThisYear >= 12 ? 'danger' : ''}`}>
              {totalLeavesThisYear} <span className="leave-stat-sub">/ 12</span>
            </div>
          </div>
          <div className="leave-stat-card">
            <div className="leave-stat-title">Casual Leaves (This Month)</div>
            <div className={`leave-stat-value ${casualLeavesThisMonth >= 1 ? 'danger' : ''}`}>
              {casualLeavesThisMonth} <span className="leave-stat-sub">/ 1</span>
            </div>
          </div>
          <div className={`leave-stat-card ${unpaidLeaves > 0 ? 'warning-bg' : ''}`}>
            <div className={`leave-stat-title ${unpaidLeaves > 0 ? 'danger-text' : ''}`}>Unpaid Leaves</div>
            <div className={`leave-stat-value ${unpaidLeaves > 0 ? 'danger' : ''}`}>
              {unpaidLeaves} <span className="leave-stat-sub">days</span>
            </div>
            {unpaidLeaves > 0 && (
              <div className="leave-stat-note">
                * Subject to salary deduction
              </div>
            )}
          </div>
        </div>

        <section>
          {loading ? (
            <div className="leaves-empty-state">Loading your leave records...</div>
          ) : leaves.length === 0 ? (
            <div className="leaves-empty-state">
              <CalendarIcon size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
              You haven't applied for any leaves yet.
            </div>
          ) : (
            <div className="leaves-table-wrapper">
              <table className="leaves-table">
                <thead>
                  <tr>
                    <th className="leaves-th">Type</th>
                    <th className="leaves-th">Duration</th>
                    <th className="leaves-th">Reason</th>
                    <th className="leaves-th">Applied On</th>
                    <th className="leaves-th">Status</th>
                    <th className="leaves-th">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave._id} className="leaves-tr">
                      <td className="leaves-td">
                        <strong style={{ color: 'var(--text-primary)' }}>{leave.leaveType}</strong>
                        {leave.leaveType === 'HalfDay' && leave.halfDayShift && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            ({leave.halfDayShift === 'FirstHalf' ? 'Morning 9:30-1:30' : 'Afternoon 1:30-5:30'})
                          </div>
                        )}
                      </td>
                      <td className="leaves-td" style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(leave.startDate)} {leave.startDate !== leave.endDate ? `- ${formatDate(leave.endDate)}` : ''}
                      </td>
                      <td className="leaves-td" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={leave.reason}>
                        <FileText size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-secondary)' }} />
                        {leave.reason}
                        {leave.status === 'Rejected' && leave.rejectReason && (
                          <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', whiteSpace: 'normal', lineHeight: '1.2' }}>
                            <strong>Rejection Reason:</strong> {leave.rejectReason}
                          </div>
                        )}
                      </td>
                      <td className="leaves-td" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(leave.appliedOn)}
                      </td>
                      <td className="leaves-td">
                        <span className={`leave-status-badge ${getStatusClass(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="leaves-td">
                        {leave.status === 'Pending' && (
                          <div className="leave-actions-cell">
                            <button
                              onClick={() => handleEditClick(leave)}
                              className="leave-action-btn edit-btn"
                              title="Edit Leave Request"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCancelLeave(leave._id)}
                              className="leave-action-btn cancel-btn"
                              title="Cancel Leave Request"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="leave-rules-box" style={{ marginTop: '2rem' }}>
          <strong>Leave Policies & Rules</strong>
          <ul className="leave-rules-list">
            <li><strong>Casual Leaves :</strong> You are allowed a maximum of 1 casual leave per month.</li>
            <li><strong>Annual Limit :</strong> A total of 12 paid leaves are allowed per year.</li>
            <li><strong>Salary Deductions :</strong> Any leaves taken beyond your allowed balance, or without prior approval, will result in a corresponding salary cut.</li>
            <li><strong>Notice Period :</strong> Planned leaves must be applied at least 3 days in advance.</li>
          </ul>
        </div>
      </main>

      {/* Apply Leave Modal */}
      {modalOpen && (
        <div className="leave-modal-overlay" onClick={() => !actionLoading && setModalOpen(false)}>
          <div className="leave-modal" onClick={e => e.stopPropagation()}>
            <div className="leave-modal-header">
              <h2 className="leave-modal-title">{editingLeaveId ? 'Edit Leave Request' : 'Apply for Leave'}</h2>
              <button
                className="leave-modal-close"
                onClick={() => setModalOpen(false)}
                disabled={actionLoading}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="leave-form">
              <div className="leave-form-group">
                <label className="leave-label">Leave Type</label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleChange}
                  className="leave-select"
                  disabled={actionLoading}
                >
                  <option value="Casual">Casual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Emergency">Emergency Leave</option>
                  <option value="WFH">Work From Home (WFH)</option>
                  <option value="HalfDay">Half Day</option>
                </select>
              </div>

              <div className="leave-date-row">
                <div className="leave-form-group">
                  <label className="leave-label">{formData.leaveType === 'HalfDay' ? 'Date' : 'Start Date'}</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="leave-input"
                    required
                    min={getTodayString()}
                    disabled={actionLoading}
                  />
                </div>
                {formData.leaveType !== 'HalfDay' && (
                  <div className="leave-form-group">
                    <label className="leave-label">End Date</label>
                    <input type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="leave-input"
                      required
                      min={formData.startDate || getTodayString()}
                      disabled={actionLoading}
                    />
                  </div>
                )}
              </div>

              {formData.leaveType === 'HalfDay' && (
                <div className="leave-form-group">
                  <label className="leave-label">Select Shift</label>
                  <select
                    name="halfDayShift"
                    value={formData.halfDayShift}
                    onChange={handleChange}
                    className="leave-select"
                    disabled={actionLoading}
                  >
                    <option value="FirstHalf">First Half (9:30 AM to 1:30 PM)</option>
                    <option value="SecondHalf">Second Half (1:30 PM to 5:30 PM)</option>
                  </select>
                </div>
              )}

              <div className="leave-form-group">
                <label className="leave-label">Reason</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Provide a valid reason for your leave..."
                  className="leave-textarea"
                  required
                  disabled={actionLoading}
                />
              </div>

              <div className="leave-form-actions">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="leave-btn-cancel"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="leave-btn-submit"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Submitting...' : (editingLeaveId ? 'Update Request' : 'Submit Request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
