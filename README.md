# Notes Maker 📝

Turn any YouTube video into clean, AI-generated notes. Paste a link, the app
fetches the transcript, summarizes it with an LLM (via OpenRouter), and saves
the notes locally on your device.

**Stack:** Expo SDK 54 · expo-router · NativeWind · expo-sqlite · Express backend · OpenRouter

---

## 1. Backend (`server/`)

The backend fetches the YouTube transcript and calls OpenRouter (keeps your API
key off the device).

```bash
cd server
npm install
cp .env.example .env        # then edit .env
npm start                   # http://localhost:3000
```

In `server/.env`:

- `OPENROUTER_API_KEY` — get one at https://openrouter.ai/keys
- `OPENROUTER_MODEL` — any model id, default `anthropic/claude-3.5-sonnet`
- `PORT` — default `3000`

Quick test:

```bash
curl -X POST localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtu.be/VIDEO_ID","style":"detailed"}'
```

## 2. Firebase (auth + notes storage)

Notes are saved per-user in **Cloud Firestore**, gated behind **Firebase Auth**
(email/password). Set up a project once:

1. Create a project at https://console.firebase.google.com.
2. **Authentication → Sign-in method → Email/Password → Enable.**
3. **Firestore Database → Create database** (start in production mode).
4. **Project settings → Your apps → Web app** → copy the config values into the
   app's `.env` (root):

   ```bash
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   EXPO_PUBLIC_FIREBASE_APP_ID=...
   ```

5. **Firestore → Rules** — lock notes to their owner:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Covers notes (users/{uid}/notes) and test results
       // (users/{uid}/testResults) — each user owns everything under their uid.
       match /users/{uid}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

Notes live at `users/{uid}/notes/{noteId}`. Sign up in the app, and every note
you generate is stored under your account and synced across your devices.

## 3. App (root)

```bash
npm install
npm run android   # or: npm run ios / npm run web
```

### Pointing the app at the backend

- **Emulator / web on the same machine:** works out of the box (`localhost:3000`).
  - Android emulator may need `http://10.0.2.2:3000`.
- **Physical phone (Expo Go):** the phone can't see `localhost`. Start Expo with
  your computer's LAN IP:

  ```bash
  EXPO_PUBLIC_API_URL=http://192.168.1.5:3000 npm run android
  ```

  (Phone and computer must be on the same Wi-Fi.)

## How it works

1. Paste a YouTube URL on the **New Note** screen, pick a style (Summary /
   Detailed / Bullets).
2. App → `POST /api/notes` → backend fetches transcript → OpenRouter → Markdown notes.
3. Notes are saved to Firestore under your account and listed on the home
   screen. Tap to read, edit the title, or delete. Sign out from the header.

## Notes / limitations

- Only works on videos that have captions/transcripts available.
- Requires the backend running and a valid OpenRouter key.
