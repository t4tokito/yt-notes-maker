import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { auth, db } from "./firebase";
import { collection, doc, getDoc, onSnapshot, orderBy, query, limit } from "firebase/firestore";

type NotificationContextValue = {
  totalUnread: number;
  hasNewMsg: Record<string, boolean>;
  groupUnreads: Record<string, boolean>;
  clearNewMsg: (uid: string) => void;
  clearGroupUnread: (groupId: string) => void;
};

const NotificationContext = createContext<NotificationContextValue>({
  totalUnread: 0,
  hasNewMsg: {},
  groupUnreads: {},
  clearNewMsg: () => {},
  clearGroupUnread: () => {},
});

function chatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [hasNewMsg, setHasNewMsg] = useState<Record<string, boolean>>({});
  const [groupUnreads, setGroupUnreads] = useState<Record<string, boolean>>({});
  const lastMsgTimes = useRef<Record<string, number>>({});
  const lastGroupReadTimes = useRef<Record<string, number>>({});

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const cleanups: (() => void)[] = [];

    try {
      const unsubFriends = onSnapshot(
        collection(db, "users", uid, "friends"),
        (snap) => {
          for (const doc of snap.docs) {
            const friendUid = doc.id;
            const id = chatId(uid, friendUid);

            const unsubChat = onSnapshot(
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

                if (fromThem && msgTime > (lastMsgTimes.current[friendUid] || 0)) {
                  setHasNewMsg((prev) => ({ ...prev, [friendUid]: true }));
                }
              },
              () => {}
            );
            cleanups.push(unsubChat);
          }
        },
        () => {}
      );
      cleanups.push(unsubFriends);
    } catch {}

    try {
      const unsubGroups = onSnapshot(
        collection(db, "users", uid, "groups"),
        (snap) => {
          for (const groupDoc of snap.docs) {
            const groupId = groupDoc.id;
            const unsubGroupMsg = onSnapshot(
              query(
                collection(db, "groups", groupId, "messages"),
                orderBy("created_at", "desc"),
                limit(1)
              ),
              (msgSnap) => {
                if (msgSnap.empty) return;
                const msg = msgSnap.docs[0].data();
                const msgTime = msg.created_at?.toMillis?.() || 0;
                const fromThem = msg.fromUid !== uid;

                if (fromThem && msgTime > (lastGroupReadTimes.current[groupId] || 0)) {
                  setGroupUnreads((prev) => ({ ...prev, [groupId]: true }));
                }
              },
              () => {}
            );
            cleanups.push(unsubGroupMsg);
          }
        },
        () => {}
      );
      cleanups.push(unsubGroups);
    } catch {}

    return () => { cleanups.forEach((fn) => fn()); };
  }, []);

  const clearNewMsg = useCallback((friendUid: string) => {
    setHasNewMsg((prev) => {
      const next = { ...prev };
      delete next[friendUid];
      return next;
    });
    lastMsgTimes.current[friendUid] = Date.now();
  }, []);

  const clearGroupUnread = useCallback((groupId: string) => {
    setGroupUnreads((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
    lastGroupReadTimes.current[groupId] = Date.now();
  }, []);

  const totalUnread = Object.values(hasNewMsg).filter(Boolean).length + Object.values(groupUnreads).filter(Boolean).length;

  return (
    <NotificationContext.Provider value={{ totalUnread, hasNewMsg, groupUnreads, clearNewMsg, clearGroupUnread }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
