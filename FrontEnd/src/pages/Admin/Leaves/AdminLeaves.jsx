import { useState, useEffect } from 'react';
import axios from '../../../config/axiosConfig';
import { toast } from 'react-toastify';
import { Calendar, Tag, CheckCircle2, X, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import './AdminLeaves.css';

const formatDate = (ts) => {
  if (!ts) return '—';
  if (typeof ts === 'string') return ts;
  const secs = ts._seconds ?? ts.seconds;
  if (secs !== undefined) return new Date(secs * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  try { return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return '—'; }
};

export default function AdminLeaves({ user }) {
  const [adminLeaves, setAdminLeaves] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [leaveToReject, setLeaveToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

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

  useEffect(() => {
    fetchLeavesAdmin();
  }, []);

  const handleUpdateLeaveStatus = async (id, status, reason = null) => {
    try {
      const payload = { status };
      if (reason) payload.rejectReason = reason;

      await axios.patch(`/api/leaves/${id}/status`, payload);
      toast.success(`Leave ${status.toLowerCase()} successfully`);
      fetchLeavesAdmin();

      // Close modal if open
      setShowRejectModal(false);
      setLeaveToReject(null);
      setRejectReason('');
    } catch (err) {
      toast.error("We couldn't update the leave status. Please try again.");
    }
  };

  const handleRejectClick = (leaveId) => {
    setLeaveToReject(leaveId);
    setShowRejectModal(true);
  };
  const totalDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;

    const parseDate = (ts) => {
      const secs = ts._seconds ?? ts.seconds;
      if (secs !== undefined) return new Date(secs * 1000);
      return new Date(ts);
    };

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 to make it inclusive
  };

  const submitReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    handleUpdateLeaveStatus(leaveToReject, 'Rejected', rejectReason);
  };

  const statusClass = { Pending: 'status-pending', 'In Progress': 'status-inprogress', Completed: 'status-completed' };

  return (
    <div className="admin-leaves-container">
      <header className="admin-leaves-header">
        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: '500', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Employee's Leave</h1>
        <button
          onClick={fetchLeavesAdmin}
          disabled={leavesLoading}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: '#475569', fontSize: '13px', fontWeight: '500' }}
        >
          <RefreshCw size={14} className={leavesLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      <main className="admin-leaves-main">
        {leavesLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#64748b' }}>
            <RefreshCw className="animate-spin" size={24} style={{ marginRight: '8px' }} /> Loading leaves...
          </div>
        ) : adminLeaves.length === 0 ? (
          <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
            No leave requests found.
          </div>
        ) : (
          <div className="leave-card-grid">
            {adminLeaves.map(leave => (
              <div key={leave._id} className={`leave-card ${leave.status === 'Pending' ? 'pending' : ''}`}>
                <div className="leave-card-header">
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>{leave.userName}</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{leave.userEmail || '—'}</p>
                  </div>
                  <span className={`task-status-badge ${statusClass[leave.status] || (leave.status === 'Approved' ? 'status-completed' : leave.status === 'Rejected' ? 'status-pending' : '')}`} style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '20px', fontWeight: '600' }}>
                    {leave.status}
                  </span>
                </div>

                <div className="leave-card-details">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px' }}>
                    <Tag size={14} color="#6366f1" /> <strong>Type:</strong> {leave.leaveType}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px' }}>
                    <Calendar size={14} color="#10b981" /> <strong>Dates:</strong> {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px' }}>
                    <Calendar size={14} color="#10b981" /> <strong>Days:</strong> {totalDays(leave.startDate, leave.endDate)}
                  </div>
                  {leave.halfDayShift && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706', fontSize: '13px' }}>
                      <strong>Half Day:</strong> {leave.halfDayShift}
                    </div>
                  )}

                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', color: '#334155', margin: 0 }}><strong>Reason:</strong> {leave.reason}</p>
                </div>

                {leave.status === 'Rejected' && leave.rejectReason && (
                  <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fca5a5', marginBottom: '16px' }}>
                    <p style={{ fontSize: '13px', color: '#b91c1c', margin: 0 }}><strong>Rejection Reason:</strong> {leave.rejectReason}</p>
                  </div>
                )}


                {leave.status === 'Pending' && (
                  <div className="leave-card-actions">
                    <button
                      onClick={() => handleUpdateLeaveStatus(leave._id, 'Approved')}
                      style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }}
                    >
                      <CheckCircle2 size={16} /> Approve
                    </button>
                    <button
                      onClick={() => handleRejectClick(leave._id)}
                      style={{ background: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }}
                    >
                      <X size={16} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="reject-modal-content">
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginTop: 0, marginBottom: '16px' }}>Reject Leave Request</h3>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>Please provide a reason for rejecting this leave request. This will be visible to the employee.</p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason here..."
              style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', minHeight: '100px', marginBottom: '20px', fontSize: '13px', outline: 'none', resize: 'vertical' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => { setShowRejectModal(false); setLeaveToReject(null); setRejectReason(''); }}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                style={{ padding: '8px 16px', background: '#ef4444', border: 'none', borderRadius: '6px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
