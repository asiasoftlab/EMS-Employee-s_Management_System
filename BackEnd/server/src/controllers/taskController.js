import asyncHandler from 'express-async-handler';
import { db } from '../config/db.js';
import admin from 'firebase-admin';

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Employee/Manager)
export const createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, deadline } = req.body;

  if (!title || !description || !deadline) {
    res.status(400);
    throw new Error('Please add title, description, and deadline');
  }

  const newTask = {
    employeeId: req.user._id,
    title,
    description,
    status: 'Pending',
    priority: priority || 'Medium',
    deadline: new Date(deadline),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('tasks').add(newTask);
  
  res.status(201).json({ _id: docRef.id, ...newTask });
});

// @desc    Get user's tasks
// @route   GET /api/tasks
// @access  Private (Employee)
export const getTasks = asyncHandler(async (req, res) => {
  const snapshot = await db.collection('tasks')
    .where('employeeId', '==', req.user._id)
    .orderBy('createdAt', 'desc')
    .get();

  const tasks = [];
  snapshot.forEach(doc => {
    tasks.push({ _id: doc.id, ...doc.data() });
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

  const updatedData = {
    ...req.body,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await taskRef.update(updatedData);

  res.status(200).json({ _id: req.params.id, ...taskData, ...updatedData });
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

  const updatedDoc = await taskRef.get();
  res.status(200).json({ _id: updatedDoc.id, ...updatedDoc.data() });
});
