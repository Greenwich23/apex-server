import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// ─── paste your Firebase config here ─────────────────────────────────────────
// get this from Firebase Console → Project Settings → Your Apps

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ─── initialise Firebase ──────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// ─── Google provider ──────────────────────────────────────────────────────────

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ─── sign in with Google popup ────────────────────────────────────────────────
// returns the user info needed to send to your backend

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  return {
    name: user.displayName,
    email: user.email,
    avatar: user.photoURL,
    providerId: user.uid,
    authProvider: "google",
  };
};

// ─── sign out from Firebase ───────────────────────────────────────────────────
// call this alongside your backend logout

export const firebaseSignOut = async () => {
  await signOut(auth);
};
