import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getFriends, subscribeFriends, type Friend } from "./friends";
import { getMyGroups, subscribeMyGroups, type Group } from "./groups";
import { getChatPreviews } from "./chat";
import { getGroupUnreadCount } from "./groups";
import { auth, db } from "./firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";

type NotificationContextValue = {
  totalUnread: number;
  friendUnreads: Record<string, number>;
  groupUnreads: Record<string, number>;
  refresh: () => void;
};

const NotificationContext = createContext<NotificationContextValue>({
  totalUnread: 0,
  friendUnreads: {},
  groupUnreads: {},
  refresh: () => {},
});

function chatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [friendUnreads, setFriendUnreads] = useState<Record<string, number>>({});
  const [groupUnreads, setGroupUnreads] = useState<Record<string, number>>({});
  const friendsRef = useRef<Friend[]>([]);
  const groupsRef = useRef<Group[]>([]);

  const loadFriendUnreads = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || friendsRef.current.length === 0) return;
    try {
      const previews = await getChatPreviews(friendsRef.current);
      const map: Record<string, number> = {};
      for (const p of previews) {
        if (p.unread > 0) map[p.friendUid] = p.unread;
      }
      setFriendUnreads(map);
    } catch {}
  }, []);

  const loadGroupUnreads = useCallback(async () => {
    if (groupsRef.current.length === 0) return;
    try {
      const gMap: Record<string, number> = {};
      for (const g of groupsRef.current) {
        const count = await getGroupUnreadCount(g.id);
        if (count > 0) gMap[g.id] = count;
      }
      setGroupUnreads(gMap);
    } catch {}
  }, []);

  const refresh = useCallback(() => {
    loadFriendUnreads();
    loadGroupUnreads();
  }, [loadFriendUnreads, loadGroupUnreads]);

  // Subscribe to friends changes → refresh unread counts
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubFriends = subscribeFriends((friends) => {
      friendsRef.current = friends;
      loadFriendUnreads();

      // Also subscribe to each friend's chat for real-time updates
      for (const friend of friends) {
        const id = chatId(uid, friend.uid);
        onSnapshot(
          query(
            collection(db, "chats", id, "messages"),
            where("read", "==", false),
            where("fromUid", "!=", uid)
          ),
          () => { loadFriendUnreads(); }
        );
      }
    });

    const unsubGroups = subscribeMyGroups((groups) => {
      groupsRef.current = groups;
      loadGroupUnreads();
    });

    return () => { unsubFriends(); unsubGroups(); };
  }, [loadFriendUnreads, loadGroupUnreads]);

  const totalUnread = Object.values(friendUnreads).reduce((a, b) => a + b, 0) +
    Object.values(groupUnreads).reduce((a, b) => a + b, 0);

  return (
    <NotificationContext.Provider value={{ totalUnread, friendUnreads, groupUnreads, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
