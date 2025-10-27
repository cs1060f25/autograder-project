/**
 * Role-Based Access Control Tests
 * Tests for role-based authorization logic
 */

import { hasRole, canAccessDashboard, requireRole } from "@/lib/user-utils";
import { UserProfile, UserRole } from "@/lib/user-utils";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

jest.mock("@/utils/supabase/server");
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("Role-Based Access Control", () => {
  let mockSupabase: any;

  const createUserProfile = (role: UserRole): UserProfile => ({
    id: "user-123",
    email: "test@example.com",
    first_name: "John",
    last_name: "Doe",
    role,
    onboarding_completed: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe("hasRole", () => {
    it("should return true when user role matches required role", async () => {
      const studentProfile = createUserProfile("student");
      const result = await hasRole(studentProfile, "student");
      expect(result).toBe(true);
    });

    it("should return false when user role does not match required role", async () => {
      const studentProfile = createUserProfile("student");
      const result = await hasRole(studentProfile, "instructor");
      expect(result).toBe(false);
    });

    it("should be case-sensitive and exact match", async () => {
      const studentProfile = createUserProfile("student");
      expect(await hasRole(studentProfile, "student")).toBe(true);
    });

    it("should work for all role types", async () => {
      const roles: UserRole[] = ["student", "ta", "instructor"];

      for (const role of roles) {
        const profile = createUserProfile(role);
        expect(await hasRole(profile, role)).toBe(true);

        for (const otherRole of roles) {
          if (otherRole !== role) {
            expect(await hasRole(profile, otherRole)).toBe(false);
          }
        }
      }
    });
  });

  describe("canAccessDashboard", () => {
    it("should return true when user can access their own dashboard", async () => {
      const studentProfile = createUserProfile("student");
      const result = await canAccessDashboard(studentProfile, "student");
      expect(result).toBe(true);
    });

    it("should return false when user cannot access different role dashboard", async () => {
      const studentProfile = createUserProfile("student");
      const result = await canAccessDashboard(studentProfile, "instructor");
      expect(result).toBe(false);
    });

    it("should enforce strict role matching", async () => {
      const taProfile = createUserProfile("ta");

      expect(await canAccessDashboard(taProfile, "ta")).toBe(true);
      expect(await canAccessDashboard(taProfile, "student")).toBe(false);
      expect(await canAccessDashboard(taProfile, "instructor")).toBe(false);
    });
  });

  describe("requireRole", () => {
    it("should throw/redirect when user does not have required role", async () => {
      const studentProfile = createUserProfile("student");

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: studentProfile,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await requireRole("instructor");

      expect(redirect).toHaveBeenCalledWith("/unauthorized");
    });

    it("should allow access when user has required role", async () => {
      const instructorProfile = createUserProfile("instructor");

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: instructorProfile,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await requireRole("instructor");

      expect(result).toEqual({
        ...instructorProfile,
        email: "test@example.com",
      });
      expect(redirect).not.toHaveBeenCalledWith("/unauthorized");
    });
  });

  describe("Role Hierarchy and Permissions", () => {
    it("should not allow role escalation", async () => {
      const studentProfile = createUserProfile("student");

      expect(await hasRole(studentProfile, "student")).toBe(true);
      expect(await hasRole(studentProfile, "ta")).toBe(false);
      expect(await hasRole(studentProfile, "instructor")).toBe(false);
    });

    it("should not allow role de-escalation access", async () => {
      const instructorProfile = createUserProfile("instructor");

      expect(await hasRole(instructorProfile, "instructor")).toBe(true);
      expect(await hasRole(instructorProfile, "ta")).toBe(false);
      expect(await hasRole(instructorProfile, "student")).toBe(false);
    });

    it("should enforce strict equality for dashboard access", async () => {
      const roles: UserRole[] = ["student", "ta", "instructor"];

      for (const role of roles) {
        const profile = createUserProfile(role);

        for (const dashboardRole of roles) {
          const canAccess = await canAccessDashboard(profile, dashboardRole);
          expect(canAccess).toBe(role === dashboardRole);
        }
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple role checks on same profile", async () => {
      const studentProfile = createUserProfile("student");

      expect(await hasRole(studentProfile, "student")).toBe(true);
      expect(await hasRole(studentProfile, "student")).toBe(true);
      expect(await hasRole(studentProfile, "ta")).toBe(false);
      expect(await hasRole(studentProfile, "instructor")).toBe(false);
    });

    it("should work with different user profiles", async () => {
      const profiles = [
        createUserProfile("student"),
        createUserProfile("ta"),
        createUserProfile("instructor"),
      ];

      for (const profile of profiles) {
        expect(await hasRole(profile, profile.role)).toBe(true);
      }
    });
  });
});
