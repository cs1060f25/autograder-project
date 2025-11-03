/**
 * SendGrid Email Provider
 * Handles email notifications through SendGrid API
 */

import { INotificationProvider } from "./INotificationProvider";
import { NotificationMessage, NotificationProvider, ProviderResponse } from "../types";

export class SendGridProvider implements INotificationProvider {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async send(message: NotificationMessage): Promise<ProviderResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "SendGrid provider is not properly configured",
      };
    }

    if (message.provider !== NotificationProvider.EMAIL) {
      return {
        success: false,
        error: "SendGrid provider only supports email notifications",
      };
    }

    try {
      // SendGrid API v3 endpoint
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: message.to }],
              subject: message.subject || "Notification",
            },
          ],
          from: { email: this.fromEmail },
          content: [
            {
              type: "text/plain",
              value: this.htmlToPlainText(message.body),
            },
            {
              type: "text/html",
              value: message.body,
            },
          ],
        }),
      });

      if (response.ok) {
        // SendGrid returns 202 Accepted on success
        const messageId = response.headers.get("x-message-id") || undefined;
        return {
          success: true,
          messageId,
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `SendGrid API error: ${response.status} - ${JSON.stringify(errorData)}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to send email: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.fromEmail);
  }

  getProviderName(): string {
    return "SendGrid";
  }

  /**
   * Convert HTML to plain text for email fallback
   */
  private htmlToPlainText(html: string): string {
    return html
      // Remove DOCTYPE and html/head/body tags
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<html[^>]*>/gi, "")
      .replace(/<\/html>/gi, "")
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
      .replace(/<body[^>]*>/gi, "")
      .replace(/<\/body>/gi, "")
      // Convert common block elements to newlines
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<h[1-6][^>]*>/gi, "")
      // Convert links to text with URL
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "$2 ($1)")
      // Remove remaining HTML tags
      .replace(/<[^>]+>/g, "")
      // Decode common HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up excessive whitespace
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .trim();
  }
}
