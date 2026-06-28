import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export type Message = {
  id: string;
  fromUid: string;
  text: string;
  created_at: number;
  read: boolean;
};

export type ChatPreview = {
  friendUid: string;
  lastMessage: string;
  lastMessageTime: number;
  unread: number;
};

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in.");
  return uid;
}

function chatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

export async function sendMessage(toUid: string, text: string): Promise<void> {
  const uid = requireUid();
  const id = chatId(uid, toUid);

  await addDoc(collection(db, "chats", id, "messages"), {
    fromUid: uid,
    text: text.trim(),
    created_at: serverTimestamp(),
    read: false,
  });
}

export async function editMessage(friendUid: string, messageId: string, newText: string): Promise<void> {
  const uid = requireUid();
  const id = chatId(uid, friendUid);
  const msgRef = doc(db, "chats", id, "messages", messageId);
  const snap = await getDoc(msgRef);
  if (!snap.exists()) throw new Error("Message not found.");
  const data = snap.data();
  if (data.fromUid !== uid) throw new Error("Not your message.");
  const { EDIT_WINDOW_MS = 5 * 60 * 1000 } = process.env as Record<string, string>;
  const now = Date.now();
  const created = data.created_at?.toMillis?.() ?? data.created_at ?? now;
  if (now - created > 5 * 60 * 1000) throw new Error("Edit window expired (5 min).");
  await updateDoc(msgRef, { text: newText.trim() });
}

export async function deleteMessage(friendUid: string, messageId: string): Promise<void> {
  const uid = requireUid();
  const id = chatId(uid, friendUid);
  await deleteDoc(doc(db, "chats", id, "messages", messageId)).catch(() => {});
}

export function subscribeMessages(
  friendUid: string,
  callback: (messages: Message[]) => void
) {
  const uid = requireUid();
  const id = chatId(uid, friendUid);

  return onSnapshot(
    query(
      collection(db, "chats", id, "messages"),
      orderBy("created_at", "asc"),
      limit(100)
    ),
    (snap) => {
      const msgs = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          fromUid: data.fromUid,
          text: data.text,
          created_at: data.created_at?.toMillis?.() || Date.now(),
          read: data.read ?? false,
        };
      });
      callback(msgs);
    }
  );
}

export async function getChatPreviews(friends: { uid: string }[]): Promise<ChatPreview[]> {
  const uid = requireUid();
  const previews: ChatPreview[] = [];

  for (const friend of friends) {
    const id = chatId(uid, friend.uid);
    const snap = await getDocs(
      query(
        collection(db, "chats", id, "messages"),
        orderBy("created_at", "desc"),
        limit(1)
      )
    );

    if (!snap.empty) {
      const last = snap.docs[0].data();
      const unreadSnap = await getDocs(
        query(
          collection(db, "chats", id, "messages"),
          where("read", "==", false),
          where("fromUid", "!=", uid)
        )
      );

      previews.push({
        friendUid: friend.uid,
        lastMessage: last.text,
        lastMessageTime: last.created_at?.toMillis?.() || Date.now(),
        unread: unreadSnap.size,
      });
    }
  }

  return previews.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
}

export function getChatId(uid1: string, uid2: string): string {
  return chatId(uid1, uid2);
}

export async function markMessagesRead(friendUid: string): Promise<void> {
  const uid = requireUid();
  const id = chatId(uid, friendUid);
  const snap = await getDocs(
    query(
      collection(db, "chats", id, "messages"),
      where("read", "==", false),
      where("fromUid", "!=", uid)
    )
  );
  const batch = snap.docs.map((d) => updateDoc(d.ref, { read: true }));
  await Promise.all(batch);
}

export async function getTotalUnreadCount(friends: { uid: string }[]): Promise<number> {
  const previews = await getChatPreviews(friends);
  return previews.reduce((sum, p) => sum + p.unread, 0);
}
