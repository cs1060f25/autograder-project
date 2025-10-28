/**
 * SendGrid Provider Tests
 * Tests for email notification delivery via SendGrid
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SendGridProvider } from '@/services/notifications/providers/SendGridProvider';
import { NotificationProvider } from '@/services/notifications/types';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('SendGrid Email Provider', () => {
  let provider: SendGridProvider;

  beforeEach(() => {
    provider = new SendGridProvider('test-api-key', 'from@example.com');
    mockFetch.mockClear();
  });

  describe('1. Configuration Tests', () => {
    it('should be configured with valid credentials', () => {
      expect(provider.isConfigured()).toBe(true);
      expect(provider.getProviderName()).toBe('SendGrid');
    });

    it('should not be configured without API key', () => {
      const invalidProvider = new SendGridProvider('', 'from@example.com');
      expect(invalidProvider.isConfigured()).toBe(false);
    });

    it('should not be configured without from email', () => {
      const invalidProvider = new SendGridProvider('test-key', '');
      expect(invalidProvider.isConfigured()).toBe(false);
    });

    it('should fail when not configured', async () => {
      const unconfiguredProvider = new SendGridProvider('', '');

      const message = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        provider: NotificationProvider.EMAIL,
      };

      const result = await unconfiguredProvider.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not properly configured');
    });
  });

  describe('2. Successful Email Delivery', () => {
    it('should send email successfully with 202 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 202,
        headers: {
          get: (key: string) => key === 'x-message-id' ? 'msg-123' : null,
        },
      });

      const message = {
        to: 'student@example.com',
        subject: 'Your submission has been graded',
        body: '<h2>Grade: 95</h2>',
        provider: NotificationProvider.EMAIL,
      };

      const result = await provider.send(message);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sendgrid.com/v3/mail/send',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should include correct email content in API call', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 202,
        headers: { get: () => null },
      });

      const message = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: '<p>Test Body</p>',
        provider: NotificationProvider.EMAIL,
      };

      await provider.send(message);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.personalizations[0].to[0].email).toBe('test@example.com');
      expect(body.personalizations[0].subject).toBe('Test Subject');
      expect(body.from.email).toBe('from@example.com');
      expect(body.content[0].value).toBe('<p>Test Body</p>');
      expect(body.content[0].type).toBe('text/html');
    });
  });

  describe('3. Email Failure Handling', () => {
    it('should handle 401 unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ errors: [{ message: 'Unauthorized' }] }),
      });

      const message = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        provider: NotificationProvider.EMAIL,
      };

      const result = await provider.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
      expect(result.error).toContain('Unauthorized');
    });

    it('should handle 400 bad request error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ errors: [{ message: 'Invalid email domain' }] }),
      });

      const message = {
        to: 'test@blocked-domain.com',
        subject: 'Test',
        body: 'Test',
        provider: NotificationProvider.EMAIL,
      };

      const result = await provider.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('400');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const message = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        provider: NotificationProvider.EMAIL,
      };

      const result = await provider.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should reject non-email provider type', async () => {
      const message = {
        to: '+11234567890',
        body: 'Test SMS',
        provider: NotificationProvider.SMS,
      };

      const result = await provider.send(message as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('only supports email');
    });
  });

  describe('4. Rate Limiting and Retry', () => {
    it('should handle 429 rate limit error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ errors: [{ message: 'Rate limit exceeded' }] }),
      });

      const message = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        provider: NotificationProvider.EMAIL,
      };

      const result = await provider.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('429');
    });

    it('should handle 500 internal server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ errors: [{ message: 'Internal server error' }] }),
      });

      const message = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        provider: NotificationProvider.EMAIL,
      };

      const result = await provider.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });
  });

  describe('5. Edge Cases', () => {
    it('should handle missing message ID in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 202,
        headers: {
          get: () => null,
        },
      });

      const message = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        provider: NotificationProvider.EMAIL,
      };

      const result = await provider.send(message);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeUndefined();
    });

    it('should handle malformed JSON error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const message = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        provider: NotificationProvider.EMAIL,
      };

      const result = await provider.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('400');
    });
  });
});
