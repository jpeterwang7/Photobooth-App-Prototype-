import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

export type User = {
  id: string;
  name: string;
  email: string;
  photoUri?: string;
};

type StoredUser = User & { password: string };

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, email: string) => Promise<void>;
  updatePhotoUri: (uri: string) => void;
};

// Simple localStorage wrapper (web only; native would use AsyncStorage)
const store = {
  get: (key: string): string | null => {
    if (Platform.OS !== 'web') return null;
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set: (key: string, val: string) => {
    if (Platform.OS !== 'web') return;
    try { localStorage.setItem(key, val); } catch {}
  },
  remove: (key: string) => {
    if (Platform.OS !== 'web') return;
    try { localStorage.removeItem(key); } catch {}
  },
};

const USERS_KEY = 'booth_users';
const SESSION_KEY = 'booth_session';

const getUsers = (): Record<string, StoredUser> => {
  const raw = store.get(USERS_KEY);
  return raw ? JSON.parse(raw) : {};
};

const saveUsers = (users: Record<string, StoredUser>) => {
  store.set(USERS_KEY, JSON.stringify(users));
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = store.get(SESSION_KEY);
    if (raw) {
      try {
        const { user: savedUser } = JSON.parse(raw);
        setUser(savedUser);
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const users = getUsers();
    const key = email.toLowerCase().trim();
    const stored = users[key];
    if (!stored) throw new Error('No account found with that email.');
    if (stored.password !== password) throw new Error('Incorrect password.');
    const { password: _, ...safeUser } = stored;
    setUser(safeUser);
    store.set(SESSION_KEY, JSON.stringify({ user: safeUser }));
  };

  const signup = async (name: string, email: string, password: string) => {
    const users = getUsers();
    const key = email.toLowerCase().trim();
    if (users[key]) throw new Error('An account with that email already exists.');
    const newUser: StoredUser = {
      id: Date.now().toString(),
      name: name.trim(),
      email: key,
      password,
    };
    users[key] = newUser;
    saveUsers(users);
    const { password: _, ...safeUser } = newUser;
    setUser(safeUser);
    store.set(SESSION_KEY, JSON.stringify({ user: safeUser }));
  };

  const logout = () => {
    setUser(null);
    store.remove(SESSION_KEY);
  };

  const updateProfile = async (name: string, email: string) => {
    if (!user) throw new Error('Not logged in.');
    const trimmedName  = name.trim();
    const trimmedEmail = email.toLowerCase().trim();
    if (!trimmedName)  throw new Error('Name cannot be empty.');
    if (!trimmedEmail) throw new Error('Email cannot be empty.');
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) throw new Error('Please enter a valid email address.');

    const users = getUsers();
    const oldKey = user.email.toLowerCase();
    const newKey = trimmedEmail;

    // Email is changing
    if (oldKey !== newKey) {
      // Check the new email isn't already taken by another account
      if (users[newKey] && users[newKey].id !== user.id) {
        throw new Error('That email is already linked to another account.');
      }
      // Move the record to the new key
      const existing = users[oldKey];
      delete users[oldKey];
      users[newKey] = { ...existing, name: trimmedName, email: newKey };
    } else {
      // Same email — just update name
      users[oldKey] = { ...users[oldKey], name: trimmedName };
    }

    saveUsers(users);
    const updated: User = { id: user.id, name: trimmedName, email: newKey };
    setUser(updated);
    store.set(SESSION_KEY, JSON.stringify({ user: updated }));
  };

  const updatePhotoUri = (uri: string) => {
    if (!user) return;
    const users = getUsers();
    const key = user.email.toLowerCase();
    users[key] = { ...users[key], photoUri: uri };
    saveUsers(users);
    const updated: User = { ...user, photoUri: uri };
    setUser(updated);
    store.set(SESSION_KEY, JSON.stringify({ user: updated }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile, updatePhotoUri }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
};
