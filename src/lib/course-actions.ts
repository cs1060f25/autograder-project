"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "./user-utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createCourse(formData: FormData) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const courseData = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    description: formData.get("description") as string,
    semester: formData.get("semester") as string,
    year: parseInt(formData.get("year") as string),
    instructor_id: userProfile.id,
  };

  const { error } = await supabase.from("courses").insert(courseData);

  if (error) {
    redirect(
      `/dashboard/instructor?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/instructor");
  redirect("/dashboard/instructor?success=Course created successfully");
}

export async function updateCourse(courseId: string, formData: FormData) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const courseData = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    description: formData.get("description") as string,
    semester: formData.get("semester") as string,
    year: parseInt(formData.get("year") as string),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("courses")
    .update(courseData)
    .eq("id", courseId)
    .eq("instructor_id", userProfile.id);

  if (error) {
    redirect(
      `/dashboard/instructor?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/instructor");
  redirect("/dashboard/instructor?success=Course updated successfully");
}

export async function deleteCourse(courseId: string) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .eq("instructor_id", userProfile.id);

  if (error) {
    redirect(
      `/dashboard/instructor?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/instructor");
  redirect("/dashboard/instructor?success=Course deleted successfully");
}

export async function enrollStudent(courseId: string, studentEmail: string) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  // First, get the student's user ID by email
  const { data: student } = await supabase
    .from("users")
    .select("id")
    .eq("email", studentEmail)
    .eq("role", "student")
    .single();

  if (!student) {
    redirect(
      `/dashboard/instructor?error=Student with email ${studentEmail} not found`
    );
  }

  // Check if course belongs to instructor
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("instructor_id", userProfile.id)
    .single();

  if (!course) {
    redirect(`/dashboard/instructor?error=Course not found or access denied`);
  }

  // Enroll student
  const { error } = await supabase.from("course_enrollments").insert({
    course_id: courseId,
    student_id: student.id,
  });

  if (error) {
    redirect(
      `/dashboard/instructor?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/instructor");
  redirect("/dashboard/instructor?success=Student enrolled successfully");
}

export async function assignTA(courseId: string, taEmail: string) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  // First, get the TA's user ID by email
  const { data: ta } = await supabase
    .from("users")
    .select("id")
    .eq("email", taEmail)
    .eq("role", "ta")
    .single();

  if (!ta) {
    redirect(`/dashboard/instructor?error=TA with email ${taEmail} not found`);
  }

  // Check if course belongs to instructor
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("instructor_id", userProfile.id)
    .single();

  if (!course) {
    redirect(`/dashboard/instructor?error=Course not found or access denied`);
  }

  // Assign TA
  const { error } = await supabase.from("course_ta_assignments").insert({
    course_id: courseId,
    ta_id: ta.id,
  });

  if (error) {
    redirect(
      `/dashboard/instructor?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/instructor");
  redirect("/dashboard/instructor?success=TA assigned successfully");
}

// New actions that return results instead of redirecting
export async function createCourseAction(formData: FormData) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  const courseData = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    description: formData.get("description") as string,
    semester: formData.get("semester") as string,
    year: parseInt(formData.get("year") as string),
    instructor_id: userProfile.id,
  };

  const { error } = await supabase.from("courses").insert(courseData);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/instructor");
  return { success: true, error: null };
}

export async function updateCourseAction(courseId: string, formData: FormData) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  const courseData = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    description: formData.get("description") as string,
    semester: formData.get("semester") as string,
    year: parseInt(formData.get("year") as string),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("courses")
    .update(courseData)
    .eq("id", courseId)
    .eq("instructor_id", userProfile.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/instructor");
  return { success: true, error: null };
}

// New enrollment actions that return results instead of redirecting
export async function enrollStudentAction(
  courseId: string,
  studentEmail: string
) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // First, get the student's user ID by email
  const { data: student } = await supabase
    .from("users")
    .select("id, email, first_name, last_name")
    .eq("email", studentEmail)
    .eq("role", "student")
    .single();

  if (!student) {
    return {
      success: false,
      error: `Student with email ${studentEmail} not found`,
    };
  }

  // Check if course belongs to instructor
  const { data: course } = await supabase
    .from("courses")
    .select("id, name")
    .eq("id", courseId)
    .eq("instructor_id", userProfile.id)
    .single();

  if (!course) {
    return { success: false, error: "Course not found or access denied" };
  }

  // Check if student is already enrolled
  const { data: existingEnrollment } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("student_id", student.id)
    .single();

  if (existingEnrollment) {
    return {
      success: false,
      error: "Student is already enrolled in this course",
    };
  }

  // Enroll student
  const { error } = await supabase.from("course_enrollments").insert({
    course_id: courseId,
    student_id: student.id,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/instructor");
  return { success: true, error: null, student: student };
}

export async function assignTAAction(courseId: string, taEmail: string) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // First, get the TA's user ID by email
  const { data: ta } = await supabase
    .from("users")
    .select("id, email, first_name, last_name")
    .eq("email", taEmail)
    .eq("role", "ta")
    .single();

  if (!ta) {
    return { success: false, error: `TA with email ${taEmail} not found` };
  }

  // Check if course belongs to instructor
  const { data: course } = await supabase
    .from("courses")
    .select("id, name")
    .eq("id", courseId)
    .eq("instructor_id", userProfile.id)
    .single();

  if (!course) {
    return { success: false, error: "Course not found or access denied" };
  }

  // Check if TA is already assigned
  const { data: existingAssignment } = await supabase
    .from("course_ta_assignments")
    .select("id")
    .eq("course_id", courseId)
    .eq("ta_id", ta.id)
    .single();

  if (existingAssignment) {
    return { success: false, error: "TA is already assigned to this course" };
  }

  // Assign TA
  const { error } = await supabase.from("course_ta_assignments").insert({
    course_id: courseId,
    ta_id: ta.id,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/instructor");
  return { success: true, error: null, ta: ta };
}

// Helper function for instructors to search users (useful for future features)
export async function searchUsersAction(searchTerm: string, role?: string) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  let query = supabase
    .from("users")
    .select("id, email, first_name, last_name, role, created_at")
    .or(
      `email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`
    )
    .order("created_at", { ascending: false });

  if (role) {
    query = query.eq("role", role);
  }

  const { data: users, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null, users: users || [] };
}

// Get enrolled students for a course
export async function getEnrolledStudentsAction(courseId: string) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Check if course belongs to instructor
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("instructor_id", userProfile.id)
    .single();

  if (!course) {
    return { success: false, error: "Course not found or access denied" };
  }

  // First, get all enrollments for the course
  // Note: If status column doesn't exist in your database, we'll get all enrollments
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("course_enrollments")
    .select("id, enrolled_at, student_id")
    .eq("course_id", courseId)
    .order("enrolled_at", { ascending: false });

  if (enrollmentsError) {
    console.error("Error fetching enrollments:", enrollmentsError);
    return { success: false, error: enrollmentsError.message };
  }

  console.log(
    `Found ${enrollments?.length || 0} enrollments for course ${courseId}`
  );

  if (!enrollments || enrollments.length === 0) {
    return { success: true, error: null, students: [] };
  }

  // Extract student IDs
  const studentIds = enrollments.map((e) => e.student_id);

  if (studentIds.length === 0) {
    return { success: true, error: null, students: [] };
  }

  console.log(`Fetching user details for ${studentIds.length} student IDs`);

  // Fetch user details for all enrolled students
  // Instructors have permission to view all users per RLS policy
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email, first_name, last_name, role")
    .in("id", studentIds);

  if (usersError) {
    console.error("Error fetching users:", usersError);
    return { success: false, error: usersError.message };
  }

  if (!users || users.length === 0) {
    console.warn(
      `No users found for student IDs: ${studentIds.join(
        ", "
      )}. Enrollment count: ${enrollments.length}`
    );
    return { success: true, error: null, students: [] };
  }

  console.log(`Fetched ${users.length} users from database`);

  // Filter to only students and create a map of user ID to user data for efficient lookup
  const studentUsers = users.filter((u) => u.role === "student");
  console.log(`Filtered to ${studentUsers.length} students`);
  const usersMap = new Map(studentUsers.map((u) => [u.id, u]));

  // Combine enrollment and user data
  const students = enrollments
    .map((e) => {
      const user = usersMap.get(e.student_id);
      if (!user) {
        console.warn(
          `User not found for enrollment ${e.id}, student_id: ${e.student_id}`
        );
        return null;
      }
      return {
        enrollmentId: e.id,
        enrolledAt: e.enrolled_at,
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      };
    })
    .filter((s) => s !== null) as Array<{
    enrollmentId: string;
    enrolledAt: string;
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  }>;

  console.log(`Returning ${students.length} students`);

  return {
    success: true,
    error: null,
    students,
  };
}

// Get assigned TAs for a course
export async function getAssignedTAsAction(courseId: string) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Check if course belongs to instructor
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("instructor_id", userProfile.id)
    .single();

  if (!course) {
    return { success: false, error: "Course not found or access denied" };
  }

  // First, get all TA assignments for the course
  const { data: assignments, error: assignmentsError } = await supabase
    .from("course_ta_assignments")
    .select("id, assigned_at, ta_id")
    .eq("course_id", courseId)
    .order("assigned_at", { ascending: false });

  if (assignmentsError) {
    return { success: false, error: assignmentsError.message };
  }

  if (!assignments || assignments.length === 0) {
    return { success: true, error: null, tas: [] };
  }

  // Extract TA IDs
  const taIds = assignments.map((a) => a.ta_id);

  // Fetch user details for all assigned TAs
  // Instructors have permission to view all users, so this should work
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email, first_name, last_name")
    .in("id", taIds);

  if (usersError) {
    return { success: false, error: usersError.message };
  }

  // Create a map of user ID to user data for efficient lookup
  const usersMap = new Map(users?.map((u) => [u.id, u]) || []);

  // Combine assignment and user data
  const tas = assignments
    .map((a) => {
      const user = usersMap.get(a.ta_id);
      if (!user) return null;
      return {
        assignmentId: a.id,
        assignedAt: a.assigned_at,
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      };
    })
    .filter((t) => t !== null) as Array<{
    assignmentId: string;
    assignedAt: string;
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  }>;

  return {
    success: true,
    error: null,
    tas,
  };
}

// Remove student enrollment
export async function removeStudentAction(
  courseId: string,
  enrollmentId: string
) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Check if course belongs to instructor
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("instructor_id", userProfile.id)
    .single();

  if (!course) {
    return { success: false, error: "Course not found or access denied" };
  }

  // Verify the enrollment belongs to this course
  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id, course_id")
    .eq("id", enrollmentId)
    .eq("course_id", courseId)
    .single();

  if (!enrollment) {
    return { success: false, error: "Enrollment not found" };
  }

  // Delete the enrollment
  const { error } = await supabase
    .from("course_enrollments")
    .delete()
    .eq("id", enrollmentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/instructor");
  return { success: true, error: null };
}

// Remove TA assignment
export async function removeTAAction(courseId: string, assignmentId: string) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Check if course belongs to instructor
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("instructor_id", userProfile.id)
    .single();

  if (!course) {
    return { success: false, error: "Course not found or access denied" };
  }

  // Verify the assignment belongs to this course
  const { data: assignment } = await supabase
    .from("course_ta_assignments")
    .select("id, course_id")
    .eq("id", assignmentId)
    .eq("course_id", courseId)
    .single();

  if (!assignment) {
    return { success: false, error: "TA assignment not found" };
  }

  // Delete the assignment
  const { error } = await supabase
    .from("course_ta_assignments")
    .delete()
    .eq("id", assignmentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/instructor");
  return { success: true, error: null };
}
