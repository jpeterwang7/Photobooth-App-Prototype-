import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { PhotoCollage, Order, Friend, PhotoEvent, EventPhoto } from '../types';
import { useAuth } from './AuthContext';

type AppContextType = {
  collages: PhotoCollage[];
  addCollage: (collage: PhotoCollage) => void;
  renameCollage: (id: string, newName: string) => void;
  deleteCollage: (id: string) => void;
  orders: Order[];
  addOrder: (order: Order) => void;
  cancelOrder: (id: string) => void;
  // Friends
  friends: Friend[];
  addFriend: (friend: Friend) => void;
  removeFriend: (id: string) => void;
  // Events
  events: PhotoEvent[];
  createEvent: (event: PhotoEvent) => void;
  deleteEvent: (eventId: string) => void;
  joinEvent: (inviteCode: string, userId: string, userName: string) => PhotoEvent | null;
  addPhotoToEvent: (eventId: string, photo: EventPhoto) => void;
  leaveEvent: (eventId: string) => void;
};

const store = {
  get: (key: string): string | null => {
    if (Platform.OS !== 'web') return null;
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set: (key: string, val: string) => {
    if (Platform.OS !== 'web') return;
    try { localStorage.setItem(key, val); } catch {}
  },
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [collages, setCollages] = useState<PhotoCollage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [events, setEvents] = useState<PhotoEvent[]>([]);

  // Load all user data when user changes
  useEffect(() => {
    if (!user) { setCollages([]); setOrders([]); setFriends([]); setEvents([]); return; }

    const rawCollages = store.get(`collages_${user.id}`);
    if (rawCollages) {
      try {
        const parsed = JSON.parse(rawCollages);
        setCollages(parsed.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt) })));
      } catch { setCollages([]); }
    } else { setCollages([]); }

    const rawOrders = store.get(`orders_${user.id}`);
    if (rawOrders) {
      try {
        const parsed = JSON.parse(rawOrders);
        setOrders(parsed.map((o: any) => ({
          ...o,
          orderedAt: new Date(o.orderedAt),
          estimatedDelivery: new Date(o.estimatedDelivery),
        })));
      } catch { setOrders([]); }
    } else { setOrders([]); }

    const rawFriends = store.get(`friends_${user.id}`);
    if (rawFriends) {
      try {
        const parsed = JSON.parse(rawFriends);
        setFriends(parsed.map((f: any) => ({ ...f, addedAt: new Date(f.addedAt) })));
      } catch { setFriends([]); }
    } else { setFriends([]); }

    const rawEvents = store.get(`events_${user.id}`);
    if (rawEvents) {
      try {
        const parsed = JSON.parse(rawEvents);
        setEvents(parsed.map((e: any) => ({
          ...e,
          createdAt: new Date(e.createdAt),
          eventDate: e.eventDate ? new Date(e.eventDate) : undefined,
          members: e.members.map((m: any) => ({ ...m, joinedAt: new Date(m.joinedAt) })),
          photos: e.photos.map((p: any) => ({ ...p, addedAt: new Date(p.addedAt) })),
        })));
      } catch { setEvents([]); }
    } else { setEvents([]); }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    store.set(`collages_${user.id}`, JSON.stringify(collages));
  }, [collages, user?.id]);

  useEffect(() => {
    if (!user) return;
    store.set(`orders_${user.id}`, JSON.stringify(orders));
  }, [orders, user?.id]);

  useEffect(() => {
    if (!user) return;
    store.set(`friends_${user.id}`, JSON.stringify(friends));
  }, [friends, user?.id]);

  useEffect(() => {
    if (!user) return;
    store.set(`events_${user.id}`, JSON.stringify(events));
  }, [events, user?.id]);

  // Collage actions
  const addCollage = (collage: PhotoCollage) => setCollages(prev => [collage, ...prev]);
  const renameCollage = (id: string, newName: string) =>
    setCollages(prev => prev.map(c => c.id === id ? { ...c, name: newName.trim() || c.name } : c));
  const deleteCollage = (id: string) => setCollages(prev => prev.filter(c => c.id !== id));

  // Order actions
  const addOrder = (order: Order) => setOrders(prev => [order, ...prev]);
  const cancelOrder = (id: string) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' as const } : o));

  // Friend actions
  const addFriend = (friend: Friend) => {
    setFriends(prev => {
      if (prev.some(f => f.email.toLowerCase() === friend.email.toLowerCase())) return prev;
      return [friend, ...prev];
    });
  };
  const removeFriend = (id: string) => setFriends(prev => prev.filter(f => f.id !== id));

  // Event actions
  const createEvent = (event: PhotoEvent) => setEvents(prev => [event, ...prev]);
  const deleteEvent = (eventId: string) => setEvents(prev => prev.filter(e => e.id !== eventId));

  const joinEvent = (inviteCode: string, userId: string, userName: string): PhotoEvent | null => {
    let found: PhotoEvent | null = null;
    setEvents(prev => {
      const idx = prev.findIndex(e => e.inviteCode === inviteCode.toUpperCase().trim());
      if (idx === -1) return prev;
      const event = prev[idx];
      if (event.members.some(m => m.userId === userId)) { found = event; return prev; }
      const updated = {
        ...event,
        members: [...event.members, { userId, name: userName, joinedAt: new Date() }],
      };
      found = updated;
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
    return found;
  };

  const addPhotoToEvent = (eventId: string, photo: EventPhoto) => {
    setEvents(prev => prev.map(e =>
      e.id === eventId
        ? { ...e, photos: [photo, ...e.photos.filter(p => p.id !== photo.id)] }
        : e
    ));
  };

  const leaveEvent = (eventId: string) => {
    if (!user) return;
    setEvents(prev => prev.map(e =>
      e.id === eventId
        ? { ...e, members: e.members.filter(m => m.userId !== user.id) }
        : e
    ).filter(e => e.createdBy === user.id || e.members.some(m => m.userId === user.id)));
  };

  return (
    <AppContext.Provider value={{
      collages, addCollage, renameCollage, deleteCollage,
      orders, addOrder, cancelOrder,
      friends, addFriend, removeFriend,
      events, createEvent, deleteEvent, joinEvent, addPhotoToEvent, leaveEvent,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
};
