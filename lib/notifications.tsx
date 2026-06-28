import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getFriends, subscribeFriends, type Friend } from "./friends";
import { getMyGroups, subscribeMyGroups, type Group } from "./groups";
import { getChatPreviews } from "./chat";
import { getGroupUnreadCount } from "./groups";
import { auth } from "./firebase";

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

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [friendUnreads, setFriendUnreads] = useState<Record<string, number>>({});
  const [groupUnreads, setGroupUnreads] = useState<Record<string, number>>({});

  const loadUnreadCounts = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const friends = await getFriends();
      if (friends.length > 0) {
        const previews = await getChatPreviews(friends);
        const map: Record<string, number> = {};
        for (const p of previews) {
          if (p.unread > 0) map[p.friendUid] = p.unread;
        }
        setFriendUnreads(map);
      }

      const groups = await getMyGroups();
      if (groups.length > 0) {
        const gMap: Record<string, number> = {};
        for (const g of groups) {
          const count = await getGroupUnreadCount(g.id);
          if (count > 0) gMap[g.id] = count;
        }
        setGroupUnreads(gMap);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadUnreadCounts();
    const interval = setInterval(loadUnreadCounts, 15000);
    return () => clearInterval(interval);
  }, [loadUnreadCounts]);

  const totalUnread = Object.values(friendUnreads).reduce((a, b) => a + b, 0) +
    Object.values(groupUnreads).reduce((a, b) => a + b, 0);

  return (
    <NotificationContext.Provider value={{ totalUnread, friendUnreads, groupUnreads, refresh: loadUnreadCounts }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
