import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { socket } from '../config/socket';

export default function useGlobalNotifications(user) {
  useEffect(() => {
    if (!user) return;

    // Request desktop notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const triggerDesktopNotification = (title, body) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/ems-logo.png' });
      }
    };

    const handleNewNotice = (data) => {
      const { title, authorName } = data;
      const msg = `New Notice from ${authorName}: ${title}`;
      toast.info(msg);
      triggerDesktopNotification('New Notice', msg);
    };

    const handleTaskUpdated = () => {
      // In a real scenario we'd get task details from backend. For now, a generic update.
      triggerDesktopNotification('Task Update', 'A task assigned to you has been updated.');
    };

    const handleReceiveMessage = (data) => {
      if (data.senderId !== user._id) {
        const msg = `New message from ${data.senderName}`;
        toast.info(msg);
        triggerDesktopNotification('New Direct Message', msg);
      }
    };

    // Ensure socket is connected globally to receive these events
    if (!socket.connected) {
      socket.connect();
    }

    socket.on('new_notice', handleNewNotice);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('new_notice', handleNewNotice);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [user]);
}
