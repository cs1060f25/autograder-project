"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "./user-utils";
import { RubricCriterion } from "./data-utils";

export interface AIGradeData {
  totalAwarded: number;
  totalPossible: number;
  items: Array<{
    id: string;
    label: string;
    maxPoints: number;
    points: number;
    comments: string;
  }>;
  overallFeedback: string;
}

export interface AIGradingStatus {
  status: "pending" | "completed" | "failed" | "regenerated";
  ai_grade_data?: AIGradeData;
  ai_graded_at?: string;
  error?: string;
}

export async function triggerAIGrading(submissionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const userProfile = await requireAuth();

  if (
    userProfile.role !== "student" &&
    userProfile.role !== "ta" &&
    userProfile.role !== "instructor"
  ) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  try {
    // Get submission details
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select(
        `
        id,
        assignment_id,
        attachments,
        assignment:assignment_id (
          id,
          title
        )
      `
      )
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return { success: false, error: "Submission not found" };
    }

    // Get assignment details
    const assignment = Array.isArray(submission.assignment)
      ? submission.assignment[0]
      : submission.assignment;

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    // Get rubric for this assignment
    const { data: rubric, error: rubricError } = await supabase
      .from("rubrics")
      .select("id, criteria")
      .eq("assignment_id", assignment.id)
      .single();

    if (rubricError || !rubric) {
      console.log(
        "No rubric found for assignment:",
        assignment.id,
        rubricError
      );
      return { success: false, error: "No rubric found for this assignment" };
    }

    // Check if submission has PDF attachments
    if (!submission.attachments || submission.attachments.length === 0) {
      return { success: false, error: "No PDF attachments found" };
    }

    // Update submission status to indicate AI grading is pending
    await supabase
      .from("submissions")
      .update({
        ai_grade_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    // Transform rubric criteria to API format
    const rubricCriteria = rubric.criteria as RubricCriterion[];

    if (!rubricCriteria || !Array.isArray(rubricCriteria)) {
      console.log("Invalid rubric criteria:", rubricCriteria);
      return { success: false, error: "Invalid rubric criteria format" };
    }

    const apiRubric = rubricCriteria.map((criterion) => ({
      id: criterion.id,
      label: criterion.name,
      maxPoints: criterion.max_points,
      guidance: criterion.description,
    }));

    // Process each PDF attachment by fetching the file and passing as File object
    for (const attachment of submission.attachments) {
      if (attachment.type === "application/pdf") {
        try {
          // Fetch the PDF file from the URL
          const fileResponse = await fetch(attachment.url);
          if (!fileResponse.ok) {
            throw new Error(
              `Failed to fetch PDF file: ${fileResponse.statusText}`
            );
          }

          const fileBuffer = await fileResponse.arrayBuffer();
          const pdfFile = new File(
            [fileBuffer],
            attachment.name || "submission.pdf",
            {
              type: "application/pdf",
            }
          );

          // Prepare request
          const formData = new FormData();
          formData.append("file", pdfFile); // pass File object
          formData.append("rubric", JSON.stringify(apiRubric));

          const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/grade`;
          const response = await fetch(apiUrl, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const responseText = await response.text();
            console.error("API error response:", responseText);
            try {
              const errorData = JSON.parse(responseText);
              throw new Error(errorData.error || "AI grading failed");
            } catch (parseError) {
              throw new Error(
                `AI grading failed: ${response.status} ${response.statusText}`
              );
            }
          }

          const responseText = await response.text();
          let aiGradeData: AIGradeData;
          try {
            aiGradeData = JSON.parse(responseText);
          } catch (parseError) {
            console.error("Failed to parse API response as JSON:", parseError);
            console.error("Response text:", responseText);
            throw new Error("Invalid response from AI grading API");
          }

          // Store AI grading results
          await supabase
            .from("submissions")
            .update({
              ai_grade_data: aiGradeData,
              ai_grade_status: "completed",
              ai_graded_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", submissionId);

          // Save AI comments to rubric_scores if they exist
          await saveAIGradeComments(submissionId, rubric.id, aiGradeData);
          return { success: true };
        } catch (error) {
          console.error("AI grading error:", error);
          // Update status to failed
          await supabase
            .from("submissions")
            .update({
              ai_grade_status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", submissionId);

          return {
            success: false,
            error: error instanceof Error ? error.message : "AI grading failed",
          };
        }
      }
    }

    return { success: false, error: "No valid PDF files found" };
  } catch (error) {
    console.error("AI grading error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI grading failed",
    };
  }
}

export async function regenerateAIGrade(submissionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const userProfile = await requireAuth();

  if (userProfile.role !== "ta" && userProfile.role !== "instructor") {
    return {
      success: false,
      error: "Only TAs and instructors can regenerate AI grades",
    };
  }

  // Update status to indicate regeneration
  const supabase = await createClient();
  await supabase
    .from("submissions")
    .update({
      ai_grade_status: "regenerated",
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  // Trigger AI grading again
  return await triggerAIGrading(submissionId);
}

export async function getAIGradingStatus(submissionId: string): Promise<{
  success: boolean;
  status?: AIGradingStatus;
  error?: string;
}> {
  const userProfile = await requireAuth();

  if (
    userProfile.role !== "ta" &&
    userProfile.role !== "instructor" &&
    userProfile.role !== "student"
  ) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  try {
    const { data: submission, error } = await supabase
      .from("submissions")
      .select("ai_grade_data, ai_grade_status, ai_graded_at")
      .eq("id", submissionId)
      .single();

    if (error || !submission) {
      return { success: false, error: "Submission not found" };
    }

    return {
      success: true,
      status: {
        status: submission.ai_grade_status || "pending",
        ai_grade_data: submission.ai_grade_data,
        ai_graded_at: submission.ai_graded_at,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get AI grading status",
    };
  }
}

async function saveAIGradeComments(
  submissionId: string,
  rubricId: string,
  aiGradeData: AIGradeData
): Promise<void> {
  const supabase = await createClient();

  // Create AI comments mapping
  const aiComments: Record<string, string> = {};
  aiGradeData.items.forEach((item) => {
    aiComments[item.id] = item.comments;
  });

  // Check if rubric scores already exist
  const { data: existingScores } = await supabase
    .from("rubric_scores")
    .select("id")
    .eq("submission_id", submissionId)
    .single();

  if (existingScores) {
    // Update existing scores with AI comments
    await supabase
      .from("rubric_scores")
      .update({
        ai_comments: aiComments,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingScores.id);
  } else {
    // Create new rubric scores entry with AI comments
    await supabase.from("rubric_scores").insert({
      submission_id: submissionId,
      rubric_id: rubricId,
      scores: {}, // Will be filled when TA manually grades
      total_score: 0,
      ai_comments: aiComments,
      graded_by: null, // AI generated
      graded_at: new Date().toISOString(),
    });
  }
}
