import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (error) {
  console.log('Firebase init error (you likely need to add valid credentials to .env):', error.message);
}

export const db = admin.apps.length ? admin.firestore() : null;
