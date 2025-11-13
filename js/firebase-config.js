// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYrRtuXX2vNYVYuauAjjEuFxqsIkBrJmE",
  authDomain: "freshers-site-dabdb.firebaseapp.com",
  projectId: "freshers-site-dabdb",
  storageBucket: "freshers-site-dabdb.firebasestorage.app",
  messagingSenderId: "64414137529",
  appId: "1:64414137529:web:614b23d2d6236cf48aef68"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
