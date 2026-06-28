import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export type FriendStatus = "friends" | "pending_sent" | "pending_received";

export type Friend = {
  uid: string;
  username: string;
  email: string;
  photoURL?: string | null;
  online?: boolean;
  lastSeen?: number;
  pinned?: boolean;
};

export type FriendRequest = {
  fromUid: string;
  fromUsername: string;
  fromPhotoURL?: string | null;
  created_at: number;
};

export async function updateLastSeen(): Promise<void> {
  const uid = requireUid();
  await updateDoc(doc(db, "users", uid), { lastSeen: serverTimestamp() });
}

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in.");
  return uid;
}

export async function searchUsers(searchTerm: string): Promise<Friend[]> {
  const uid = requireUid();
  const snap = await getDocs(
    query(
      collection(db, "users"),
      where("username", ">=", searchTerm.toLowerCase()),
      where("username", "<=", searchTerm.toLowerCase() + "\uf8ff")
    )
  );
  return snap.docs
    .filter((d) => d.id !== uid)
    .map((d) => ({
      uid: d.id,
      username: d.data().username || "",
      email: d.data().email || "",
      photoURL: d.data().photoURL || null,
    }));
}

export async function sendFriendRequest(toUid: string): Promise<void> {
  const uid = requireUid();
  const myProfile = await getDoc(doc(db, "users", uid));
  const myData = myProfile.data();

  await setDoc(doc(db, "users", toUid, "friendRequests", uid), {
    fromUid: uid,
    fromUsername: myData?.username || "",
    fromPhotoURL: myData?.photoURL || null,
    created_at: serverTimestamp(),
  });

  await setDoc(doc(db, "users", uid, "friendRequestsSent", toUid), {
    toUid,
    created_at: serverTimestamp(),
  });
}

export async function acceptFriendRequest(fromUid: string): Promise<void> {
  const uid = requireUid();

  await setDoc(doc(db, "users", uid, "friends", fromUid), {
    uid: fromUid,
    added_at: serverTimestamp(),
  });
  updateDoc(doc(db, "users", uid), { friendsCount: increment(1) }).catch(() => {});

  // Also increment the other user's friendsCount immediately so their profile
  // shows the correct number even before they sync.
  updateDoc(doc(db, "users", fromUid), { friendsCount: increment(1) }).catch(() => {});

  try {
    await setDoc(doc(db, "users", fromUid, "friendRequests", uid), {
      fromUid: uid,
      status: "accepted",
      created_at: serverTimestamp(),
    });
  } catch {}

  await deleteDoc(doc(db, "users", uid, "friendRequests", fromUid));
}

export async function rejectFriendRequest(fromUid: string): Promise<void> {
  const uid = requireUid();
  await deleteDoc(doc(db, "users", uid, "friendRequests", fromUid));
}

export async function unfriend(friendUid: string): Promise<void> {
  const uid = requireUid();
  await deleteDoc(doc(db, "users", uid, "friends", friendUid));
  updateDoc(doc(db, "users", uid), { friendsCount: increment(-1) }).catch(() => {});
}

export async function cancelFriendRequest(toUid: string): Promise<void> {
  const uid = requireUid();
  await deleteDoc(doc(db, "users", uid, "friendRequestsSent", toUid));
}

export async function getFriendStatus(targetUid: string): Promise<FriendStatus | null> {
  const uid = requireUid();

  const friendSnap = await getDoc(doc(db, "users", uid, "friends", targetUid));
  if (friendSnap.exists()) return "friends";

  const sentSnap = await getDoc(doc(db, "users", uid, "friendRequestsSent", targetUid));
  if (sentSnap.exists()) return "pending_sent";

  const receivedSnap = await getDoc(doc(db, "users", targetUid, "friendRequests", uid));
  if (receivedSnap.exists()) return "pending_received";

  return null;
}

export async function getFriends(): Promise<Friend[]> {
  const uid = requireUid();
  const snap = await getDocs(collection(db, "users", uid, "friends"));
  const friends: Friend[] = [];
  const now = Date.now();

  for (const d of snap.docs) {
    const friendData = d.data();
    const userSnap = await getDoc(doc(db, "users", d.id));
    if (userSnap.exists()) {
      const data = userSnap.data();
      const lastSeen = data.lastSeen?.toMillis?.() || 0;
      const isOnline = now - lastSeen < 5 * 60 * 1000;
      friends.push({
        uid: d.id,
        username: data.username || "",
        email: data.email || "",
        photoURL: data.photoURL || null,
        online: isOnline,
        lastSeen,
        pinned: friendData.pinned || false,
      });
    }
  }

  return friends;
}

export async function getFriendRequests(): Promise<FriendRequest[]> {
  const uid = requireUid();
  const snap = await getDocs(
    query(collection(db, "users", uid, "friendRequests"), orderBy("created_at", "desc"))
  );
  return snap.docs
    .filter((d) => d.data().status !== "accepted")
    .map((d) => {
      const data = d.data();
      return {
        fromUid: data.fromUid,
        fromUsername: data.fromUsername,
        fromPhotoURL: data.fromPhotoURL || null,
        created_at: data.created_at?.toMillis?.() || Date.now(),
      };
    });
}

// When Person B accepts, they write "accepted" to Person A's friendRequests.
// This function checks for those and adds the friend to Person A's own list.
export async function syncAcceptedRequests(): Promise<void> {
  const uid = requireUid();
  const snap = await getDocs(collection(db, "users", uid, "friendRequests"));
  for (const d of snap.docs) {
    const data = d.data();
    if (data.status === "accepted") {
      await setDoc(doc(db, "users", uid, "friends", d.id), {
        uid: d.id,
        added_at: serverTimestamp(),
      });
      updateDoc(doc(db, "users", uid), { friendsCount: increment(1) }).catch(() => {});
      await deleteDoc(doc(db, "users", uid, "friendRequests", d.id));
    }
  }
}

export function subscribeFriends(callback: (friends: Friend[]) => void) {
  const uid = requireUid();

  async function fetchAndEmit() {
    const friends = await getFriends();
    callback(friends);
  }

  const unsubFriends = onSnapshot(collection(db, "users", uid, "friends"), () => {
    fetchAndEmit();
  });

  const unsubLastSeen = onSnapshot(collection(db, "users"), () => {
    fetchAndEmit();
  });

  return () => {
    unsubFriends();
    unsubLastSeen();
  };
}

export function subscribeFriendRequests(callback: (requests: FriendRequest[]) => void) {
  const uid = requireUid();
  return onSnapshot(collection(db, "users", uid, "friendRequests"), async () => {
    // First sync any "accepted" requests (adds friend to own list)
    await syncAcceptedRequests();
    // Then fetch remaining pending requests
    const requests = await getFriendRequests();
    callback(requests);
  });
}

export async function togglePinFriend(friendUid: string): Promise<void> {
  const uid = requireUid();
  const friendRef = doc(db, "users", uid, "friends", friendUid);
  const friendSnap = await getDoc(friendRef);
  if (!friendSnap.exists()) return;
  const currentPinned = friendSnap.data().pinned || false;
  await updateDoc(friendRef, { pinned: !currentPinned });
}
