import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

console.log("PROJECT ID:", serviceAccount.projectId);
console.log("CLIENT EMAIL:", serviceAccount.clientEmail);

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  const db = admin.firestore();

  // Print all users
  const usersSnapshot = await db.collection('users').get();
  console.log("\n--- USERS IN FIRESTORE ---");
  usersSnapshot.forEach(doc => {
    console.log(`ID: ${doc.id} | ${JSON.stringify(doc.data(), null, 2)}`);
  });

  // Print all tasks
  const tasksSnapshot = await db.collection('tasks').get();
  console.log("\n--- TASKS IN FIRESTORE ---");
  tasksSnapshot.forEach(doc => {
    console.log(`ID: ${doc.id} | EmployeeId: ${doc.data().employeeId} | Title: ${doc.data().title} | Deadline: ${doc.data().deadline}`);
  });

} catch (err) {
  console.error("DIAGNOSTIC ERROR:", err.message);
}
