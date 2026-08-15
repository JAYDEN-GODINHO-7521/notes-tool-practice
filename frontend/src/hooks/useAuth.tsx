/** Auth context: holds the current user (loaded via GET /me on mount, since
 * the JWT lives in an httpOnly cookie the frontend can't inspect itself). */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateNotesViewPreference,
} from "../api/auth";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setNotesView: (view: "grid" | "list") => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const u = await loginUser(email, password);
    setUser(u);
  };

  const register = async (email: string, password: string, name: string) => {
    const u = await registerUser(email, password, name);
    setUser(u);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const setNotesView = async (view: "grid" | "list") => {
    setUser((prev) => (prev ? { ...prev, notes_view: view } : prev));
    await updateNotesViewPreference(view);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setNotesView }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
