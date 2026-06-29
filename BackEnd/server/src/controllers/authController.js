import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import generateToken from '../utils/generateToken.js';
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

  const newUser = {name,email,phone,
    password: hashedPassword,
    department: department || 'General',
    role: role || 'employee',
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
    role: newUser.role,
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
      role: userData.role || 'employee',
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
    role: req.user.role || 'employee',
    department: req.user.department,
    phone: req.user.phone,
    emergencyContact: req.user.emergencyContact,
    gender: req.user.gender,
    dob: req.user.dob,
    address: req.user.address,
    bloodGroup: req.user.bloodGroup,
    profilePic: req.user.profilePic,
    profilePicUpdateDates: req.user.profilePicUpdateDates || [],
  };
  res.status(200).json(user);
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const usersRef = db.collection('users');
  const userRef = usersRef.doc(req.user._id);

  const docSnap = await userRef.get();
  if (!docSnap.exists) {
    res.status(404);
    throw new Error('User not found');
  }

  const { name, phone, emergencyContact, gender, dob, address, bloodGroup, profilePic } = req.body;
  
  const updateData = {
    name: name || docSnap.data().name || '',
    phone: phone || docSnap.data().phone || '',
    emergencyContact: emergencyContact || docSnap.data().emergencyContact || '',
    gender: gender || docSnap.data().gender || '',
    dob: dob || docSnap.data().dob || '',
    address: address || docSnap.data().address || '',
    bloodGroup: bloodGroup || docSnap.data().bloodGroup || '',
  };

  if (profilePic !== undefined) {
    const existingPic = docSnap.data().profilePic;
    if (profilePic !== existingPic) {
      const updates = docSnap.data().profilePicUpdateDates || [];
      const currentYear = new Date().getFullYear();
      const updatesThisYear = updates.filter(date => new Date(date).getFullYear() === currentYear);
      
      if (updatesThisYear.length >= 3) {
        res.status(400);
        throw new Error('You can only change your profile picture 3 times a year.');
      }
      
      updateData.profilePicUpdateDates = [...updates, new Date().toISOString()];
    }
    updateData.profilePic = profilePic;
  }

  await userRef.update(updateData);

  const updatedDoc = await userRef.get();
  const updatedUser = {
    _id: updatedDoc.id,
    name: updatedDoc.data().name,
    email: updatedDoc.data().email,
    role: updatedDoc.data().role || 'employee',
    department: updatedDoc.data().department,
    phone: updatedDoc.data().phone,
    emergencyContact: updatedDoc.data().emergencyContact,
    gender: updatedDoc.data().gender,
    dob: updatedDoc.data().dob,
    address: updatedDoc.data().address,
    bloodGroup: updatedDoc.data().bloodGroup,
    profilePic: updatedDoc.data().profilePic,
    profilePicUpdateDates: updatedDoc.data().profilePicUpdateDates || [],
  };

  res.status(200).json(updatedUser);
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

// @desc    Update user activity
// @route   POST /api/auth/activity
// @access  Private
export const updateActivity = asyncHandler(async (req, res) => {
  if (req.user) {
    await db.collection('users').doc(req.user._id).update({
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  res.status(200).json({ success: true });
});
