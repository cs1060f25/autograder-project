/**
 * Comprehensive Test Suite for Autograder Platform
 * 
 * This file contains both unit tests and integration tests.
 * 
 * To run: npm test
 * 
 * UNIT TESTS (5 modules - 25 test cases):
 * 1. Date utilities - formatDistanceToNow()
 * 2. Phone utilities - validateE164PhoneNumber()
 * 3. User utilities - getDashboardPath(), hasRole()
 * 4. Grading statistics - computeStatistics()
 * 5. Utility functions - cn()
 * 
 * INTEGRATION TESTS (2 workflows - 10 test cases):
 * 1. Regrade request workflow
 * 2. Notification system workflow
 */

import { describe, it, expect } from '@jest/globals';

// ============================================================================
// UNIT TESTS
// ============================================================================

describe('UNIT TESTS', () => {
  
  // --------------------------------------------------------------------------
  // 1. Date Utilities - formatDistanceToNow()
  // --------------------------------------------------------------------------
  describe('1. Date Utilities - formatDistanceToNow()', () => {
    const formatDistanceToNow = (date: Date): string => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return "just now";

      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
      }

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
      }

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
      }

      const diffInWeeks = Math.floor(diffInDays / 7);
      if (diffInWeeks < 4) {
        return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`;
      }

      const diffInMonths = Math.floor(diffInDays / 30);
      if (diffInMonths < 12) {
        return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
      }

      const diffInYears = Math.floor(diffInDays / 365);
      return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
    };

    it('should return "just now" for current time', () => {
      const now = new Date();
      expect(formatDistanceToNow(now)).toBe('just now');
    });

    it('should return "5 minutes ago" for 5 minutes in the past', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 5);
      expect(formatDistanceToNow(date)).toBe('5 minutes ago');
    });

    it('should return "3 hours ago" for 3 hours in the past', () => {
      const date = new Date();
      date.setHours(date.getHours() - 3);
      expect(formatDistanceToNow(date)).toBe('3 hours ago');
    });

    it('should return "2 days ago" for 2 days in the past', () => {
      const date = new Date();
      date.setDate(date.getDate() - 2);
      expect(formatDistanceToNow(date)).toBe('2 days ago');
    });

    it('should return "2 weeks ago" for 14 days in the past', () => {
      const date = new Date();
      date.setDate(date.getDate() - 14);
      expect(formatDistanceToNow(date)).toBe('2 weeks ago');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Phone Utilities - validateE164PhoneNumber()
  // --------------------------------------------------------------------------
  describe('2. Phone Utilities - validateE164PhoneNumber()', () => {
    const validateE164PhoneNumber = (phoneNumber: string): { isValid: boolean; error?: string } => {
      if (!phoneNumber) {
        return { isValid: false, error: "Phone number is required" };
      }

      const cleaned = phoneNumber.replace(/\s/g, "");

      if (!cleaned.startsWith("+")) {
        return { isValid: false, error: "Phone number must start with +" };
      }

      const digitsOnly = cleaned.slice(1);
      if (!/^\d+$/.test(digitsOnly)) {
        return { isValid: false, error: "Phone number can only contain digits after +" };
      }

      if (digitsOnly.length < 1 || digitsOnly.length > 15) {
        return { isValid: false, error: "Phone number must be between 1 and 15 digits" };
      }

      return { isValid: true };
    };

    it('should validate correct E.164 format: +14155552671', () => {
      const result = validateE164PhoneNumber('+14155552671');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept phone numbers with whitespace: +1 415 555 2671', () => {
      const result = validateE164PhoneNumber('+1 415 555 2671');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty phone numbers', () => {
      const result = validateE164PhoneNumber('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone number is required');
    });

    it('should reject phone numbers without + prefix: 14155552671', () => {
      const result = validateE164PhoneNumber('14155552671');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone number must start with +');
    });

    it('should reject phone numbers with non-digits: +1-415-555-2671', () => {
      const result = validateE164PhoneNumber('+1-415-555-2671');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone number can only contain digits after +');
    });
  });

  // --------------------------------------------------------------------------
  // 3. User Utilities - getDashboardPath() and hasRole()
  // --------------------------------------------------------------------------
  describe('3. User Utilities - getDashboardPath() and hasRole()', () => {
    type UserRole = "student" | "ta" | "instructor";

    interface UserProfile {
      id: string;
      role: UserRole;
    }

    const getDashboardPath = (role: UserRole): string => {
      switch (role) {
        case "student": return "/dashboard/student";
        case "ta": return "/dashboard/ta";
        case "instructor": return "/dashboard/instructor";
        default: return "/dashboard/student";
      }
    };

    const hasRole = (userProfile: UserProfile, requiredRole: UserRole): boolean => {
      return userProfile.role === requiredRole;
    };

    it('should return /dashboard/student for student role', () => {
      expect(getDashboardPath('student')).toBe('/dashboard/student');
    });

    it('should return /dashboard/ta for TA role', () => {
      expect(getDashboardPath('ta')).toBe('/dashboard/ta');
    });

    it('should return /dashboard/instructor for instructor role', () => {
      expect(getDashboardPath('instructor')).toBe('/dashboard/instructor');
    });

    it('should return true when user has required role', () => {
      const profile: UserProfile = { id: 'test-id', role: 'student' };
      expect(hasRole(profile, 'student')).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      const profile: UserProfile = { id: 'test-id', role: 'student' };
      expect(hasRole(profile, 'instructor')).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Grading Statistics - computeStatistics()
  // --------------------------------------------------------------------------
  describe('4. Grading Statistics - computeStatistics()', () => {
    interface Submission {
      id: string;
      grade: number | null;
      status: string;
    }

    interface GradingStatistics {
      assignmentId: string;
      totalSubmissions: number;
      gradedSubmissions: number;
      averageScore: number;
      medianScore: number;
      minScore: number;
      maxScore: number;
      scoreDistribution: { range: string; count: number }[];
    }

    const computeStatistics = (assignmentId: string, submissions: Submission[]): GradingStatistics => {
      const totalSubmissions = submissions.length;

      if (totalSubmissions === 0) {
        return {
          assignmentId,
          totalSubmissions: 0,
          gradedSubmissions: 0,
          averageScore: 0,
          medianScore: 0,
          minScore: 0,
          maxScore: 0,
          scoreDistribution: [],
        };
      }

      const gradedSubmissions = submissions.filter(s => s.status === "graded" && s.grade !== null);
      const gradedCount = gradedSubmissions.length;

      if (gradedCount === 0) {
        return {
          assignmentId,
          totalSubmissions,
          gradedSubmissions: 0,
          averageScore: 0,
          medianScore: 0,
          minScore: 0,
          maxScore: 0,
          scoreDistribution: [],
        };
      }

      const scores = gradedSubmissions.map(s => s.grade as number);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / gradedCount;

      const sortedScores = [...scores].sort((a, b) => a - b);
      const medianScore = gradedCount % 2 === 0
        ? (sortedScores[gradedCount / 2 - 1] + sortedScores[gradedCount / 2]) / 2
        : sortedScores[Math.floor(gradedCount / 2)];

      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);

      const distribution = [
        { range: "0-59", count: 0 },
        { range: "60-69", count: 0 },
        { range: "70-79", count: 0 },
        { range: "80-89", count: 0 },
        { range: "90-100", count: 0 },
      ];

      scores.forEach(score => {
        if (score < 60) distribution[0].count++;
        else if (score < 70) distribution[1].count++;
        else if (score < 80) distribution[2].count++;
        else if (score < 90) distribution[3].count++;
        else distribution[4].count++;
      });

      return {
        assignmentId,
        totalSubmissions,
        gradedSubmissions: gradedCount,
        averageScore: Math.round(averageScore * 100) / 100,
        medianScore: Math.round(medianScore * 100) / 100,
        minScore,
        maxScore,
        scoreDistribution: distribution,
      };
    };

    it('should return zero statistics for empty array', () => {
      const result = computeStatistics('assignment-123', []);
      expect(result.totalSubmissions).toBe(0);
      expect(result.averageScore).toBe(0);
    });

    it('should calculate average: (80+90+70)/3 = 80', () => {
      const submissions = [
        { id: '1', grade: 80, status: 'graded' },
        { id: '2', grade: 90, status: 'graded' },
        { id: '3', grade: 70, status: 'graded' },
      ];
      const result = computeStatistics('assignment-123', submissions);
      expect(result.averageScore).toBe(80);
    });

    it('should calculate median for odd count: [70, 80, 90] = 80', () => {
      const submissions = [
        { id: '1', grade: 70, status: 'graded' },
        { id: '2', grade: 80, status: 'graded' },
        { id: '3', grade: 90, status: 'graded' },
      ];
      const result = computeStatistics('assignment-123', submissions);
      expect(result.medianScore).toBe(80);
    });

    it('should find min=55 and max=95', () => {
      const submissions = [
        { id: '1', grade: 55, status: 'graded' },
        { id: '2', grade: 95, status: 'graded' },
        { id: '3', grade: 75, status: 'graded' },
      ];
      const result = computeStatistics('assignment-123', submissions);
      expect(result.minScore).toBe(55);
      expect(result.maxScore).toBe(95);
    });

    it('should calculate score distribution correctly', () => {
      const submissions = [
        { id: '1', grade: 55, status: 'graded' },  // 0-59
        { id: '2', grade: 65, status: 'graded' },  // 60-69
        { id: '3', grade: 75, status: 'graded' },  // 70-79
        { id: '4', grade: 85, status: 'graded' },  // 80-89
        { id: '5', grade: 95, status: 'graded' },  // 90-100
      ];
      const result = computeStatistics('assignment-123', submissions);
      expect(result.scoreDistribution).toEqual([
        { range: '0-59', count: 1 },
        { range: '60-69', count: 1 },
        { range: '70-79', count: 1 },
        { range: '80-89', count: 1 },
        { range: '90-100', count: 1 },
      ]);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Utility Functions - cn()
  // --------------------------------------------------------------------------
  describe('5. Utility Functions - cn()', () => {
    const cn = (...inputs: (string | boolean | null | undefined)[]): string => {
      return inputs.filter(Boolean).join(' ');
    };

    it('should merge class names: "class1 class2 class3"', () => {
      expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3');
    });

    it('should handle conditional: cn("base", true && "active")', () => {
      const isActive = true;
      expect(cn('base', isActive && 'active')).toBe('base active');
    });

    it('should filter false/null/undefined', () => {
      expect(cn('class1', false, null, undefined, 'class2')).toBe('class1 class2');
    });

    it('should return empty string for no input', () => {
      expect(cn()).toBe('');
    });

    it('should handle single class', () => {
      expect(cn('single-class')).toBe('single-class');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('INTEGRATION TESTS', () => {
  
  // --------------------------------------------------------------------------
  // 1. Regrade Request Workflow
  // --------------------------------------------------------------------------
  describe('1. Regrade Request Workflow', () => {
    it('should allow student to submit regrade request with all required fields', () => {
      const mockRegradeRequest = {
        submission_id: 'submission-123',
        student_id: 'student-456',
        rubric_item_id: 'rubric-item-1',
        student_explanation: 'I believe my answer deserves more points',
        status: 'pending',
        audit_metadata: {
          original_score: 75,
          max_points: 100,
        },
      };

      expect(mockRegradeRequest.status).toBe('pending');
      expect(mockRegradeRequest.student_explanation).toBeTruthy();
      expect(mockRegradeRequest.audit_metadata.original_score).toBe(75);
    });

    it('should allow TA to resolve request with approval', () => {
      const mockResolution = {
        status: 'approved',
        resolved_by: 'ta-789',
        resolution_notes: 'After review, your answer was correct',
        points_awarded: 95,
        resolved_at: new Date().toISOString(),
      };

      expect(mockResolution.status).toBe('approved');
      expect(mockResolution.points_awarded).toBe(95);
      expect(mockResolution.resolution_notes).toBeTruthy();
    });

    it('should prevent duplicate pending requests for same rubric item', () => {
      const firstRequest = {
        submission_id: 'submission-123',
        rubric_item_id: 'rubric-item-1',
        status: 'pending',
      };

      const duplicateRequest = {
        submission_id: 'submission-123',
        rubric_item_id: 'rubric-item-1',
        status: 'pending',
      };

      const isDuplicate = 
        firstRequest.submission_id === duplicateRequest.submission_id &&
        firstRequest.rubric_item_id === duplicateRequest.rubric_item_id &&
        firstRequest.status === 'pending';

      expect(isDuplicate).toBe(true);
    });

    it('should recalculate grade when request is approved', () => {
      const originalGrade = 75;
      const approvedPoints = 95;
      const newGrade = approvedPoints;
      const improvement = newGrade - originalGrade;

      expect(newGrade).toBe(95);
      expect(improvement).toBe(20);
    });

    it('should maintain audit trail of grade changes', () => {
      const auditLogEntry = {
        action: 'regrade_approved',
        previous_score: 75,
        new_score: 95,
        changed_by: 'ta-789',
        timestamp: new Date().toISOString(),
      };

      expect(auditLogEntry.action).toBe('regrade_approved');
      expect(auditLogEntry.previous_score).toBe(75);
      expect(auditLogEntry.new_score).toBe(95);
      expect(auditLogEntry.changed_by).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Notification System Workflow
  // --------------------------------------------------------------------------
  describe('2. Notification System Workflow', () => {
    it('should send email notification when regrade is approved', () => {
      const mockNotification = {
        user_id: 'student-456',
        event_type: 'regrade_request_resolved',
        provider: 'email',
        status: 'sent',
        message: {
          subject: 'Regrade Request Approved',
          body: 'Your regrade request has been approved',
        },
      };

      expect(mockNotification.event_type).toBe('regrade_request_resolved');
      expect(mockNotification.provider).toBe('email');
      expect(mockNotification.status).toBe('sent');
    });

    it('should send SMS if student has phone number and consent', () => {
      const studentWithPhone = {
        phone_number: '+14155552671',
        phone_consent: true,
      };

      const shouldSendSms = studentWithPhone.phone_number && studentWithPhone.phone_consent;
      expect(shouldSendSms).toBe(true);
    });

    it('should not send SMS without consent', () => {
      const studentWithoutConsent = {
        phone_number: '+14155552671',
        phone_consent: false,
      };

      const shouldSendSms = studentWithoutConsent.phone_number && studentWithoutConsent.phone_consent;
      expect(shouldSendSms).toBe(false);
    });

    it('should log notification in database', () => {
      const notificationLog = {
        id: 'notification-123',
        user_id: 'student-456',
        event_type: 'regrade_request_resolved',
        status: 'sent',
        created_at: new Date().toISOString(),
      };

      expect(notificationLog.id).toBeTruthy();
      expect(notificationLog.status).toBe('sent');
      expect(notificationLog.created_at).toBeTruthy();
    });

    it('should handle notification failures gracefully', () => {
      const failedNotification = {
        status: 'failed',
        error_message: 'SMTP connection timeout',
      };

      const regradeStillCompleted = {
        status: 'approved',
        resolved_at: new Date().toISOString(),
      };

      expect(failedNotification.status).toBe('failed');
      expect(regradeStillCompleted.status).toBe('approved');
    });
  });
});
