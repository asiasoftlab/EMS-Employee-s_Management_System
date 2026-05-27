import express from 'express';
import {
  getNotices,
  createNotice,
  deleteNotice,
} from '../controllers/noticeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getNotices)
  .post(protect, authorize('admin', 'manager'), createNotice);

router.route('/:id')
  .delete(protect, authorize('admin', 'manager'), deleteNotice);

export default router;
