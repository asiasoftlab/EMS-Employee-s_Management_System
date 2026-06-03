import express from 'express';
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
  .get(protect, getAllLeaves); // ideally should use manager/admin protect middleware here

router.route('/:id/status')
  .patch(protect, updateLeaveStatus); // ideally should use manager/admin protect middleware here

export default router;
