import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import axios from '../../config/axiosConfig';
import { socket } from '../../config/socket';

export const Sidebar = () => {
  const [unreadNotices, setUnreadNotices] = useState(0);

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

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
          My Tasks
        </NavLink>
        <NavLink to="/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"></path><path d="m4.93 4.93 14.14 14.14M4.93 19.07 19.07 4.93"></path></svg>
          Attendance
        </NavLink>
        <NavLink to="/leaves" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path><path d="M13 13h4"></path><path d="M13 17h4"></path></svg>
          Leave Requests
        </NavLink>
        <NavLink to="/notice" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ position: 'relative' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>
          Notice Board
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
          Profile
        </NavLink>
      </nav>
    </aside>
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

  return (
    <aside className="notification-panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-title" style={{ flexShrink: 0, paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        Live Chat
        <span style={{ fontSize: '0.75rem', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>
          Admin
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2rem' }}>
            No messages yet. Say hi!
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.senderId === user?._id;
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isSelf ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '12px',
                  backgroundColor: isSelf ? 'var(--primary)' : 'white',
                  color: isSelf ? 'white' : 'var(--text-primary)',
                  boxShadow: isSelf ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                  border: isSelf ? 'none' : '1px solid var(--border-color)',
                  borderBottomRightRadius: isSelf ? '4px' : '12px',
                  borderBottomLeftRadius: isSelf ? '12px' : '4px',
                }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.4 }}>{msg.text}</p>
                  <span style={{ display: 'block', fontSize: '0.65rem', textAlign: 'right', marginTop: '4px', opacity: 0.7 }}>
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} style={{ flexShrink: 0, paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={sending}
          style={{
            flex: 1,
            padding: '0.6rem 1rem',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            outline: 'none',
            fontSize: '0.85rem',
            background: 'var(--bg-color)'
          }}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          style={{
            width: '36px', height: '36px', borderRadius: '50%', border: 'none',
            background: inputText.trim() ? '#10b981' : 'var(--border-color)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: inputText.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    </aside>
  );
};
