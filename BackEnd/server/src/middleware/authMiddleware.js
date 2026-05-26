import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { db } from '../config/db.js';

// Protect routes
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Prioritize the Authorization header, fallback to cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from firestore
      const userDoc = await db.collection('users').doc(decoded.id).get();

      if (!userDoc.exists) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      req.user = { _id: userDoc.id, ...userDoc.data() };
      delete req.user.password;

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});
