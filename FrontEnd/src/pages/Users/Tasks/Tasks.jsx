import { useState, useEffect } from 'react';
import { Sidebar, ChatPanel } from '../../../components/UserLayout/LayoutComponents';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, Eye, Calendar, Check, X, Inbox, FolderLock, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from '../../../config/axiosConfig';
import './Tasks.css';

export default function Tasks({ user }) {

  const [localTasks, setLocalTasks] = useState([]);
  const formatTaskTitle = (dateStr) => {
    if (!dateStr) return 'No Date Assigned';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return `Schedule: ${dateStr}`;
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [formStatus, setFormStatus] = useState('Pending');
  const [formTitle, setFormTitle] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formSubtasks, setFormSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get('/api/tasks');
      const mappedTasks = (data || []).map(t => ({
        id: t._id,
        _id: t._id,
        title: t.title || '',
        location: t.location || '',
        dueDate: (() => {
          if (!t.deadline) return '';
          if (typeof t.deadline === 'object') {
            const secs = t.deadline._seconds !== undefined ? t.deadline._seconds : t.deadline.seconds;
            if (secs !== undefined) {
              return new Date(secs * 1000).toISOString().split('T')[0];
            }
          }
          try {
            const date = new Date(t.deadline);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error("Failed to parse deadline", e);
          }
          return '';
        })(),
        status: t.status || 'Pending',
        notes: t.notes || t.description || '',
        completed: t.status === 'Completed',
        subtasks: t.subtasks || []
      }));
      setLocalTasks(mappedTasks);
    } catch (err) {
      console.error(err);
      toast.error("We couldn't load your tasks. Please refresh and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTasks();
    }
  }, [user]);

  if (!user) return null;
  const triggerCreateModal = () => {
    setFormStatus('Pending');
    setFormTitle('');
    setFormLocation('');
    setCustomLocation('');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setFormSubtasks([]);
    setNewSubtaskText('');
    setSelectedTask(null);
    setActiveModal('create');
  };

  const triggerEditModal = (task) => {
    setSelectedTask(task);
    setFormStatus(task.status);
    setFormTitle(task.title || '');
    const predefinedLocations = ['Thiruvananthapuram', 'Chirayinkeezhu', 'Kottayam', 'Work from home'];
    if (task.location && !predefinedLocations.includes(task.location)) {
      setFormLocation('Others');
      setCustomLocation(task.location);
    } else {
      setFormLocation(task.location || '');
      setCustomLocation('');
    }
    setFormDueDate(task.dueDate || '');
    setFormNotes(task.notes || '');
    setFormSubtasks(task.subtasks || []);
    setNewSubtaskText('');
    setActiveModal('edit');
  };

  const triggerViewModal = (task) => {
    setSelectedTask(task);
    setActiveModal('view');
  };

  const handleSaveTask = async (e, shouldClose = true) => {
    if (e) e.preventDefault();

    if (!formTitle || !formTitle.trim()) {
      return toast.error('Please provide a title for your task.');
    }
    const finalLocation = formLocation === 'Others' ? customLocation.trim() : formLocation.trim();
    if (!finalLocation) {
      return toast.error('Please select or enter a location for the task.');
    }
    if (!formStatus) {
      return toast.error('Please select a current status for the task.');
    }
    if (!formDueDate) {
      return toast.error('Please set a due date for your task.');
    }

    const tasksOnDate = localTasks.filter(t => t && t.dueDate === formDueDate);
    const isExceedingLimit = activeModal === 'create'
      ? tasksOnDate.length >= 9
      : tasksOnDate.length >= 9 && selectedTask?.dueDate !== formDueDate;

    if (isExceedingLimit) {
      return toast.error("You've reached the maximum limit of 9 tasks per day.");
    }

    const payload = {
      title: formTitle.trim() || formatTaskTitle(formDueDate),
      location: finalLocation,
      description: formNotes.trim() || 'Daily Checklist',
      deadline: formDueDate,
      status: formStatus,
      notes: formNotes.trim(),
      subtasks: formSubtasks
    };

    try {
      if (activeModal === 'create') {
        const { data } = await axios.post('/api/tasks', payload);
        const newTask = {
          id: data._id,
          _id: data._id,
          title: formTitle.trim() || formatTaskTitle(formDueDate),
          location: formLocation.trim(),
          dueDate: formDueDate,
          status: formStatus,
          notes: formNotes.trim(),
          completed: formStatus === 'Completed',
          subtasks: formSubtasks
        };

        setLocalTasks(prev => [newTask, ...prev]);
        toast.success('Task Created successfully!');

        if (shouldClose) {
          setActiveModal(null);
        } else {
          setFormStatus('Pending');
          setFormTitle('');
          setFormLocation('');
          setFormDueDate(new Date().toISOString().split('T')[0]);
          setFormNotes('');
          setFormSubtasks([]);
          setNewSubtaskText('');
          toast.info('Continuous Mode Active. Add next task!');
        }
      } else if (activeModal === 'edit' && selectedTask) {
        await axios.put(`/api/tasks/${selectedTask._id}`, payload);
        setLocalTasks(prev => prev.map(t => t && t.id === selectedTask.id ? {
          ...t,
          title: formTitle.trim() || formatTaskTitle(formDueDate),
          location: formLocation.trim(),
          status: formStatus,
          dueDate: formDueDate,
          notes: formNotes.trim(),
          completed: formStatus === 'Completed',
          subtasks: formSubtasks
        } : t));
        toast.success('Task Updated Successfully!');
        setActiveModal(null);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "We couldn't save your task changes. Please try again.");
    }
  };

  const handleDeleteTask = (id) => {
    setTaskToDelete(id);
  };
  const handleToggleComplete = async (id) => {
    const task = localTasks.find(t => t && t.id === id);
    if (!task) return;

    const nextCompleted = !task.completed;
    const nextStatus = nextCompleted ? 'Completed' : 'In Progress';

    const payload = {
      title: formatTaskTitle(task.dueDate),
      description: task.notes || 'Daily Checklist',
      deadline: task.dueDate,
      status: nextStatus,
      notes: task.notes,
      subtasks: task.subtasks
    };

    try {
      await axios.put(`/api/tasks/${task._id}`, payload);
      setLocalTasks(prev => prev.map(t => {
        if (t && t.id === id) {
          return {
            ...t,
            completed: nextCompleted,
            status: nextStatus
          };
        }
        return t;
      }));

      if (selectedTask && selectedTask.id === id) {
        setSelectedTask({
          ...selectedTask,
          completed: nextCompleted,
          status: nextStatus
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("We couldn't update the task status right now. Please try again.");
    }
  };

  const handleToggleSubtask = async (subId) => {
    if (!selectedTask) return;
    const nextSubtasks = selectedTask.subtasks.map(s =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    const payload = {
      title: formatTaskTitle(selectedTask.dueDate),
      description: selectedTask.notes || 'Daily Checklist',
      deadline: selectedTask.dueDate,
      status: selectedTask.status,
      notes: selectedTask.notes,
      subtasks: nextSubtasks
    };

    try {
      await axios.put(`/api/tasks/${selectedTask._id}`, payload);
      setLocalTasks(prev => prev.map(t =>
        t.id === selectedTask.id ? { ...t, subtasks: nextSubtasks } : t
      ));
      setSelectedTask({
        ...selectedTask,
        subtasks: nextSubtasks
      });
    } catch (err) {
      console.error(err);
      toast.error("We couldn't save your checklist changes. Please try again.");
    }
  };


  const filteredTasks = (localTasks || []).filter(Boolean);
  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
  };


  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-dashboard overflow-y-auto relative bg-slate-50/50">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Task Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>View and manage your daily tasks.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchTasks} disabled={isLoading} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 shadow-sm cursor-pointer transition-colors text-slate-600">
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/25 font-bold text-sm transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              onClick={triggerCreateModal}>
              <Plus size={16} strokeWidth={2.5} />
              Add New Task
            </button>
          </div>
        </header>
        <section className="flex-1 w-full min-h-[350px]">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(idx => (
                <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-premium h-60 flex flex-col justify-between animate-pulse">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <div className="h-4 bg-slate-200 rounded w-16"></div>
                      <div className="h-4 bg-slate-200 rounded w-12"></div>
                    </div>
                    <div className="h-5 bg-slate-200 rounded w-5/6 mt-4"></div>
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 rounded w-4/5"></div>
                  </div>
                  <div className="h-4 bg-slate-100 rounded w-full mt-4"></div>
                </div>
              ))}
            </div>
          ) : filteredTasks.length > 0 ? (
            <motion.div variants={listVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
              <AnimatePresence mode="popLayout">
                {filteredTasks.map(task => {
                  const statusStyles = {
                    Pending: 'bg-slate-50 text-slate-500 border-slate-200',
                    'In Progress': 'bg-blue-50 text-blue-500 border-blue-200',
                    Completed: 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  };
                  const isToday = task.dueDate === new Date().toISOString().split('T')[0];

                  return (
                    <motion.div
                      key={task.id}
                      layout
                      variants={cardVariants}
                      exit="exit"
                      whileHover={{ y: -5, transition: { duration: 0.15 } }}
                      className="bg-white border border-slate-100 rounded-2xl p-5 shadow-premium hover:shadow-premium-hover transition-shadow duration-300 flex flex-col justify-between min-h-[220px] relative group cursor-pointer"
                      onClick={() => triggerViewModal(task)}>
                      <div className="flex justify-end items-center mb-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${statusStyles[task.status]}`}
                          onClick={(e) => e.stopPropagation()}>
                          {task.status}
                        </span>
                      </div>

                      {/* Header details */}
                      <div className="flex items-start gap-2.5 mt-1 flex-1 min-w-0">
                        {/* Instant checkbox toggle */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isToday) handleToggleComplete(task.id);
                          }}
                          className={`flex-shrink-0 w-5 h-5 border rounded-md flex items-center justify-center transition-all mt-0.5 ${!isToday ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${task.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 hover:border-slate-500 hover:bg-slate-50'
                            }`}>
                          {task.completed && <Check size={12} strokeWidth={3} />}
                        </div>

                        {/* Title text & Description */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`font-black text-slate-850 text-xl md:text-xl leading-tight truncate hover:text-blue-600 transition-colors ${task.completed ? 'line-through text-slate-400 decoration-slate-400 decoration-2' : ''}`}
                          >
                            {(task.title)}
                          </h3>

                          {/* Checklist preview list */}
                          <div className="mt-3.5 space-y-2">
                            {task.subtasks && task.subtasks.length > 0 ? (
                              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                                {task.subtasks.map((sub, index) => (
                                  <div key={sub.id} className="flex items-center gap-2 text-lg font-semibold text-slate-700">
                                    <span className={`w-1.5 h-1.5 rounded-full ${sub.completed ? 'bg-emerald-500' : 'bg-slate-350'}`}></span>
                                    <span className="text-slate-400 text-sm font-bold">{index + 1}.</span>
                                    <span className={`truncate leading-normal ${sub.completed ? 'line-through text-slate-400 decoration-slate-300' : ''}`}>{sub.text}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400 italic font-semibold">No checklist items registered for this date.</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Subtask checklist overview progress bar */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-4 space-y-1.5 px-0.5 w-full" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            <span>Checklist Progress</span>
                            <span>
                              {task.subtasks.filter(s => s.completed).length} of {task.subtasks.length}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{
                                width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="h-px bg-slate-100 w-full my-3.5"></div>

                      <div className="flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-1 text-[10px] font-semibold ${!task.completed && new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-slate-400'
                          }`}>
                          <Calendar size={12} />
                          <span>{task.dueDate || 'No Deadline'}</span>
                        </div>

                        <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-1 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerViewModal(task);
                            }}
                            title="Expand Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className={`p-1 rounded-lg transition-colors ${isToday ? 'hover:bg-slate-50 text-slate-500 hover:text-blue-600 cursor-pointer' : 'text-slate-300 cursor-not-allowed opacity-50'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isToday) triggerEditModal(task);
                            }}
                            title={isToday ? "Edit Parameters" : "Cannot edit past/future tasks"}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="p-1 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            title="Delete Task"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : (
            // Clean Empty State Dashboard
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white border border-slate-100 rounded-2xl shadow-premium">
              <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-4">
                <Inbox size={36} strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-slate-700">No active manual tasks</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Add fresh tasks to your personal checklist to populate the desktop board.
              </p>
              <button
                onClick={triggerCreateModal}
                className="mt-5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-premium font-bold text-xs transition-transform active:scale-95 cursor-pointer"
              >
                + Add A New Task
              </button>
            </div>
          )}
        </section>


      </main>

      <ChatPanel user={user} />

      {/* CRUD Modals (Create / Edit Overlay Panel) */}
      <AnimatePresence>
        {(activeModal === 'create' || activeModal === 'edit') && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="bg-white border border-slate-100 rounded-2xl shadow-modal w-full max-w-md overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100">
                <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                  <FolderLock size={15} className="text-slate-500" />
                  {activeModal === 'create' ? ' Add New Task' : 'Edit Task Details'}
                </h2>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-4 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Input Fields Form */}
              <form onSubmit={(e) => handleSaveTask(e, true)} className="overflow-y-auto">
                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Status State</label>
                      <select
                        className="px-3 py-2 border border-slate-200 rounded-xl outline-none text-slate-800 bg-white focus:border-slate-400 cursor-pointer text-xs font-semibold"
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Just Created">Just Created</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    {/* Due Date */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Due Date Deadline</label>
                      <input
                        type="date"
                        className="px-3 py-2 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-slate-400 cursor-pointer text-xs bg-white font-semibold"
                        value={formDueDate}
                        min={new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())}
                        onChange={(e) => setFormDueDate(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Task Title + Location Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Task Title</label>
                      <input
                        type="text"
                        placeholder="Enter a task name..."
                        className="px-3 py-2 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-slate-400 bg-slate-50/50 focus:bg-white transition-all text-xs font-semibold"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Location</label>
                      <select
                        className="px-3 py-2 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-slate-400 bg-white cursor-pointer text-xs font-semibold"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                      >
                        <option value="" disabled>Select Location...</option>
                        <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                        <option value="Chirayinkeezhu">Chirayinkeezhu</option>
                        <option value="Kottayam">Kottayam</option>
                        <option value="Work from home">Work from home</option>
                        <option value="Others">Others</option>
                      </select>
                      {formLocation === 'Others' && (
                        <input
                          type="text"
                          placeholder="Type custom location..."
                          className="mt-1.5 px-3 py-2 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-slate-400 bg-white text-xs font-semibold w-full transition-all"
                          value={customLocation}
                          onChange={(e) => setCustomLocation(e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Checklist Sub-tasks */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Checklist Sub-tasks</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a step or sub-task item..."
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs bg-slate-50/50 focus:bg-white focus:border-slate-400 transition-all font-semibold"
                        value={newSubtaskText}
                        onChange={(e) => setNewSubtaskText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newSubtaskText.trim()) {
                              setFormSubtasks([...formSubtasks, { id: Date.now(), text: newSubtaskText.trim(), completed: false }]);
                              setNewSubtaskText('');
                            }
                          }
                        }}
                      />
                      <button type="button" onClick={() => {
                        if (newSubtaskText.trim()) {
                          setFormSubtasks([...formSubtasks, { id: Date.now(), text: newSubtaskText.trim(), completed: false }]);
                          setNewSubtaskText('');
                        }
                      }}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                        Add
                      </button>
                    </div>

                    {formSubtasks.length > 0 && (
                      <div className="border border-slate-100 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1.5 bg-slate-50/30">
                        {formSubtasks.map((sub, i) => (
                          <div key={sub.id} className="flex justify-between items-center gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                className="w-3.5 h-3.5 border rounded cursor-pointer accent-blue-600"
                                checked={sub.completed}
                                onChange={(e) => {
                                  setFormSubtasks(formSubtasks.map((s, idx) => idx === i ? { ...s, completed: e.target.checked } : s));
                                }}
                              />
                              <span className="text-slate-400 font-bold">{i + 1}.</span>
                              <span className={`truncate text-slate-700 ${sub.completed ? 'line-through text-slate-400' : ''}`}>{sub.text}</span>
                            </div>
                            <button type="button" onClick={() => setFormSubtasks(formSubtasks.filter((_, idx) => idx !== i))} className="text-slate-450 hover:text-red-500 transition-colors p-1 cursor-pointer">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes & Comments */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Detailed Notes & Comments</label>
                    <textarea placeholder="Jot down links, reminders, or general notes..." rows={2} className="px-3 py-2 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-slate-400 bg-slate-50/50 focus:bg-white transition-all text-xs resize-none font-semibold" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="bg-slate-50/50 px-6 py-4 flex justify-between items-center border-t border-slate-100 flex-wrap gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-xs cursor-pointer">
                    Cancel
                  </button>

                  <div className="flex gap-2">
                    {activeModal === 'create' && (
                      <button type="button" onClick={(e) => handleSaveTask(e, false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-xs cursor-pointer active:scale-95">
                        Add & Create Another
                      </button>
                    )}
                    <button type="submit" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all text-xs shadow-premium active:scale-95 cursor-pointer">
                      {activeModal === 'create' ? 'Add & Close' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Viewer Detail Modal Drawer */}
        {activeModal === 'view' && selectedTask && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="bg-white border border-slate-100 rounded-2xl shadow-modal w-full max-w-md overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Task Details</h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-450 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* View Panel Details Body */}
              <div className="px-6 py-5 flex-1 overflow-y-auto space-y-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800 flex items-start gap-2.5 leading-snug">
                    <span
                      onClick={() => {
                        if (selectedTask.dueDate === new Date().toISOString().split('T')[0]) {
                          handleToggleComplete(selectedTask.id);
                        }
                      }}
                      className={`flex-shrink-0 w-5 h-5 mt-0.5 border rounded-md flex items-center justify-center transition-all ${selectedTask.dueDate !== new Date().toISOString().split('T')[0] ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${selectedTask.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 hover:border-slate-500 hover:bg-slate-50'
                        }`}
                    >
                      {selectedTask.completed && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className={selectedTask.completed ? 'line-through text-slate-400 decoration-slate-400' : ''}>
                      {formatTaskTitle(selectedTask.dueDate)}
                    </span>
                  </h2>
                </div>

                <div className="h-px bg-slate-100 w-full my-3"></div>

                {/* Metadata Grid parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs ml-7.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[12px] font-extrabold text-slate-400 uppercase tracking-wide">Status State</span>
                    <span className="font-semibold text-slate-705 flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${selectedTask.status === 'Completed' ? 'bg-emerald-500' :
                        selectedTask.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-400'
                        }`}></span>
                      {selectedTask.status}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[12px] font-extrabold text-slate-400 uppercase tracking-wide">Due Date Deadline</span>
                    <span className="font-semibold text-slate-705 flex items-center gap-1.5 mt-0.5">
                      <Calendar size={13} className="text-slate-400" />
                      {selectedTask.dueDate || 'No deadline assigned'}
                    </span>
                  </div>
                </div>

                {/* Subtask interactive list inside View modal */}
                {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                  <>
                    <div className="h-px bg-slate-100 w-full my-3"></div>
                    <div className="flex flex-col gap-2 ml-7.5">
                      <span className="text-[12px] font-extrabold text-slate-400 uppercase tracking-wide">Checklist Items</span>
                      <div className="space-y-2">
                        {selectedTask.subtasks.map((sub, index) => (
                          <div key={sub.id} className="flex items-center gap-2.5 text-sm text-slate-700">
                            <div
                              onClick={() => {
                                if (selectedTask.dueDate === new Date().toISOString().split('T')[0]) {
                                  handleToggleSubtask(sub.id);
                                }
                              }}
                              className={`flex-shrink-0 w-4 h-4 border rounded flex items-center justify-center transition-all ${selectedTask.dueDate !== new Date().toISOString().split('T')[0] ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${sub.completed
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 hover:border-slate-500'
                                }`}
                            >
                              {sub.completed && <Check size={10} strokeWidth={3} />}
                            </div>
                            <span className="text-slate-400 font-bold">{index + 1}.</span>
                            <span className={sub.completed ? 'line-through text-slate-400 decoration-slate-400' : ''}>
                              {sub.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Detailed Notes inside View modal */}
                {selectedTask.notes && (
                  <>
                    <div className="h-px bg-slate-100 w-full my-3"></div>
                    <div className="flex flex-col gap-1 ml-7.5">
                      <span className="text-[12px] font-extrabold text-slate-400 uppercase tracking-wide">Detailed Notes</span>
                      <p className="text-slate-600 text-xs mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line font-semibold">
                        {selectedTask.notes}
                      </p>
                    </div>
                  </>
                )}

                <div className="h-px bg-slate-100 w-full my-3"></div>
              </div>

              {/* Close footer */}
              <div className="bg-slate-50/50 px-6 py-4 flex justify-end border-t border-slate-100">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all text-xs active:scale-95 shadow-premium cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Custom Delete Confirmation Modal */}
        {taskToDelete !== null && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-100 rounded-2xl shadow-modal w-full max-w-sm overflow-hidden z-10 p-6 text-center space-y-4"
            >
              {/* Warning Icon */}
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 animate-bounce">
                <Trash2 size={22} strokeWidth={2} />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-800">Delete Task Note?</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Are you sure you want to permanently delete this task? This action cannot be undone and will clear all checklist history.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTaskToDelete(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await axios.delete(`/api/tasks/${taskToDelete}`);
                      setLocalTasks(localTasks.filter(t => t && t.id !== taskToDelete));
                      toast.info('Task deleted from Firebase.');
                      setTaskToDelete(null);
                      if (activeModal === 'view') setActiveModal(null);
                    } catch (err) {
                      console.error(err);
                      toast.error("We couldn't delete the task. Please try again.");
                    }
                  }}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all text-xs active:scale-95 shadow-lg shadow-red-500/10 cursor-pointer"
                >
                  Delete Task
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
