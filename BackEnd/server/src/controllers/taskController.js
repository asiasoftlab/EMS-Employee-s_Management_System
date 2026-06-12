import asyncHandler from 'express-async-handler';
import { db } from '../config/db.js';
import admin from 'firebase-admin';
import { getIO } from '../../socket.js';

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Employee/Manager)
export const createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, deadline, location } = req.body;

  if (!title || !description || !deadline) {
    res.status(400);
    throw new Error('Please add title, description, and deadline');
  }

  // Prevent task creation on approved leave days
  const taskDeadline = new Date(deadline).toISOString().split('T')[0];
  const leavesSnapshot = await db.collection('leaves')
    .where('userId', '==', req.user._id)
    .where('status', '==', 'Approved')
    .get();

  let isOnLeave = false;
  leavesSnapshot.forEach(doc => {
    const leave = doc.data();
    if (taskDeadline >= leave.startDate && taskDeadline <= leave.endDate) {
      isOnLeave = true;
    }
  });

  if (isOnLeave) {
    res.status(400);
    throw new Error('You cannot be assigned a task on a day you are on an approved leave.');
  }

  const newTask = {
    employeeId: req.user._id,
    employeeName: req.user.name || '',
    employeeEmail: req.user.email || '',
    title,
    description,
    location: location || '',
    status: 'Pending',
    priority: priority || 'Medium',
    deadline: new Date(deadline),
    submittedTo: ['manager'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('tasks').add(newTask);
  
  const io = getIO();
  if (io) io.emit('task_updated');

  res.status(201).json({ _id: docRef.id, ...newTask });
});

// @desc    Get user's tasks
// @route   GET /api/tasks
// @access  Private (Employee)
export const getTasks = asyncHandler(async (req, res) => {
  const snapshot = await db.collection('tasks')
    .where('employeeId', '==', req.user._id)
    .get();

  const tasks = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    
    // Normalize deadline to clean ISO Date string (YYYY-MM-DD)
    let deadlineStr = '';
    if (data.deadline) {
      if (data.deadline.toDate) {
        deadlineStr = data.deadline.toDate().toISOString().split('T')[0];
      } else if (data.deadline._seconds !== undefined) {
        deadlineStr = new Date(data.deadline._seconds * 1000).toISOString().split('T')[0];
      } else if (typeof data.deadline === 'string') {
        deadlineStr = data.deadline.split('T')[0];
      } else {
        try {
          deadlineStr = new Date(data.deadline).toISOString().split('T')[0];
        } catch (e) {
          deadlineStr = '';
        }
      }
    }

    tasks.push({ 
      _id: doc.id, 
      ...data, 
      deadline: deadlineStr 
    });
  });

  // Sort by createdAt descending in memory to avoid requiring a Firebase composite index
  tasks.sort((a, b) => {
    const valA = a.createdAt ? (a.createdAt.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()) : 0;
    const valB = b.createdAt ? (b.createdAt.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime()) : 0;
    return valB - valA;
  });

  res.status(200).json(tasks);
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Employee)
export const updateTask = asyncHandler(async (req, res) => {
  const taskRef = db.collection('tasks').doc(req.params.id);
  const taskDoc = await taskRef.get();

  if (!taskDoc.exists) {
    res.status(404);
    throw new Error('Task not found');
  }

  const taskData = taskDoc.data();

  // Make sure user owns task
  if (taskData.employeeId !== req.user._id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  const { title, description, priority, deadline, status, notes, subtasks, location } = req.body;

  const updatedData = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // Prevent task update to an approved leave day
  if (deadline !== undefined && deadline) {
    const taskDeadline = new Date(deadline).toISOString().split('T')[0];
    const leavesSnapshot = await db.collection('leaves')
      .where('userId', '==', taskData.employeeId)
      .where('status', '==', 'Approved')
      .get();

    let isOnLeave = false;
    leavesSnapshot.forEach(doc => {
      const leave = doc.data();
      if (taskDeadline >= leave.startDate && taskDeadline <= leave.endDate) {
        isOnLeave = true;
      }
    });

    if (isOnLeave) {
      res.status(400);
      throw new Error('You cannot update a task deadline to a day you are on an approved leave.');
    }
  }

  if (title !== undefined) updatedData.title = title;
  if (description !== undefined) updatedData.description = description;
  if (priority !== undefined) updatedData.priority = priority;
  if (status !== undefined) updatedData.status = status;
  if (notes !== undefined) updatedData.notes = notes;
  if (subtasks !== undefined) updatedData.subtasks = subtasks;
  if (location !== undefined) updatedData.location = location;
  
  if (deadline !== undefined) {
    updatedData.deadline = deadline ? new Date(deadline) : null;
  }

  await taskRef.update(updatedData);

  const io = getIO();
  if (io) io.emit('task_updated');

  // Return the updated task representation
  const finalDeadline = deadline ? (new Date(deadline).toISOString().split('T')[0]) : '';
  res.status(200).json({ 
    _id: req.params.id, 
    ...taskData, 
    ...updatedData,
    deadline: finalDeadline
  });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Employee)
export const deleteTask = asyncHandler(async (req, res) => {
  const taskRef = db.collection('tasks').doc(req.params.id);
  const taskDoc = await taskRef.get();

  if (!taskDoc.exists) {
    res.status(404);
    throw new Error('Task not found');
  }

  if (taskDoc.data().employeeId !== req.user._id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  await taskRef.delete();

  const io = getIO();
  if (io) io.emit('task_updated');

  res.status(200).json({ id: req.params.id });
});

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private (Employee)
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const taskRef = db.collection('tasks').doc(req.params.id);
  const taskDoc = await taskRef.get();

  if (!taskDoc.exists) {
    res.status(404);
    throw new Error('Task not found');
  }

  if (taskDoc.data().employeeId !== req.user._id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  await taskRef.update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  const io = getIO();
  if (io) io.emit('task_updated');

  const updatedDoc = await taskRef.get();
  res.status(200).json({ _id: updatedDoc.id, ...updatedDoc.data() });
});
