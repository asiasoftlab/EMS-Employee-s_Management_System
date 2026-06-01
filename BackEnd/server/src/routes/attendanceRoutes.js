import express from 'express';
import { getAttendance, clockIn, clockOut } from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAttendance);
router.post('/clock-in', protect, clockIn);
router.post('/clock-out', protect, clockOut);

export default router;
