import {
  getUserProfile,
  requireAuth,
  getDashboardPath,
  requireRole,
  hasRole,
  canAccessDashboard,
} from "@/lib/user-utils";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { UserRole } from "@/lib/user-utils";

// Mock dependencies
jest.mock("@/utils/supabase/server");
jest.mock("next/navigation", () => ({
  redirect: jest.fn().mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("User Utils", () => {
  let mockSupabase: any;

  const mockUser = {
    id: "user-123",
    email: "test@example.com",
  };

  const mockUserData = {
    id: "user-123",
    first_name: "John",
    last_name: "Doe",
    role: "student" as UserRole,
    onboarding_completed: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

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

  describe("getUserProfile", () => {
    it("should return null when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await getUserProfile();

      expect(result).toBeNull();
    });

    it("should return user profile when user is authenticated and exists in database", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUserData,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getUserProfile();

      expect(result).toEqual({
        ...mockUserData,
        email: mockUser.email,
      });
      expect(mockSupabase.from).toHaveBeenCalledWith("users");
    });

    it("should return null when user exists in auth but not in users table", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getUserProfile();

      expect(result).toBeNull();
    });
  });

  describe("requireAuth", () => {
    it("should redirect to login when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      try {
        await requireAuth();
      } catch (error: any) {
        expect(error.message).toBe("NEXT_REDIRECT");
      }

      expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("should redirect to onboarding when user has not completed onboarding", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockUserData, onboarding_completed: false },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      try {
        await requireAuth();
      } catch (error: any) {
        expect(error.message).toBe("NEXT_REDIRECT");
      }

      expect(redirect).toHaveBeenCalledWith("/onboarding");
    });

    it("should return user profile when user is authenticated and onboarded", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUserData,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await requireAuth();

      expect(result).toEqual({
        ...mockUserData,
        email: mockUser.email,
      });
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe("getDashboardPath", () => {
    it("should return correct path for student role", async () => {
      const path = await getDashboardPath("student");
      expect(path).toBe("/dashboard/student");
    });

    it("should return correct path for ta role", async () => {
      const path = await getDashboardPath("ta");
      expect(path).toBe("/dashboard/ta");
    });

    it("should return correct path for instructor role", async () => {
      const path = await getDashboardPath("instructor");
      expect(path).toBe("/dashboard/instructor");
    });

    it("should default to student dashboard for unknown role", async () => {
      const path = await getDashboardPath("unknown" as UserRole);
      expect(path).toBe("/dashboard/student");
    });
  });

  describe("requireRole", () => {
    it("should redirect to unauthorized when user does not have required role", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockUserData, role: "student" },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      try {
        await requireRole("instructor");
      } catch (error: any) {
        expect(error.message).toBe("NEXT_REDIRECT");
      }

      expect(redirect).toHaveBeenCalledWith("/unauthorized");
    });

    it("should return user profile when user has required role", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockUserData, role: "instructor" },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await requireRole("instructor");

      expect(result).toEqual({
        ...mockUserData,
        role: "instructor",
        email: mockUser.email,
      });
      expect(redirect).not.toHaveBeenCalledWith("/unauthorized");
    });
  });

  describe("hasRole", () => {
    it("should return true when user has the required role", async () => {
      const result = await hasRole(mockUserData, "student");
      expect(result).toBe(true);
    });

    it("should return false when user does not have the required role", async () => {
      const result = await hasRole(mockUserData, "instructor");
      expect(result).toBe(false);
    });
  });

  describe("canAccessDashboard", () => {
    it("should return true when user role matches dashboard role", async () => {
      const result = await canAccessDashboard(mockUserData, "student");
      expect(result).toBe(true);
    });

    it("should return false when user role does not match dashboard role", async () => {
      const result = await canAccessDashboard(mockUserData, "instructor");
      expect(result).toBe(false);
    });
  });
});
