/**
 * Base URL of the notes backend (server/).
 *
 * - Web / iOS simulator / Android emulator on the same machine: http://localhost:3000
 *   (Android emulator users may need http://10.0.2.2:3000)
 * - Physical device (Expo Go): set EXPO_PUBLIC_API_URL to your computer's LAN IP,
 *   e.g. EXPO_PUBLIC_API_URL=http://192.168.1.5:3000
 * - Production APK: uses Render deployment
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "https://notes-maker-server-iui2.onrender.com";

export const APP_VERSION = "1.0.0";
