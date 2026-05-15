import app from './app.js';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config({ quiet: true });

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on the port ${PORT}`);
});
