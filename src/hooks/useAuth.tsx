import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  loadingProfile: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  loadingProfile: false,
  signOut: async () => { },
  refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    let initialized = false;

    console.log("[Auth] Initializing AuthProvider...");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log(`[Auth] Event: ${event}`);
      if (!mounted || signingOut) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      // If we got a session/user, we are definitely no longer loading the AUTH state
      if (currentSession || event === 'SIGNED_OUT') {
        initialized = true;
        setLoading(false);
      }
    });

    // Fallback timer for session initialization
    const timer = setTimeout(() => {
      if (mounted && !initialized) {
        console.warn("[Auth] Session initialization timeout. Forcing loading to false.");
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [signingOut]);

  // Separate Effect for Profile Fetching to avoid blocking Auth init
  useEffect(() => {
    let mounted = true;
    if (!user) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    const fetchProfileWithRetry = async (retryCount = 0): Promise<void> => {
      if (!mounted) return;
      setLoadingProfile(true);
      console.log(`[Auth] Fetching profile (attempt ${retryCount + 1})...`);

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          if (error.message?.includes("Lock") && retryCount < 2) {
            console.warn("[Auth] Profile lock collision, retrying...");
            await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
            return fetchProfileWithRetry(retryCount + 1);
          }
          throw error;
        }

        if (mounted) {
          setProfile(data);
          setLoadingProfile(false);
        }
      } catch (err: any) {
        console.error("[Auth] Profile fetch error:", err.message);
        if (mounted) setLoadingProfile(false);
      }
    };

    fetchProfileWithRetry();
    return () => { mounted = false; };
  }, [user]);

  const refreshProfile = async () => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      setProfile(data);
    } catch (err: any) {
      console.error("[Auth] Manual profile refresh error:", err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setLoading(false);
      setSigningOut(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, loadingProfile, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
