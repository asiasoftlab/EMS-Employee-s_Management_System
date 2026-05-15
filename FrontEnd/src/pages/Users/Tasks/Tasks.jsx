import { useState, useEffect, useRef } from 'react';
import { Sidebar, NotificationPanel } from '../../../components/UserLayout/LayoutComponents';
import './Tasks.css';

export default function Tasks({ user }) {
  const [localTasks, setLocalTasks] = useState(() => {
    const saved = localStorage.getItem('ems_manual_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTaskText, setNewTaskText] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('ems_manual_tasks', JSON.stringify(localTasks));
  }, [localTasks]);

  if (!user) return null;

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    
    const newTask = {
      id: Date.now(),
      text: newTaskText,
      completed: false,
    };
    
    setLocalTasks([newTask, ...localTasks]);
    setNewTaskText('');
  };

  const toggleTask = (id) => {
    setLocalTasks(localTasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTask = (id) => {
    setLocalTasks(localTasks.filter(t => t.id !== id));
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-dashboard">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage your personal notes and tasks.</p>
          </div>
          <button className="btn-add-task" onClick={() => inputRef.current?.focus()}>+ New Task</button>
        </header>

        {/* Re-adding the notepad input as it's essential for the page's purpose */}
        <div className="notepad-section" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleAddTask} className="notepad-input-wrapper">
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Add a manual task and press Enter..." 
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="notepad-input-field"
            />
          </form>
        </div>

        <section className="tasks-container">
          <div className="tasks-header">
            <span>Task Description</span>
            <span style={{ textAlign: 'center' }}>Status</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>
          <div className="tasks-list">
            {localTasks.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                Your notepad is empty. Use the input above to add tasks.
              </div>
            ) : (
              localTasks.map(task => (
                <div key={task.id} className={`task-row ${task.completed ? 'completed' : ''}`}>
                  <div className="task-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div 
                      className={`custom-checkbox ${task.completed ? 'checked' : ''}`}
                      onClick={() => toggleTask(task.id)}
                    >
                      {task.completed && '✓'}
                    </div>
                    <span className="task-title" style={{ textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.6 : 1 }}>
                      {task.text}
                    </span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span className={`status-badge ${task.completed ? 'completed' : 'pending'}`}>
                      {task.completed ? 'Done' : 'Pending'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button onClick={() => deleteTask(task.id)} className="delete-task-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <NotificationPanel />
    </div>
  );
}
