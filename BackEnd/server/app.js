import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import './src/config/db.js';
import { notFound, errorHandler } from './src/middleware/errorMiddleware.js';

// Route imports
import authRoutes from './src/routes/authRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import managerRoutes from './src/routes/managerRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';
import noticeRoutes from './src/routes/noticeRoutes.js';

dotenv.config({ quiet: true });

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notices', noticeRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('EMS API is running with Firebase...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
