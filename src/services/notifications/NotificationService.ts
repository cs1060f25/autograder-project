/**
 * Notification Service
 * Main service responsible for handling notification events and sending messages
 */

import { createClient } from "@supabase/supabase-js";
import {
  NotificationEvent,
  NotificationEventType,
  NotificationProvider,
  NotificationStatus,
  NotificationMessage,
  UserContact,
  NotificationConfig,
  GradingEvent,
  DocumentEvent,
} from "./types";
import {
  INotificationProvider,
  SendGridProvider,
  TwilioProvider,
  MockProvider,
} from "./providers";
import {
  getAssignmentUrl,
  getSubmissionUrl,
  getDashboardUrl,
  getGradingUrl,
} from "./url-utils";

export class NotificationService {
  private emailProvider: INotificationProvider;
  private smsProvider: INotificationProvider;
  private supabaseClient;
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;

    // Initialize providers based on mock mode
    if (config.mockMode) {
      this.emailProvider = new MockProvider();
      this.smsProvider = new MockProvider();
    } else {
      this.emailProvider = new SendGridProvider(
        config.sendGridApiKey || "",
        config.sendGridFromEmail || ""
      );
      this.smsProvider = new TwilioProvider(
        config.twilioAccountSid || "",
        config.twilioAuthToken || "",
        config.twilioPhoneNumber || ""
      );
    }

    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration is missing");
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Handle a notification event
   * @param event - The notification event to handle
   */
  async handleEvent(event: NotificationEvent): Promise<void> {
    try {
      // Determine the user to notify based on event type
      const userId = this.getUserIdFromEvent(event);

      // Fetch user contact information
      const userContact = await this.fetchUserContact(userId);

      if (!userContact) {
        console.error(`User contact not found for user ID: ${userId}`);
        return;
      }

      // Generate notification messages
      const messages = await this.generateMessages(event, userContact);

      // Send notifications through appropriate providers
      for (const message of messages) {
        await this.sendNotification(userId, event.type, message);
      }
    } catch (error) {
      console.error("Error handling notification event:", error);
      throw error;
    }
  }

  /**
   * Extract user ID from event
   */
  private getUserIdFromEvent(event: NotificationEvent): string {
    if ("studentId" in event) {
      return (event as any).studentId;
    } else if ("userId" in event) {
      return (event as any).userId;
    }
    throw new Error("Unable to determine user ID from event");
  }

  /**
   * Fetch user contact information from database
   * @param userId - The user ID to fetch contact info for
   */
  private async fetchUserContact(userId: string): Promise<UserContact | null> {
    try {
      const { data, error } = await this.supabaseClient
        .from("users")
        .select("id, email, first_name, last_name, phone_number")
        .eq("id", userId)
        .single();

      if (error || !data) {
        console.error("Error fetching user contact:", error);
        return null;
      }

      return {
        userId: data.id as string,
        email: data.email as string,
        firstName: data.first_name as string,
        lastName: data.last_name as string,
        phone: data.phone_number as string | undefined,
      };
    } catch (error) {
      console.error("Error fetching user contact:", error);
      return null;
    }
  }

  /**
   * Fetch assignment context (name, course info)
   */
  private async fetchAssignmentContext(assignmentId: string): Promise<{
    assignmentName: string;
    courseName: string;
    courseCode: string;
    dueDate?: string;
  } | null> {
    try {
      const { data, error } = await this.supabaseClient
        .from("assignments")
        .select(
          `
          title,
          due_date,
          course_id,
          courses:course_id (
            name,
            code
          )
        `
        )
        .eq("id", assignmentId)
        .single();

      if (error || !data) {
        console.error("Error fetching assignment context:", error);
        return null;
      }

      // Handle the case where course might be null
      const course = data.courses as any;

      return {
        assignmentName: data.title,
        courseName: course?.name || "Unknown Course",
        courseCode: course?.code || "",
        dueDate: data.due_date,
      };
    } catch (error) {
      console.error("Error fetching assignment context:", error);
      return null;
    }
  }

  /**
   * Fetch student name for instructor notifications
   */
  private async fetchStudentName(studentId: string): Promise<string> {
    try {
      const { data, error } = await this.supabaseClient
        .from("users")
        .select("first_name, last_name")
        .eq("id", studentId)
        .single();

      if (error || !data) {
        return "A student";
      }

      return `${data.first_name} ${data.last_name}`;
    } catch (error) {
      return "A student";
    }
  }

