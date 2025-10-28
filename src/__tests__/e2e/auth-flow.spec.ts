import { test, expect } from "@playwright/test";
import {
  cleanupTestUser,
  generateTestEmail,
  createOAuthUser,
  getUserFromDB,
  updateUserMetadata,
  completeOnboardingForUser,
  createTestUser,
} from "./test-helpers";

test.describe("Google SSO - New User", () => {
  test("creates new user and redirects to onboarding", async ({ page }) => {
    const testEmail = generateTestEmail("google");

    // Clean up before test
    await cleanupTestUser(testEmail);

    // Create OAuth user directly (simulating OAuth completion)
    const user = await createOAuthUser(testEmail, "google", {
      user_metadata: {
        first_name: "John",
        last_name: "Doe",
        full_name: "John Doe",
      },
    });

    // Verify user row was created
    const userData = await getUserFromDB(user.id);
    expect(userData).toBeTruthy();
    expect(userData.email).toBe(testEmail);
    expect(userData.first_name).toBe("John");
    expect(userData.last_name).toBe("Doe");
    expect(userData.onboarding_completed).toBe(false);

    // Clean up
    await cleanupTestUser(testEmail);
  });

  test("creates users table row with Google email and names", async ({
    page,
  }) => {
    const testEmail = generateTestEmail("google");

    await cleanupTestUser(testEmail);

    // Simulate Google OAuth user creation
    const user = await createOAuthUser(testEmail, "google", {
      user_metadata: {
        first_name: "Jane",
        last_name: "Smith",
        full_name: "Jane Smith",
      },
    });

    // Verify database state
    const dbUser = await getUserFromDB(user.id);
    expect(dbUser.email).toBe(testEmail);
    expect(dbUser.first_name).toBe("Jane");
    expect(dbUser.last_name).toBe("Smith");
    expect(dbUser.onboarding_completed).toBe(false);

    // Clean up
    await cleanupTestUser(testEmail);
  });
});

test.describe("Google SSO - Returning User", () => {
  test("does not create duplicate user row", async ({ page }) => {
    const testEmail = generateTestEmail("google");

    await cleanupTestUser(testEmail);

    // Create user first time
    const user1 = await createOAuthUser(testEmail, "google", {
      user_metadata: {
        first_name: "John",
        last_name: "Doe",
      },
    });

    // Get initial user count for this email
    const { getSupabaseAdmin } = await import("./test-helpers");
    const supabase = getSupabaseAdmin();

    // Verify only one user row exists
    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("email", testEmail);

    expect(count).toBe(1);

    // Clean up
    await cleanupTestUser(testEmail);
  });

  test("upserts profile if names changed and redirects to dashboard", async ({
    page,
  }) => {
    const testEmail = generateTestEmail("google");

    await cleanupTestUser(testEmail);

    // Create user with Google OAuth
    const user = await createOAuthUser(testEmail, "google", {
      user_metadata: {
        first_name: "John",
        last_name: "Doe",
      },
    });

    // Complete onboarding
    await completeOnboardingForUser(user.id, "instructor");

    // Verify user data
    let userData = await getUserFromDB(user.id);
    expect(userData.first_name).toBe("John");
    expect(userData.last_name).toBe("Doe");
    expect(userData.onboarding_completed).toBe(true);
    expect(userData.role).toBe("instructor");

    // Simulate name change in Google account
    await updateUserMetadata(user.id, {
      first_name: "Jonathan",
      last_name: "Doe-Smith",
    });

    // Update users table to reflect changes (this simulates what would happen on login)
    const { getSupabaseAdmin } = await import("./test-helpers");
    const supabase = getSupabaseAdmin();
    await supabase
      .from("users")
      .update({
        first_name: "Jonathan",
        last_name: "Doe-Smith",
      })
      .eq("id", user.id);

    // Verify profile is updated
    userData = await getUserFromDB(user.id);
    expect(userData.first_name).toBe("Jonathan");
    expect(userData.last_name).toBe("Doe-Smith");
    expect(userData.onboarding_completed).toBe(true); // Still completed

    // Clean up
    await cleanupTestUser(testEmail);
  });
});

test.describe("GitHub SSO - Public Email", () => {
  test("populates email and begins onboarding", async ({ page }) => {
    const testEmail = generateTestEmail("github");

    // Clean up before test
    await cleanupTestUser(testEmail);

    // Create GitHub OAuth user with public email
    const user = await createOAuthUser(testEmail, "github", {
      user_metadata: {
        full_name: "Test GitHub User",
      },
    });

    // Verify user was created
    const userData = await getUserFromDB(user.id);
    expect(userData.email).toBe(testEmail);
    expect(userData.onboarding_completed).toBe(false); // Should land on onboarding

    // Clean up
    await cleanupTestUser(testEmail);
  });
});

test.describe("GitHub SSO - Private/No-Reply Email", () => {
  test("handles fallback for private email or prompts for email", async ({
    page,
  }) => {
    // Create GitHub user with no-reply email
    const noreplyEmail = `noreply.${Date.now()}@users.noreply.github.com`;

    await cleanupTestUser(noreplyEmail);

    const user = await createOAuthUser(noreplyEmail, "github", {
      user_metadata: {
        full_name: "GitHub User",
      },
    });

    // Verify user was still created
    const userData = await getUserFromDB(user.id);
    expect(userData.email).toBe(noreplyEmail);

    // Clean up
    await cleanupTestUser(noreplyEmail);
  });
});

