/**
 * Types for the Autograder Orchestration Service
 * 
 * This service connects document management, grading, and storage
 */

export interface SubmissionDocument {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface RubricCriterion {
  id: string;
  name: string;
  max_points: number;
  description?: string;
}

export interface AutogradeRequest {
  submissionId: string;
  assignmentId: string;
  documents: SubmissionDocument[];
}

export interface AutogradeResult {
  submissionId: string;
  status: "completed" | "failed" | "no_rubric" | "no_documents";
  totalAwarded?: number;
  totalPossible?: number;
  items?: GradedItem[];
  overallFeedback?: string;
  error?: string;
  gradedAt: string;
}

export interface GradedItem {
  id: string;
  label: string;
  maxPoints: number;
  points: number;
  comments: string;
}

export type AutogradeStatus = 
  | "pending" 
  | "processing" 
  | "completed" 
  | "failed" 
  | "no_rubric" 
  | "no_documents";

export interface AutograderConfig {
  maxRetries?: number;
  retryDelay?: number;
  useMockGrading?: boolean;
}

export interface BatchAutogradeRequest {
  requests: AutogradeRequest[];
  parallel?: boolean;
}

export interface BatchAutogradeResult {
  results: AutogradeResult[];
  summary: {
    total: number;
    completed: number;
    failed: number;
    noRubric: number;
    noDocuments: number;
  };
}

