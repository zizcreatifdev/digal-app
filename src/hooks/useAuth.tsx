import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { logAuth, getClientIp, geolocateLog } from "@/lib/activity-logs";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: "admin" | "user" | null;
  profileRole: string | null;
  profileRoleLoaded: boolean;
  userStatut: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; data: unknown }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "user" | null>(null);
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [profileRoleLoaded, setProfileRoleLoaded] = useState(false);
  const [userStatut, setUserStatut] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    const [roleResult, profileResult] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("users").select("role, statut").eq("user_id", userId).maybeSingle(),
    ]);
    setUserRole((roleResult.data?.role as "admin" | "user") ?? "user");
    setProfileRole(profileResult.data?.role ?? null);
    setUserStatut(profileResult.data?.statut ?? null);
    setProfileRoleLoaded(true);
  };

  // Prevents getSession() from overwriting onAuthStateChange when both fire concurrently
  const initializedRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        initializedRef.current = true;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock inside the listener
          setTimeout(() => fetchRole(session.user.id), 0);
        } else {
          setUserRole(null);
          setProfileRole(null);
          setProfileRoleLoaded(true);
        }
        setLoading(false);
      }
    );

    // Fallback: only runs if onAuthStateChange hasn't fired yet (avoids double-fetch)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (initializedRef.current) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setProfileRoleLoaded(true);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      const ip = await getClientIp();
      const logId = await logAuth(data.user.id, "login_success", ip);
      // Géolocalisation asynchrone — ne bloque pas la connexion
      if (logId) geolocateLog(logId);
    }
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { data, error: error as Error | null };
  };

  const signOut = async () => {
    if (user) logAuth(user.id, "Déconnexion");
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserRole(null);
    setProfileRole(null);
    setUserStatut(null);
    setProfileRoleLoaded(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, userRole, profileRole, profileRoleLoaded, userStatut, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
