/**
 * Autograder Orchestration Service
 * 
 * Core service that orchestrates the complete autograding pipeline:
 * 1. Document retrieval and validation
 * 2. Rubric fetching
 * 3. Grading coordination with AI service
 * 4. Result storage and status management
 * 
 * This service connects document management, grading, and storage.
 */

import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { GradingService } from "@/services/grading";
import { OpenAIGradingProvider } from "@/services/grading/providers/OpenAIGradingProvider";
import { MockGradingProvider } from "@/services/grading/providers/MockGradingProvider";
import type { RubricItem, GradeResult } from "@/services/grading/types";
import type {
  AutogradeRequest,
  AutogradeResult,
  AutograderConfig,
  BatchAutogradeRequest,
  BatchAutogradeResult,
  RubricCriterion,
  SubmissionDocument,
  AutogradeStatus,
} from "./types";

export class AutograderService {
  private gradingService: GradingService;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config?: AutograderConfig) {
    this.maxRetries = config?.maxRetries ?? 3;
    this.retryDelay = config?.retryDelay ?? 1000;

    // Initialize grading service with appropriate provider
    const useMock = config?.useMockGrading ?? process.env.USE_MOCK_GRADING === "true";
    const provider = useMock
      ? new MockGradingProvider()
      : new OpenAIGradingProvider({
          apiKey: process.env.OPENAI_KEY,
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        });

    this.gradingService = new GradingService({
      provider,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
    });
  }

  /**
   * Autograde a single submission
   * Orchestrates the full pipeline: fetch rubric → validate documents → grade → store results
   */
  async autograde(request: AutogradeRequest): Promise<AutogradeResult> {
    const startTime = Date.now();
    
    try {
      // Update status to processing
      await this.updateSubmissionStatus(request.submissionId, "processing");

      // Step 1: Fetch rubric for the assignment
      const rubric = await this.fetchRubric(request.assignmentId);
      if (!rubric) {
        const result: AutogradeResult = {
          submissionId: request.submissionId,
          status: "no_rubric",
          error: "No rubric found for this assignment",
          gradedAt: new Date().toISOString(),
        };
        await this.updateSubmissionStatus(request.submissionId, "no_rubric");
        return result;
      }

      // Step 2: Validate documents
      const pdfDocuments = this.validateDocuments(request.documents);
      if (pdfDocuments.length === 0) {
        const result: AutogradeResult = {
          submissionId: request.submissionId,
          status: "no_documents",
          error: "No valid PDF documents found",
          gradedAt: new Date().toISOString(),
        };
        await this.updateSubmissionStatus(request.submissionId, "no_documents");
        return result;
      }

      // Step 3: Grade the first PDF document (support for multiple docs can be added later)
      const document = pdfDocuments[0];
      const gradeResult = await this.gradeDocument(document, rubric.criteria);

      // Step 4: Store results in database
      await this.storeResults(request.submissionId, rubric.id, gradeResult);

      // Step 5: Update submission status to completed
      await this.updateSubmissionStatus(request.submissionId, "completed");

      const result: AutogradeResult = {
        submissionId: request.submissionId,
        status: "completed",
        totalAwarded: gradeResult.totalAwarded,
        totalPossible: gradeResult.totalPossible,
        items: gradeResult.items,
        overallFeedback: gradeResult.overallFeedback,
        gradedAt: new Date().toISOString(),
      };

      const duration = Date.now() - startTime;
      console.log(`Autograding completed for submission ${request.submissionId} in ${duration}ms`);

      return result;
    } catch (error) {
      console.error("Autograding failed:", error);
      
      await this.updateSubmissionStatus(request.submissionId, "failed");

      const result: AutogradeResult = {
        submissionId: request.submissionId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        gradedAt: new Date().toISOString(),
      };

      return result;
    }
  }

  /**
   * Autograde multiple submissions in batch
   * Can process in parallel or sequentially
   */
  async autogradeBatch(request: BatchAutogradeRequest): Promise<BatchAutogradeResult> {
    const parallel = request.parallel ?? true;

    let results: AutogradeResult[];

    if (parallel) {
      // Process all submissions in parallel
      results = await Promise.all(
        request.requests.map((req) => this.autograde(req))
      );
    } else {
      // Process sequentially
      results = [];
      for (const req of request.requests) {
        const result = await this.autograde(req);
        results.push(result);
      }
    }

    // Calculate summary statistics
    const summary = {
      total: results.length,
      completed: results.filter((r) => r.status === "completed").length,
      failed: results.filter((r) => r.status === "failed").length,
      noRubric: results.filter((r) => r.status === "no_rubric").length,
      noDocuments: results.filter((r) => r.status === "no_documents").length,
    };

    return { results, summary };
  }

  /**
   * Get the status of an autograding job
   */
  async getStatus(submissionId: string): Promise<{
    status: AutogradeStatus;
    result?: AutogradeResult;
  }> {
    try {
      const supabase = await createSupabaseClient();
      
      const { data: submission, error } = await supabase
        .from("submissions")
        .select("ai_grade_status, ai_grade_data, ai_graded_at")
        .eq("id", submissionId)
        .single();

      if (error || !submission) {
        throw new Error("Submission not found");
      }

      const status = (submission.ai_grade_status || "pending") as AutogradeStatus;

      let result: AutogradeResult | undefined;
      if (submission.ai_grade_data) {
        result = {
          submissionId,
          status: "completed",
          totalAwarded: submission.ai_grade_data.totalAwarded,
          totalPossible: submission.ai_grade_data.totalPossible,
          items: submission.ai_grade_data.items,
          overallFeedback: submission.ai_grade_data.overallFeedback,
          gradedAt: submission.ai_graded_at || new Date().toISOString(),
        };
      }

      return { status, result };
    } catch (error) {
      console.error("Failed to get status:", error);
      return { status: "failed" };
    }
  }

  /**
   * Check if the service is ready to grade submissions
   */
  async isReady(): Promise<boolean> {
    return await this.gradingService.isReady();
  }

  /**
   * Private helper: Fetch rubric from database
   */
  private async fetchRubric(assignmentId: string): Promise<{
    id: string;
    criteria: RubricCriterion[];
  } | null> {
    try {
      const supabase = await createSupabaseClient();
      
      const { data: rubric, error } = await supabase
        .from("rubrics")
        .select("id, criteria")
        .eq("assignment_id", assignmentId)
        .single();

      if (error || !rubric || !rubric.criteria) {
        console.log("No rubric found for assignment:", assignmentId);
        return null;
      }

      // Validate criteria format
      const criteria = rubric.criteria as RubricCriterion[];
      if (!Array.isArray(criteria) || criteria.length === 0) {
        console.log("Invalid rubric criteria format");
        return null;
      }

      return {
        id: rubric.id,
        criteria,
      };
    } catch (error) {
      console.error("Error fetching rubric:", error);
      return null;
    }
  }

  /**
   * Private helper: Validate documents and filter for PDFs
   */
  private validateDocuments(documents: SubmissionDocument[]): SubmissionDocument[] {
    return documents.filter((doc) => {
      // Only process PDF files
      if (doc.type !== "application/pdf") {
        console.log(`Skipping non-PDF document: ${doc.name}`);
        return false;
      }

      // Validate URL
      if (!doc.url || !doc.url.startsWith("http")) {
        console.log(`Invalid URL for document: ${doc.name}`);
        return false;
      }

      // Validate size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (doc.size > maxSize) {
        console.log(`Document too large: ${doc.name} (${doc.size} bytes)`);
        return false;
      }

      return true;
    });
  }

  /**
   * Private helper: Grade a document using the grading service
   */
  private async gradeDocument(
    document: SubmissionDocument,
    criteria: RubricCriterion[]
  ): Promise<GradeResult> {
    // Transform rubric criteria to grading service format
    const rubricItems: RubricItem[] = criteria.map((criterion) => ({
      id: criterion.id,
      label: criterion.name,
      maxPoints: criterion.max_points,
      guidance: criterion.description,
    }));

    // Call grading service
    const result = await this.gradingService.grade({
      fileUrl: document.url,
      rubric: rubricItems,
    });

    return result;
  }

  /**
   * Private helper: Store grading results in database
   */
  private async storeResults(
    submissionId: string,
    rubricId: string,
    gradeResult: GradeResult
  ): Promise<void> {
    try {
      const supabase = await createSupabaseClient();

      // Store in submissions table
      await supabase
        .from("submissions")
        .update({
          ai_grade_data: {
            totalAwarded: gradeResult.totalAwarded,
            totalPossible: gradeResult.totalPossible,
            items: gradeResult.items,
            overallFeedback: gradeResult.overallFeedback,
          },
          ai_graded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", submissionId);

      // Store AI comments in rubric_scores table
      await this.storeAIComments(submissionId, rubricId, gradeResult);
    } catch (error) {
      console.error("Error storing results:", error);
      throw error;
    }
  }

  /**
   * Private helper: Store AI comments in rubric_scores table
   */
  private async storeAIComments(
    submissionId: string,
    rubricId: string,
    gradeResult: GradeResult
  ): Promise<void> {
    try {
      const supabase = await createSupabaseClient();

      // Create AI comments mapping
      const aiComments: Record<string, string> = {};
      gradeResult.items.forEach((item) => {
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
    } catch (error) {
      console.error("Error storing AI comments:", error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Private helper: Update submission status
   */
  private async updateSubmissionStatus(
    submissionId: string,
    status: AutogradeStatus
  ): Promise<void> {
    try {
      const supabase = await createSupabaseClient();
      
      await supabase
        .from("submissions")
        .update({
          ai_grade_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", submissionId);
    } catch (error) {
      console.error("Error updating submission status:", error);
      // Don't throw - this is not critical
    }
  }
}