  /**
   * Generate notification messages based on event type
   */
  private async generateMessages(
    event: NotificationEvent,
    userContact: UserContact
  ): Promise<NotificationMessage[]> {
    const messages: NotificationMessage[] = [];

    // Generate email message
    const emailMessage = await this.generateEmailMessage(event, userContact);
    if (emailMessage) {
      messages.push(emailMessage);
    }

    // Generate SMS message if phone is available
    if (userContact.phone) {
      const smsMessage = await this.generateSMSMessage(event, userContact);
      if (smsMessage) {
        messages.push(smsMessage);
      }
    }

    return messages;
  }

  /**
   * Generate email message content
   */
  private async generateEmailMessage(
    event: NotificationEvent,
    userContact: UserContact
  ): Promise<NotificationMessage | null> {
    const { firstName, lastName, email } = userContact;
    let subject = "";
    let body = "";

    switch (event.type) {
      case NotificationEventType.SUBMISSION_GRADED:
        const gradingEvent = event as GradingEvent;
        const gradingContext = await this.fetchAssignmentContext(
          gradingEvent.assignmentId
        );

        const assignmentName =
          gradingContext?.assignmentName || "Your assignment";
        const courseName = gradingContext?.courseName || "";
        const courseCode = gradingContext?.courseCode || "";
        const courseDisplay = courseCode
          ? `${courseCode}: ${courseName}`
          : courseName;
        const submissionUrl = getSubmissionUrl(
          gradingEvent.assignmentId,
          gradingEvent.submissionId
        );

        subject = `Grade Released: ${assignmentName}${
          courseCode ? ` (${courseCode})` : ""
        }`;
        body = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
              <h2 style="color: #2c3e50; margin-top: 0;">Grade Released</h2>
              <p style="font-size: 16px; margin-bottom: 8px;">Hello ${firstName},</p>
              <p style="font-size: 16px;">Your submission for <strong>${assignmentName}</strong> has been graded.</p>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              ${
                courseDisplay
                  ? `<p style="margin: 0 0 12px 0; color: #6c757d;"><strong>Course:</strong> ${courseDisplay}</p>`
                  : ""
              }
              <p style="margin: 0 0 12px 0;"><strong>Assignment:</strong> ${assignmentName}</p>
              <p style="margin: 0 0 12px 0;"><strong>Status:</strong> <span style="color: #28a745; font-weight: 600;">Graded</span></p>
              <p style="margin: 0;"><strong>Grade:</strong> <span style="font-size: 18px; font-weight: 600; color: #2c3e50;">${
                gradingEvent.grade !== undefined && gradingEvent.grade !== null
                  ? gradingEvent.grade
                  : "See submission"
              }</span></p>
            </div>
            
            ${
              gradingEvent.feedback
                ? `
            <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #2c3e50;">Feedback:</p>
              <p style="margin: 0; white-space: pre-wrap;">${gradingEvent.feedback}</p>
            </div>
            `
                : ""
            }
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${submissionUrl}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">View Full Submission</a>
            </div>
            
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e1e4e8; color: #6c757d; font-size: 14px;">
              <p style="margin: 0;">This is an automated notification from your course autograder system.</p>
              <p style="margin: 8px 0 0 0;">If you have questions about your grade, please contact your instructor.</p>
            </div>
          </body>
          </html>
        `;
        break;

      case NotificationEventType.GRADE_UPDATED:
        subject = "Your grade has been updated";
        body = `
          <h2>Hello ${firstName} ${lastName},</h2>
          <p>Your grade has been updated. Please log in to view the changes.</p>
        `;
        break;

      case NotificationEventType.FEEDBACK_AVAILABLE:
        subject = "New feedback available";
        body = `
          <h2>Hello ${firstName} ${lastName},</h2>
          <p>New feedback is available for your submission. Please log in to view it.</p>
        `;
        break;

      case NotificationEventType.DOCUMENT_UPLOADED:
        const docUploadEvent = event as DocumentEvent;
        const uploadContext = docUploadEvent.userId
          ? await this.fetchAssignmentContext(docUploadEvent.documentId)
          : null;
        const studentName = docUploadEvent.userId
          ? await this.fetchStudentName(docUploadEvent.userId)
          : "A student";

        subject = "Submission Received: New Student Work to Review";
        body = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
              <h2 style="color: #2c3e50; margin-top: 0;">📝 New Submission Received</h2>
              <p style="font-size: 16px; margin-bottom: 8px;">Hello ${firstName},</p>
              <p style="font-size: 16px;"><strong>${studentName}</strong> has submitted new work for review.</p>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 12px 0;"><strong>Student:</strong> ${studentName}</p>
              <p style="margin: 0 0 12px 0;"><strong>Document:</strong> ${
                docUploadEvent.fileName
              }</p>
              <p style="margin: 0;"><strong>Status:</strong> <span style="color: #ffc107; font-weight: 600;">Awaiting Review</span></p>
            </div>
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${getDashboardUrl()}" style="display: inline-block; background-color: #28a745; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Review Submission</a>
            </div>
            
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e1e4e8; color: #6c757d; font-size: 14px;">
              <p style="margin: 0;">This is an automated notification from your course autograder system.</p>
            </div>
          </body>
          </html>
        `;
        break;

      case NotificationEventType.DOCUMENT_PROCESSED:
        const docProcessEvent = event as DocumentEvent;
        subject = "Document processed successfully";
        body = `
          <h2>Hello ${firstName} ${lastName},</h2>
          <p>Your document <strong>${docProcessEvent.fileName}</strong> has been processed successfully.</p>
        `;
        break;

      case NotificationEventType.DOCUMENT_FAILED:
        const docFailEvent = event as DocumentEvent;
        subject = "Document processing failed";
        body = `
          <h2>Hello ${firstName} ${lastName},</h2>
          <p>Unfortunately, your document <strong>${
            docFailEvent.fileName
          }</strong> failed to process.</p>
          ${
            docFailEvent.error
              ? `<p><strong>Error:</strong> ${docFailEvent.error}</p>`
              : ""
          }
        `;
        break;

      case NotificationEventType.ASSIGNMENT_PUBLISHED:
        const publishedEvent = event as any;
        const publishedContext = publishedEvent.assignmentId
          ? await this.fetchAssignmentContext(publishedEvent.assignmentId)
          : null;
        const publishedAssignmentName =
          publishedContext?.assignmentName || "A new assignment";
        const publishedCourseDisplay = publishedContext?.courseCode
          ? `${publishedContext.courseCode}: ${publishedContext.courseName}`
          : publishedContext?.courseName || "";
        const publishedUrl = publishedEvent.assignmentId
          ? getAssignmentUrl(publishedEvent.assignmentId)
          : getDashboardUrl();

        subject = `New Assignment: ${publishedAssignmentName}${
          publishedContext?.courseCode
            ? ` (${publishedContext.courseCode})`
            : ""
        }`;
        body = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #e3f2fd; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
              <h2 style="color: #1976d2; margin-top: 0;">📚 New Assignment Published</h2>
              <p style="font-size: 16px; margin-bottom: 8px;">Hello ${firstName},</p>
              <p style="font-size: 16px;">A new assignment has been published and is ready for you to begin.</p>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              ${
                publishedCourseDisplay
                  ? `<p style="margin: 0 0 12px 0; color: #6c757d;"><strong>Course:</strong> ${publishedCourseDisplay}</p>`
                  : ""
              }
              <p style="margin: 0 0 12px 0;"><strong>Assignment:</strong> ${publishedAssignmentName}</p>
              ${
                publishedContext?.dueDate
                  ? `<p style="margin: 0;"><strong>Due Date:</strong> ${new Date(
                      publishedContext.dueDate
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}</p>`
                  : ""
              }
            </div>
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${publishedUrl}" style="display: inline-block; background-color: #1976d2; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">View Assignment</a>
            </div>
            
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e1e4e8; color: #6c757d; font-size: 14px;">
              <p style="margin: 0;">This is an automated notification from your course autograder system.</p>
            </div>
          </body>
          </html>
        `;
        break;

      case NotificationEventType.ASSIGNMENT_DUE_SOON:
        const dueSoonEvent = event as any;
        const dueSoonContext = dueSoonEvent.assignmentId
          ? await this.fetchAssignmentContext(dueSoonEvent.assignmentId)
          : null;
        const dueSoonAssignmentName =
          dueSoonContext?.assignmentName || "An assignment";
        const dueSoonCourseDisplay = dueSoonContext?.courseCode
          ? `${dueSoonContext.courseCode}: ${dueSoonContext.courseName}`
          : dueSoonContext?.courseName || "";
        const dueSoonUrl = dueSoonEvent.assignmentId
          ? getAssignmentUrl(dueSoonEvent.assignmentId)
          : getDashboardUrl();

        subject = `⏰ Reminder: ${dueSoonAssignmentName} Due Soon`;
        body = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fff3cd; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
              <h2 style="color: #856404; margin-top: 0;">⏰ Assignment Due Soon</h2>
              <p style="font-size: 16px; margin-bottom: 8px;">Hello ${firstName},</p>
              <p style="font-size: 16px;">This is a friendly reminder that <strong>${dueSoonAssignmentName}</strong> is due soon.</p>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              ${
                dueSoonCourseDisplay
                  ? `<p style="margin: 0 0 12px 0; color: #6c757d;"><strong>Course:</strong> ${dueSoonCourseDisplay}</p>`
                  : ""
              }
              <p style="margin: 0 0 12px 0;"><strong>Assignment:</strong> ${dueSoonAssignmentName}</p>
              ${
                dueSoonContext?.dueDate
                  ? `<p style="margin: 0;"><strong>Due Date:</strong> <span style="color: #ffc107; font-weight: 600;">${new Date(
                      dueSoonContext.dueDate
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}</span></p>`
                  : ""
              }
            </div>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 0; color: #856404;">⚠️ Don't forget to submit your work before the deadline!</p>
            </div>
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${dueSoonUrl}" style="display: inline-block; background-color: #ffc107; color: #000; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Submit Assignment</a>
            </div>
            
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e1e4e8; color: #6c757d; font-size: 14px;">
              <p style="margin: 0;">This is an automated notification from your course autograder system.</p>
            </div>
          </body>
          </html>
        `;
        break;

      case NotificationEventType.ASSIGNMENT_OVERDUE:
        const overdueEvent = event as any;
        const overdueContext = overdueEvent.assignmentId
          ? await this.fetchAssignmentContext(overdueEvent.assignmentId)
          : null;
        const overdueAssignmentName =
          overdueContext?.assignmentName || "An assignment";
        const overdueCourseDisplay = overdueContext?.courseCode
          ? `${overdueContext.courseCode}: ${overdueContext.courseName}`
          : overdueContext?.courseName || "";
        const overdueUrl = overdueEvent.assignmentId
          ? getAssignmentUrl(overdueEvent.assignmentId)
          : getDashboardUrl();

        subject = `⚠️ Overdue: ${overdueAssignmentName}`;
        body = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8d7da; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
              <h2 style="color: #721c24; margin-top: 0;">⚠️ Assignment Overdue</h2>
              <p style="font-size: 16px; margin-bottom: 8px;">Hello ${firstName},</p>
              <p style="font-size: 16px;"><strong>${overdueAssignmentName}</strong> is now overdue. Please submit as soon as possible.</p>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              ${
                overdueCourseDisplay
                  ? `<p style="margin: 0 0 12px 0; color: #6c757d;"><strong>Course:</strong> ${overdueCourseDisplay}</p>`
                  : ""
              }
              <p style="margin: 0 0 12px 0;"><strong>Assignment:</strong> ${overdueAssignmentName}</p>
              ${
                overdueContext?.dueDate
                  ? `<p style="margin: 0;"><strong>Was Due:</strong> <span style="color: #dc3545; font-weight: 600;">${new Date(
                      overdueContext.dueDate
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}</span></p>`
                  : ""
              }
            </div>
            
            <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 0; color: #721c24;">Late submissions may be subject to penalties. Please contact your instructor if you need an extension.</p>
            </div>
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${overdueUrl}" style="display: inline-block; background-color: #dc3545; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Submit Now</a>
            </div>
            
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e1e4e8; color: #6c757d; font-size: 14px;">
              <p style="margin: 0;">This is an automated notification from your course autograder system.</p>
            </div>
          </body>
          </html>
        `;
        break;

      case NotificationEventType.REGRADE_REQUEST_SUBMITTED:
        const regradeEvent = event as any;

        subject = `Regrade Request: ${regradeEvent.studentName} - ${regradeEvent.assignmentTitle}`;
        body = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fff3cd; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
              <h2 style="color: #856404; margin-top: 0;">📝 New Regrade Request</h2>
              <p style="font-size: 16px; margin-bottom: 8px;">Hello ${firstName},</p>
              <p style="font-size: 16px;"><strong>${
                regradeEvent.studentName
              }</strong> has submitted a regrade request.</p>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 12px 0;"><strong>Student:</strong> ${
                regradeEvent.studentName
              }</p>
              <p style="margin: 0 0 12px 0;"><strong>Assignment:</strong> ${
                regradeEvent.assignmentTitle
              }</p>
              <p style="margin: 0 0 12px 0;"><strong>Rubric Item:</strong> ${
                regradeEvent.rubricItemId
              }</p>
              <p style="margin: 0;"><strong>Status:</strong> <span style="color: #ffc107; font-weight: 600;">Pending Review</span></p>
            </div>
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${getDashboardUrl()}" style="display: inline-block; background-color: #ffc107; color: #000; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Review Request</a>
            </div>
            
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e1e4e8; color: #6c757d; font-size: 14px;">
              <p style="margin: 0;">This is an automated notification from your course autograder system.</p>
            </div>
          </body>
          </html>
        `;
        break;

      case NotificationEventType.REGRADE_REQUEST_RESOLVED:
        const resolutionEvent = event as any;
        const isApproved = resolutionEvent.status === "approved";
        const statusColor = isApproved ? "#28a745" : "#dc3545";
        const statusBgColor = isApproved ? "#d4edda" : "#f8d7da";
        const statusText = isApproved ? "Approved" : "Denied";
        const statusIcon = isApproved ? "✅" : "❌";

        subject = `Regrade Request ${statusText}: ${resolutionEvent.assignmentTitle}`;
        body = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: ${statusBgColor}; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
              <h2 style="color: ${statusColor}; margin-top: 0;">${statusIcon} Regrade Request ${statusText}</h2>
              <p style="font-size: 16px; margin-bottom: 8px;">Hello ${firstName},</p>
              <p style="font-size: 16px;">Your regrade request for <strong>${
                resolutionEvent.assignmentTitle
              }</strong> has been reviewed and ${statusText.toLowerCase()}.</p>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 12px 0;"><strong>Assignment:</strong> ${
                resolutionEvent.assignmentTitle
              }</p>
              <p style="margin: 0 0 12px 0;"><strong>Rubric Item:</strong> ${
                resolutionEvent.rubricItemName
              }</p>
              <p style="margin: 0 0 12px 0;"><strong>Decision:</strong> <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span></p>
              ${
                isApproved && resolutionEvent.pointsAwarded !== undefined
                  ? `<p style="margin: 0;"><strong>Points Awarded:</strong> <span style="font-size: 18px; font-weight: 600; color: ${statusColor};">${
                      resolutionEvent.pointsAwarded
                    }${
                      resolutionEvent.maxPoints
                        ? ` / ${resolutionEvent.maxPoints}`
                        : ""
                    }</span></p>`
                  : ""
              }
            </div>
            
            ${
              resolutionEvent.resolutionNotes
                ? `
            <div style="background-color: #f8f9fa; border-left: 4px solid ${statusColor}; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #2c3e50;">TA/Instructor Comment:</p>
              <p style="margin: 0; white-space: pre-wrap;">${resolutionEvent.resolutionNotes}</p>
            </div>
            `
                : ""
            }
            
            ${
              resolutionEvent.auditMetadata?.ai_rationale
                ? `
            <div style="background-color: #e7f3ff; border-left: 4px solid #007bff; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #2c3e50;">Original AI Grading Context:</p>
              <p style="margin: 0; font-size: 14px; color: #495057;">${resolutionEvent.auditMetadata.ai_rationale}</p>
            </div>
            `
                : ""
            }
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${getDashboardUrl()}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">View Updated Grade</a>
            </div>
            
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e1e4e8; color: #6c757d; font-size: 14px;">
              <p style="margin: 0;">This is an automated notification from your course autograder system.</p>
              ${
                !isApproved
                  ? `<p style="margin: 8px 0 0 0;">If you have further questions about this decision, please contact your instructor.</p>`
                  : ""
              }
            </div>
          </body>
          </html>
        `;
        break;

      default:
        return null;
    }

    return {
      to: email,
      subject,
      body,
      provider: NotificationProvider.EMAIL,
    };
  }

  /**
   * Generate SMS message content
   */
  private async generateSMSMessage(
    event: NotificationEvent,
    userContact: UserContact
  ): Promise<NotificationMessage | null> {
    if (!userContact.phone) return null;

    const { firstName } = userContact;
    let body = "";

    switch (event.type) {
      case NotificationEventType.SUBMISSION_GRADED:
        const gradingEvent = event as GradingEvent;
        const gradingContext = await this.fetchAssignmentContext(
          gradingEvent.assignmentId
        );
        const assignmentName =
          gradingContext?.assignmentName || "your assignment";
        const courseCode = gradingContext?.courseCode || "";
        const submissionUrl = getSubmissionUrl(
          gradingEvent.assignmentId,
          gradingEvent.submissionId
        );

        body = `Hi ${firstName}, ${
          courseCode ? `[${courseCode}] ` : ""
        }${assignmentName} graded! Score: ${
          gradingEvent.grade !== undefined && gradingEvent.grade !== null
            ? gradingEvent.grade
            : "See details"
        }. View: ${submissionUrl}`;
        break;

      case NotificationEventType.GRADE_UPDATED:
        body = `Hi ${firstName}, your grade has been updated. Log in to view changes: ${getDashboardUrl()}`;
        break;

      case NotificationEventType.FEEDBACK_AVAILABLE:
        body = `Hi ${firstName}, new feedback available for your submission. Check it out: ${getDashboardUrl()}`;
        break;

      case NotificationEventType.ASSIGNMENT_DUE_SOON:
        const dueSoonEvent = event as any;
        const dueSoonContext = dueSoonEvent.assignmentId
          ? await this.fetchAssignmentContext(dueSoonEvent.assignmentId)
          : null;
        const dueSoonName = dueSoonContext?.assignmentName || "An assignment";
        const dueSoonCode = dueSoonContext?.courseCode || "";
        const dueSoonUrl = dueSoonEvent.assignmentId
          ? getAssignmentUrl(dueSoonEvent.assignmentId)
          : getDashboardUrl();

        body = `⏰ Hi ${firstName}, reminder: ${
          dueSoonCode ? `[${dueSoonCode}] ` : ""
        }${dueSoonName} due soon! Submit: ${dueSoonUrl}`;
        break;

      case NotificationEventType.ASSIGNMENT_OVERDUE:
        const overdueEvent = event as any;
        const overdueContext = overdueEvent.assignmentId
          ? await this.fetchAssignmentContext(overdueEvent.assignmentId)
          : null;
        const overdueName = overdueContext?.assignmentName || "An assignment";
        const overdueCode = overdueContext?.courseCode || "";
        const overdueUrl = overdueEvent.assignmentId
          ? getAssignmentUrl(overdueEvent.assignmentId)
          : getDashboardUrl();

        body = `⚠️ Hi ${firstName}, ${
          overdueCode ? `[${overdueCode}] ` : ""
        }${overdueName} is OVERDUE. Submit ASAP: ${overdueUrl}`;
        break;

      case NotificationEventType.REGRADE_REQUEST_RESOLVED:
        const smsResolutionEvent = event as any;
        const smsStatusText =
          smsResolutionEvent.status === "approved" ? "APPROVED" : "DENIED";
        const smsStatusIcon =
          smsResolutionEvent.status === "approved" ? "✅" : "❌";

        body = `${smsStatusIcon} Hi ${firstName}, your regrade request for ${
          smsResolutionEvent.assignmentTitle
        } was ${smsStatusText}. Check details: ${getDashboardUrl()}`;
        break;

      default:
        // Don't send SMS for other event types
        return null;
    }

    return {
      to: userContact.phone,
      body,
      provider: NotificationProvider.SMS,
    };
  }

  /**
   * Send notification and log to database
   */
  private async sendNotification(
    userId: string,
    eventType: NotificationEventType,
    message: NotificationMessage
  ): Promise<void> {
    const provider =
      message.provider === NotificationProvider.EMAIL
        ? this.emailProvider
        : this.smsProvider;

    let status = NotificationStatus.PENDING;
    let errorMessage: string | undefined;

    try {
      // Send the notification
      const response = await provider.send(message);

      if (response.success) {
        status = this.config.mockMode
          ? NotificationStatus.MOCK
          : NotificationStatus.SENT;
      } else {
        status = NotificationStatus.FAILED;
        errorMessage = response.error;
      }
    } catch (error) {
      status = NotificationStatus.FAILED;
      errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
    }

    // Log notification to database
    await this.logNotification({
      user_id: userId,
      event_type: eventType,
      provider: message.provider,
      status,
      message: JSON.stringify({
        to: message.to,
        subject: message.subject,
        body: message.body.substring(0, 500), // Truncate for storage
      }),
      error_message: errorMessage,
      metadata: {
        mock_mode: this.config.mockMode,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log notification to Supabase notifications table
   */
  private async logNotification(
    log: Omit<any, "id" | "created_at">
  ): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .from("notifications")
        .insert(log);

      if (error) {
        console.error("Error logging notification:", error);
      }
    } catch (error) {
      console.error("Error logging notification:", error);
    }
  }

  /**
   * Get notification history for a user
   */
  async getNotificationHistory(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching notification history:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching notification history:", error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseClient
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabaseClient
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null);

      if (error) {
        console.error("Error fetching unread count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  }
}
