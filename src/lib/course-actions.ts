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
