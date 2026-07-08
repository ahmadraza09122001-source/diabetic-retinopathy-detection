import { initializeApp, getApps, getApp } from "firebase/app";  // Import getApps and getApp
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD93QLoWNrXo7drg2aBivaycz0SbD_faEw",
  authDomain: "dr-detection-53db0.firebaseapp.com",
  projectId: "dr-detection-53db0",
  storageBucket: "dr-detection-53db0.firebasestorage.app",
  messagingSenderId: "988432779226",
  appId: "1:988432779226:web:59b6cae3e4067707d722e3",
  measurementId: "G-94K7S1VM4T",
};

// Initialize Firebase (only if it hasn't been initialized yet)
let app, db, auth;

if (typeof window !== "undefined") {
  try {
    // Check if any Firebase apps are already initialized
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);  // Initialize Firebase app only if no apps exist
    } else {
      app = getApp();  // Get the already initialized app
    }

    // Initialize Firestore and Auth services
    db = getFirestore(app);
    auth = getAuth(app);

    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

export { app, db, auth };
