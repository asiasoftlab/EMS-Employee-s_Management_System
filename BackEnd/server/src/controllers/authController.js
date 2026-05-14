import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../services/emailService.js';
import { db } from '../config/db.js';
import admin from 'firebase-admin';

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, phone } = req.body;

  if (!name || !email || !password || !phone) {
    res.status(400);
    throw new Error('Please add name, email, password, and phone number');
  }

  if (!email.toLowerCase().endsWith('@asiasoftlab.in')) {
    res.status(400);
    throw new Error('Please check your email address');
  }

  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();

  if (!snapshot.empty) {
    res.status(400);
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = {
    name,
    email,
    phone,
    password: hashedPassword,
    department: department || 'General',
    isAdmin: false,
    isOnline: false,
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await usersRef.add(newUser);

  const token = generateToken(res, docRef.id);
  res.status(201).json({
    _id: docRef.id,
    name: newUser.name,
    email: newUser.email,
    department: newUser.department,
    isAdmin: newUser.isAdmin,
    token,
  });
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();

  if (snapshot.empty) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  let userDoc;
  let userData;
  snapshot.forEach(doc => {
    userDoc = doc;
    userData = doc.data();
  });

  const isMatch = await bcrypt.compare(password, userData.password);

  if (isMatch) {
    // Update online status
    await usersRef.doc(userDoc.id).update({
      isOnline: true,
      lastSeen: admin.firestore.FieldValue.serverTimestamp()
    });

    const token = generateToken(res, userDoc.id);
    
    res.json({
      _id: userDoc.id,
      name: userData.name,
      email: userData.email,
      department: userData.department,
      isAdmin: userData.isAdmin || false,
      token,
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = asyncHandler(async (req, res) => {
  if (req.user) {
    await db.collection('users').doc(req.user._id).update({
      isOnline: false,
      lastSeen: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    isAdmin: req.user.isAdmin || false,
    department: req.user.department,
  };
  res.status(200).json(user);
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('phone', '==', req.body.phone).get();

  if (snapshot.empty) {
    res.status(404);
    throw new Error('There is no user with that mobile number');
  }

  let userDocId;
  let userData;
  snapshot.forEach(doc => { userDocId = doc.id; userData = doc.data(); });

  const resetOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
  const resetPasswordToken = crypto.createHash('sha256').update(resetOtp).digest('hex');
  const resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await usersRef.doc(userDocId).update({
    resetPasswordToken,
    resetPasswordExpire
  });

  // Mock sending SMS via console
  console.log(`\n\n=== SMS MOCK ===`);
  console.log(`To: ${req.body.phone}`);
  console.log(`Message: Your EMS password reset OTP is: ${resetOtp}`);
  console.log(`================\n\n`);

  res.status(200).json({ success: true, data: 'OTP sent to mobile number' });
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { phone, otp, password } = req.body;

  if (!phone || !otp || !password) {
    res.status(400);
    throw new Error('Please provide phone, OTP, and new password');
  }

  const resetPasswordToken = crypto.createHash('sha256').update(otp).digest('hex');

  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('phone', '==', phone).get();

  if (snapshot.empty) {
    res.status(400);
    throw new Error('Invalid phone number or OTP');
  }

  let userDocId;
  let userData;
  snapshot.forEach(doc => { 
    userDocId = doc.id; 
    userData = doc.data();
  });

  if (userData.resetPasswordToken !== resetPasswordToken) {
    res.status(400);
    throw new Error('Invalid OTP');
  }

  if (!userData.resetPasswordExpire || userData.resetPasswordExpire < Date.now()) {
    res.status(400);
    throw new Error('OTP has expired');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  await usersRef.doc(userDocId).update({
    password: hashedPassword,
    resetPasswordToken: admin.firestore.FieldValue.delete(),
    resetPasswordExpire: admin.firestore.FieldValue.delete()
  });

  const token = generateToken(res, userDocId);

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
    token,
  });
});
