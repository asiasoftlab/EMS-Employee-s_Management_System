import asyncHandler from 'express-async-handler';
import { db } from '../config/db.js';
import admin from 'firebase-admin';

// @desc    Apply for a leave
// @route   POST /api/leaves
// @access  Private
export const applyLeave = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, reason, halfDayShift } = req.body;

  if (!leaveType || !startDate || !endDate || !reason) {
    res.status(400);
    throw new Error('Please provide leaveType, startDate, endDate, and reason');
  }

  const newLeave = {
    userId: req.user._id,
    userName: req.user.name || '',
    userEmail: req.user.email || '',
    leaveType,
    startDate, // Storing as YYYY-MM-DD string
    endDate,   // Storing as YYYY-MM-DD string
    halfDayShift: halfDayShift || null,
    reason,
    status: 'Pending',
    appliedOn: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('leaves').add(newLeave);

  res.status(201).json({ _id: docRef.id, ...newLeave });
});

// @desc    Get my leaves
// @route   GET /api/leaves
// @access  Private
export const getMyLeaves = asyncHandler(async (req, res) => {
  const snapshot = await db.collection('leaves')
    .where('userId', '==', req.user._id)
    .get();

  const leaves = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    
    // Normalize timestamp for frontend
    let appliedOnMs = 0;
    if (data.appliedOn) {
      if (data.appliedOn.toMillis) {
        appliedOnMs = data.appliedOn.toMillis();
      } else if (data.appliedOn._seconds !== undefined) {
        appliedOnMs = data.appliedOn._seconds * 1000;
      } else {
        appliedOnMs = new Date(data.appliedOn).getTime();
      }
    }
    
    leaves.push({ 
      _id: doc.id, 
      ...data,
      appliedOn: appliedOnMs
    });
  });

  // Sort descending by applied date
  leaves.sort((a, b) => b.appliedOn - a.appliedOn);

  res.status(200).json(leaves);
});

// @desc    Get all leaves
// @route   GET /api/leaves/all
// @access  Private (Manager)
export const getAllLeaves = asyncHandler(async (req, res) => {
  // In a real app, verify manager role here
  const snapshot = await db.collection('leaves').get();

  const leaves = [];
  snapshot.forEach(doc => {
    leaves.push({ _id: doc.id, ...doc.data() });
  });

  res.status(200).json(leaves);
});

// @desc    Update leave status
// @route   PATCH /api/leaves/:id/status
// @access  Private (Manager)
export const updateLeaveStatus = asyncHandler(async (req, res) => {
  const { status, rejectReason } = req.body;
  const leaveRef = db.collection('leaves').doc(req.params.id);
  const leaveDoc = await leaveRef.get();

  if (!leaveDoc.exists) {
    res.status(404);
    throw new Error('Leave record not found');
  }

  const leaveData = leaveDoc.data();

  const updateData = {
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (status === 'Rejected' && rejectReason) {
    updateData.rejectReason = rejectReason;
  }

  await leaveRef.update(updateData);

  // If approved, create attendance records
  if (status === 'Approved') {
    const start = new Date(leaveData.startDate);
    const end = new Date(leaveData.endDate);
    
    // Loop through all days from start to end
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0) continue; // Skip Sundays

      const dateStr = d.toISOString().split('T')[0];
      
      // Check if an attendance record already exists for this day
      const existingSnapshot = await db.collection('attendance')
        .where('userId', '==', leaveData.userId)
        .where('date', '==', dateStr)
        .get();

      if (existingSnapshot.empty) {
        // Create new attendance record for the leave day
        await db.collection('attendance').add({
          userId: leaveData.userId,
          userName: leaveData.userName,
          date: dateStr,
          clockIn: null,
          clockOut: null,
          totalHours: 0,
          status: leaveData.leaveType === 'HalfDay' ? `Half Day Leave (${leaveData.halfDayShift})` : `On Leave (${leaveData.leaveType})`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  }

  const updatedDoc = await leaveRef.get();
  res.status(200).json({ _id: updatedDoc.id, ...updatedDoc.data() });
});

// @desc    Cancel a pending leave request
// @route   DELETE /api/leaves/:id
// @access  Private (Employee)
export const cancelLeave = asyncHandler(async (req, res) => {
  const leaveRef = db.collection('leaves').doc(req.params.id);
  const leaveDoc = await leaveRef.get();

  if (!leaveDoc.exists) {
    res.status(404);
    throw new Error('Leave record not found');
  }

  const leaveData = leaveDoc.data();

  // Make sure the user owns this leave
  if (leaveData.userId !== req.user._id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  // Only allow canceling if it's still pending
  if (leaveData.status !== 'Pending') {
    res.status(400);
    throw new Error('Cannot cancel a leave that has already been processed');
  }

  await leaveRef.delete();

  res.status(200).json({ id: req.params.id, message: 'Leave cancelled successfully' });
});

// @desc    Update a pending leave request
// @route   PUT /api/leaves/:id
// @access  Private (Employee)
export const updateLeave = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, reason, halfDayShift } = req.body;
  const leaveRef = db.collection('leaves').doc(req.params.id);
  const leaveDoc = await leaveRef.get();

  if (!leaveDoc.exists) {
    res.status(404);
    throw new Error('Leave record not found');
  }

  const leaveData = leaveDoc.data();

  // Make sure the user owns this leave
  if (leaveData.userId !== req.user._id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  // Only allow updating if it's still pending
  if (leaveData.status !== 'Pending') {
    res.status(400);
    throw new Error('Cannot edit a leave that has already been processed');
  }

  if (!leaveType || !startDate || !endDate || !reason) {
    res.status(400);
    throw new Error('Please provide leaveType, startDate, endDate, and reason');
  }

  const updatedData = {
    leaveType,
    startDate,
    endDate,
    halfDayShift: halfDayShift || null,
    reason,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await leaveRef.update(updatedData);

  const updatedDoc = await leaveRef.get();
  res.status(200).json({ _id: updatedDoc.id, ...updatedDoc.data() });
});
