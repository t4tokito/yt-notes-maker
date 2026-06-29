import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
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

const AUTH_PERSIST_KEY = "@firebase_auth";

const asyncStoragePersistence = {
  type: "LOCAL" as const,
  async _isAvailable() { return true; },
  async _set(key: string, value: string) {
    const raw = await AsyncStorage.getItem(AUTH_PERSIST_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[key] = value;
    await AsyncStorage.setItem(AUTH_PERSIST_KEY, JSON.stringify(data));
  },
  async _get(key: string) {
    const raw = await AsyncStorage.getItem(AUTH_PERSIST_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data[key] ?? null;
  },
  async _remove(key: string) {
    const raw = await AsyncStorage.getItem(AUTH_PERSIST_KEY);
    const data = raw ? JSON.parse(raw) : {};
    delete data[key];
    await AsyncStorage.setItem(AUTH_PERSIST_KEY, JSON.stringify(data));
  },
  _addListener(_key: string, _callback: (value: string | null) => void) { return () => {}; },
  _removeListener(_key: string, _callback: (value: string | null) => void) {},
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
try {
  auth = initializeAuth(app, { persistence: asyncStoragePersistence });
} catch {
  auth = getAuth(app);
}

export { auth };

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

export const rtdb = getDatabase(app);
export default app;
