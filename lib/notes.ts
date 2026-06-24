import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "./firebase";

/**
 * Notes are stored per-user in Firestore at:  users/{uid}/notes/{noteId}
 * Each user can only read/write their own notes (enforced by Security Rules).
 */
export type Note = {
  id: string;
  video_id: string | null;
  title: string;
  url: string | null;
  content: string;
  created_at: number;
  pinned: boolean;
};

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in.");
  return uid;
}

function notesCol(uid: string) {
  return collection(db, "users", uid, "notes");
}

function toNote(snap: QueryDocumentSnapshot<DocumentData>): Note {
  const d = snap.data();
  // serverTimestamp resolves to a Firestore Timestamp; it's momentarily null
  // for the local write before the server round-trips, so fall back to now.
  const createdAt =
    typeof d.created_at?.toMillis === "function"
      ? d.created_at.toMillis()
      : typeof d.created_at === "number"
        ? d.created_at
        : Date.now();
  return {
    id: snap.id,
    video_id: d.video_id ?? null,
    title: d.title ?? "Untitled note",
    url: d.url ?? null,
    content: d.content ?? "",
    created_at: createdAt,
    pinned: d.pinned ?? false,
  };
}

export async function insertNote(
  note: Omit<Note, "id" | "created_at" | "pinned">
): Promise<string> {
  const uid = requireUid();
  const ref = await addDoc(notesCol(uid), {
    video_id: note.video_id ?? null,
    title: note.title,
    url: note.url ?? null,
    content: note.content,
    pinned: false,
    created_at: serverTimestamp(),
  });
  updateDoc(doc(db, "users", uid), { notesCount: increment(1) }).catch(() => {});
  return ref.id;
}

export async function getNotes(): Promise<Note[]> {
  const uid = requireUid();
  const snap = await getDocs(
    query(notesCol(uid), orderBy("created_at", "desc"))
  );
  return snap.docs.map(toNote);
}

export async function getNote(id: string): Promise<Note | null> {
  const uid = requireUid();
  const snap = await getDoc(doc(db, "users", uid, "notes", id));
  if (!snap.exists()) return null;
  return toNote(snap as QueryDocumentSnapshot<DocumentData>);
}

export async function updateNote(
  id: string,
  fields: Partial<Pick<Note, "title" | "content" | "pinned">>
): Promise<void> {
  const uid = requireUid();
  const patch: Record<string, unknown> = {};
  if (fields.title !== undefined) patch.title = fields.title;
  if (fields.content !== undefined) patch.content = fields.content;
  if (fields.pinned !== undefined) patch.pinned = fields.pinned;
  if (Object.keys(patch).length === 0) return;
  await updateDoc(doc(db, "users", uid, "notes", id), patch);
}

export async function deleteNote(id: string): Promise<void> {
  const uid = requireUid();
  await deleteDoc(doc(db, "users", uid, "notes", id));
  updateDoc(doc(db, "users", uid), { notesCount: increment(-1) }).catch(() => {});
}

export type WeekDay = { label: string; count: number };

export async function getWeeklyActivity(): Promise<WeekDay[]> {
  const uid = requireUid();
  const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - mondayOffset);
  const mondayMs = monday.getTime();

  const [notesSnap, resultsSnap] = await Promise.all([
    getDocs(query(notesCol(uid), orderBy("created_at", "desc"))),
    getDocs(query(collection(db, "users", uid, "testResults"), orderBy("created_at", "desc"))),
  ]);

  const counts = new Array(7).fill(0);

  for (const d of notesSnap.docs) {
    const ts = d.data().created_at;
    const ms = typeof ts?.toMillis === "function" ? ts.toMillis() : typeof ts === "number" ? ts : 0;
    if (ms >= mondayMs) {
      const date = new Date(ms);
      const idx = date.getDay() === 0 ? 6 : date.getDay() - 1;
      counts[idx]++;
    }
  }

  for (const d of resultsSnap.docs) {
    const ts = d.data().created_at;
    const ms = typeof ts?.toMillis === "function" ? ts.toMillis() : typeof ts === "number" ? ts : 0;
    if (ms >= mondayMs) {
      const date = new Date(ms);
      const idx = date.getDay() === 0 ? 6 : date.getDay() - 1;
      counts[idx]++;
    }
  }

  return DAY_LABELS.map((label, i) => ({ label, count: counts[i] }));
}
