import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import { applyUserLocale } from "@/i18n";

export type Role = "CAMUNDA" | "CUSTOMER";

export interface User {
  userId: string; // auth user id (users.id)
  email?: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Result of looking up the signed-in auth user in the users table.
// `role` is null when there is no usable profile (missing, inactive, deleted).
interface ProfileState {
  authId: string;
  role: Role | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // undefined = session not checked yet, null = signed out
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<ProfileState | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    // Keep this callback synchronous: awaiting supabase calls inside it can deadlock.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) =>
      setSession(s),
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Load the role from users.role whenever the signed-in auth user changes.
  const authId = session?.user.id;
  useEffect(() => {
    if (!authId) return;

    let cancelled = false;
    supabase
      .from("users")
      .select("role, active, deleted, locale")
      .eq("id", authId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Error fetching user profile:", error);

        if (data) applyUserLocale(data.locale);
        const usable = data && data.active !== false && !data.deleted;
        setProfile({
          authId,
          role: usable
            ? data.role === "CAMUNDA"
              ? "CAMUNDA"
              : "CUSTOMER"
            : null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [authId]);

  const profileReady = !authId || profile?.authId === authId;
  const loading = session === undefined || !profileReady;

  const user: User | null =
    session && profileReady && profile?.role
      ? {
          userId: session.user.id,
          email: session.user.email,
          role: profile.role,
        }
      : null;

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error(error);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AppProvider");
  }
  return context;
};
