import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

function hasPlaceholderConfig(config) {
  return Object.values(config).some(function (value) {
    return typeof value !== "string" || value.indexOf("PASTE_") === 0 || value.trim() === "";
  });
}

export const isFirebaseConfigPlaceholder = hasPlaceholderConfig(firebaseConfig);

if (isFirebaseConfigPlaceholder) {
  console.warn("Please replace firebaseConfig with your real Firebase web app config.");
}

let app = null;
let auth = null;
let db = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization failed. Please check js/firebase-config.js.", error);
}

export { app, auth, db };
