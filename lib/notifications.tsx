import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getFriends, subscribeFriends, type Friend } from "./friends";
import { getMyGroups, subscribeMyGroups, type Group } from "./groups";
import { getChatPreviews } from "./chat";
import { getGroupUnreadCount } from "./groups";

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

  const refresh = useCallback(async () => {
    try {
      const friends = await getFriends();
      if (friends.length > 0) {
        const previews = await getChatPreviews(friends);
        const map: Record<string, number> = {};
        for (const p of previews) {
          if (p.unread > 0) map[p.friendUid] = p.unread;
        }
        setFriendUnreads(map);
      } else {
        setFriendUnreads({});
      }

      const groups = await getMyGroups();
      if (groups.length > 0) {
        const gMap: Record<string, number> = {};
        for (const g of groups) {
          const count = await getGroupUnreadCount(g.id);
          if (count > 0) gMap[g.id] = count;
        }
        setGroupUnreads(gMap);
      } else {
        setGroupUnreads({});
      }
    } catch (e) { console.log("notif refresh error", e); }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

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
