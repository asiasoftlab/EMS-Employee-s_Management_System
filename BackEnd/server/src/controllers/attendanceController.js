import asyncHandler from 'express-async-handler';
import { db } from '../config/db.js';
import admin from 'firebase-admin';

const getTodayDateString = () => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
};

// @desc    Get user's attendance records
// @route   GET /api/attendance
// @access  Private
export const getAttendance = asyncHandler(async (req, res) => {
  const snapshot = await db.collection('attendance')
    .where('userId', '==', req.user._id)
    .get();

  const records = [];
  const now = new Date();
  const updatePromises = [];

  snapshot.forEach(doc => {
    let record = { _id: doc.id, ...doc.data() };

    if (!record.clockOut && record.clockIn) {
      const clockInTime = new Date(record.clockIn);
      const sixPM = new Date(clockInTime);
      sixPM.setHours(18, 0, 0, 0); // 6:00 PM on the day of clock-in

      // If current time is past 6 PM and clock-in was before 6 PM
      if (now > sixPM && clockInTime < sixPM) {
        const clockOutTime = sixPM.toISOString();
        const diffMs = sixPM - clockInTime;
        const totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

        record.clockOut = clockOutTime;
        record.totalHours = parseFloat(totalHours);

        const updatePromise = db.collection('attendance').doc(doc.id).update({
          clockOut: clockOutTime,
          totalHours: parseFloat(totalHours),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          autoClockedOut: true
        });
        updatePromises.push(updatePromise);
      }
    }

    records.push(record);
  });

  if (updatePromises.length > 0) {
    await Promise.all(updatePromises);
  }

  // Sort by date descending
  records.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.status(200).json(records);
});

// @desc    Clock in for today
// @route   POST /api/attendance/clock-in
// @access  Private
export const clockIn = asyncHandler(async (req, res) => {
  const today = getTodayDateString();
  const userId = req.user._id;

  const snapshot = await db.collection('attendance')
    .where('userId', '==', userId)
    .where('date', '==', today)
    .get();

  if (!snapshot.empty) {
    res.status(400);
    throw new Error('Already clocked in today');
  }

  const newRecord = {
    userId,
    userName: req.user.name,
    date: today,
    clockIn: new Date().toISOString(),
    clockOut: null,
    totalHours: 0,
    status: 'Present', // Or late, etc. depending on logic
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('attendance').add(newRecord);

  res.status(201).json({ _id: docRef.id, ...newRecord });
});

// @desc    Clock out for today
// @route   POST /api/attendance/clock-out
// @access  Private
export const clockOut = asyncHandler(async (req, res) => {
  const today = getTodayDateString();
  const userId = req.user._id;

  const snapshot = await db.collection('attendance')
    .where('userId', '==', userId)
    .where('date', '==', today)
    .get();

  if (snapshot.empty) {
    res.status(400);
    throw new Error('No clock-in record found for today');
  }

  let docId;
  let recordData;
  snapshot.forEach(doc => {
    docId = doc.id;
    recordData = doc.data();
  });

  if (recordData.clockOut) {
    res.status(400);
    throw new Error('Already clocked out today');
  }

  const clockOutTime = new Date().toISOString();
  const clockInTime = new Date(recordData.clockIn);
  const diffMs = new Date(clockOutTime) - clockInTime;
  const totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

  await db.collection('attendance').doc(docId).update({
    clockOut: clockOutTime,
    totalHours: parseFloat(totalHours),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const updatedDoc = await db.collection('attendance').doc(docId).get();

  res.status(200).json({ _id: updatedDoc.id, ...updatedDoc.data() });
});
