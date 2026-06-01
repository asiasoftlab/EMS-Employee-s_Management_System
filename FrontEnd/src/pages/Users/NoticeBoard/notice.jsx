import { useState, useEffect } from 'react';
import { Sidebar, ChatPanel } from '../../../components/UserLayout/LayoutComponents';
import axios from '../../../config/axiosConfig';
import { Megaphone, Calendar, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import '../Tasks/Tasks.css'; // Reuse basic styles

export default function NoticeBoard({ user }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/notices');
      setNotices(data || []);
      
      // Update last viewed time in localStorage
      if (data && data.length > 0) {
        localStorage.setItem('lastViewedNoticeTime', new Date().toISOString());
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotices();
    }
  }, [user]);

  const formatDate = (ts) => {
    if (!ts) return '';
    const date = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-dashboard">
        <header style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Notice Board</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Check the latest updates and company announcements.</p>
          </div>
          <button onClick={fetchNotices} disabled={loading} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 shadow-sm cursor-pointer transition-colors text-slate-600">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </header>

        <section className="flex-1 w-full min-h-[350px]">
          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(idx => (
                <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-premium h-32 flex flex-col justify-between animate-pulse">
                   <div className="h-5 bg-slate-200 rounded w-1/3 mb-2"></div>
                   <div className="h-4 bg-slate-200 rounded w-full mb-1"></div>
                   <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          ) : notices.length > 0 ? (
            <div className="flex flex-col gap-5 w-full">
              {notices.map((notice) => (
                <div key={notice.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-premium hover:shadow-premium-hover transition-shadow duration-300 relative group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Megaphone size={22} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-black text-slate-800 text-xl leading-tight mb-2">
                          {notice.title}
                        </h3>
                        {/* Show "New" tag if created in the last 3 days */}
                        {notice.createdAt && (new Date() - (notice.createdAt._seconds ? new Date(notice.createdAt._seconds * 1000) : new Date(notice.createdAt))) < 3 * 24 * 60 * 60 * 1000 && (
                           <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200 uppercase">New</span>
                        )}
                      </div>
                      
                      <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed mb-4">
                        {notice.content}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 pt-3 border-t border-slate-50">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} />
                          {formatDate(notice.createdAt)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] uppercase">
                            {notice.authorName ? notice.authorName.charAt(0) : 'A'}
                          </span>
                          By {notice.authorName || 'Admin'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white border border-slate-100 rounded-2xl shadow-premium">
              <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-4">
                <Megaphone size={36} strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-slate-700">No Announcements Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Any important notices from management will appear here.
              </p>
            </div>
          )}
        </section>
      </main>
      <ChatPanel user={user} />
    </div>
  );
}
