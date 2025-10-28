import { createClient } from "@supabase/supabase-js";

/**
 * Helper functions for e2e testing
 */

export function getSupabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_KEY) {
    throw new Error("SUPABASE_SERVICE_KEY not set");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function cleanupTestUser(email: string) {
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.warn("SUPABASE_SERVICE_KEY not set, skipping cleanup");
    return;
  }

  const supabase = getSupabaseAdmin();

  try {
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users.users.find((u) => u.email === email);

    if (testUser) {
      await supabase.auth.admin.deleteUser(testUser.id);
      console.log(`Cleaned up test user: ${email}`);
    }
  } catch (error) {
    console.error(`Error cleaning up test user: ${error}`);
  }
}

export async function createOAuthUser(
  email: string,
  provider: "google" | "github",
  metadata?: any
) {
  const supabase = getSupabaseAdmin();

  // Create user with OAuth provider
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: {
      provider: provider,
      providers: [provider],
      ...metadata,
    },
    user_metadata: {
      ...metadata?.user_metadata,
    },
  });

  if (error) throw error;

  // Create users table row
  await supabase.from("users").insert({
    id: data.user.id,
    email,
    first_name: metadata?.user_metadata?.first_name || null,
    last_name: metadata?.user_metadata?.last_name || null,
    onboarding_completed: false,
  });

  return data.user;
}

export async function updateUserMetadata(userId: string, metadata: any) {
  const supabase = getSupabaseAdmin();

  return await supabase.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  });
}

export async function getUserFromDB(userId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function createTestUser(email: string, password: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw error;

  // Create users table row
  await supabase.from("users").insert({
    id: data.user.id,
    email,
    onboarding_completed: false,
  });

  return data.user;
}

export async function completeOnboardingForUser(
  userId: string,
  role: "instructor" | "ta" | "student"
) {
  const supabase = getSupabaseAdmin();

  return await supabase
    .from("users")
    .update({
      role,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

export function generateTestEmail(prefix: string = "test"): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}@example.com`;
}
