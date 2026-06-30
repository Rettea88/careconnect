import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBk_JGX8UeVsRehunweNRtqyrgQLJ_BKhU",
  authDomain: "careconnect-ashin.firebaseapp.com",
  projectId: "careconnect-ashin",
  storageBucket: "careconnect-ashin.firebasestorage.app",
  messagingSenderId: "370665122740",
  appId: "1:370665122740:web:e29d67d783696b8be2a0e1"
};

let app = null;
let auth = null;
let db = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { app, auth, db };
