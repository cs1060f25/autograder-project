import { signUp, signIn, signOut } from "@/lib/auth-actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// Mock the Supabase client and Next.js redirect
jest.mock("@/utils/supabase/server");
jest.mock("next/navigation", () => ({
  redirect: jest.fn().mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("Auth Actions", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
      },
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe("signUp", () => {
    it("should redirect to signup page when passwords do not match", async () => {
      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");
      formData.append("confirmPassword", "password456");
      formData.append("firstName", "John");
      formData.append("lastName", "Doe");

      try {
        await signUp(formData);
      } catch (error: any) {
        expect(error.message).toBe("NEXT_REDIRECT");
      }

      expect(redirect).toHaveBeenCalledWith(
        "/signup?error=Passwords do not match"
      );
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it("should successfully sign up a new user when passwords match", async () => {
      const mockUser = { id: "123", email: "test@example.com" };
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");
      formData.append("confirmPassword", "password123");
      formData.append("firstName", "John");
      formData.append("lastName", "Doe");

      try {
        await signUp(formData);
      } catch (error: any) {
        expect(error.message).toBe("NEXT_REDIRECT");
      }

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        options: {
          data: {
            first_name: "John",
            last_name: "Doe",
          },
        },
      });
      expect(redirect).toHaveBeenCalledWith(
        "/login?message=Check your email to confirm your account."
      );
    });

    it("should redirect to signup with error when signup fails", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: "Email already registered" },
      });

      const formData = new FormData();
      formData.append("email", "existing@example.com");
      formData.append("password", "password123");
      formData.append("confirmPassword", "password123");
      formData.append("firstName", "John");
      formData.append("lastName", "Doe");

      try {
        await signUp(formData);
      } catch (error: any) {
        expect(error.message).toBe("NEXT_REDIRECT");
      }

      expect(redirect).toHaveBeenCalledWith(
        "/signup?error=Email%20already%20registered"
      );
    });
  });

  describe("signIn", () => {
    it("should successfully sign in a user with valid credentials", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: "123", email: "test@example.com" } },
        error: null,
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");

      try {
        await signIn(formData);
      } catch (error: any) {
        expect(error.message).toBe("NEXT_REDIRECT");
      }

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(redirect).toHaveBeenCalledWith("/");
    });

    it("should redirect to login with error when signin fails", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid credentials" },
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "wrongpassword");

      try {
        await signIn(formData);
      } catch (error: any) {
        expect(error.message).toBe("NEXT_REDIRECT");
      }

      expect(redirect).toHaveBeenCalledWith(
        "/login?error=Invalid%20credentials"
      );
    });
  });

  describe("signOut", () => {
    it("should successfully sign out a user", async () => {
      mockSupabase.auth.signOut.mockResolvedValue({});

      try {
        await signOut();
      } catch (error: any) {
        expect(error.message).toBe("NEXT_REDIRECT");
      }

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login");
    });
  });
});
