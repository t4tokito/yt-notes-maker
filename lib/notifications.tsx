import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { auth, db } from "./firebase";
import { collection, onSnapshot, orderBy, query, limit, where } from "firebase/firestore";

type NotificationContextValue = {
  totalUnread: number;
  hasNewMsg: Record<string, boolean>;
  clearNewMsg: (uid: string) => void;
};

const NotificationContext = createContext<NotificationContextValue>({
  totalUnread: 0,
  hasNewMsg: {},
  clearNewMsg: () => {},
});

function chatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [hasNewMsg, setHasNewMsg] = useState<Record<string, boolean>>({});
  const lastMsgTimes = useRef<Record<string, number>>({});

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Listen to friends collection to find all chat partners
    const unsubFriends = onSnapshot(
      collection(db, "users", uid, "friends"),
      (snap) => {
        // For each friend, subscribe to their chat's latest messages
        for (const doc of snap.docs) {
          const friendUid = doc.id;
          const id = chatId(uid, friendUid);

          onSnapshot(
            query(
              collection(db, "chats", id, "messages"),
              orderBy("created_at", "desc"),
              limit(1)
            ),
            (msgSnap) => {
              if (msgSnap.empty) return;
              const msg = msgSnap.docs[0].data();
              const msgTime = msg.created_at?.toMillis?.() || 0;
              const fromThem = msg.fromUid !== uid;

              // If message is from the other person and newer than what we saw
              if (fromThem && msgTime > (lastMsgTimes.current[friendUid] || 0)) {
                setHasNewMsg((prev) => ({ ...prev, [friendUid]: true }));
              }
            }
          );
        }
      }
    );

    return () => unsubFriends();
  }, []);

  const clearNewMsg = useCallback((friendUid: string) => {
    setHasNewMsg((prev) => {
      const next = { ...prev };
      delete next[friendUid];
      return next;
    });
    // Record current time so we don't re-trigger
    lastMsgTimes.current[friendUid] = Date.now();
  }, []);

  const totalUnread = Object.values(hasNewMsg).filter(Boolean).length;

  return (
    <NotificationContext.Provider value={{ totalUnread, hasNewMsg, clearNewMsg }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
