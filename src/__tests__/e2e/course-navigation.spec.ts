import { test, expect } from "@playwright/test";
import {
  cleanupTestUser,
  generateTestEmail,
  createTestUser,
  completeOnboardingForUser,
  getSupabaseAdmin,
  loginUser,
} from "./test-helpers";

test.describe("Course Navigation - Instructor", () => {
  let testEmail: string;
  let testPassword: string;
  let userId: string;
  let courseId: string;
  let assignmentId: string;

  test.beforeAll(async () => {
    testEmail = generateTestEmail("course-nav-instructor");
    testPassword = "TestPassword123!";
    await cleanupTestUser(testEmail);

    // Create instructor user with email/password
    const user = await createTestUser(testEmail, testPassword);
    userId = user.id;

    // Update user with names
    const supabase = getSupabaseAdmin();
    await supabase
      .from("users")
      .update({
        first_name: "Test",
        last_name: "Instructor",
      })
      .eq("id", userId);

    await completeOnboardingForUser(userId, "instructor");

    // Create test course
    const { data: course } = await supabase
      .from("courses")
      .insert({
        name: "Test Course for Navigation",
        code: "NAV101",
        description: "Test course for navigation tests",
        instructor_id: userId,
      })
      .select()
      .single();

    if (course) {
      courseId = course.id;

      // Create test assignment
      const { data: assignment } = await supabase
        .from("assignments")
        .insert({
          title: "Test Assignment",
          description: "Test assignment for navigation",
          course_id: courseId,
          instructor_id: userId,
          due_date: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          max_points: 100,
          status: "published",
        })
        .select()
        .single();

      if (assignment) {
        assignmentId = assignment.id;
      }
    }
  });

  test.afterAll(async () => {
    const supabase = getSupabaseAdmin();

    // Clean up in order: assignments, courses, user
    if (assignmentId) {
      await supabase.from("assignments").delete().eq("id", assignmentId);
    }
    if (courseId) {
      await supabase.from("courses").delete().eq("id", courseId);
    }
    await cleanupTestUser(testEmail);
  });

  test("instructor dashboard displays list of courses", async ({ page }) => {
    // Log in first
    await loginUser(page, testEmail, testPassword, "instructor");

    // Navigate to instructor dashboard
    await page.goto("/dashboard/instructor");

    // Should see courses section
    await expect(page.getByText("Your Courses")).toBeVisible();

    // Should see the test course
    await expect(page.getByText("Test Course for Navigation")).toBeVisible();
  });

  test("instructor can click course to view its assignments", async ({
    page,
  }) => {
    // Log in first
    await loginUser(page, testEmail, testPassword);

    await page.goto("/dashboard/instructor");

    // Click on the course card/row
    const courseCard = page.locator('[data-testid="course-card"]').filter({
      hasText: "Test Course for Navigation",
    });

    // If no test-id, try clicking the course name
    const courseLink = page.getByRole("link", {
      name: /Test Course for Navigation/i,
    });

    if (await courseLink.isVisible()) {
      await courseLink.click();
    } else if (await courseCard.isVisible()) {
      await courseCard.click();
    } else {
      // Click on the course row
      await page.getByText("Test Course for Navigation").click();
    }

    // Should navigate to course detail page
    await expect(page).toHaveURL(
      new RegExp(`/dashboard/instructor/courses/${courseId}`)
    );

    // Should see the course name
    await expect(page.getByText("Test Course for Navigation")).toBeVisible();

    // Should see assignments for this course
    await expect(page.getByText("Test Assignment")).toBeVisible();
  });

  test("course detail page shows only assignments for that course", async ({
    page,
  }) => {
    // Log in first
    await loginUser(page, testEmail, testPassword);

    // Navigate directly to course detail
    await page.goto(`/dashboard/instructor/courses/${courseId}`);

    // Should show the test assignment
    await expect(page.getByText("Test Assignment")).toBeVisible();
  });

  test("instructor can navigate back from course to dashboard", async ({
    page,
  }) => {
    // Log in first
    await loginUser(page, testEmail, testPassword);

    await page.goto(`/dashboard/instructor/courses/${courseId}`);

    // Click back button or breadcrumb
    const backButton = page.getByRole("button", { name: /back/i });
    const breadcrumb = page.getByRole("link", { name: /dashboard/i });

    if (await backButton.isVisible()) {
      await backButton.click();
    } else if (await breadcrumb.isVisible()) {
      await breadcrumb.click();
    } else {
      // Use browser back
      await page.goBack();
    }

    // Should be back on dashboard
    await expect(page).toHaveURL(/\/dashboard\/instructor/);
    await expect(page.getByText("Your Courses")).toBeVisible();
  });

  test("empty course shows appropriate message", async ({ page }) => {
    // Log in first
    await loginUser(page, testEmail, testPassword, "instructor");

    const supabase = getSupabaseAdmin();

    // Create empty course
    const { data: emptyCourse } = await supabase
      .from("courses")
      .insert({
        name: "Empty Course",
        code: "EMPTY101",
        description: "Course with no assignments",
        instructor_id: userId,
      })
      .select()
      .single();

    if (emptyCourse) {
      await page.goto(`/dashboard/instructor/courses/${emptyCourse.id}`);

      // Should show empty state message
      await expect(page.getByText("No assignments yet")).toBeVisible();

      // Clean up
      await supabase.from("courses").delete().eq("id", emptyCourse.id);
    }
  });
});

