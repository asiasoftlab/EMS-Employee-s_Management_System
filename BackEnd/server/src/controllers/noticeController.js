import asyncHandler from 'express-async-handler';
import { db } from '../config/db.js';
import { FieldValue } from 'firebase-admin/firestore';
import { getIO } from '../../socket.js';

// @desc    Get all notices
// @route   GET /api/notices
// @access  Private (Employee/Admin/Manager)
export const getNotices = asyncHandler(async (req, res) => {
  const snapshot = await db.collection('notices')
    .orderBy('createdAt', 'desc')
    .get();

  const notices = [];
  snapshot.forEach(doc => {
    notices.push({ id: doc.id, ...doc.data() });
  });

  res.json(notices);
});

// @desc    Create a notice
// @route   POST /api/notices
// @access  Private (Admin/Manager)
export const createNotice = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    res.status(400);
    throw new Error('Please provide title and content');
  }

  const noticeData = {
    title,
    content,
    authorName: req.user.name,
    authorId: req.user._id,
    createdAt: FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('notices').add(noticeData);
  const newDoc = await docRef.get();

  const io = getIO();
  if (io) io.emit('new_notice', { title: noticeData.title, authorName: noticeData.authorName });

  res.status(201).json({ id: newDoc.id, ...newDoc.data() });
});

// @desc    Delete a notice
// @route   DELETE /api/notices/:id
// @access  Private (Admin/Manager)
export const deleteNotice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const docRef = db.collection('notices').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    res.status(404);
    throw new Error('Notice not found');
  }

  await docRef.delete();
  res.json({ message: 'Notice removed successfully' });
});
