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

    socket.on('mark_chat_read', async (roomId) => {
      if (!roomId || !db) return;
      try {
        await db.collection('chats').doc(roomId).set({ adminUnreadCount: 0 }, { merge: true });
        ioInstance.emit('unread_count_update', { employeeId: roomId, unreadCount: 0 });
      } catch (err) {
        console.error('Error marking chat read:', err);
      }
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
          let newUnreadCount = 1;
          
          if (!metaSnap.exists && senderRole === 'employee') {
            await metaRef.set({
              employeeId: senderId,
              employeeName: senderName,
              employeeEmail: data.senderEmail || '',
              lastMessage: text,
              updatedAt: FieldValue.serverTimestamp(),
              adminUnreadCount: 1
            });
          } else {
            const updateData = { lastMessage: text, updatedAt: FieldValue.serverTimestamp() };
            if (senderRole === 'employee') {
              updateData.adminUnreadCount = FieldValue.increment(1);
            }
            await metaRef.set(updateData, { merge: true });
            if (senderRole === 'employee') {
              const updatedSnap = await metaRef.get();
              newUnreadCount = updatedSnap.data().adminUnreadCount || 1;
            }
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

        if (db && senderRole === 'employee') {
          ioInstance.emit('unread_count_update', { employeeId: senderId, unreadCount: newUnreadCount });
        }
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
