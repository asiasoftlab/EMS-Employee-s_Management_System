import asyncHandler from 'express-async-handler';
import { db } from '../config/db.js';

// @desc    Get all employees
// @route   GET /api/manager/employees
// @access  Private (Manager only)
export const getEmployees = asyncHandler(async (req, res) => {
  // Query only by role to avoid requiring a composite index in Firestore
  const snapshot = await db.collection('users')
    .where('role', '==', 'employee')
    .get();

  const employees = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    delete data.password;
    employees.push({ _id: doc.id, ...data });
  });

  res.status(200).json(employees);
});

// @desc    Get all tasks
// @route   GET /api/manager/tasks
// @access  Private (Manager only)
export const getAllTasks = asyncHandler(async (req, res) => {
  const tasksSnapshot = await db.collection('tasks').orderBy('createdAt', 'desc').get();
  const tasks = [];

  const userIds = new Set();
  tasksSnapshot.forEach(doc => {
    const data = doc.data();
    userIds.add(data.employeeId);
    tasks.push({ _id: doc.id, ...data });
  });

  // Fetch users for those tasks
  const usersMap = {};
  if (userIds.size > 0) {
    // Note: Firestore 'in' query supports up to 10 items. For larger datasets, 
    // it's better to fetch users individually or keep a cached map. 
    // This is a simple implementation:
    const usersRefs = Array.from(userIds).map(id => db.collection('users').doc(id));
    if (usersRefs.length > 0) {
      const usersDocs = await db.getAll(...usersRefs);
      usersDocs.forEach(doc => {
        if (doc.exists) {
          const data = doc.data();
          usersMap[doc.id] = { _id: doc.id, name: data.name, email: data.email, department: data.department, isOnline: data.isOnline };
        }
      });
    }
  }

  // Combine tasks with employee data
  const populatedTasks = tasks
    .filter(task => {
      const user = usersMap[task.employeeId];
      return user !== undefined;
    })
    .map(task => ({
      ...task,
      employeeId: usersMap[task.employeeId]
    }));

  res.status(200).json(populatedTasks);
});

// @desc    Get specific employee details and their tasks
// @route   GET /api/manager/employee/:id
// @access  Private (Manager only)
export const getEmployeeDetails = asyncHandler(async (req, res) => {
  const userRef = db.collection('users').doc(req.params.id);
  const userDoc = await userRef.get();

  if (!userDoc.exists || userDoc.data().role !== 'employee') {
    res.status(404);
    throw new Error('Employee not found');
  }

  const employeeData = userDoc.data();
  delete employeeData.password;

  const tasksSnapshot = await db.collection('tasks').where('employeeId', '==', req.params.id).get();
  const tasks = [];
  tasksSnapshot.forEach(doc => {
    tasks.push({ _id: doc.id, ...doc.data() });
  });

  res.status(200).json({ employee: { _id: userDoc.id, ...employeeData }, tasks });
});

// @desc    Get tasks for a specific employee
// @route   GET /api/manager/employee/:id/tasks
// @access  Private (Manager/Admin)
export const getEmployeeTasksById = asyncHandler(async (req, res) => {
  const tasksSnapshot = await db.collection('tasks')
    .where('employeeId', '==', req.params.id)
    .get();

  const tasks = [];
  tasksSnapshot.forEach(doc => {
    const data = doc.data();

    // Normalize deadline
    let deadlineStr = '';
    if (data.deadline) {
      const secs = data.deadline._seconds ?? data.deadline.seconds;
      if (secs !== undefined) {
        deadlineStr = new Date(secs * 1000).toISOString().split('T')[0];
      } else if (data.deadline.toDate) {
        deadlineStr = data.deadline.toDate().toISOString().split('T')[0];
      } else {
        try { deadlineStr = new Date(data.deadline).toISOString().split('T')[0]; } catch { }
      }
    }

    // Normalize timestamps
    const toMs = (ts) => {
      if (!ts) return 0;
      if (ts.toMillis) return ts.toMillis();
      const s = ts._seconds ?? ts.seconds;
      return s ? s * 1000 : new Date(ts).getTime();
    };

    tasks.push({
      _id: doc.id,
      ...data,
      deadline: deadlineStr,
      createdAt: toMs(data.createdAt),
      updatedAt: toMs(data.updatedAt),
    });
  });

  tasks.sort((a, b) => b.createdAt - a.createdAt);

  res.status(200).json(tasks);
});
