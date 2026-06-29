import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { Platform } from "react-native";

/**
 * Firebase config is read from EXPO_PUBLIC_FIREBASE_* env vars (see .env).
 * These are public client keys — safe to ship in the app bundle; access is
 * controlled by Firebase Security Rules, not by hiding the config.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Debug: log the projectId to verify env vars are loaded
if (__DEV__) {
  console.log("[Firebase] projectId:", firebaseConfig.projectId);
  console.log("[Firebase] authDomain:", firebaseConfig.authDomain);
  console.log("[Firebase] apiKey set:", !!firebaseConfig.apiKey);
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use initializeFirestore with long polling so Firestore works even on networks
// that block WebSocket / gRPC (common on mobile carriers, school/work WiFi).
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

export const rtdb = getDatabase(app);
export default app;
