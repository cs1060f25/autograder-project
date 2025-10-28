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
      const messages = this.generateMessages(event, userContact);

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
        .select("id, email, first_name, last_name, phone")
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
        phone: data.phone as string | undefined,
      };
    } catch (error) {
      console.error("Error fetching user contact:", error);
      return null;
    }
  }

  /**
   * Generate notification messages based on event type
   */
  private generateMessages(
    event: NotificationEvent,
    userContact: UserContact
  ): NotificationMessage[] {
    const messages: NotificationMessage[] = [];

    // Generate email message
    const emailMessage = this.generateEmailMessage(event, userContact);
    if (emailMessage) {
      messages.push(emailMessage);
    }

    // Generate SMS message if phone is available
    if (userContact.phone) {
      const smsMessage = this.generateSMSMessage(event, userContact);
      if (smsMessage) {
        messages.push(smsMessage);
      }
    }

    return messages;
  }

  /**
   * Generate email message content
   */
  private generateEmailMessage(
    event: NotificationEvent,
    userContact: UserContact
  ): NotificationMessage | null {
    const { firstName, lastName, email } = userContact;
    let subject = "";
    let body = "";

    switch (event.type) {
      case NotificationEventType.SUBMISSION_GRADED:
        const gradingEvent = event as GradingEvent;
        subject = "Your submission has been graded";
        body = `
          <h2>Hello ${firstName} ${lastName},</h2>
          <p>Your submission has been graded.</p>
          <p><strong>Grade:</strong> ${gradingEvent.grade || "N/A"}</p>
          ${gradingEvent.feedback ? `<p><strong>Feedback:</strong> ${gradingEvent.feedback}</p>` : ""}
          <p>Please log in to view the full details.</p>
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
        subject = "New student submission received";
        body = `
          <h2>Hello ${firstName} ${lastName},</h2>
          <p>A student has submitted new document(s): <strong>${docUploadEvent.fileName}</strong></p>
          <p>Please log in to review and grade the submission.</p>
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
          <p>Unfortunately, your document <strong>${docFailEvent.fileName}</strong> failed to process.</p>
          ${docFailEvent.error ? `<p><strong>Error:</strong> ${docFailEvent.error}</p>` : ""}
        `;
        break;

      case NotificationEventType.ASSIGNMENT_PUBLISHED:
        subject = "New assignment published";
        body = `
          <h2>Hello ${firstName} ${lastName},</h2>
          <p>A new assignment has been published. Please log in to view the details.</p>
        `;
        break;

      case NotificationEventType.ASSIGNMENT_DUE_SOON:
        subject = "Assignment due soon";
        body = `
          <h2>Hello ${firstName} ${lastName},</h2>
          <p>Reminder: You have an assignment due soon. Please log in to submit it.</p>
        `;
        break;

      case NotificationEventType.ASSIGNMENT_OVERDUE:
        subject = "Assignment overdue";
        body = `
          <h2>Hello ${firstName} ${lastName},</h2>
          <p>You have an overdue assignment. Please log in to submit it as soon as possible.</p>
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
  private generateSMSMessage(
    event: NotificationEvent,
    userContact: UserContact
  ): NotificationMessage | null {
    if (!userContact.phone) return null;

    const { firstName } = userContact;
    let body = "";

    switch (event.type) {
      case NotificationEventType.SUBMISSION_GRADED:
        const gradingEvent = event as GradingEvent;
        body = `Hi ${firstName}, your submission has been graded. Grade: ${gradingEvent.grade || "N/A"}. Log in to view details.`;
        break;

      case NotificationEventType.GRADE_UPDATED:
        body = `Hi ${firstName}, your grade has been updated. Log in to view changes.`;
        break;

      case NotificationEventType.FEEDBACK_AVAILABLE:
        body = `Hi ${firstName}, new feedback is available for your submission. Log in to view it.`;
        break;

      case NotificationEventType.ASSIGNMENT_DUE_SOON:
        body = `Hi ${firstName}, reminder: You have an assignment due soon. Log in to submit it.`;
        break;

      case NotificationEventType.ASSIGNMENT_OVERDUE:
        body = `Hi ${firstName}, you have an overdue assignment. Please submit it ASAP.`;
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
  private async logNotification(log: Omit<any, "id" | "created_at">): Promise<void> {
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
