import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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
  };
}

export async function insertNote(
  note: Omit<Note, "id" | "created_at">
): Promise<string> {
  const uid = requireUid();
  const ref = await addDoc(notesCol(uid), {
    video_id: note.video_id ?? null,
    title: note.title,
    url: note.url ?? null,
    content: note.content,
    created_at: serverTimestamp(),
  });
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
  fields: Partial<Pick<Note, "title" | "content">>
): Promise<void> {
  const uid = requireUid();
  const patch: Record<string, unknown> = {};
  if (fields.title !== undefined) patch.title = fields.title;
  if (fields.content !== undefined) patch.content = fields.content;
  if (Object.keys(patch).length === 0) return;
  await updateDoc(doc(db, "users", uid, "notes", id), patch);
}

export async function deleteNote(id: string): Promise<void> {
  const uid = requireUid();
  await deleteDoc(doc(db, "users", uid, "notes", id));
}
