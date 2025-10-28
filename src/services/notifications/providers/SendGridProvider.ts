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
}
