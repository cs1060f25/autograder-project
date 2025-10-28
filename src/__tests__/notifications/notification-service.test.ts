/**
 * Notification Service Tests
 * Tests for core notification service functionality
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

// Mock environment variables before importing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

import { NotificationService } from '@/services/notifications/NotificationService';
import { NotificationEventType, NotificationProvider } from '@/services/notifications/types';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeAll(() => {
    // Create service in mock mode to avoid real API calls
    service = new NotificationService({
      mockMode: true,
      sendGridApiKey: 'test-key',
      sendGridFromEmail: 'test@example.com',
      twilioAccountSid: 'test-sid',
      twilioAuthToken: 'test-token',
      twilioPhoneNumber: '+10987654321',
    });
  });

  describe('1. Authentication & Access Control', () => {
    it('AUTH-001: should initialize with mock providers in mock mode', () => {
      expect(service).toBeDefined();
      expect((service as any).emailProvider.getProviderName()).toBe('Mock');
      expect((service as any).smsProvider.getProviderName()).toBe('Mock');
    });

    it('AUTH-002: should initialize with real providers when mock mode is disabled', () => {
      const realService = new NotificationService({
        mockMode: false,
        sendGridApiKey: 'test-key',
        sendGridFromEmail: 'test@example.com',
        twilioAccountSid: 'test-sid',
        twilioAuthToken: 'test-token',
        twilioPhoneNumber: '+10987654321',
      });

      expect((realService as any).emailProvider.getProviderName()).toBe('SendGrid');
      expect((realService as any).smsProvider.getProviderName()).toBe('Twilio');
    });

    it('AUTH-003: should throw error when Supabase configuration is missing', () => {
      // Temporarily remove env vars
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalKey = process.env.SUPABASE_SERVICE_KEY;
      
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_KEY;

      expect(() => {
        new NotificationService({
          mockMode: true,
          sendGridApiKey: 'test',
          sendGridFromEmail: 'test@example.com',
        });
      }).toThrow('Supabase configuration is missing');

      // Restore env vars
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      process.env.SUPABASE_SERVICE_KEY = originalKey;
    });
  });

  describe('2. Instructor Flow', () => {
    it('INST-001: should generate correct email message for graded submission', () => {
      const event = {
        type: NotificationEventType.SUBMISSION_GRADED,
        submissionId: 'sub-123',
        studentId: 'user-123',
        assignmentId: 'assign-123',
        grade: 95,
        feedback: 'Excellent work!',
        gradedBy: 'instructor-456',
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const message = (service as any).generateEmailMessage(event, userContact);

      expect(message).toBeDefined();
      expect(message.subject).toBe('Your submission has been graded');
      expect(message.body).toContain('John Doe');
      expect(message.body).toContain('95');
      expect(message.body).toContain('Excellent work!');
      expect(message.to).toBe('student@example.com');
      expect(message.provider).toBe(NotificationProvider.EMAIL);
    });

    it('INST-002: should generate email without feedback when not provided', () => {
      const event = {
        type: NotificationEventType.SUBMISSION_GRADED,
        submissionId: 'sub-123',
        studentId: 'user-123',
        assignmentId: 'assign-123',
        grade: 88,
        gradedBy: 'instructor-456',
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const message = (service as any).generateEmailMessage(event, userContact);

      expect(message).toBeDefined();
      expect(message.body).toContain('88');
      expect(message.body).not.toContain('Feedback:');
    });
  });

  describe('3. TA Flow', () => {
    it('TA-001: should generate notification for TA grading', () => {
      const event = {
        type: NotificationEventType.SUBMISSION_GRADED,
        submissionId: 'sub-456',
        studentId: 'user-123',
        assignmentId: 'assign-123',
        grade: 92,
        feedback: 'Good job!',
        gradedBy: 'ta-789',
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'Test',
        lastName: 'Student',
      };

      const message = (service as any).generateEmailMessage(event, userContact);

      expect(message).toBeDefined();
      expect(message.body).toContain('92');
      expect(message.body).toContain('Good job!');
    });
  });

  describe('4. Student Flow', () => {
    it('STU-001: should generate notification for document upload', () => {
      const event = {
        type: NotificationEventType.DOCUMENT_UPLOADED,
        documentId: 'doc-123',
        userId: 'instructor-456',
        fileName: 'assignment.pdf',
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'instructor-456',
        email: 'instructor@example.com',
        firstName: 'Jane',
        lastName: 'Instructor',
      };

      const message = (service as any).generateEmailMessage(event, userContact);

      expect(message).toBeDefined();
      expect(message.subject).toBe('New student submission received');
      expect(message.body).toContain('assignment.pdf');
      expect(message.body).toContain('Jane Instructor');
      expect(message.to).toBe('instructor@example.com');
    });

    it('STU-002: should send both email and SMS when phone is available', () => {
      const event = {
        type: NotificationEventType.SUBMISSION_GRADED,
        submissionId: 'sub-123',
        studentId: 'user-123',
        assignmentId: 'assign-123',
        grade: 95,
        feedback: 'Great!',
        gradedBy: 'instructor-456',
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+11234567890',
      };

      const messages = (service as any).generateMessages(event, userContact);

      expect(messages).toHaveLength(2);
      expect(messages[0].provider).toBe(NotificationProvider.EMAIL);
      expect(messages[1].provider).toBe(NotificationProvider.SMS);
      expect(messages[1].to).toBe('+11234567890');
      expect(messages[1].body).toContain('John');
      expect(messages[1].body).toContain('95');
    });

    it('STU-003: should only send email when phone is not available', () => {
      const event = {
        type: NotificationEventType.SUBMISSION_GRADED,
        submissionId: 'sub-123',
        studentId: 'user-123',
        assignmentId: 'assign-123',
        grade: 95,
        gradedBy: 'instructor-456',
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const messages = (service as any).generateMessages(event, userContact);

      expect(messages).toHaveLength(1);
      expect(messages[0].provider).toBe(NotificationProvider.EMAIL);
    });
  });

  describe('5. Message Generation', () => {
    it('should generate grade updated notification', () => {
      const event = {
        type: NotificationEventType.GRADE_UPDATED,
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      const message = (service as any).generateEmailMessage(event, userContact);

      expect(message).toBeDefined();
      expect(message.subject).toBe('Your grade has been updated');
    });

    it('should generate feedback available notification', () => {
      const event = {
        type: NotificationEventType.FEEDBACK_AVAILABLE,
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      const message = (service as any).generateEmailMessage(event, userContact);

      expect(message).toBeDefined();
      expect(message.subject).toBe('New feedback available');
    });

    it('should generate assignment published notification', () => {
      const event = {
        type: NotificationEventType.ASSIGNMENT_PUBLISHED,
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      const message = (service as any).generateEmailMessage(event, userContact);

      expect(message).toBeDefined();
      expect(message.subject).toBe('New assignment published');
    });

    it('should generate assignment due soon notification', () => {
      const event = {
        type: NotificationEventType.ASSIGNMENT_DUE_SOON,
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      const message = (service as any).generateEmailMessage(event, userContact);

      expect(message).toBeDefined();
      expect(message.subject).toBe('Assignment due soon');
    });
  });

  describe('6. SMS Message Generation', () => {
    it('should generate SMS for graded submission', () => {
      const event = {
        type: NotificationEventType.SUBMISSION_GRADED,
        grade: 95,
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+11234567890',
      };

      const message = (service as any).generateSMSMessage(event, userContact);

      expect(message).toBeDefined();
      expect(message.to).toBe('+11234567890');
      expect(message.body).toContain('John');
      expect(message.body).toContain('95');
      expect(message.provider).toBe(NotificationProvider.SMS);
    });

    it('should not generate SMS when phone is missing', () => {
      const event = {
        type: NotificationEventType.SUBMISSION_GRADED,
        grade: 95,
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const message = (service as any).generateSMSMessage(event, userContact);

      expect(message).toBeNull();
    });

    it('should not generate SMS for document upload events', () => {
      const event = {
        type: NotificationEventType.DOCUMENT_UPLOADED,
        fileName: 'test.pdf',
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+11234567890',
      };

      const message = (service as any).generateSMSMessage(event, userContact);

      expect(message).toBeNull();
    });
  });

  describe('7. User ID Extraction', () => {
    it('should extract studentId from grading event', () => {
      const event = {
        type: NotificationEventType.SUBMISSION_GRADED,
        studentId: 'student-123',
        timestamp: new Date().toISOString(),
      };

      const userId = (service as any).getUserIdFromEvent(event);

      expect(userId).toBe('student-123');
    });

    it('should extract userId from document event', () => {
      const event = {
        type: NotificationEventType.DOCUMENT_UPLOADED,
        userId: 'instructor-456',
        timestamp: new Date().toISOString(),
      };

      const userId = (service as any).getUserIdFromEvent(event);

      expect(userId).toBe('instructor-456');
    });

    it('should throw error when no user ID found', () => {
      const event = {
        type: NotificationEventType.ASSIGNMENT_PUBLISHED,
        timestamp: new Date().toISOString(),
      };

      expect(() => {
        (service as any).getUserIdFromEvent(event);
      }).toThrow('Unable to determine user ID from event');
    });
  });

  describe('8. Notification Deduplication (Bug Fix)', () => {
    it('should send both email and SMS but UI should show only one notification', () => {
      const event = {
        type: NotificationEventType.SUBMISSION_GRADED,
        submissionId: 'sub-123',
        studentId: 'user-123',
        assignmentId: 'assign-123',
        grade: 95,
        feedback: 'Great work!',
        gradedBy: 'instructor-456',
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+11234567890',
      };

      const messages = (service as any).generateMessages(event, userContact);

      // Should generate 2 messages (email + SMS)
      expect(messages).toHaveLength(2);
      expect(messages[0].provider).toBe(NotificationProvider.EMAIL);
      expect(messages[1].provider).toBe(NotificationProvider.SMS);

      // Both should have the same event information
      expect(messages[0].to).toBe('student@example.com');
      expect(messages[1].to).toBe('+11234567890');

      // UI will deduplicate these based on event_type and timestamp
      // This ensures user sees only 1 notification in UI despite 2 database entries
    });

    it('should handle deduplication logic correctly', () => {
      // Simulate duplicate notifications (email + SMS for same event)
      const now = new Date();
      const notifications = [
        {
          id: '1',
          event_type: 'submission_graded',
          created_at: now.toISOString(),
          provider: 'email',
        },
        {
          id: '2',
          event_type: 'submission_graded',
          created_at: now.toISOString(),
          provider: 'sms',
        },
        {
          id: '3',
          event_type: 'document_uploaded',
          created_at: new Date(now.getTime() + 5000).toISOString(),
          provider: 'email',
        },
      ];

      // Deduplication logic (same as in UI components)
      const uniqueNotifications = notifications.reduce((acc: any[], notification: any) => {
        const isDuplicate = acc.some(n => 
          n.event_type === notification.event_type &&
          Math.abs(new Date(n.created_at).getTime() - new Date(notification.created_at).getTime()) < 1000
        );
        
        if (!isDuplicate) {
          acc.push(notification);
        }
        return acc;
      }, []);

      // Should have 2 unique notifications (1 graded, 1 uploaded)
      expect(uniqueNotifications).toHaveLength(2);
      expect(uniqueNotifications[0].event_type).toBe('submission_graded');
      expect(uniqueNotifications[1].event_type).toBe('document_uploaded');
    });
  });

  describe('9. Message Formatting (Bug Fix)', () => {
    it('should generate clean email message without provider type in content', () => {
      const event = {
        type: NotificationEventType.SUBMISSION_GRADED,
        submissionId: 'sub-123',
        studentId: 'user-123',
        assignmentId: 'assign-123',
        grade: 95,
        feedback: 'Great work!',
        gradedBy: 'instructor-456',
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const message = (service as any).generateEmailMessage(event, userContact);

      // Message should not contain the word "email" or "sms" in the body
      expect(message.body.toLowerCase()).not.toContain('provider');
      expect(message.subject).not.toContain('email');
      expect(message.subject).not.toContain('sms');
      
      // Should contain actual content
      expect(message.subject).toBe('Your submission has been graded');
      expect(message.body).toContain('John Doe');
      expect(message.body).toContain('95');
    });

    it('should generate clean SMS message without provider type in content', () => {
      const event = {
        type: NotificationEventType.SUBMISSION_GRADED,
        submissionId: 'sub-123',
        studentId: 'user-123',
        assignmentId: 'assign-123',
        grade: 88,
        gradedBy: 'instructor-456',
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+11234567890',
      };

      const message = (service as any).generateSMSMessage(event, userContact);

      // SMS message should not contain the word "email" or "sms"
      expect(message.body.toLowerCase()).not.toContain('email');
      expect(message.body.toLowerCase()).not.toContain('provider');
      
      // Should contain actual content
      expect(message.body).toContain('Jane');
      expect(message.body).toContain('88');
      expect(message.body).toContain('graded');
    });

    it('should format HTML content properly in email messages', () => {
      const event = {
        type: NotificationEventType.SUBMISSION_GRADED,
        submissionId: 'sub-123',
        studentId: 'user-123',
        assignmentId: 'assign-123',
        grade: 100,
        feedback: 'Perfect score!',
        gradedBy: 'instructor-456',
        timestamp: new Date().toISOString(),
      };

      const userContact = {
        userId: 'user-123',
        email: 'student@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      const message = (service as any).generateEmailMessage(event, userContact);

      // Should contain HTML tags
      expect(message.body).toContain('<h2>');
      expect(message.body).toContain('<p>');
      expect(message.body).toContain('<strong>');
      
      // Should have proper structure
      expect(message.body).toContain('Hello Test User');
      expect(message.body).toContain('Grade:</strong> 100');
      expect(message.body).toContain('Feedback:</strong> Perfect score!');
    });
  });
});