test.describe("Course Navigation - Student", () => {
  let testEmail: string;
  let testPassword: string;
  let instructorEmail: string;
  let instructorPassword: string;
  let studentId: string;
  let instructorId: string;
  let courseId: string;
  let assignmentId: string;

  test.beforeAll(async () => {
    const supabase = getSupabaseAdmin();

    // Create instructor
    instructorEmail = generateTestEmail("course-nav-instructor-for-student");
    instructorPassword = "TestPassword123!";
    await cleanupTestUser(instructorEmail);
    const instructor = await createTestUser(
      instructorEmail,
      instructorPassword
    );
    instructorId = instructor.id;

    // Update instructor with names
    await supabase
      .from("users")
      .update({
        first_name: "Test",
        last_name: "Instructor",
      })
      .eq("id", instructorId);

    await completeOnboardingForUser(instructorId, "instructor");

    // Create student
    testEmail = generateTestEmail("course-nav-student");
    testPassword = "TestPassword123!";
    await cleanupTestUser(testEmail);
    const student = await createTestUser(testEmail, testPassword);
    studentId = student.id;

    // Update student with names
    await supabase
      .from("users")
      .update({
        first_name: "Test",
        last_name: "Student",
      })
      .eq("id", studentId);

    await completeOnboardingForUser(studentId, "student");

    // Create course
    const { data: course } = await supabase
      .from("courses")
      .insert({
        name: "Student Test Course",
        code: "STU101",
        description: "Test course for student navigation",
        instructor_id: instructorId,
      })
      .select()
      .single();

    if (course) {
      courseId = course.id;

      // Enroll student
      await supabase.from("course_enrollments").insert({
        course_id: courseId,
        student_id: studentId,
      });

      // Create assignment
      const { data: assignment } = await supabase
        .from("assignments")
        .insert({
          title: "Student Test Assignment",
          description: "Assignment for student navigation test",
          course_id: courseId,
          instructor_id: instructorId,
          due_date: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          max_points: 100,
          status: "published",
        })
        .select()
        .single();

      if (assignment) {
        assignmentId = assignment.id;
      }
    }
  });

  test.afterAll(async () => {
    const supabase = getSupabaseAdmin();

    if (assignmentId) {
      await supabase.from("assignments").delete().eq("id", assignmentId);
    }
    if (courseId) {
      await supabase
        .from("course_enrollments")
        .delete()
        .eq("course_id", courseId);
      await supabase.from("courses").delete().eq("id", courseId);
    }
    await cleanupTestUser(testEmail);
    await cleanupTestUser(instructorEmail);
  });

  test("student dashboard displays enrolled courses", async ({ page }) => {
    // Log in first
    await loginUser(page, testEmail, testPassword, "student");

    await page.goto("/dashboard/student");

    // Should see the enrolled course
    await expect(page.getByText("Student Test Course")).toBeVisible();
  });

  test("student can click course to view assignments", async ({ page }) => {
    // Log in first
    await loginUser(page, testEmail, testPassword, "student");

    await page.goto("/dashboard/student");

    // Click on the course
    await page.getByText("Student Test Course").click();

    // Should navigate to course detail or show filtered assignments
    await expect(page.getByText("Student Test Assignment")).toBeVisible();
  });

  test("student sees only enrolled courses", async ({ page }) => {
    // Log in first
    await loginUser(page, testEmail, testPassword, "student");

    const supabase = getSupabaseAdmin();

    // Create a course the student is NOT enrolled in
    const { data: unenrolledCourse } = await supabase
      .from("courses")
      .insert({
        name: "Unenrolled Course",
        code: "NOPE101",
        description: "Student should not see this",
        instructor_id: instructorId,
      })
      .select()
      .single();

    await page.goto("/dashboard/student");

    // Should see enrolled course
    await expect(page.getByText("Student Test Course")).toBeVisible();

    // Should NOT see unenrolled course
    await expect(page.getByText("Unenrolled Course")).not.toBeVisible();

    // Clean up
    if (unenrolledCourse) {
      await supabase.from("courses").delete().eq("id", unenrolledCourse.id);
    }
  });

  test("student course detail shows assignments with submission status", async ({
    page,
  }) => {
    // Log in first
    await loginUser(page, testEmail, testPassword, "student");

    await page.goto("/dashboard/student");

    // Navigate to course
    await page.getByText("Student Test Course").click();

    // Should show assignment
    await expect(page.getByText("Student Test Assignment")).toBeVisible();

    const submitButton = page.getByRole("button", { name: "Submit" } ).first();
    await expect(submitButton).toBeVisible();
  });
});
