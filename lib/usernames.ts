import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Username system layered on top of Firebase email/password auth.
 *
 * - usernames/{lowercased}  ->  { uid, email, username }
 *     Publicly readable so login can resolve a username to its email.
 *     Created atomically, so the doc itself is the uniqueness lock.
 * - users/{uid}             ->  { username, email, created_at }
 *     The user's private profile.
 */

export const MIN_USERNAME = 6;
export const MAX_USERNAME = 15;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

/** Returns an error string if invalid, or null if the username is OK. */
export function validateUsername(raw: string): string | null {
  const u = (raw || "").trim();
  if (u.length < MIN_USERNAME)
    return `Username must be at least ${MIN_USERNAME} characters.`;
  if (u.length > MAX_USERNAME)
    return `Username must be at most ${MAX_USERNAME} characters.`;
  if (!USERNAME_RE.test(u))
    return "Use only letters, numbers, and underscores.";
  return null;
}

const key = (username: string) => username.trim().toLowerCase();

/** Look up the email behind a username (used to sign in by username). */
export async function resolveUsernameToEmail(
  username: string
): Promise<string | null> {
  const snap = await getDoc(doc(db, "usernames", key(username)));
  return snap.exists() ? ((snap.data().email as string) ?? null) : null;
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "usernames", key(username)));
  return !snap.exists();
}

export type Profile = {
  username?: string;
  email?: string;
  photoURL?: string | null;
  bio?: string;
};

export async function getProfile(uid: string): Promise<Profile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as Profile) : null;
}

/**
 * Atomically claim a username for a user. Throws if it's already taken.
 * Writes both the public mapping and the user's profile in one transaction.
 */
export async function updateProfile(
  uid: string,
  fields: Partial<Pick<Profile, "username" | "photoURL" | "bio">>
): Promise<void> {
  const userRef = doc(db, "users", uid);
  const patch: Record<string, unknown> = {};
  if (fields.username !== undefined) patch.username = fields.username;
  if (fields.photoURL !== undefined) patch.photoURL = fields.photoURL;
  if (fields.bio !== undefined) patch.bio = fields.bio;
  if (Object.keys(patch).length === 0) return;
  await updateDoc(userRef, patch);
}

export async function claimUsername(
  uid: string,
  email: string,
  usernameRaw: string
): Promise<void> {
  const username = usernameRaw.trim();
  const err = validateUsername(username);
  if (err) throw new Error(err);

  const unameRef = doc(db, "usernames", key(username));
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (tx) => {
    const existing = await tx.get(unameRef);
    if (existing.exists()) throw new Error("That username is already taken.");
    tx.set(unameRef, { uid, email, username });
    tx.set(
      userRef,
      { username, email, created_at: serverTimestamp(), notesCount: 0, friendsCount: 0 },
      { merge: true }
    );
  });
}