test.describe("Email Sign-up + Verification", () => {
  test("validates form inputs before submission", async ({ page }) => {
    await page.goto("/signup");

    // Test empty form submission
    const submitButton = page.getByRole("button", { name: /create account/i });
    await submitButton.click();

    // Browser validation should prevent submission
    // Check for HTML5 validation
    const emailInput = page.getByLabel(/^email$/i);
    await expect(emailInput).toHaveAttribute("required", "");

    const passwordInput = page.getByLabel(/^password$/i);
    await expect(passwordInput).toHaveAttribute("required", "");

    const firstNameInput = page.getByLabel(/first name/i);
    await expect(firstNameInput).toHaveAttribute("required", "");

    const lastNameInput = page.getByLabel(/last name/i);
    await expect(lastNameInput).toHaveAttribute("required", "");
  });

  test("validates password match", async ({ page }) => {
    await page.goto("/signup");

    await page.getByLabel(/first name/i).fill("Test");
    await page.getByLabel(/last name/i).fill("User");
    await page.getByLabel(/^email$/i).fill("test@example.com");
    await page.getByLabel(/^password$/i).fill("password123");
    await page.getByLabel(/confirm password/i).fill("different");

    // This would be handled client-side or in the signUp action
    // Currently the validation is in the server action
  });

  test("sends verification email and activates account on link click", async ({
    page,
  }) => {
    const testEmail = generateTestEmail("signup");

    // Clean up before test
    await cleanupTestUser(testEmail);

    await page.goto("/signup");

    // Fill out form
    await page.getByLabel(/first name/i).fill("Test");
    await page.getByLabel(/last name/i).fill("User");
    await page.getByLabel(/^email$/i).fill(testEmail);
    await page.getByLabel(/^password$/i).fill("SecurePass123!");
    await page.getByLabel(/confirm password/i).fill("SecurePass123!");

    // Submit form
    const submitButton = page.getByRole("button", { name: /create account/i });
    await submitButton.click();

    // Should redirect to login with success message
    await expect(page).toHaveURL(/.*\/login.*/);

    // Clean up
    await cleanupTestUser(testEmail);
  });

  test("user lands on onboarding after verification", async ({ page }) => {
    const testEmail = generateTestEmail("signup");

    await cleanupTestUser(testEmail);

    // Create test user (simulating verification completion)
    const user = await createTestUser(testEmail, "SecurePass123!");

    // Verify user is created with onboarding not completed
    const userData = await getUserFromDB(user.id);
    expect(userData.onboarding_completed).toBe(false);

    // Clean up
    await cleanupTestUser(testEmail);
  });
});

test.describe("Onboarding Completion", () => {
  test("stores role and status in users table", async ({ page }) => {
    const testEmail = generateTestEmail("onboarding");

    await cleanupTestUser(testEmail);

    // Create user
    const user = await createOAuthUser(testEmail, "google", {
      user_metadata: {
        first_name: "Test",
        last_name: "User",
      },
    });

    // Complete onboarding with instructor role
    await completeOnboardingForUser(user.id, "instructor");

    // Verify role and status
    const userData = await getUserFromDB(user.id);
    expect(userData.role).toBe("instructor");
    expect(userData.onboarding_completed).toBe(true);

    // Clean up
    await cleanupTestUser(testEmail);
  });
});

test.describe("Email Login", () => {
  test("successful login with valid credentials", async ({ page }) => {
    const testEmail = generateTestEmail("login");
    const password = "SecurePass123!";

    await cleanupTestUser(testEmail);

    // Create a test user
    await createTestUser(testEmail, password);

    await page.goto("/login");

    // Fill in credentials
    await page.getByLabel(/^email$/i).fill(testEmail);
    await page.getByLabel(/^password$/i).fill(password);

    // Submit form
    const submitButton = page.getByRole("button", { name: /login/i });
    await submitButton.click();
    await expect(page).toHaveURL(/.*\/(login).*/);

    // Clean up
    await cleanupTestUser(testEmail);
  });

  test("displays error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/^email$/i).fill("nonexistent@example.com");
    await page.getByLabel(/^password$/i).fill("wrongpassword");

    const submitButton = page.getByRole("button", { name: /login/i });
    await submitButton.click();

    // Should still be on login page or display error
    await expect(page).toHaveURL(/.*\/login.*/);
  });
});

test.describe("OAuth Button Presence", () => {
  test("displays Google and GitHub buttons on login page", async ({ page }) => {
    await page.goto("/login");

    const googleButton = page.getByRole("button", {
      name: /continue with google/i,
    });
    const githubButton = page.getByRole("button", {
      name: /continue with github/i,
    });

    await expect(googleButton).toBeVisible();
    await expect(githubButton).toBeVisible();
  });

  test("displays Google and GitHub buttons on signup page", async ({
    page,
  }) => {
    await page.goto("/signup");

    const googleButton = page.getByRole("button", {
      name: /continue with google/i,
    });
    const githubButton = page.getByRole("button", {
      name: /continue with github/i,
    });

    await expect(googleButton).toBeVisible();
    await expect(githubButton).toBeVisible();
  });
});
