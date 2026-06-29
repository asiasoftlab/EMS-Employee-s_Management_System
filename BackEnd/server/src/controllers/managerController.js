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

  try {
    const attendanceSnapshot = await db.collection('attendance').get();
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const hoursMap = {};

    attendanceSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.userId) {
        if (!hoursMap[data.userId]) {
          hoursMap[data.userId] = { today: 0, total: 0, currentClockIn: null };
        }
        const hours = parseFloat(data.totalHours) || 0;
        hoursMap[data.userId].total += hours;

        if (data.date === todayStr) {
          hoursMap[data.userId].today += hours;
          if (data.clockIn && !data.clockOut) {
            hoursMap[data.userId].currentClockIn = data.clockIn;
          }
        }
      }
    });

    employees.forEach(emp => {
      if (hoursMap[emp._id]) {
        emp.todayWorkingHours = hoursMap[emp._id].today;
        emp.totalWorkingHours = hoursMap[emp._id].total;
        emp.currentClockIn = hoursMap[emp._id].currentClockIn;
      } else {
        emp.todayWorkingHours = 0;
        emp.totalWorkingHours = 0;
        emp.currentClockIn = null;
      }
    });
  } catch (err) {
    console.error('Error fetching attendance for hours calculation:', err);
  }

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

  const attendanceSnapshot = await db.collection('attendance').get();
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

  const userAttMap = {}; // userId -> date -> { hours, clockIn }
  attendanceSnapshot.forEach(doc => {
    const d = doc.data();
    if (d.userId && d.date) {
      if (!userAttMap[d.userId]) userAttMap[d.userId] = {};
      let hours = parseFloat(d.totalHours) || 0;
      let clockIn = null;
      if (d.date === todayStr && d.clockIn && !d.clockOut) {
        clockIn = d.clockIn;
      }
      userAttMap[d.userId][d.date] = { hours, clockIn };
    }
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
          usersMap[doc.id] = { _id: doc.id, name: data.name, email: data.email, department: data.department, isOnline: data.isOnline, lastActiveAt: data.lastActiveAt };
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
    .map(task => {
      let attDateStr = '';
      if (task.deadline) {
        const secs = task.deadline._seconds ?? task.deadline.seconds;
        let dObj;
        if (secs !== undefined) dObj = new Date(secs * 1000);
        else if (task.deadline.toDate) dObj = task.deadline.toDate();
        else { try { dObj = new Date(task.deadline); } catch { } }

        if (dObj && !isNaN(dObj)) {
          attDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(dObj);
        }
      }

      let todayWorkingHours = 0;
      let currentClockIn = null;
      if (attDateStr && userAttMap[task.employeeId] && userAttMap[task.employeeId][attDateStr]) {
        todayWorkingHours = userAttMap[task.employeeId][attDateStr].hours;
        currentClockIn = userAttMap[task.employeeId][attDateStr].clockIn;
      }

      return {
        ...task,
        todayWorkingHours,
        currentClockIn,
        employeeId: usersMap[task.employeeId]
      };
    });

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

  const attSnapshot = await db.collection('attendance')
    .where('userId', '==', req.params.id)
    .get();

  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const attMap = {};
  attSnapshot.forEach(doc => {
    const d = doc.data();
    if (d.date) {
      let hours = parseFloat(d.totalHours) || 0;
      let clockIn = null;
      if (d.date === todayStr && d.clockIn && !d.clockOut) {
        clockIn = d.clockIn;
      }
      attMap[d.date] = { hours, clockIn };
    }
  });

  const tasks = [];
  tasksSnapshot.forEach(doc => {
    const data = doc.data();

    // Normalize deadline
    let deadlineStr = '';
    let attDateStr = '';
    if (data.deadline) {
      const secs = data.deadline._seconds ?? data.deadline.seconds;
      let dObj;
      if (secs !== undefined) {
        dObj = new Date(secs * 1000);
      } else if (data.deadline.toDate) {
        dObj = data.deadline.toDate();
      } else {
        try { dObj = new Date(data.deadline); } catch { }
      }

      if (dObj && !isNaN(dObj)) {
        deadlineStr = dObj.toISOString().split('T')[0];
        attDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(dObj);
      }
    }

    // Normalize timestamps
    const toMs = (ts) => {
      if (!ts) return 0;
      if (ts.toMillis) return ts.toMillis();
      const s = ts._seconds ?? ts.seconds;
      return s ? s * 1000 : new Date(ts).getTime();
    };

    let todayWorkingHours = 0;
    let currentClockIn = null;
    if (attDateStr && attMap[attDateStr]) {
      todayWorkingHours = attMap[attDateStr].hours;
      currentClockIn = attMap[attDateStr].clockIn;
    }

    tasks.push({
      _id: doc.id,
      ...data,
      deadline: deadlineStr,
      todayWorkingHours,
      currentClockIn,
      createdAt: toMs(data.createdAt),
      updatedAt: toMs(data.updatedAt),
    });
  });

  tasks.sort((a, b) => b.createdAt - a.createdAt);

  res.status(200).json(tasks);
});

// @desc    Get employee attendance by ID
// @route   GET /api/manager/employee/:id/attendance
// @access  Private (Manager only)
export const getEmployeeAttendanceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const snapshot = await db.collection('attendance')
    .where('userId', '==', id)
    .get();

  const records = [];
  snapshot.forEach(doc => {
    records.push({ _id: doc.id, ...doc.data() });
  });

  // Sort by date descending
  records.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.status(200).json(records);
});
