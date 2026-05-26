import asyncHandler from 'express-async-handler';
import { db } from '../config/db.js';
import admin from 'firebase-admin';

// @desc    Get logged in user's notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  const snapshot = await db.collection('notifications')
    .where('userId', '==', req.user._id)
    .orderBy('createdAt', 'desc')
    .get();

  const notifications = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    // Normalize timestamps
    const toMs = (ts) => {
      if (!ts) return 0;
      if (ts.toMillis) return ts.toMillis();
      const s = ts._seconds ?? ts.seconds;
      return s ? s * 1000 : new Date(ts).getTime();
    };

    notifications.push({
      _id: doc.id,
      ...data,
      createdAt: toMs(data.createdAt),
    });
  });

  res.status(200).json(notifications);
});

// @desc    Send notification to employee
// @route   POST /api/notifications/send/:id
// @access  Private (Manager/Admin)
export const sendNotification = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) {
    res.status(400);
    throw new Error('Message is required');
  }

  const notification = {
    userId: req.params.id,
    message,
    senderName: req.user.name || 'Manager',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    read: false
  };

  const docRef = await db.collection('notifications').add(notification);
  
  res.status(201).json({
    _id: docRef.id,
    ...notification,
    createdAt: Date.now()
  });
});
