/**
 * Notification Service Module Export
 */

export { NotificationService } from "./NotificationService";
export * from "./types";
export * from "./providers";

// Factory function to create NotificationService instance
import { NotificationService } from "./NotificationService";
import { NotificationConfig } from "./types";

export function createNotificationService(
  config?: Partial<NotificationConfig>
): NotificationService {
  const defaultConfig: NotificationConfig = {
    mockMode: process.env.NOTIFICATION_MOCK_MODE === "true",
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
    sendGridApiKey: process.env.SENDGRID_API_KEY,
    sendGridFromEmail: process.env.SENDGRID_FROM_EMAIL,
  };

  return new NotificationService({ ...defaultConfig, ...config });
}
