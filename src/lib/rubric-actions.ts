"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "./user-utils";
import { revalidatePath } from "next/cache";
import { Rubric, RubricCriterion, RubricScores } from "./data-utils";

export async function createRubric(
  assignmentId: string,
  criteria: RubricCriterion[]
) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor") {
    return { success: false, error: "Only instructors can create rubrics" };
  }

  const supabase = await createClient();

  // Verify assignment belongs to instructor
  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("id, instructor_id, max_points")
    .eq("id", assignmentId)
    .eq("instructor_id", userProfile.id)
    .single();

  if (assignmentError || !assignment) {
    return { success: false, error: "Assignment not found or unauthorized" };
  }

  // Validate criteria total matches assignment max_points
  const totalPoints = criteria.reduce(
    (sum, criterion) => sum + criterion.max_points,
    0
  );
  if (totalPoints !== assignment.max_points) {
    return {
      success: false,
      error: `Rubric total (${totalPoints}) must equal assignment max points (${assignment.max_points})`,
    };
  }

  // Check if rubric already exists
  const { data: existingRubric } = await supabase
    .from("rubrics")
    .select("id")
    .eq("assignment_id", assignmentId)
    .single();

  if (existingRubric) {
    return {
      success: false,
      error: "Rubric already exists for this assignment",
    };
  }

  const { error } = await supabase.from("rubrics").insert({
    assignment_id: assignmentId,
    criteria,
    created_by: userProfile.id,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/instructor");
  return { success: true, error: null };
}

export async function updateRubric(
  rubricId: string,
  criteria: RubricCriterion[]
) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "instructor" && userProfile.role !== "ta") {
    return {
      success: false,
      error: "Only instructors and TAs can update rubrics",
    };
  }

  const supabase = await createClient();

  // Get rubric and assignment info
  const { data: rubric, error: rubricError } = await supabase
    .from("rubrics")
    .select(
      `
      id,
      assignment_id,
      assignment:assignment_id (
        id,
        instructor_id,
        max_points
      )
    `
    )
    .eq("id", rubricId)
    .single();

  if (rubricError || !rubric) {
    return { success: false, error: "Rubric not found" };
  }

  // Check permissions
  const assignment = rubric.assignment as any; // Type assertion for nested query result
  const isInstructor = assignment.instructor_id === userProfile.id;
  const isTA =
    userProfile.role === "ta" &&
    (await checkTAAssignment(rubric.assignment_id, userProfile.id));

  if (!isInstructor && !isTA) {
    return { success: false, error: "Unauthorized to update this rubric" };
  }

  // Validate criteria total matches assignment max_points
  const totalPoints = criteria.reduce(
    (sum, criterion) => sum + criterion.max_points,
    0
  );
  if (totalPoints !== assignment.max_points) {
    return {
      success: false,
      error: `Rubric total (${totalPoints}) must equal assignment max points (${assignment.max_points})`,
    };
  }

  const { error } = await supabase
    .from("rubrics")
    .update({
      criteria,
      updated_at: new Date().toISOString(),
    })
    .eq("id", rubricId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/instructor");
  revalidatePath("/dashboard/ta");
  return { success: true, error: null };
}

export async function getRubricByAssignment(assignmentId: string) {
  const userProfile = await requireAuth();

  if (
    userProfile.role !== "instructor" &&
    userProfile.role !== "ta" &&
    userProfile.role !== "student"
  ) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  const { data: rubric, error } = await supabase
    .from("rubrics")
    .select("*")
    .eq("assignment_id", assignmentId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { success: true, rubric: null }; // No rubric found
    }
    return { success: false, error: error.message };
  }

  return { success: true, rubric };
}

export async function saveRubricScores(
  submissionId: string,
  rubricId: string,
  scores: Record<string, number>,
  gradedBy: string,
  aiComments?: Record<string, string>
) {
  const userProfile = await requireAuth();

  if (userProfile.role !== "ta" && userProfile.role !== "instructor") {
    return {
      success: false,
      error: "Only TAs and instructors can grade submissions",
    };
  }

  const supabase = await createClient();

  // Get rubric to validate scores
  const { data: rubric, error: rubricError } = await supabase
    .from("rubrics")
    .select("criteria")
    .eq("id", rubricId)
    .single();

  if (rubricError || !rubric) {
    return { success: false, error: "Rubric not found" };
  }

  // Validate scores against rubric criteria
  const criteria = rubric.criteria as RubricCriterion[];
  const totalScore = Object.values(scores).reduce(
    (sum, score) => sum + score,
    0
  );

  for (const criterion of criteria) {
    const score = scores[criterion.id];
    if (score === undefined) {
      return {
        success: false,
        error: `Missing score for criterion: ${criterion.name}`,
      };
    }
    if (score < 0 || score > criterion.max_points) {
      return {
        success: false,
        error: `Score for ${criterion.name} must be between 0 and ${criterion.max_points}`,
      };
    }
  }

  // Check if rubric scores already exist
  const { data: existingScores } = await supabase
    .from("rubric_scores")
    .select("id")
    .eq("submission_id", submissionId)
    .single();

  if (existingScores) {
    // Update existing scores
    const updateData: any = {
      scores,
      total_score: totalScore,
      graded_by: gradedBy,
      graded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (aiComments) {
      updateData.ai_comments = aiComments;
    }

    const { error } = await supabase
      .from("rubric_scores")
      .update(updateData)
      .eq("id", existingScores.id);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    // Create new scores
    const insertData: any = {
      submission_id: submissionId,
      rubric_id: rubricId,
      scores,
      total_score: totalScore,
      graded_by: gradedBy,
      graded_at: new Date().toISOString(),
    };

    if (aiComments) {
      insertData.ai_comments = aiComments;
    }

    const { error } = await supabase.from("rubric_scores").insert(insertData);

    if (error) {
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/dashboard/ta");
  revalidatePath("/dashboard/instructor");
  revalidatePath("/dashboard/student");
  return { success: true, error: null };
}

export async function getRubricScores(submissionId: string) {
  const userProfile = await requireAuth();

  if (
    userProfile.role !== "ta" &&
    userProfile.role !== "instructor" &&
    userProfile.role !== "student"
  ) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  const { data: rubricScores, error } = await supabase
    .from("rubric_scores")
    .select(
      `
      *,
      rubric:rubric_id (
        id,
        criteria
      )
    `
    )
    .eq("submission_id", submissionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { success: true, rubricScores: null }; // No scores found
    }
    return { success: false, error: error.message };
  }

  return { success: true, rubricScores };
}

// Helper function to check if TA is assigned to course
async function checkTAAssignment(
  assignmentId: string,
  taId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("assignments")
    .select(
      `
      course_id,
      course_ta_assignments!inner(ta_id)
    `
    )
    .eq("id", assignmentId)
    .eq("course_ta_assignments.ta_id", taId)
    .single();

  return !!data;
}
