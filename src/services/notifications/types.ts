/**
 * Notification Service Types
 * Type definitions for the notification system
 */

// Notification providers
export enum NotificationProvider {
  EMAIL = "email",
  SMS = "sms",
}

// Notification event types
export enum NotificationEventType {
  SUBMISSION_GRADED = "submission_graded",
  GRADE_UPDATED = "grade_updated",
  FEEDBACK_AVAILABLE = "feedback_available",
  DOCUMENT_UPLOADED = "document_uploaded",
  DOCUMENT_PROCESSED = "document_processed",
  DOCUMENT_FAILED = "document_failed",
  ASSIGNMENT_PUBLISHED = "assignment_published",
  ASSIGNMENT_DUE_SOON = "assignment_due_soon",
  ASSIGNMENT_OVERDUE = "assignment_overdue",
  REGRADE_REQUEST_SUBMITTED = "regrade_request_submitted",
  REGRADE_REQUEST_RESOLVED = "regrade_request_resolved",
}

// Notification status
export enum NotificationStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed",
  MOCK = "mock",
}

// Base notification event
export interface NotificationEvent {
  type: NotificationEventType;
  timestamp: string;
}

// Grading-related events
export interface GradingEvent extends NotificationEvent {
  submissionId: string;
  studentId: string;
  assignmentId: string;
  grade?: number;
  feedback?: string;
  gradedBy: string;
}

// Document-related events
export interface DocumentEvent extends NotificationEvent {
  documentId: string;
  userId: string;
  fileName: string;
  error?: string;
}

// Assignment-related events
export interface AssignmentEvent extends NotificationEvent {
  assignmentId: string;
  courseId: string;
  studentIds?: string[];
}

// Regrade request events
export interface RegradeRequestEvent extends NotificationEvent {
  userId: string; // TA/Instructor being notified
  studentName: string;
  assignmentId: string;
  assignmentTitle: string;
  rubricItemId: string;
}

// Regrade resolution events
export interface RegradeResolutionEvent extends NotificationEvent {
  studentId: string; // Student being notified
  assignmentTitle: string;
  rubricItemName: string;
  status: 'approved' | 'rejected';
  resolutionNotes: string;
  pointsAwarded?: number;
  maxPoints?: number;
  auditMetadata?: any;
}

// User contact information
export interface UserContact {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// Notification message
export interface NotificationMessage {
  to: string;
  subject?: string;
  body: string;
  provider: NotificationProvider;
}

// Provider response
export interface ProviderResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Notification configuration
export interface NotificationConfig {
  mockMode: boolean;
  sendGridApiKey?: string;
  sendGridFromEmail?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
}

// Database notification record
export interface NotificationRecord {
  id: string;
  user_id: string;
  event_type: string;
  provider: string;
  status: string;
  message: string;
  error_message?: string;
  metadata?: any;
  created_at: string;
  read_at?: string;
}
