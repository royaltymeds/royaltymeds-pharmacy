import { createClient } from "@supabase/supabase-js";

export const createAuthClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  role: "patient" | "doctor" = "patient"
) {
  const supabase = createAuthClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: fullName,
      },
      emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
    },
  });

  if (authError) throw authError;

  if (authData.user) {
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert([
        {
          user_id: authData.user.id,
          full_name: fullName,
        },
      ]);

    if (profileError) throw profileError;
  }

  return authData;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createAuthClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = createAuthClient();

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const supabase = createAuthClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getUserProfile(userId: string) {
  const supabase = createAuthClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId: string, updates: Record<string, any>) {
  const supabase = createAuthClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
