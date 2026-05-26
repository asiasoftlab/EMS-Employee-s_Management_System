import express from 'express';
import { getNotifications, sendNotification } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getNotifications);
router.post('/send/:id', authorize('manager', 'admin'), sendNotification);

export default router;
