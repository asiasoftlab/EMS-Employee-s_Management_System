import express from 'express';
import { authorize } from '../middleware/roleMiddleware.js';
import { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus, cancelLeave, updateLeave } from '../controllers/leaveController.js';
import { protect } from '../middleware/authMiddleware.js'; // Assumes standard protect middleware

const router = express.Router();

router.route('/')
  .post(protect, applyLeave)
  .get(protect, getMyLeaves);

router.route('/:id')
  .delete(protect, cancelLeave)
  .put(protect, updateLeave);

router.route('/all')
  .get(protect, authorize('admin', 'manager'), getAllLeaves);

router.route('/:id/status')
  .patch(protect, authorize('admin', 'manager'), updateLeaveStatus);

export default router;
