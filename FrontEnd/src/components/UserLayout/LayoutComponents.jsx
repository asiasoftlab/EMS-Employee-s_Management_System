import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import axios from '../../config/axiosConfig';
import { socket } from '../../config/socket';
import { toast } from 'react-toastify';
import './LayoutComponents.css';

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
      } catch (err) { }
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"></path><path d="m4.93 4.93 14.14 14.14M4.93 19.07 19.07 4.93"></path></svg>
            <span className="nav-label">Attendance</span>
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            <span className="nav-label">My Tasks</span>
          </NavLink>
          <NavLink to="/leaves" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path><path d="M13 13h4"></path><path d="M13 17h4"></path></svg>
            <span className="nav-label">Leave Requests</span>
          </NavLink>
          <NavLink to="/notice" className={({ isActive }) => `nav-item nav-notice-link ${isActive ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>
            <span className="nav-label">Notice Board</span>
            {unreadNotices > 0 && (
              <span className="unread-badge">
                {unreadNotices}
              </span>
            )}
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span className="nav-label">Profile</span>
          </NavLink>

          <div className="company-policies-wrapper">
            <NavLink to="/readme" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              <span className="nav-label">Company Policies</span>
            </NavLink>
          </div>
          <div className="version-info">
            <p>Version : V1.0.3</p>
          </div>
        </nav>
      </aside>
      {showGreetingModal && (
        <div className="greeting-modal-overlay">
          <div className="greeting-modal-content">
            <div className="greeting-modal-emoji">🎉</div>
            <h2 className="greeting-modal-title">Congratulations!</h2>
            <p className="greeting-modal-text">
              You've officially completed your <strong>8:00 hrs</strong> shift today. Great job <strong>{user?.name}</strong> and thank you for your hard work!
            </p>
            <button
              onClick={() => setShowGreetingModal(false)}
              className="greeting-modal-button"
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
  const chatContainerRef = useRef(null);
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
    if (chatContainerRef.current) {
      // Scroll only the chat container, do NOT use scrollIntoView as it forces the whole page window down
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
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
    <aside className="notification-panel chat-panel-aside">
      <div className="panel-title chat-panel-title">
        Live Chat
        <span className="chat-panel-admin-badge">
          Admin
        </span>
      </div>
      <div className="user-chat-messages" ref={chatContainerRef}>
        {groupedMessages.length === 0 ? (
          <div className="chat-empty-state">
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
