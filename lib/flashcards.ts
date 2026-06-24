import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export type FlashcardSet = {
  id: string;
  title: string;
  cards: { front: string; back: string }[];
  pinned: boolean;
  created_at: number;
};

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in.");
  return uid;
}

function flashcardsCol(uid: string) {
  return collection(db, "users", uid, "flashcards");
}

function toFlashcardSet(snap: QueryDocumentSnapshot<DocumentData>): FlashcardSet {
  const d = snap.data();
  const createdAt =
    typeof d.created_at?.toMillis === "function"
      ? d.created_at.toMillis()
      : typeof d.created_at === "number"
        ? d.created_at
        : Date.now();
  return {
    id: snap.id,
    title: d.title ?? "Untitled",
    cards: d.cards ?? [],
    pinned: d.pinned ?? false,
    created_at: createdAt,
  };
}

export async function saveFlashcardSet(
  title: string,
  cards: { front: string; back: string }[]
): Promise<string> {
  const uid = requireUid();
  const ref = await addDoc(flashcardsCol(uid), {
    title,
    cards,
    pinned: false,
    created_at: serverTimestamp(),
  });
  return ref.id;
}

export async function getFlashcardSets(): Promise<FlashcardSet[]> {
  const uid = requireUid();
  const snap = await getDocs(
    query(flashcardsCol(uid), orderBy("created_at", "desc"))
  );
  return snap.docs.map(toFlashcardSet);
}

export async function updateFlashcardSet(
  id: string,
  fields: Partial<Pick<FlashcardSet, "title" | "pinned">>
): Promise<void> {
  const uid = requireUid();
  const patch: Record<string, unknown> = {};
  if (fields.title !== undefined) patch.title = fields.title;
  if (fields.pinned !== undefined) patch.pinned = fields.pinned;
  if (Object.keys(patch).length === 0) return;
  await updateDoc(doc(db, "users", uid, "flashcards", id), patch);
}

export async function deleteFlashcardSet(id: string): Promise<void> {
  const uid = requireUid();
  await deleteDoc(doc(db, "users", uid, "flashcards", id));
}
