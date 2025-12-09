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
    const { data: users } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const matches =
      users?.users.filter(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      ) ?? [];

    if (!matches.length) {
      return;
    }

    for (const user of matches) {
      await supabase.auth.admin.deleteUser(user.id);
      console.log(`Cleaned up test user: ${email} (${user.id})`);
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

/**
 * Helper to log in a user via the login page
 * Handles onboarding redirects - if user hasn't completed onboarding,
 * they will be redirected to /onboarding and onboarding will be completed automatically.
 * Otherwise, they'll be redirected to their dashboard.
 * @param page Playwright page object
 * @param email User email
 * @param password User password
 * @param role Optional role to use if onboarding is needed. If not provided, will try to get from user data or default to "student"
 */
export async function loginUser(
  page: any,
  email: string,
  password: string,
  role?: "instructor" | "ta" | "student"
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();

  // Wait for navigation after login
  // Login redirects to /, which then redirects to dashboard or onboarding
  // Wait for URL to change from /login
  await page.waitForURL(
    (url: { pathname: string }) => !url.pathname.includes("/login"),
    { timeout: 10000 }
  );

  // Wait a bit more for potential redirect from / to dashboard/onboarding
  await page.waitForLoadState("networkidle");

  // Check if onboarding page is shown (check both URL and text)
  const finalUrl = page.url();
  const isOnboardingUrl = finalUrl.includes("/onboarding");
  const onboardingText = page.getByText(
    "Let's set up your profile to get you started."
  );
  const isOnboardingPage =
    isOnboardingUrl || (await onboardingText.isVisible().catch(() => false));

  if (isOnboardingPage) {
    // Complete onboarding automatically
    // Check if first/last name fields are needed
    const firstNameField = page.getByLabel("First Name");
    const lastNameField = page.getByLabel("Last Name");
    const needsNames =
      (await firstNameField.isVisible().catch(() => false)) &&
      (await lastNameField.isVisible().catch(() => false));

    // Fill in names if needed (try to get from user data)
    if (needsNames) {
      try {
        // Try to get user data to see if names exist
        const supabase = getSupabaseAdmin();
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users?.users.find((u) => u.email === email);
        if (user) {
          const userData = await getUserFromDB(user.id).catch(() => null);
          if (userData?.first_name) {
            await firstNameField.fill(userData.first_name);
          } else {
            await firstNameField.fill("Test");
          }
          if (userData?.last_name) {
            await lastNameField.fill(userData.last_name);
          } else {
            await lastNameField.fill("User");
          }
        } else {
          // Fallback values
          await firstNameField.fill("Test");
          await lastNameField.fill("User");
        }
      } catch (error) {
        // Fallback values if we can't get user data
        await firstNameField.fill("Test");
        await lastNameField.fill("User");
      }
    }

    // Determine which role to use
    let roleToUse: "instructor" | "ta" | "student" = role || "student";
    if (!role) {
      // Try to get role from user data
      try {
        const supabase = getSupabaseAdmin();
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users?.users.find((u) => u.email === email);
        if (user) {
          const userData = await getUserFromDB(user.id).catch(() => null);
          if (userData?.role) {
            roleToUse = userData.role as "instructor" | "ta" | "student";
          }
        }
      } catch (error) {
        // Use default
      }
    }

    // Select role - find and click the select trigger
    // The Select component has name="role" and uses a button trigger
    // Find the select by its name attribute or by the label
    const roleSelect = page.locator('select[name="role"]');
    const selectExists = (await roleSelect.count()) > 0;

    if (selectExists) {
      // Native select element
      await roleSelect.selectOption(roleToUse);
    } else {
      // Custom Select component - find the button trigger
      // The SelectTrigger is a button that opens the dropdown
      const roleLabel = page.getByLabel("I am a...");
      const roleSelectButton = roleLabel
        .locator("..")
        .locator("button")
        .first();

      await roleSelectButton.click();

      // Wait for dropdown to open and select the option
      const roleOptionText =
        roleToUse === "instructor"
          ? "Instructor"
          : roleToUse === "ta"
          ? "Teaching Assistant"
          : "Student";

      await page.getByRole("option", { name: roleOptionText }).click();
    }

    // Phone number is optional, so we'll skip it
    // Submit the form
    await page.getByRole("button", { name: "Complete Setup" }).click();

    // Wait for redirect to dashboard after onboarding
    await page.waitForURL(/\/dashboard\//, { timeout: 10000 });
  } else {
    // Not onboarding page, check final URL

    // Should now be at dashboard (could be / or /dashboard/...)
    // If at /, wait for redirect to dashboard
    const urlPath = new URL(finalUrl).pathname;
    if (urlPath === "/" || urlPath === "") {
      await page.waitForURL(/\/dashboard\//, { timeout: 5000 });
    } else if (!finalUrl.includes("/dashboard/")) {
      throw new Error(
        `Unexpected redirect after login. Expected dashboard, got: ${finalUrl}`
      );
    }
  }
}
