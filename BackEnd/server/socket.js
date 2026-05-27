import { Server } from 'socket.io';
import { db } from './src/config/db.js';
import { FieldValue } from 'firebase-admin/firestore';

let ioInstance;

export const initializeSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5174',
      methods: ['GET', 'POST'],
      credentials: true,
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log('User connected to socket:', socket.id);

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('send_message', async (data) => {
      // data should contain: roomId, text, senderId, senderName, senderRole
      const { roomId, text, senderId, senderName, senderRole } = data;

      if (!roomId || !text) return;

      try {
        const msgData = {
          text,
          senderId,
          senderName,
          senderRole,
          createdAt: FieldValue.serverTimestamp(),
        };

        // Save to Firestore
        if (db) {
          const msgsRef = db.collection('chats').doc(roomId).collection('messages');
          const addedMsg = await msgsRef.add(msgData);

          // Also update the chat metadata
          const metaRef = db.collection('chats').doc(roomId);
          const metaSnap = await metaRef.get();
          if (!metaSnap.exists && senderRole === 'employee') {
            await metaRef.set({
              employeeId: senderId,
              employeeName: senderName,
              employeeEmail: data.senderEmail || '',
              lastMessage: text,
              updatedAt: FieldValue.serverTimestamp(),
            });
          } else {
            await metaRef.set({ lastMessage: text, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
          }

          // Attach the real timestamp for broadcasting
          msgData.id = addedMsg.id;
          msgData.createdAt = new Date().toISOString(); // fallback for immediate display
        } else {
          msgData.id = Date.now().toString();
          msgData.createdAt = new Date().toISOString();
        }

        // Broadcast to room
        ioInstance.to(roomId).emit('receive_message', msgData);
      } catch (err) {
        console.error('Socket message error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    console.warn('Socket.io not initialized yet!');
  }
  return ioInstance;
};
