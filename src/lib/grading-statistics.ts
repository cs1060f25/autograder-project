/**
 * Grading Statistics Utilities
 * 
 * Provides statistical analysis of grading results for assignments.
 */

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "./user-utils";

export interface GradingStatistics {
  assignmentId: string;
  totalSubmissions: number;
  gradedSubmissions: number;
  averageScore: number;
  medianScore: number;
  minScore: number;
  maxScore: number;
  scoreDistribution: {
    range: string;
    count: number;
  }[];
}

interface Submission {
  id: string;
  grade: number | null;
  status: string;
}

/**
 * Calculate statistics from a list of submissions (pure function for testability)
 * @internal
 */
export function computeStatistics(
  assignmentId: string,
  submissions: Submission[]
): GradingStatistics {
  const totalSubmissions = submissions.length;

  if (totalSubmissions === 0) {
    return {
      assignmentId,
      totalSubmissions: 0,
      gradedSubmissions: 0,
      averageScore: 0,
      medianScore: 0,
      minScore: 0,
      maxScore: 0,
      scoreDistribution: [],
    };
  }

  // Filter only graded submissions
  const gradedSubmissions = submissions.filter(
    (s) => s.status === "graded" && s.grade !== null
  );

  const gradedCount = gradedSubmissions.length;

  if (gradedCount === 0) {
    return {
      assignmentId,
      totalSubmissions,
      gradedSubmissions: 0,
      averageScore: 0,
      medianScore: 0,
      minScore: 0,
      maxScore: 0,
      scoreDistribution: [],
    };
  }

  // Extract scores
  const scores = gradedSubmissions.map((s) => s.grade as number);

  // Calculate average
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / gradedCount;

  // Calculate median
  const sortedScores = [...scores].sort((a, b) => a - b);
  const medianScore =
    gradedCount % 2 === 0
      ? (sortedScores[gradedCount / 2 - 1] + sortedScores[gradedCount / 2]) / 2
      : sortedScores[Math.floor(gradedCount / 2)];

  // Calculate min and max
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  // Calculate score distribution (in 10-point ranges)
  const distribution = [
    { range: "0-59", count: 0 },
    { range: "60-69", count: 0 },
    { range: "70-79", count: 0 },
    { range: "80-89", count: 0 },
    { range: "90-100", count: 0 },
  ];

  scores.forEach((score) => {
    if (score < 60) distribution[0].count++;
    else if (score < 70) distribution[1].count++;
    else if (score < 80) distribution[2].count++;
    else if (score < 90) distribution[3].count++;
    else distribution[4].count++;
  });

  return {
    assignmentId,
    totalSubmissions,
    gradedSubmissions: gradedCount,
    averageScore: Math.round(averageScore * 100) / 100, // Round to 2 decimals
    medianScore: Math.round(medianScore * 100) / 100,
    minScore,
    maxScore,
    scoreDistribution: distribution,
  };
}

/**
 * Calculate grading statistics for an assignment
 * 
 * @param assignmentId - The assignment ID to calculate statistics for
 * @returns Statistics object with average, median, min, max, and distribution
 */
export async function calculateGradingStatistics(
  assignmentId: string
): Promise<{ success: boolean; statistics?: GradingStatistics; error?: string }> {
  const userProfile = await requireAuth();

  // Only instructors and TAs can view statistics
  if (userProfile.role !== "instructor" && userProfile.role !== "ta") {
    return { success: false, error: "Unauthorized: Only instructors and TAs can view statistics" };
  }

  const supabase = await createClient();

  try {
    // Get all submissions for this assignment
    const { data: submissions, error } = await supabase
      .from("submissions")
      .select("id, grade, status")
      .eq("assignment_id", assignmentId);

    if (error) {
      return { success: false, error: error.message };
    }

    const statistics = computeStatistics(assignmentId, submissions || []);

    return {
      success: true,
      statistics,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to calculate statistics",
    };
  }
}

