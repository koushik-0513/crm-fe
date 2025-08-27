import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

type TFirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const firebaseConfig: TFirebaseConfig = {
  apiKey: "AIzaSyDGfUk21VmPyNbBlBEDBAbObwwkiE_mPbc",
  authDomain: "crm-application-64f82.firebaseapp.com",
  projectId: "crm-application-64f82",
  storageBucket: "crm-application-64f82.firebasestorage.app",
  messagingSenderId: "1001478107726",
  appId: "1:1001478107726:web:a7c761cae27f4a8026891f",
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
export const storage: FirebaseStorage = getStorage(app);