import { test, expect } from "@playwright/test";
import {
  cleanupTestUser,
  generateTestEmail,
  getSupabaseAdmin,
  completeOnboardingForUser,
} from "./test-helpers";

test.describe("OAuth Student Missing Names - Dashboard Error", () => {
  test("TA dashboard throws error when student has no first_name/last_name", async ({
    page,
  }) => {
    const studentEmail = generateTestEmail("oauth-student");
    const taEmail = generateTestEmail("ta");
    const instructorEmail = generateTestEmail("instructor");

    const supabase = getSupabaseAdmin();

    try {
      // Clean up before test
      await cleanupTestUser(studentEmail);
      await cleanupTestUser(taEmail);
      await cleanupTestUser(instructorEmail);

      // 1. Create an OAuth student WITHOUT first_name/last_name (simulating Google/GitHub OAuth)
      const { data: studentAuth, error: studentAuthError } =
        await supabase.auth.admin.createUser({
          email: studentEmail,
          email_confirm: true,
          app_metadata: {
            provider: "google",
            providers: ["google"],
          },
          // Intentionally NOT including first_name/last_name in user_metadata
          user_metadata: {
            full_name: "OAuth User",
            // No first_name or last_name
          },
        });

      if (studentAuthError) throw studentAuthError;

      // Create users table row WITHOUT first_name/last_name (null values)
      await supabase.from("users").insert({
        id: studentAuth.user.id,
        email: studentEmail,
        first_name: null, // Missing first_name
        last_name: null, // Missing last_name
        onboarding_completed: true,
        role: "student",
      });

      // Verify the student was created without first_name/last_name
      const { data: studentDataVerify } = await supabase
        .from("users")
        .select("first_name, last_name")
        .eq("id", studentAuth.user.id)
        .single();
      
      expect(studentDataVerify?.first_name).toEqual('');
      expect(studentDataVerify?.last_name).toEqual('');

      // 2. Create instructor
      const { data: instructorAuth, error: instructorAuthError } =
        await supabase.auth.admin.createUser({
          email: instructorEmail,
          email_confirm: true,
          password: "TestPassword123!",
        });

      if (instructorAuthError) throw instructorAuthError;

      await supabase.from("users").insert({
        id: instructorAuth.user.id,
        email: instructorEmail,
        first_name: "Instructor",
        last_name: "User",
        onboarding_completed: true,
        role: "instructor",
      });

      // 3. Create TA
      const { data: taAuth, error: taAuthError } =
        await supabase.auth.admin.createUser({
          email: taEmail,
          email_confirm: true,
          password: "TestPassword123!",
        });

      if (taAuthError) throw taAuthError;

      await supabase.from("users").insert({
        id: taAuth.user.id,
        email: taEmail,
        first_name: "TA",
        last_name: "User",
        onboarding_completed: true,
        role: "ta",
      });

      // 4. Create a course
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .insert({
          name: "Test Course",
          code: "TEST101",
          instructor_id: instructorAuth.user.id,
          semester: "Fall",
          year: 2024,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // 5. Assign TA to course
      await supabase.from("course_ta_assignments").insert({
        course_id: course.id,
        ta_id: taAuth.user.id,
      });

      // 6. Enroll student in course
      await supabase.from("course_enrollments").insert({
        course_id: course.id,
        student_id: studentAuth.user.id,
      });

      // 7. Create an assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from("assignments")
        .insert({
          title: "Test Assignment",
          description: "Test Description",
          course_id: course.id,
          instructor_id: instructorAuth.user.id,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          max_points: 100,
          assignment_type: "homework",
          status: "published",
        })
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // 8. Create a submission from the student (without first_name/last_name)
      const { data: submission, error: submissionError } = await supabase
        .from("submissions")
        .insert({
          assignment_id: assignment.id,
          student_id: studentAuth.user.id,
          content: "Test submission content",
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // 9. Log in as TA
      await page.goto("/login");
      await page.getByLabel(/^email$/i).fill(taEmail);
      await page.getByLabel(/^password$/i).fill("TestPassword123!");
      await page.getByRole("button", { name: /login/i }).click();

      // Wait for navigation to dashboard
      await page.waitForURL(/.*\/dashboard.*/, { timeout: 10000 });

      // 10. Set up error tracking before navigating
      const consoleErrors: string[] = [];
      const pageErrors: Error[] = [];
      
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });
      
      page.on("pageerror", (error) => {
        pageErrors.push(error);
      });

      // 11. Navigate to TA dashboard
      await page.goto("/dashboard/ta");

      // 12. Wait for the page to load and render
      // The error should occur when trying to render student names in the pending grading queue
      await page.waitForSelector("text=Pending Grading Queue", { timeout: 10000 }).catch(() => {
        // If selector doesn't appear, the page might have crashed
      });

      // Wait a bit more for any async rendering to complete
      await page.waitForTimeout(3000);

      // 13. Check for the error
      // The error should be: "Cannot read properties of null (reading 'first_name')"
      const allErrors = [
        ...pageErrors.map((e) => e.message),
        ...consoleErrors,
      ];

      const hasExpectedError = allErrors.some(
        (error) =>
          error.includes("Cannot read properties of null") &&
          error.includes("first_name")
      );

      // Verify the error occurred
      expect(hasExpectedError).toBe(true);

      // Also verify that the page either:
      // 1. Shows the error in console, OR
      // 2. The submission is not displayed properly (because of the error)
      const pendingGradingSection = page.getByText(/Pending Grading Queue/i);
      await expect(pendingGradingSection).toBeVisible();
    } finally {
      // Clean up
      await cleanupTestUser(studentEmail);
      await cleanupTestUser(taEmail);
      await cleanupTestUser(instructorEmail);
    }
  });

  test("Instructor dashboard throws error when student has no first_name/last_name", async ({
    page,
  }) => {
    const studentEmail = generateTestEmail("oauth-student");
    const instructorEmail = generateTestEmail("instructor");

    const supabase = getSupabaseAdmin();

    try {
      // Clean up before test
      await cleanupTestUser(studentEmail);
      await cleanupTestUser(instructorEmail);

      // 1. Create an OAuth student WITHOUT first_name/last_name (simulating GitHub OAuth)
      const { data: studentAuth, error: studentAuthError } =
        await supabase.auth.admin.createUser({
          email: studentEmail,
          email_confirm: true,
          app_metadata: {
            provider: "github",
            providers: ["github"],
          },
          // Intentionally NOT including first_name/last_name in user_metadata
          user_metadata: {
            full_name: "GitHub User",
            // No first_name or last_name
          },
        });

      if (studentAuthError) throw studentAuthError;

      // Create users table row WITHOUT first_name/last_name (null values)
      await supabase.from("users").insert({
        id: studentAuth.user.id,
        email: studentEmail,
        first_name: null, // Missing first_name
        last_name: null, // Missing last_name
        onboarding_completed: true,
        role: "student",
      });

      // Verify the student was created without first_name/last_name
      const { data: studentDataVerify2 } = await supabase
        .from("users")
        .select("first_name, last_name")
        .eq("id", studentAuth.user.id)
        .single();
      
      expect(studentDataVerify2?.first_name).toEqual('');
      expect(studentDataVerify2?.last_name).toEqual('');

      // 2. Create instructor
      const { data: instructorAuth, error: instructorAuthError } =
        await supabase.auth.admin.createUser({
          email: instructorEmail,
          email_confirm: true,
          password: "TestPassword123!",
        });

      if (instructorAuthError) throw instructorAuthError;

      await supabase.from("users").insert({
        id: instructorAuth.user.id,
        email: instructorEmail,
        first_name: "Instructor",
        last_name: "User",
        onboarding_completed: true,
        role: "instructor",
      });

      // 3. Create a course
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .insert({
          name: "Test Course",
          code: "TEST101",
          instructor_id: instructorAuth.user.id,
          semester: "Fall",
          year: 2024,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // 4. Enroll student in course
      await supabase.from("course_enrollments").insert({
        course_id: course.id,
        student_id: studentAuth.user.id,
      });

      // 5. Create an assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from("assignments")
        .insert({
          title: "Test Assignment",
          description: "Test Description",
          course_id: course.id,
          instructor_id: instructorAuth.user.id,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          max_points: 100,
          assignment_type: "homework",
          status: "published",
        })
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // 6. Create a submission from the student (without first_name/last_name)
      const { data: submission, error: submissionError } = await supabase
        .from("submissions")
        .insert({
          assignment_id: assignment.id,
          student_id: studentAuth.user.id,
          content: "Test submission content",
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // 7. Log in as instructor
      await page.goto("/login");
      await page.getByLabel(/^email$/i).fill(instructorEmail);
      await page.getByLabel(/^password$/i).fill("TestPassword123!");
      await page.getByRole("button", { name: /login/i }).click();

      // Wait for navigation to dashboard
      await page.waitForURL(/.*\/dashboard.*/, { timeout: 10000 });

      // 8. Set up error tracking before navigating
      const consoleErrors: string[] = [];
      const pageErrors: Error[] = [];
      
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });
      
      page.on("pageerror", (error) => {
        pageErrors.push(error);
      });

      // 9. Navigate to instructor dashboard first
      await page.goto("/dashboard/instructor");
      await page.waitForLoadState("networkidle");

      // 10. Navigate to assignment detail page (where student names are displayed)
      await page.goto(`/dashboard/instructor/assignments/${assignment.id}`);

      // 11. Wait for the page to load and render
      // The error should occur when trying to render student names in the submissions list
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);

      // 12. Check for the error
      // The error should be: "Cannot read properties of null (reading 'first_name')"
      const allErrors = [
        ...pageErrors.map((e) => e.message),
        ...consoleErrors,
      ];

      const hasExpectedError = allErrors.some(
        (error) =>
          error.includes("Cannot read properties of null") &&
          error.includes("first_name")
      );

      // Verify the error occurred
      expect(hasExpectedError).toBe(true);
    } finally {
      // Clean up
      await cleanupTestUser(studentEmail);
      await cleanupTestUser(instructorEmail);
    }
  });
});

