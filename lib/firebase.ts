import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
// @ts-ignore - getReactNativePersistence exists at runtime in @firebase/auth/dist/rn but has no TS types
import { initializeAuth, getReactNativePersistence } from "@firebase/auth/dist/rn/index.js";
import { initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  const { getAuth } = require("firebase/auth");
  auth = getAuth(app);
}

export { auth };

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

export const rtdb = getDatabase(app);
export default app;
