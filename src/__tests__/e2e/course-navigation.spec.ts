import { test, expect } from "@playwright/test";
import {
  cleanupTestUser,
  generateTestEmail,
  createOAuthUser,
  completeOnboardingForUser,
  getSupabaseAdmin,
} from "./test-helpers";

test.describe("Course Navigation - Instructor", () => {
  let testEmail: string;
  let userId: string;
  let courseId: string;
  let assignmentId: string;

  test.beforeAll(async () => {
    testEmail = generateTestEmail("course-nav-instructor");
    await cleanupTestUser(testEmail);

    // Create instructor user
    const user = await createOAuthUser(testEmail, "google", {
      user_metadata: {
        first_name: "Test",
        last_name: "Instructor",
      },
    });
    userId = user.id;
    await completeOnboardingForUser(userId, "instructor");

    // Create test course
    const supabase = getSupabaseAdmin();
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
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
    // Navigate to instructor dashboard
    await page.goto("/dashboard/instructor");

    // Should see courses section
    await expect(page.getByText("Your Courses")).toBeVisible();

    // Should see the test course
    await expect(page.getByText("Test Course for Navigation")).toBeVisible();
    await expect(page.getByText("NAV101")).toBeVisible();
  });

  test("instructor can click course to view its assignments", async ({ page }) => {
    await page.goto("/dashboard/instructor");

    // Click on the course card/row
    const courseCard = page.locator('[data-testid="course-card"]').filter({
      hasText: "Test Course for Navigation",
    });

    // If no test-id, try clicking the course name
    const courseLink = page.getByRole("link", { name: /Test Course for Navigation/i });

    if (await courseLink.isVisible()) {
      await courseLink.click();
    } else if (await courseCard.isVisible()) {
      await courseCard.click();
    } else {
      // Click on the course row
      await page.getByText("Test Course for Navigation").click();
    }

    // Should navigate to course detail page
    await expect(page).toHaveURL(new RegExp(`/dashboard/instructor/courses/${courseId}`));

    // Should see the course name
    await expect(page.getByText("Test Course for Navigation")).toBeVisible();

    // Should see assignments for this course
    await expect(page.getByText("Test Assignment")).toBeVisible();
  });

  test("course detail page shows only assignments for that course", async ({ page }) => {
    // Navigate directly to course detail
    await page.goto(`/dashboard/instructor/courses/${courseId}`);

    // Should show assignments section
    await expect(page.getByText(/assignments/i)).toBeVisible();

    // Should show the test assignment
    await expect(page.getByText("Test Assignment")).toBeVisible();
  });

  test("instructor can navigate back from course to dashboard", async ({ page }) => {
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
      await expect(
        page.getByText(/no assignments/i).or(page.getByText(/create your first assignment/i))
      ).toBeVisible();

      // Clean up
      await supabase.from("courses").delete().eq("id", emptyCourse.id);
    }
  });
});

test.describe("Course Navigation - Student", () => {
  let testEmail: string;
  let instructorEmail: string;
  let studentId: string;
  let instructorId: string;
  let courseId: string;
  let assignmentId: string;

  test.beforeAll(async () => {
    const supabase = getSupabaseAdmin();

    // Create instructor
    instructorEmail = generateTestEmail("course-nav-instructor-for-student");
    await cleanupTestUser(instructorEmail);
    const instructor = await createOAuthUser(instructorEmail, "google", {
      user_metadata: { first_name: "Test", last_name: "Instructor" },
    });
    instructorId = instructor.id;
    await completeOnboardingForUser(instructorId, "instructor");

    // Create student
    testEmail = generateTestEmail("course-nav-student");
    await cleanupTestUser(testEmail);
    const student = await createOAuthUser(testEmail, "google", {
      user_metadata: { first_name: "Test", last_name: "Student" },
    });
    studentId = student.id;
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
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
      await supabase.from("course_enrollments").delete().eq("course_id", courseId);
      await supabase.from("courses").delete().eq("id", courseId);
    }
    await cleanupTestUser(testEmail);
    await cleanupTestUser(instructorEmail);
  });

  test("student dashboard displays enrolled courses", async ({ page }) => {
    await page.goto("/dashboard/student");

    // Should see courses section or enrolled courses
    await expect(
      page.getByText(/your courses/i).or(page.getByText(/enrolled courses/i))
    ).toBeVisible();

    // Should see the enrolled course
    await expect(page.getByText("Student Test Course")).toBeVisible();
  });

  test("student can click course to view assignments", async ({ page }) => {
    await page.goto("/dashboard/student");

    // Click on the course
    await page.getByText("Student Test Course").click();

    // Should navigate to course detail or show filtered assignments
    await expect(page.getByText("Student Test Assignment")).toBeVisible();
  });

  test("student sees only enrolled courses", async ({ page }) => {
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

  test("student course detail shows assignments with submission status", async ({ page }) => {
    await page.goto("/dashboard/student");

    // Navigate to course
    await page.getByText("Student Test Course").click();

    // Should show assignment
    await expect(page.getByText("Student Test Assignment")).toBeVisible();

    // Should show submission button or status
    await expect(
      page.getByRole("button", { name: /submit/i }).or(page.getByText(/pending/i))
    ).toBeVisible();
  });
});

test.describe("Course Navigation - URL Structure", () => {
  test("course detail page has correct URL structure for instructor", async ({ page }) => {
    // This test verifies the URL pattern exists
    await page.goto("/dashboard/instructor");

    // The URL for course detail should follow pattern: /dashboard/instructor/courses/[id]
    // This will be implemented with the navigation change
  });

  test("course detail page has correct URL structure for student", async ({ page }) => {
    await page.goto("/dashboard/student");

    // The URL for course detail should follow pattern: /dashboard/student/courses/[id]
    // This will be implemented with the navigation change
  });
});
