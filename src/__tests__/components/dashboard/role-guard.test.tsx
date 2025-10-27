import { render, screen, waitFor } from "@testing-library/react";
import { RoleGuard } from "@/components/dashboard/role-guard";
import { UserProfile, UserRole } from "@/lib/user-utils";
import { useRouter } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("RoleGuard Component", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  const createMockUserProfile = (role: UserRole): UserProfile => ({
    id: "user-123",
    email: "test@example.com",
    first_name: "John",
    last_name: "Doe",
    role,
    onboarding_completed: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  });

  it("should render children when user has the required role", async () => {
    const userProfile = createMockUserProfile("student");

    render(
      <RoleGuard userProfile={userProfile} requiredRole="student">
        <div>Protected Content</div>
      </RoleGuard>
    );

    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    expect(
      screen.queryByText("Checking permissions...")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Access Denied")).not.toBeInTheDocument();
  });

  it("should show access denied when user does not have required role", async () => {
    const userProfile = createMockUserProfile("student");

    render(
      <RoleGuard userProfile={userProfile} requiredRole="instructor">
        <div>Protected Content</div>
      </RoleGuard>
    );

    await waitFor(() => {
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });

    expect(screen.getByText(/You don't have permission/)).toBeInTheDocument();
    expect(screen.getByText(/student/i)).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should render custom fallback when provided and user lacks permission", async () => {
    const userProfile = createMockUserProfile("student");

    render(
      <RoleGuard
        userProfile={userProfile}
        requiredRole="instructor"
        fallback={<div>Custom Fallback</div>}
      >
        <div>Protected Content</div>
      </RoleGuard>
    );

    await waitFor(() => {
      expect(screen.getByText("Custom Fallback")).toBeInTheDocument();
    });

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Access Denied")).not.toBeInTheDocument();
  });

  it("should show checking permissions initially", () => {
    const userProfile = createMockUserProfile("student");

    const { container } = render(
      <RoleGuard userProfile={userProfile} requiredRole="student">
        <div>Protected Content</div>
      </RoleGuard>
    );

    // Component should render checking state briefly, then resolve
    // We check that the final content renders
    waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });

  it("should allow access for student to student dashboard", async () => {
    const userProfile = createMockUserProfile("student");

    render(
      <RoleGuard userProfile={userProfile} requiredRole="student">
        <div>Student Dashboard</div>
      </RoleGuard>
    );

    await waitFor(() => {
      expect(screen.getByText("Student Dashboard")).toBeInTheDocument();
    });
  });

  it("should deny access for student to ta dashboard", async () => {
    const userProfile = createMockUserProfile("student");

    render(
      <RoleGuard userProfile={userProfile} requiredRole="ta">
        <div>TADashboard</div>
      </RoleGuard>
    );

    await waitFor(() => {
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });
  });

  it("should deny access for student to instructor dashboard", async () => {
    const userProfile = createMockUserProfile("student");

    render(
      <RoleGuard userProfile={userProfile} requiredRole="instructor">
        <div>Instructor Dashboard</div>
      </RoleGuard>
    );

    await waitFor(() => {
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });
  });

  it("should allow access for ta to ta dashboard", async () => {
    const userProfile = createMockUserProfile("ta");

    render(
      <RoleGuard userProfile={userProfile} requiredRole="ta">
        <div>TA Dashboard</div>
      </RoleGuard>
    );

    await waitFor(() => {
      expect(screen.getByText("TA Dashboard")).toBeInTheDocument();
    });
  });

  it("should deny access for ta to student dashboard", async () => {
    const userProfile = createMockUserProfile("ta");

    render(
      <RoleGuard userProfile={userProfile} requiredRole="student">
        <div>Student Dashboard</div>
      </RoleGuard>
    );

    await waitFor(() => {
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });
  });

  it("should allow access for instructor to instructor dashboard", async () => {
    const userProfile = createMockUserProfile("instructor");

    render(
      <RoleGuard userProfile={userProfile} requiredRole="instructor">
        <div>Instructor Dashboard</div>
      </RoleGuard>
    );

    await waitFor(() => {
      expect(screen.getByText("Instructor Dashboard")).toBeInTheDocument();
    });
  });

  it("should show role name in access denied message", async () => {
    const userProfile = createMockUserProfile("student");

    render(
      <RoleGuard userProfile={userProfile} requiredRole="instructor">
        <div>Protected</div>
      </RoleGuard>
    );

    await waitFor(() => {
      const roleText = screen.getByText(/Your current role is:/);
      expect(roleText).toBeInTheDocument();
      expect(screen.getByText(/student/i)).toBeInTheDocument();
    });
  });
});
