import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import axios from '../../config/axiosConfig';
import { socket } from '../../config/socket';
import { toast } from 'react-toastify';

export const Sidebar = ({ user }) => {
  const [unreadNotices, setUnreadNotices] = useState(0);
  const [showGreetingModal, setShowGreetingModal] = useState(false);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const { data } = await axios.get('/api/notices');
        const lastViewedStr = localStorage.getItem('lastViewedNoticeTime');
        const lastViewed = lastViewedStr ? new Date(lastViewedStr) : new Date(0);

        const newNotices = (data || []).filter(notice => {
          const createdAt = notice.createdAt?._seconds
            ? new Date(notice.createdAt._seconds * 1000)
            : new Date(notice.createdAt);
          return createdAt > lastViewed;
        });

        setUnreadNotices(newNotices.length);
      } catch (err) {
        console.error('Failed to check notices:', err);
      }
    };
    fetchNotices();
  }, []);

  useEffect(() => {
    let attendanceInterval;
    const checkShiftCompletion = async () => {
      try {
        const { data } = await axios.get('/api/attendance');
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
        const foundToday = data.find(r => r.date === today);
        
        if (foundToday && foundToday.clockIn && !foundToday.clockOut) {
          const targetDurationMs = 7.5 * 60 * 60 * 1000;
          
          const evaluateTime = () => {
            const diffMs = new Date() - new Date(foundToday.clockIn);
            if (diffMs >= targetDurationMs) {
              const todayStr = new Date().toDateString();
              const hasGreeted = localStorage.getItem('shiftCompletedGreeting');
              if (hasGreeted !== todayStr) {
                setShowGreetingModal(true);
                localStorage.setItem('shiftCompletedGreeting', todayStr);
              }
            }
          };

          evaluateTime();
          attendanceInterval = setInterval(evaluateTime, 60000);
        }
      } catch (err) {}
    };
    
    checkShiftCompletion();
    
    return () => {
      if (attendanceInterval) clearInterval(attendanceInterval);
    };
  }, []);

  return (
    <>
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
          <span className="nav-label">My Tasks</span>
        </NavLink>
        <NavLink to="/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"></path><path d="m4.93 4.93 14.14 14.14M4.93 19.07 19.07 4.93"></path></svg>
          <span className="nav-label">Attendance</span>
        </NavLink>
        <NavLink to="/leaves" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path><path d="M13 13h4"></path><path d="M13 17h4"></path></svg>
          <span className="nav-label">Leave Requests</span>
        </NavLink>
        <NavLink to="/notice" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ position: 'relative' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>
          <span className="nav-label">Notice Board</span>
          {unreadNotices > 0 && (
            <span style={{
              position: 'absolute',
              top: '8px',
              left: '20px',
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              minWidth: '16px',
              height: '16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '1px solid white'
            }}>
              {unreadNotices}
            </span>
          )}
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span className="nav-label">Profile</span>
        </NavLink>

        <div className="company-policies-wrapper" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <NavLink to="/readme" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            <span className="nav-label">Company Policies</span>
          </NavLink>
        </div>
      </nav>
    </aside>
    {showGreetingModal && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
        <div style={{ backgroundColor: '#fff', padding: '2.5rem 2rem', borderRadius: '24px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'bounce 2s infinite' }}>🎉</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>Congratulations!</h2>
          <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            You've officially completed your <strong>8:00 hrs</strong> shift today. Great job <strong>{user?.name}</strong> and thank you for your hard work! 
          </p>
          <button 
            onClick={() => setShowGreetingModal(false)}
            style={{ width: '100%', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={(e) => { e.target.style.backgroundColor = '#1d4ed8'; e.target.style.transform = 'scale(1.02)'; }}
            onMouseOut={(e) => { e.target.style.backgroundColor = '#2563eb'; e.target.style.transform = 'scale(1)'; }}
          >
            Awesome!
          </button>
        </div>
      </div>
    )}
    </>
  );
};

export const ChatPanel = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const chatId = user?._id;

  useEffect(() => {
    if (!chatId) return;

    socket.connect();
    socket.emit('join_room', chatId);

    axios.get(`/api/chat/${chatId}/messages`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setMessages(res.data);
        }
      })
      .catch(err => console.error('Failed to load chat history:', err));

    const handleReceiveMessage = (msg) => {
      setMessages(prev => {
        // Prevent duplicate messages if any
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.disconnect();
    };
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || sending || !user) return;

    setSending(true);
    setInputText('');

    socket.emit('send_message', {
      roomId: chatId,
      text,
      senderId: user._id,
      senderName: user.name || user.email,
      senderEmail: user.email,
      senderRole: 'employee'
    });

    setSending(false);
    inputRef.current?.focus();
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getChatDateLabel = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const groupedMessages = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const msgDate = getChatDateLabel(msg.createdAt);
    if (msgDate !== lastDate) {
      groupedMessages.push({ type: 'date', label: msgDate });
      lastDate = msgDate;
    }
    groupedMessages.push({ type: 'msg', data: msg });
  });

  return (
    <aside className="notification-panel" style={{ display: 'flex', flexDirection: 'column', padding: 0, gap: 0, overflow: 'hidden' }}>
      <div className="panel-title" style={{ flexShrink: 0, padding: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', background: '#fff', margin: 0 }}>
        Live Chat
        <span style={{ fontSize: '0.75rem', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>
          Admin
        </span>
      </div>
      <div className="user-chat-messages">
        {groupedMessages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#54656f', fontSize: '0.85rem', marginTop: '2rem' }}>
            No messages yet. Say hi!
          </div>
        ) : (
          groupedMessages.map((item, idx) => {
            if (item.type === 'date') {
              return (
                <div key={`dl-${idx}`} className="chat-date-separator">
                  <span>{item.label}</span>
                </div>
              );
            }
            const msg = item.data;
            const isSelf = msg.senderId === user?._id;
            return (
              <div key={msg.id} className={`chat-bubble-row ${isSelf ? 'self' : 'other'}`}>
                <div className={`chat-bubble ${isSelf ? 'self' : 'other'}`}>
                  <p className="chat-bubble-text">{msg.text}</p>
                  <span className="chat-bubble-time">{formatTime(msg.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="chat-input-container">
        <input
          ref={inputRef}
          type="text"
          className="chat-input-field"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!inputText.trim() || sending}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    </aside>
  );
};
