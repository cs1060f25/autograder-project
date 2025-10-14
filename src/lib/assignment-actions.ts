"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "./user-utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createRubric } from "./rubric-actions";
import { RubricCriterion } from "./data-utils";

export async function createAssignment(formData: FormData) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const assignmentData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    course_id: formData.get("course_id") as string,
    instructor_id: userProfile.id,
    due_date: formData.get("due_date") as string,
    max_points: parseInt(formData.get("max_points") as string),
    assignment_type: formData.get("assignment_type") as string,
    status: (formData.get("status") as string) || "draft",
    instructions: formData.get("instructions") as string,
  };

  const { error } = await supabase.from("assignments").insert(assignmentData);

  if (error) {
    redirect(
      `/dashboard/instructor?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/instructor");
  redirect("/dashboard/instructor?success=Assignment created successfully");
}

export async function updateAssignment(
  assignmentId: string,
  formData: FormData
) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const assignmentData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    course_id: formData.get("course_id") as string,
    due_date: formData.get("due_date") as string,
    max_points: parseInt(formData.get("max_points") as string),
    assignment_type: formData.get("assignment_type") as string,
    status: formData.get("status") as string,
    instructions: formData.get("instructions") as string,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("assignments")
    .update(assignmentData)
    .eq("id", assignmentId)
    .eq("instructor_id", userProfile.id);

  if (error) {
    redirect(
      `/dashboard/instructor?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/instructor");
  redirect("/dashboard/instructor?success=Assignment updated successfully");
}

export async function deleteAssignment(assignmentId: string) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", assignmentId)
    .eq("instructor_id", userProfile.id);

  if (error) {
    redirect(
      `/dashboard/instructor?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/instructor");
  redirect("/dashboard/instructor?success=Assignment deleted successfully");
}

export async function publishAssignment(assignmentId: string) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("assignments")
    .update({
      status: "published",
      updated_at: new Date().toISOString(),
    })
    .eq("id", assignmentId)
    .eq("instructor_id", userProfile.id);

  if (error) {
    redirect(
      `/dashboard/instructor?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/instructor");
  redirect("/dashboard/instructor?success=Assignment published successfully");
}

export async function closeAssignment(assignmentId: string) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("assignments")
    .update({
      status: "closed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", assignmentId)
    .eq("instructor_id", userProfile.id);

  if (error) {
    redirect(
      `/dashboard/instructor?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/instructor");
  redirect("/dashboard/instructor?success=Assignment closed successfully");
}

// New actions that return results instead of redirecting
export async function createAssignmentAction(formData: FormData) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  const assignmentData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    course_id: formData.get("course_id") as string,
    instructor_id: userProfile.id,
    due_date: formData.get("due_date") as string,
    max_points: parseInt(formData.get("max_points") as string),
    assignment_type: formData.get("assignment_type") as string,
    status: (formData.get("status") as string) || "draft",
    instructions: formData.get("instructions") as string,
  };

  const { data: assignment, error } = await supabase
    .from("assignments")
    .insert(assignmentData)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Handle rubric creation if provided
  const rubricData = formData.get("rubric_data") as string;
  if (rubricData) {
    try {
      const criteria: RubricCriterion[] = JSON.parse(rubricData);
      if (criteria.length > 0) {
        const rubricResult = await createRubric(assignment.id, criteria);
        if (!rubricResult.success) {
          // If rubric creation fails, we should still return success for assignment
          // but log the error
          console.error("Failed to create rubric:", rubricResult.error);
        }
      }
    } catch (error) {
      console.error("Failed to parse rubric data:", error);
    }
  }

  revalidatePath("/dashboard/instructor");
  return { success: true, error: null };
}

export async function updateAssignmentAction(
  assignmentId: string,
  formData: FormData
) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  const assignmentData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    course_id: formData.get("course_id") as string,
    due_date: formData.get("due_date") as string,
    max_points: parseInt(formData.get("max_points") as string),
    assignment_type: formData.get("assignment_type") as string,
    status: formData.get("status") as string,
    instructions: formData.get("instructions") as string,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("assignments")
    .update(assignmentData)
    .eq("id", assignmentId)
    .eq("instructor_id", userProfile.id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Handle rubric update if provided
  const rubricData = formData.get("rubric_data") as string;
  if (rubricData) {
    try {
      const criteria: RubricCriterion[] = JSON.parse(rubricData);

      // Check if rubric exists
      const { data: existingRubric } = await supabase
        .from("rubrics")
        .select("id")
        .eq("assignment_id", assignmentId)
        .single();

      if (existingRubric) {
        // Update existing rubric
        const { updateRubric } = await import("./rubric-actions");
        const rubricResult = await updateRubric(existingRubric.id, criteria);
        if (!rubricResult.success) {
          console.error("Failed to update rubric:", rubricResult.error);
        }
      } else if (criteria.length > 0) {
        // Create new rubric
        const rubricResult = await createRubric(assignmentId, criteria);
        if (!rubricResult.success) {
          console.error("Failed to create rubric:", rubricResult.error);
        }
      }
    } catch (error) {
      console.error("Failed to parse rubric data:", error);
    }
  }

  revalidatePath("/dashboard/instructor");
  return { success: true, error: null };
}
