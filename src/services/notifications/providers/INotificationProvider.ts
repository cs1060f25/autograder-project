/**
 * Notification Provider Interface
 * All notification providers must implement this interface
 */

import { NotificationMessage, ProviderResponse } from "../types";

export interface INotificationProvider {
  /**
   * Send a notification message
   * @param message - The notification message to send
   * @returns Promise with success status and optional message ID or error
   */
  send(message: NotificationMessage): Promise<ProviderResponse>;

  /**
   * Check if the provider is properly configured
   * @returns true if configured, false otherwise
   */
  isConfigured(): boolean;

  /**
   * Get the provider name
   * @returns The name of the provider
   */
  getProviderName(): string;
}
