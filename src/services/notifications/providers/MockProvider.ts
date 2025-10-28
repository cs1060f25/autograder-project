/**
 * Mock Notification Provider
 * Used for development/testing - logs notifications instead of sending them
 */

import { INotificationProvider } from "./INotificationProvider";
import { NotificationMessage, ProviderResponse } from "../types";

export class MockProvider implements INotificationProvider {
  private sentMessages: NotificationMessage[] = [];

  async send(message: NotificationMessage): Promise<ProviderResponse> {
    // Log the notification
    console.log("📧 [MockProvider] Notification sent:", {
      provider: message.provider,
      to: message.to,
      subject: message.subject,
      body: message.body.substring(0, 100) + "...",
    });

    // Store for testing
    this.sentMessages.push(message);

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }

  isConfigured(): boolean {
    return true; // Mock provider is always configured
  }

  getProviderName(): string {
    return "Mock";
  }

  // Helper method for testing
  getSentMessages(): NotificationMessage[] {
    return this.sentMessages;
  }

  clearSentMessages(): void {
    this.sentMessages = [];
  }
}
