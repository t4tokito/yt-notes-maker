import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as ImageManipulator from "expo-image-manipulator";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updatePassword,
  EmailAuthProvider,
  type User,
} from "firebase/auth";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import {
  claimUsername,
  getProfile,
  isUsernameAvailable,
  resolveUsernameToEmail,
  updateProfile as updateProfileDoc,
  validateUsername,
  type Profile,
} from "./usernames";

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  initializing: boolean;
  needsUsername: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (email: string, username: string, password: string) => Promise<void>;
  setUsername: (username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  updateBio: (bio: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  uploadPhoto: (uri: string) => Promise<string>;
  removePhoto: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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
      return "Incorrect username/email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again in a moment.";
    case "auth/network-request-failed":
      return "Network error. Check your connection.";
    default:
      return e?.message || "Authentication failed.";
  }
}

async function uriToBase64(uri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 200 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  if (manipulated.base64) {
    return `data:image/jpeg;base64,${manipulated.base64}`;
  }
  const res = await fetch(manipulated.uri);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const p = await getProfile(u.uid);
          setProfile(p);
          setNeedsUsername(!p?.username);
        } catch (e) {
          console.error("profile load failed", e);
          setProfile(null);
          setNeedsUsername(false);
        }
      } else {
        setProfile(null);
        setNeedsUsername(false);
      }
      setInitializing(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      initializing,
      needsUsername,
      signIn: async (identifier, password) => {
        let email = identifier.trim();
        if (!email.includes("@")) {
          const resolved = await resolveUsernameToEmail(email);
          if (!resolved) throw { code: "auth/user-not-found" };
          email = resolved;
        }
        await signInWithEmailAndPassword(auth, email, password);
      },
      signUp: async (email, username, password) => {
        const err = validateUsername(username);
        if (err) throw new Error(err);
        const available = await isUsernameAvailable(username);
        if (!available) throw new Error("That username is already taken.");

        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        try {
          await claimUsername(cred.user.uid, email.trim(), username);
          setProfile({ username: username.trim(), email: email.trim() });
          setNeedsUsername(false);
        } catch (e) {
          await cred.user.delete().catch(() => {});
          throw e;
        }
      },
      setUsername: async (username) => {
        const u = auth.currentUser;
        if (!u) throw new Error("You must be signed in.");
        await claimUsername(u.uid, u.email ?? "", username);
        setProfile((prev) => ({ ...prev, username: username.trim() }));
        setNeedsUsername(false);
      },
      signOut: () => fbSignOut(auth),
      updateUsername: async (username) => {
        const u = auth.currentUser;
        if (!u) throw new Error("You must be signed in.");
        const err = validateUsername(username);
        if (err) throw new Error(err);
        const available = await isUsernameAvailable(username);
        if (!available) throw new Error("That username is already taken.");

        const newName = username.trim();
        const oldName = profile?.username?.trim();

        // Delete old username mapping & create new one
        if (oldName) {
          await deleteDoc(doc(db, "usernames", oldName.toLowerCase())).catch(() => {});
        }
        await setDoc(doc(db, "usernames", newName.toLowerCase()), {
          uid: u.uid,
          email: u.email,
          username: newName,
        });

        // Update user profile doc
        await updateProfileDoc(u.uid, { username: newName });
        setProfile((prev) => ({ ...prev, username: newName }));
      },
      updateBio: async (bio) => {
        const u = auth.currentUser;
        if (!u) throw new Error("You must be signed in.");
        await updateProfileDoc(u.uid, { bio });
        setProfile((prev) => ({ ...prev, bio }));
      },
      changePassword: async (currentPassword, newPassword) => {
        const u = auth.currentUser;
        if (!u || !u.email) throw new Error("You must be signed in.");
        const credential = EmailAuthProvider.credential(u.email, currentPassword);
        await reauthenticateWithCredential(u, credential);
        await updatePassword(u, newPassword);
      },
      uploadPhoto: async (uri) => {
        const u = auth.currentUser;
        if (!u) throw new Error("You must be signed in.");
        const base64 = await uriToBase64(uri);
        await updateProfileDoc(u.uid, { photoURL: base64 });
        setProfile((prev) => ({ ...prev, photoURL: base64 }));
        return base64;
      },
      removePhoto: async () => {
        const u = auth.currentUser;
        if (!u) throw new Error("You must be signed in.");
        await updateProfileDoc(u.uid, { photoURL: null });
        setProfile((prev) => ({ ...prev, photoURL: null }));
      },
    }),
    [user, profile, initializing, needsUsername]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
