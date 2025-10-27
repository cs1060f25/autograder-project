/**
 * Supabase RLS Integration Tests
 *
 * These tests verify that Row Level Security policies work correctly by
 * making actual requests with different user roles.
 */

import { createClient } from "@supabase/supabase-js";

// Configuration for test Supabase instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

// Only run tests if Supabase is configured
if (supabaseUrl) {
  describe("Supabase RLS Integration Tests", () => {
    let supabaseAdmin: any;
    let testInstructor: any;
    let testTA: any;
    let testStudent: any;
    let testCourse: any;
    let testAssignment: any;

    // Helper to create test users with specific roles
    async function createTestUser(
      role: "instructor" | "ta" | "student",
      email: string
    ) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Check if auth user already exists
      const { data: existingAuthUsers } =
        await adminClient.auth.admin.listUsers();
      const existingAuthUser = existingAuthUsers?.users.find(
        (u) => u.email === email
      );

      let authUser;
      if (existingAuthUser) {
        // Delete existing user and create new one
        await adminClient.from("users").delete().eq("id", existingAuthUser.id);
        await adminClient.auth.admin.deleteUser(existingAuthUser.id);
        const { data: newUser, error: authError } =
          await adminClient.auth.admin.createUser({
            email,
            password: "test-password-123",
            email_confirm: true,
          });
        if (authError) {
          throw authError;
        }
        authUser = newUser;
      } else {
        const { data: newUser, error: authError } =
          await adminClient.auth.admin.createUser({
            email,
            password: "test-password-123",
            email_confirm: true,
          });
        if (authError) {
          throw authError;
        }
        authUser = newUser;
      }

      // Check if user profile already exists
      const { data: existingProfile } = await adminClient
        .from("users")
        .select("id")
        .eq("id", authUser.user.id)
        .single();

      // Create user profile only if it doesn't exist
      if (!existingProfile) {
        const { error: profileError } = await adminClient.from("users").insert({
          id: authUser.user.id,
          email,
          first_name: "Test",
          last_name: role.charAt(0).toUpperCase() + role.slice(1),
          role,
          onboarding_completed: true,
        });

        if (profileError) {
          await adminClient.auth.admin.deleteUser(authUser.user.id);
          throw profileError;
        }
      }

      // Create authenticated client for this user
      const client = createClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
      );

      // Sign in to get session
      await client.auth.signInWithPassword({
        email,
        password: "test-password-123",
      });

      return {
        client,
        userId: authUser.user.id,
        email,
      };
    }

    beforeAll(async () => {
      // Create admin client for setup/teardown
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Clean up any existing test users (in case of previous failed runs)
      try {
        // Delete all users with test emails
        const testEmails = [
          "test-instructor-",
          "test-ta-",
          "test-student-",
          "test-student2-",
          "test-instructor2-",
        ];
        for (const prefix of testEmails) {
          const { data: existingUsers } = await supabaseAdmin
            .from("users")
            .select("id, email")
            .like("email", `${prefix}%@example.com`);

          if (existingUsers && existingUsers.length > 0) {
            for (const user of existingUsers) {
              await supabaseAdmin.from("users").delete().eq("id", user.id);
              await supabaseAdmin.auth.admin
                .deleteUser(user.id)
                .catch(() => {});
            }
          }
        }
      } catch (error) {
        // Ignore cleanup errors
      }

      // Create test users
      testInstructor = await createTestUser(
        "instructor",
        `test-instructor-${Date.now()}@example.com`
      );
      testTA = await createTestUser("ta", `test-ta-${Date.now()}@example.com`);
      testStudent = await createTestUser(
        "student",
        `test-student-${Date.now()}@example.com`
      );
    });

    afterAll(async () => {
      // Cleanup test course and related data
      if (testCourse?.id) {
        await supabaseAdmin.from("courses").delete().eq("id", testCourse.id);
      }

      // Cleanup test users (must delete profile first due to foreign key constraints)
      if (testInstructor?.userId) {
        await supabaseAdmin
          .from("users")
          .delete()
          .eq("id", testInstructor.userId);
        await supabaseAdmin.auth.admin.deleteUser(testInstructor.userId);
      }
      if (testTA?.userId) {
        await supabaseAdmin.from("users").delete().eq("id", testTA.userId);
        await supabaseAdmin.auth.admin.deleteUser(testTA.userId);
      }
      if (testStudent?.userId) {
        await supabaseAdmin.from("users").delete().eq("id", testStudent.userId);
        await supabaseAdmin.auth.admin.deleteUser(testStudent.userId);
      }
    });

    describe("Course Access Control", () => {
      it("should allow students to read courses they are enrolled in", async () => {
        if (!testCourse) return;

        // Enroll student in course (using admin to bypass RLS for setup)
        await supabaseAdmin.from("course_enrollments").insert({
          course_id: testCourse.id,
          student_id: testStudent.userId,
        });

        // Student should be able to read the course
        const { data, error } = await testStudent.client
          .from("courses")
          .select("*")
          .eq("id", testCourse.id);

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
      });

      it("should NOT allow TA to update course they are not assigned to", async () => {
        if (!testCourse) return;

        const { error } = await testTA.client
          .from("courses")
          .update({ description: "Hacked" })
          .eq("id", testCourse.id);

        expect(error).toBeTruthy();
        expect(error?.message).toMatch(/permission|policy|denied/i);
      });
    });

    describe("Assignment Access Control", () => {
      it("should allow instructor to create assignments", async () => {
        if (!testCourse) return;

        const { data: assignment, error } = await testInstructor.client
          .from("assignments")
          .insert({
            title: "Test Assignment",
            course_id: testCourse.id,
            instructor_id: testInstructor.userId,
            due_date: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            max_points: 100,
            assignment_type: "homework",
            status: "published",
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(assignment).toBeTruthy();
        testAssignment = assignment;
      });

      it("should allow enrolled students to read published assignments", async () => {
        if (!testAssignment) return;

        const { data, error } = await testStudent.client
          .from("assignments")
          .select("*")
          .eq("id", testAssignment.id);

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data[0].status).toBe("published");
      });

      it("should NOT allow students to create assignments", async () => {
        if (!testCourse) return;

        const { error } = await testStudent.client.from("assignments").insert({
          title: "Unauthorized Assignment",
          course_id: testCourse.id,
          instructor_id: testStudent.userId,
          due_date: new Date().toISOString(),
          max_points: 100,
          assignment_type: "homework",
          status: "published",
        });

        expect(error).toBeTruthy();
        expect(error?.message).toMatch(/permission|policy|denied/i);
      });
    });

    describe("Submission Access Control", () => {
      it("should allow students to create their own submissions", async () => {
        if (!testAssignment) return;

        const { data: submission, error } = await testStudent.client
          .from("submissions")
          .insert({
            assignment_id: testAssignment.id,
            student_id: testStudent.userId,
            content: "My submission content",
            status: "draft",
            attachments: [],
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(submission).toBeTruthy();
        expect(submission.student_id).toBe(testStudent.userId);
      });

      it("should NOT allow students to read other students' submissions", async () => {
        if (!testAssignment) return;

        // Create another student and their submission
        const otherStudent = await createTestUser(
          "student",
          `test-student2-${Date.now()}@example.com`
        );

        const { data: otherSubmission } = await otherStudent.client
          .from("submissions")
          .insert({
            assignment_id: testAssignment.id,
            student_id: otherStudent.userId,
            content: "Other student's submission",
            status: "submitted",
            attachments: [],
          })
          .select()
          .single();

        // First student should NOT be able to read other student's submission
        const { data, error } = await testStudent.client
          .from("submissions")
          .select("*")
          .eq("id", otherSubmission.id);

        // Should either return empty or error
        expect(data).toEqual([]);

        // Cleanup
        await supabaseAdmin
          .from("users")
          .delete()
          .eq("id", otherStudent.userId);
        await supabaseAdmin.auth.admin.deleteUser(otherStudent.userId);
      });

      it("should allow TAs to read submissions for assigned courses", async () => {
        if (!testCourse || !testAssignment) return;

        // Assign TA to course
        await supabaseAdmin.from("course_ta_assignments").insert({
          course_id: testCourse.id,
          ta_id: testTA.userId,
        });

        // Create a submission
        const { data: submission } = await testStudent.client
          .from("submissions")
          .insert({
            assignment_id: testAssignment.id,
            student_id: testStudent.userId,
            content: "TA should see this",
            status: "submitted",
            attachments: [],
          })
          .select()
          .single();

        // TA should be able to read submissions for assigned courses
        const { data, error } = await testTA.client
          .from("submissions")
          .select("*")
          .eq("id", submission.id);

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
      });

      it("should NOT allow TAs to read submissions for unassigned courses", async () => {
        // Create another instructor and course
        const instructor2 = await createTestUser(
          "instructor",
          `test-instructor2-${Date.now()}@example.com`
        );

        const { data: course2 } = await instructor2.client
          .from("courses")
          .insert({
            name: "Test Course 2",
            code: "TEST102",
            instructor_id: instructor2.userId,
          })
          .select()
          .single();

        const { data: assignment2 } = await instructor2.client
          .from("assignments")
          .insert({
            title: "Test Assignment 2",
            course_id: course2.id,
            instructor_id: instructor2.userId,
            due_date: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            max_points: 100,
            assignment_type: "homework",
            status: "published",
          })
          .select()
          .single();

        // TA should NOT see submissions from this course
        const { data, error } = await testTA.client
          .from("submissions")
          .select("*")
          .eq("assignment_id", assignment2.id);

        // Should return empty or error
        expect(data).toEqual([]);

        // Cleanup
        await supabaseAdmin.from("courses").delete().eq("id", course2.id);
        await supabaseAdmin.from("users").delete().eq("id", instructor2.userId);
        await supabaseAdmin.auth.admin.deleteUser(instructor2.userId);
      });
    });

    describe("Role Isolation", () => {
      it("should ensure users cannot access other users' profiles", async () => {
        const { data, error } = await testStudent.client
          .from("users")
          .select("*")
          .eq("id", testInstructor.userId);
        expect(data).toEqual([]);
      });
    });
  });
}
