import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

// You need to set these variables in your .env file
// Or you can use a serviceAccountKey.json file directly:
// import serviceAccount from '../../serviceAccountKey.json' assert { type: 'json' };

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

try {
  if (!admin.apps.length) {
    // If you have a serviceAccountKey.json, replace the credential below with:
    // credential: admin.credential.cert(serviceAccountKey)
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (error) {
  console.log('Firebase init error (you likely need to add valid credentials to .env):', error.message);
}

export const db = admin.apps.length ? admin.firestore() : null;
