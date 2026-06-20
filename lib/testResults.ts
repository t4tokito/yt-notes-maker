import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import type { QuizDifficulty } from "./api";

/** A completed quiz attempt, stored at users/{uid}/testResults/{id}. */
export type TestResult = {
  id: string;
  title: string;
  source: "notes" | "youtube" | "pdf";
  score: number;
  total: number;
  difficulty: QuizDifficulty;
  created_at: number;
};

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in.");
  return uid;
}

function resultsCol(uid: string) {
  return collection(db, "users", uid, "testResults");
}

export async function saveTestResult(
  result: Omit<TestResult, "id" | "created_at">
): Promise<string> {
  const uid = requireUid();
  const ref = await addDoc(resultsCol(uid), {
    ...result,
    created_at: serverTimestamp(),
  });
  return ref.id;
}

export async function getTestResults(max = 50): Promise<TestResult[]> {
  const uid = requireUid();
  const snap = await getDocs(
    query(resultsCol(uid), orderBy("created_at", "desc"), limit(max))
  );
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data();
    const createdAt =
      typeof data.created_at?.toMillis === "function"
        ? data.created_at.toMillis()
        : Date.now();
    return {
      id: d.id,
      title: data.title ?? "Quiz",
      source: data.source ?? "notes",
      score: data.score ?? 0,
      total: data.total ?? 0,
      difficulty: data.difficulty ?? "medium",
      created_at: createdAt,
    };
  });
}
