/**
 * Twilio SMS Provider
 * Handles SMS notifications through Twilio API
 */

import { INotificationProvider } from "./INotificationProvider";
import { NotificationMessage, NotificationProvider, ProviderResponse } from "../types";

export class TwilioProvider implements INotificationProvider {
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;

  constructor(accountSid: string, authToken: string, phoneNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.phoneNumber = phoneNumber;
  }

  async send(message: NotificationMessage): Promise<ProviderResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "Twilio provider is not properly configured",
      };
    }

    if (message.provider !== NotificationProvider.SMS) {
      return {
        success: false,
        error: "Twilio provider only supports SMS notifications",
      };
    }

    try {
      // Twilio API endpoint
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      
      // Create Basic Auth credentials (browser-compatible)
      const credentials = typeof btoa !== 'undefined'
        ? btoa(`${this.accountSid}:${this.authToken}`)
        : Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: message.to,
          From: this.phoneNumber,
          Body: message.body,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          messageId: data?.sid,
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Twilio API error: ${response.status} - ${JSON.stringify(errorData)}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to send SMS: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  isConfigured(): boolean {
    return Boolean(this.accountSid && this.authToken && this.phoneNumber);
  }

  getProviderName(): string {
    return "Twilio";
  }
}
