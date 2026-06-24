import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export type Group = {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  createdAt: number;
  photoURL?: string | null;
};

export type GroupMessage = {
  id: string;
  fromUid: string;
  fromUsername: string;
  text: string;
  created_at: number;
};

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in.");
  return uid;
}

export async function createGroup(name: string, memberUids: string[]): Promise<string> {
  const uid = requireUid();
  const myProfile = await getDoc(doc(db, "users", uid));
  const myData = myProfile.data();

  const allMembers = [...new Set([uid, ...memberUids])];

  const ref = await addDoc(collection(db, "groups"), {
    name: name.trim(),
    members: allMembers,
    createdBy: uid,
    createdByUsername: myData?.username || "",
    createdAt: serverTimestamp(),
  });

  // Add group reference to each member's subcollection
  for (const memberUid of allMembers) {
    await setDoc(doc(db, "users", memberUid, "groups", ref.id), {
      groupId: ref.id,
      name: name.trim(),
      added_at: serverTimestamp(),
    });
  }

  return ref.id;
}

export async function getMyGroups(): Promise<Group[]> {
  const uid = requireUid();
  const snap = await getDocs(collection(db, "users", uid, "groups"));
  const groups: Group[] = [];

  for (const d of snap.docs) {
    const groupSnap = await getDoc(doc(db, "groups", d.id));
    if (groupSnap.exists()) {
      const data = groupSnap.data();
      groups.push({
        id: d.id,
        name: data.name || "Group",
        members: data.members || [],
        createdBy: data.createdBy || "",
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
        photoURL: data.photoURL || null,
      });
    }
  }

  return groups.sort((a, b) => b.createdAt - a.createdAt);
}

export async function sendGroupMessage(groupId: string, text: string): Promise<void> {
  const uid = requireUid();
  const myProfile = await getDoc(doc(db, "users", uid));
  const myData = myProfile.data();

  await addDoc(collection(db, "groups", groupId, "messages"), {
    fromUid: uid,
    fromUsername: myData?.username || "",
    text: text.trim(),
    created_at: serverTimestamp(),
  });
}

export async function editGroupMessage(groupId: string, messageId: string, newText: string): Promise<void> {
  const msgRef = doc(db, "groups", groupId, "messages", messageId);
  const snap = await getDoc(msgRef);
  if (!snap.exists()) throw new Error("Message not found.");
  const data = snap.data();
  if (data.fromUid !== requireUid()) throw new Error("Not your message.");
  const now = Date.now();
  const created = data.created_at?.toMillis?.() ?? data.created_at ?? now;
  if (now - created > 5 * 60 * 1000) throw new Error("Edit window expired (5 min).");
  await updateDoc(msgRef, { text: newText.trim() });
}

export async function deleteGroupMessage(groupId: string, messageId: string): Promise<void> {
  await deleteDoc(doc(db, "groups", groupId, "messages", messageId)).catch(() => {});
}

export function subscribeGroupMessages(
  groupId: string,
  callback: (messages: GroupMessage[]) => void
) {
  return onSnapshot(
    query(
      collection(db, "groups", groupId, "messages"),
      orderBy("created_at", "asc")
    ),
    (snap) => {
      const msgs = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          fromUid: data.fromUid,
          fromUsername: data.fromUsername || "",
          text: data.text,
          created_at: data.created_at?.toMillis?.() || Date.now(),
        };
      });
      callback(msgs);
    }
  );
}

export function subscribeMyGroups(callback: (groups: Group[]) => void) {
  const uid = requireUid();
  return onSnapshot(collection(db, "users", uid, "groups"), async () => {
    const groups = await getMyGroups();
    callback(groups);
  });
}

export async function getGroupMembers(memberUids: string[]): Promise<{ uid: string; username: string; photoURL?: string | null }[]> {
  const members: { uid: string; username: string; photoURL?: string | null }[] = [];
  for (const uid of memberUids) {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const d = snap.data();
      members.push({ uid, username: d.username || "", photoURL: d.photoURL || null });
    }
  }
  return members;
}

export async function updateGroup(groupId: string, fields: Partial<Pick<Group, "name" | "photoURL">>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (fields.name !== undefined) patch.name = fields.name;
  if (fields.photoURL !== undefined) patch.photoURL = fields.photoURL;
  if (Object.keys(patch).length === 0) return;
  await updateDoc(doc(db, "groups", groupId), patch);
}

export async function addGroupMembers(groupId: string, newMemberUids: string[]): Promise<void> {
  const snap = await getDoc(doc(db, "groups", groupId));
  if (!snap.exists()) return;
  const data = snap.data();
  const existing = data.members || [];
  const toAdd = newMemberUids.filter((uid) => !existing.includes(uid));
  if (toAdd.length === 0) return;
  const allMembers = [...existing, ...toAdd];
  await updateDoc(doc(db, "groups", groupId), { members: allMembers });
  for (const uid of toAdd) {
    await setDoc(doc(db, "users", uid, "groups", groupId), {
      groupId,
      name: data.name || "Group",
      added_at: serverTimestamp(),
    });
  }
}

export async function leaveGroup(groupId: string): Promise<void> {
  const uid = requireUid();
  await deleteDoc(doc(db, "users", uid, "groups", groupId)).catch(() => {});
  const snap = await getDoc(doc(db, "groups", groupId));
  if (snap.exists()) {
    const members = (snap.data().members || []).filter((m: string) => m !== uid);
    await updateDoc(doc(db, "groups", groupId), { members });
  }
}

export async function kickMember(groupId: string, memberUid: string): Promise<void> {
  await deleteDoc(doc(db, "users", memberUid, "groups", groupId)).catch(() => {});
  const snap = await getDoc(doc(db, "groups", groupId));
  if (snap.exists()) {
    const members = (snap.data().members || []).filter((m: string) => m !== memberUid);
    await updateDoc(doc(db, "groups", groupId), { members });
  }
}
