import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Map Firebase auth error codes to short, user-friendly messages. */
export function authErrorMessage(e: any): string {
  const code = e?.code as string | undefined;
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/missing-password":
      return "Please enter a password.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again in a moment.";
    case "auth/network-request-failed":
      return "Network error. Check your connection.";
    default:
      return e?.message || "Authentication failed.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      signUp: async (email, password) => {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      },
      signOut: () => fbSignOut(auth),
    }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
