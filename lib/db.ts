import * as SQLite from "expo-sqlite";

export type Note = {
  id: number;
  video_id: string | null;
  title: string;
  url: string | null;
  content: string;
  created_at: number;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("notes.db");
  }
  return dbPromise;
}

export async function initDb() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id TEXT,
      title TEXT NOT NULL,
      url TEXT,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
}

export async function insertNote(
  note: Omit<Note, "id" | "created_at"> & { created_at?: number }
): Promise<number> {
  const db = await getDb();
  const createdAt = note.created_at ?? Date.now();
  const result = await db.runAsync(
    "INSERT INTO notes (video_id, title, url, content, created_at) VALUES (?, ?, ?, ?, ?)",
    note.video_id ?? null,
    note.title,
    note.url ?? null,
    note.content,
    createdAt
  );
  return result.lastInsertRowId;
}

export async function getNotes(): Promise<Note[]> {
  const db = await getDb();
  return db.getAllAsync<Note>("SELECT * FROM notes ORDER BY created_at DESC");
}

export async function getNote(id: number): Promise<Note | null> {
  const db = await getDb();
  return db.getFirstAsync<Note>("SELECT * FROM notes WHERE id = ?", id);
}

export async function updateNote(
  id: number,
  fields: Partial<Pick<Note, "title" | "content">>
): Promise<void> {
  const db = await getDb();
  const sets: string[] = [];
  const values: (string | number)[] = [];
  if (fields.title !== undefined) {
    sets.push("title = ?");
    values.push(fields.title);
  }
  if (fields.content !== undefined) {
    sets.push("content = ?");
    values.push(fields.content);
  }
  if (sets.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE notes SET ${sets.join(", ")} WHERE id = ?`, ...values);
}

export async function deleteNote(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM notes WHERE id = ?", id);
}
