import express from 'express';
import {
  getEmployees,
  getAllTasks,
  getEmployeeDetails,
  getEmployeeTasksById,
  getEmployeeAttendanceById,
} from '../controllers/managerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes in this file are protected and restricted to managers only
router.use(protect);
router.use(authorize('manager', 'admin'));

router.get('/employees', getEmployees);
router.get('/tasks', getAllTasks);
router.get('/employee/:id/tasks', getEmployeeTasksById);
router.get('/employee/:id/attendance', getEmployeeAttendanceById);
router.get('/employee/:id', getEmployeeDetails);

export default router;
