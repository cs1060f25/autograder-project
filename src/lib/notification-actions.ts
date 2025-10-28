"use server";

/**
 * Notification Actions
 * Server actions for triggering and managing notifications
 */

import { createNotificationService, NotificationEventType } from "@/services/notifications";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "./user-utils";

/**
 * Notify student when their submission has been graded
 */
export async function notifySubmissionGraded(params: {
  submissionId: string;
  studentId: string;
  assignmentId: string;
  grade: number;
  feedback?: string;
  gradedBy: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const service = createNotificationService();

    await service.handleEvent({
      type: NotificationEventType.SUBMISSION_GRADED,
      submissionId: params.submissionId,
      studentId: params.studentId,
      assignmentId: params.assignmentId,
      grade: params.grade,
      feedback: params.feedback,
      gradedBy: params.gradedBy,
      timestamp: new Date().toISOString(),
    } as any);

    return { success: true };
  } catch (error) {
    console.error("Error sending submission graded notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get notification history for current user
 */
export async function getUserNotifications(
  limit?: number
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const userProfile = await requireAuth();
    const service = createNotificationService();
    const notifications = await service.getNotificationHistory(userProfile.id, limit);

    return { success: true, data: notifications };
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get unread notification count for current user
 */
export async function getUnreadCount(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const userProfile = await requireAuth();
    const service = createNotificationService();
    const count = await service.getUnreadCount(userProfile.id);

    return { success: true, count };
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const service = createNotificationService();
    const result = await service.markAsRead(notificationId);

    if (!result) {
      return { success: false, error: "Failed to mark notification as read" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllAsRead(): Promise<{ success: boolean; error?: string }> {
  try {
    const userProfile = await requireAuth();
    const supabase = await createClient();

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userProfile.id)
      .is("read_at", null);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Notify instructor/TAs when a student uploads a document
 */
export async function notifyDocumentUploaded(params: {
  documentId: string;
  studentId: string;
  assignmentId: string;
  fileName: string;
  courseId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const service = createNotificationService();

    // Get instructor and TAs for this course
    const { data: course } = await supabase
      .from("courses")
      .select("instructor_id")
      .eq("id", params.courseId)
      .single();

    const { data: tas } = await supabase
      .from("course_enrollments")
      .select("student_id")
      .eq("course_id", params.courseId)
      .eq("role", "ta");

    // Notify instructor
    if (course?.instructor_id) {
      await service.handleEvent({
        type: NotificationEventType.DOCUMENT_UPLOADED,
        documentId: params.documentId,
        userId: course.instructor_id,
        fileName: params.fileName,
        timestamp: new Date().toISOString(),
      } as any);
    }

    // Notify all TAs
    if (tas) {
      for (const ta of tas) {
        await service.handleEvent({
          type: NotificationEventType.DOCUMENT_UPLOADED,
          documentId: params.documentId,
          userId: ta.student_id,
          fileName: params.fileName,
          timestamp: new Date().toISOString(),
        } as any);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending document uploaded notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
