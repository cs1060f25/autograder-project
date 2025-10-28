/**
 * Twilio Provider Tests
 * Tests for SMS notification delivery via Twilio
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TwilioProvider } from '@/services/notifications/providers/TwilioProvider';
import { NotificationProvider } from '@/services/notifications/types';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('Twilio SMS Provider', () => {
  let provider: TwilioProvider;

  beforeEach(() => {
    provider = new TwilioProvider('test-sid', 'test-token', '+10987654321');
    mockFetch.mockClear();
  });

  describe('1. Configuration Tests', () => {
    it('should be configured with valid credentials', () => {
      expect(provider.isConfigured()).toBe(true);
      expect(provider.getProviderName()).toBe('Twilio');
    });

    it('should not be configured without account SID', () => {
      const invalidProvider = new TwilioProvider('', 'token', '+1234567890');
      expect(invalidProvider.isConfigured()).toBe(false);
    });

    it('should not be configured without auth token', () => {
      const invalidProvider = new TwilioProvider('sid', '', '+1234567890');
      expect(invalidProvider.isConfigured()).toBe(false);
    });

    it('should not be configured without phone number', () => {
      const invalidProvider = new TwilioProvider('sid', 'token', '');
      expect(invalidProvider.isConfigured()).toBe(false);
    });

    it('should fail when not configured', async () => {
      const unconfiguredProvider = new TwilioProvider('', '', '');

      const message = {
        to: '+11234567890',
        body: 'Test',
        provider: NotificationProvider.SMS,
      };

      const result = await unconfiguredProvider.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not properly configured');
    });
  });

  describe('2. Successful SMS Delivery', () => {
    it('should send SMS successfully with 201 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ sid: 'SM123456' }),
      });

      const message = {
        to: '+11234567890',
        body: 'Your submission has been graded. Grade: 95',
        provider: NotificationProvider.SMS,
      };

      const result = await provider.send(message);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('SM123456');
    });

    it('should use correct Twilio API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ sid: 'SM123456' }),
      });

      const message = {
        to: '+11234567890',
        body: 'Test message',
        provider: NotificationProvider.SMS,
      };

      await provider.send(message);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      const url = callArgs[0];

      expect(url).toContain('test-sid');
      expect(url).toContain('/Messages.json');
      expect(url).toContain('api.twilio.com');
    });

    it('should include correct headers and auth', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ sid: 'SM123456' }),
      });

      const message = {
        to: '+11234567890',
        body: 'Test',
        provider: NotificationProvider.SMS,
      };

      await provider.send(message);

      const callArgs = mockFetch.mock.calls[0];
      const options = callArgs[1];

      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(options.headers['Authorization']).toContain('Basic');
    });

    it('should format phone numbers correctly in request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ sid: 'SM123456' }),
      });

      const message = {
        to: '+11234567890',
        body: 'Test',
        provider: NotificationProvider.SMS,
      };

      await provider.send(message);

      const callArgs = mockFetch.mock.calls[0];
      const body = callArgs[1].body;

      expect(body).toContain('To=%2B11234567890');
      expect(body).toContain('From=%2B10987654321');
      expect(body).toContain('Body=Test');
    });
  });

  describe('3. SMS Failure Handling', () => {
    it('should handle 400 invalid phone number error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ 
          message: 'Invalid phone number',
          code: 21211,
        }),
      });

      const message = {
        to: 'invalid-number',
        body: 'Test',
        provider: NotificationProvider.SMS,
      };

      const result = await provider.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('400');
    });

    it('should handle 401 authentication error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ 
          message: 'Authentication failed',
          code: 20003,
        }),
      });

      const message = {
        to: '+11234567890',
        body: 'Test',
        provider: NotificationProvider.SMS,
      };

      const result = await provider.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const message = {
        to: '+11234567890',
        body: 'Test',
        provider: NotificationProvider.SMS,
      };

      const result = await provider.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });

    it('should reject non-SMS provider type', async () => {
      const message = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        provider: NotificationProvider.EMAIL,
      };

      const result = await provider.send(message as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('only supports SMS');
    });
  });

  describe('4. Rate Limiting', () => {
    it('should handle 429 rate limit error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ 
          message: 'Too many requests',
          code: 20429,
        }),
      });

      const message = {
        to: '+11234567890',
        body: 'Test',
        provider: NotificationProvider.SMS,
      };

      const result = await provider.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('429');
    });

    it('should handle 503 service unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ 
          message: 'Service temporarily unavailable',
        }),
      });

      const message = {
        to: '+11234567890',
        body: 'Test',
        provider: NotificationProvider.SMS,
      };

      const result = await provider.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('503');
    });
  });

  describe('5. Edge Cases', () => {
    it('should handle missing SID in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({}),
      });

      const message = {
        to: '+11234567890',
        body: 'Test',
        provider: NotificationProvider.SMS,
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
        to: '+11234567890',
        body: 'Test',
        provider: NotificationProvider.SMS,
      };

      const result = await provider.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('400');
    });

    it('should handle special characters in message body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ sid: 'SM123456' }),
      });

      const message = {
        to: '+11234567890',
        body: 'Test with special chars: & = % #',
        provider: NotificationProvider.SMS,
      };

      const result = await provider.send(message);

      expect(result.success).toBe(true);
      
      // Check that special characters are URL encoded
      const callArgs = mockFetch.mock.calls[0];
      const body = callArgs[1].body;
      expect(body).toContain('Body=Test+with+special+chars');
    });
  });
});
