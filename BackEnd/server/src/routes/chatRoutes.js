import express from 'express';
import { db } from '../config/db.js';

const router = express.Router();

router.get('/meta/all', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ message: 'Database not initialized' });
    }
    const snapshot = await db.collection('chats').get();
    const meta = {};
    snapshot.forEach(doc => {
      meta[doc.id] = doc.data();
    });
    res.json(meta);
  } catch (error) {
    console.error('Error fetching chat meta:', error);
    res.status(500).json({ message: 'Failed to fetch chat meta' });
  }
});

router.get('/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!db) {
      return res.status(500).json({ message: 'Database not initialized' });
    }

    const msgsRef = db.collection('chats').doc(roomId).collection('messages');
    const snapshot = await msgsRef.orderBy('createdAt', 'asc').get();

    const messages = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Handle timestamp conversion
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        data.createdAt = data.createdAt.toDate().toISOString();
      }
      messages.push({ id: doc.id, ...data });
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

export default router;
