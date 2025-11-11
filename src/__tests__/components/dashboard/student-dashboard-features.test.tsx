/**
 * Tests for Student Dashboard Features - HW9
 * TASK-15: Due Soon Badge
 * TASK-16: Assignment Sorting
 */

import React from "react";
import { render, screen, within, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StudentDashboardContent } from "@/components/dashboard/student-dashboard-content";
import { Assignment, Submission } from "@/lib/data-utils";

// Mock the modals
jest.mock("@/components/modals/submission-modal", () => ({
  SubmissionModal: () => <div data-testid="submission-modal" />,
}));

jest.mock("@/components/modals/regrade-request-modal", () => ({
  RegradeRequestModal: () => <div data-testid="regrade-modal" />,
}));

// Mock regrade actions
jest.mock("@/lib/regrade-actions", () => ({
  getRubricItemsForSubmission: jest.fn().mockResolvedValue({
    success: true,
    items: [],
    rubricScoreId: "test-rubric-id",
  }),
}));

describe("Student Dashboard Features - HW9", () => {
  const mockStudentId = "student-123";

  const createMockAssignment = (
    overrides: Partial<Assignment> & { submission?: Submission }
  ): Assignment & { submission?: Submission } => {
    const base: Assignment = {
      id: `assignment-${Math.random()}`,
      title: "Test Assignment",
      description: "Test description",
      instructions: "Test instructions",
      course_id: "course-123",
      instructor_id: "instructor-123",
      max_points: 100,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      status: "published",
      show_score_distribution: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      course: {
        id: "course-123",
        name: "Test Course",
        code: "CS101",
      },
    };
    return { ...base, ...overrides };
  };

  const mockStats = {
    total: 3,
    submitted: 1,
    pending: 2,
  };

  describe("TASK-15: Due Soon Badge", () => {
    it("should display 'Due Soon' badge for assignments due within 48 hours", () => {
      const dueSoonDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
      const assignments = [
        createMockAssignment({
          title: "Due Soon Assignment",
          due_date: dueSoonDate,
        }),
      ];

      render(
        <StudentDashboardContent
          assignments={assignments}
          stats={mockStats}
          studentId={mockStudentId}
        />
      );

      expect(screen.getByText("Due Soon")).toBeInTheDocument();
    });

    it("should NOT display 'Due Soon' badge for assignments due after 48 hours", () => {
      const farFutureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now
      const assignments = [
        createMockAssignment({
          title: "Future Assignment",
          due_date: farFutureDate,
        }),
      ];

      render(
        <StudentDashboardContent
          assignments={assignments}
          stats={mockStats}
          studentId={mockStudentId}
        />
      );

      expect(screen.queryByText("Due Soon")).not.toBeInTheDocument();
    });

    it("should NOT display 'Due Soon' badge for overdue assignments", () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
      const assignments = [
        createMockAssignment({
          title: "Overdue Assignment",
          due_date: pastDate,
        }),
      ];

      render(
        <StudentDashboardContent
          assignments={assignments}
          stats={mockStats}
          studentId={mockStudentId}
        />
      );

      expect(screen.queryByText("Due Soon")).not.toBeInTheDocument();
      expect(screen.getByText("(Overdue)")).toBeInTheDocument();
    });

    it("should NOT display 'Due Soon' badge for graded submissions", () => {
      const dueSoonDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const submission: Submission = {
        id: "sub-123",
        assignment_id: "assignment-123",
        student_id: mockStudentId,
        content: "Test content",
        attachments: [],
        status: "graded",
        grade: 95,
        feedback: "Great work",
        submitted_at: new Date().toISOString(),
        graded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const assignments = [
        createMockAssignment({
          title: "Graded Assignment",
          due_date: dueSoonDate,
          submission,
        }),
      ];

      render(
        <StudentDashboardContent
          assignments={assignments}
          stats={mockStats}
          studentId={mockStudentId}
        />
      );

      expect(screen.queryByText("Due Soon")).not.toBeInTheDocument();
    });

    it("should NOT display 'Due Soon' badge for submitted (not draft) assignments", () => {
      const dueSoonDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const submission: Submission = {
        id: "sub-123",
        assignment_id: "assignment-123",
        student_id: mockStudentId,
        content: "Test content",
        attachments: [],
        status: "submitted",
        grade: null,
        feedback: null,
        submitted_at: new Date().toISOString(),
        graded_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const assignments = [
        createMockAssignment({
          title: "Submitted Assignment",
          due_date: dueSoonDate,
          submission,
        }),
      ];

      render(
        <StudentDashboardContent
          assignments={assignments}
          stats={mockStats}
          studentId={mockStudentId}
        />
      );

      expect(screen.queryByText("Due Soon")).not.toBeInTheDocument();
    });

    it("should display 'Due Soon' badge for draft submissions", () => {
      const dueSoonDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const submission: Submission = {
        id: "sub-123",
        assignment_id: "assignment-123",
        student_id: mockStudentId,
        content: "Test content",
        attachments: [],
        status: "draft",
        grade: null,
        feedback: null,
        submitted_at: null,
        graded_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const assignments = [
        createMockAssignment({
          title: "Draft Assignment",
          due_date: dueSoonDate,
          submission,
        }),
      ];

      render(
        <StudentDashboardContent
          assignments={assignments}
          stats={mockStats}
          studentId={mockStudentId}
        />
      );

      expect(screen.getByText("Due Soon")).toBeInTheDocument();
    });

    it("should handle edge case: exactly 48 hours until due", () => {
      const exactly48Hours = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const assignments = [
        createMockAssignment({
          title: "48 Hour Assignment",
          due_date: exactly48Hours,
        }),
      ];

      render(
        <StudentDashboardContent
          assignments={assignments}
          stats={mockStats}
          studentId={mockStudentId}
        />
      );

      expect(screen.getByText("Due Soon")).toBeInTheDocument();
    });
  });

  describe("TASK-16: Assignment Sorting", () => {
    const createTestAssignments = (): (Assignment & { submission?: Submission })[] => {
      const now = Date.now();
      return [
        createMockAssignment({
          id: "assignment-1",
          title: "Zebra Assignment",
          due_date: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        }),
        createMockAssignment({
          id: "assignment-2",
          title: "Apple Assignment",
          due_date: new Date(now + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day
        }),
        createMockAssignment({
          id: "assignment-3",
          title: "Banana Assignment",
          due_date: new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
          submission: {
            id: "sub-1",
            assignment_id: "assignment-3",
            student_id: mockStudentId,
            content: "Test",
            attachments: [],
            status: "graded",
            grade: 90,
            feedback: null,
            submitted_at: new Date().toISOString(),
            graded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      ];
    };

    it("should render sort dropdown with default 'Due Date (Earliest)' option", () => {
      const assignments = createTestAssignments();

      render(
        <StudentDashboardContent
          assignments={assignments}
          stats={mockStats}
          studentId={mockStudentId}
        />
      );

      expect(screen.getByText("Sort by:")).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should sort by due date (earliest first) by default", () => {
      const assignments = createTestAssignments();

      render(
        <StudentDashboardContent
          assignments={assignments}
          stats={mockStats}
          studentId={mockStudentId}
        />
      );

      const assignmentElements = screen.getAllByRole("heading", { level: 3 });
      expect(assignmentElements[0]).toHaveTextContent("Apple Assignment"); // 1 day
      expect(assignmentElements[1]).toHaveTextContent("Zebra Assignment"); // 3 days
      expect(assignmentElements[2]).toHaveTextContent("Banana Assignment"); // 5 days
    });

    it("should sort by due date (latest first) when selected", () => {
      const assignments = createTestAssignments();

      render(
        <StudentDashboardContent
          assignments={assignments}
          stats={mockStats}
          studentId={mockStudentId}
        />
      );

      const sortDropdown = screen.getByRole("combobox");
      fireEvent.click(sortDropdown);

      const latestOption = screen.getByRole("option", { name: /Due Date \(Latest\)/i });
      fireEvent.click(latestOption);

      const assignmentElements = screen.getAllByRole("heading", { level: 3 });
      expect(assignmentElements[0]).toHaveTextContent("Banana Assignment"); // 5 days
      expect(assignmentElements[1]).toHaveTextContent("Zebra Assignment"); // 3 days
      expect(assignmentElements[2]).toHaveTextContent("Apple Assignment"); // 1 day
    });

    it("should sort by title (A-Z) when selected", () => {
      const assignments = createTestAssignments();

      render(
        <StudentDashboardContent
          assignments={assignments}
          stats={mockStats}
          studentId={mockStudentId}
        />
      );

      const sortDropdown = screen.getByRole("combobox");
      fireEvent.click(sortDropdown);

      const titleAscOption = screen.getByRole("option", { name: /Title \(A-Z\)/i });
      fireEvent.click(titleAscOption);

      const assignmentElements = screen.getAllByRole("heading", { level: 3 });
      expect(assignmentElements[0]).toHaveTextContent("Apple Assignment");
      expect(assignmentElements[1]).toHaveTextContent("Banana Assignment");
      expect(assignmentElements[2]).toHaveTextContent("Zebra Assignment");
    });

    it("should sort by title (Z-A) when selected", () => {
      const assignments = createTestAssignments();

      render(
        <StudentDashboardContent
          assignments={assignments}
          stats={mockStats}
          studentId={mockStudentId}
        />
      );

      const sortDropdown = screen.getByRole("combobox");
      fireEvent.click(sortDropdown);

      const titleDescOption = screen.getByRole("option", { name: /Title \(Z-A\)/i });
      fireEvent.click(titleDescOption);

      const assignmentElements = screen.getAllByRole("heading", { level: 3 });
      expect(assignmentElements[0]).toHaveTextContent("Zebra Assignment");
      expect(assignmentElements[1]).toHaveTextContent("Banana Assignment");
      expect(assignmentElements[2]).toHaveTextContent("Apple Assignment");
    });

    it("should sort by status when selected", () => {
      const now = Date.now();
      const assignments = [
        createMockAssignment({
          id: "assignment-1",
          title: "Graded Assignment",
          due_date: new Date(now + 1 * 24 * 60 * 60 * 1000).toISOString(),
          submission: {
            id: "sub-1",
            assignment_id: "assignment-1",
            student_id: mockStudentId,
            content: "Test",
            attachments: [],
            status: "graded",
            grade: 90,
            feedback: null,
            submitted_at: new Date().toISOString(),
            graded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
        createMockAssignment({
          id: "assignment-2",
          title: "Unsubmitted Assignment",
          due_date: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        createMockAssignment({
          id: "assignment-3",
          title: "Draft Assignment",
          due_date: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
          submission: {
            id: "sub-2",
            assignment_id: "assignment-3",
            student_id: mockStudentId,
            content: "Test",
            attachments: [],
            status: "draft",
            grade: null,
            feedback: null,
            submitted_at: null,
            graded_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      ];

      render(
        <StudentDashboardContent
          assignments={assignments}
          stats={mockStats}
          studentId={mockStudentId}
        />
      );

      const sortDropdown = screen.getByRole("combobox");
      fireEvent.click(sortDropdown);

      const statusOption = screen.getByRole("option", { name: /Status/i });
      fireEvent.click(statusOption);

      const assignmentElements = screen.getAllByRole("heading", { level: 3 });
      // Status order: draft (0), submitted (1), graded (2), none (3)
      expect(assignmentElements[0]).toHaveTextContent("Draft Assignment");
      expect(assignmentElements[1]).toHaveTextContent("Graded Assignment");
      expect(assignmentElements[2]).toHaveTextContent("Unsubmitted Assignment");
    });

    it("should persist sort selection during session", () => {
      const assignments = createTestAssignments();

      const { rerender } = render(
        <StudentDashboardContent
          assignments={assignments}
          stats={mockStats}
          studentId={mockStudentId}
        />
      );

      const sortDropdown = screen.getByRole("combobox");
      fireEvent.click(sortDropdown);

      const titleAscOption = screen.getByRole("option", { name: /Title \(A-Z\)/i });
      fireEvent.click(titleAscOption);

      // Rerender with the same component
      rerender(
        <StudentDashboardContent
          assignments={assignments}
          stats={mockStats}
          studentId={mockStudentId}
        />
      );

      // Verify sorting is still applied
      const assignmentElements = screen.getAllByRole("heading", { level: 3 });
      expect(assignmentElements[0]).toHaveTextContent("Apple Assignment");
    });

    it("should handle empty assignment list gracefully", () => {
      render(
        <StudentDashboardContent
          assignments={[]}
          stats={{ total: 0, submitted: 0, pending: 0 }}
          studentId={mockStudentId}
        />
      );

      expect(screen.getByText("Sort by:")).toBeInTheDocument();
      expect(
        screen.getByText("No assignments found. You may not be enrolled in any courses yet.")
      ).toBeInTheDocument();
    });
  });

  describe("Combined Features", () => {
    it("should display 'Due Soon' badge correctly after sorting", () => {
      const now = Date.now();
      const assignments = [
        createMockAssignment({
          id: "assignment-1",
          title: "Zebra Assignment",
          due_date: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days (no badge)
        }),
        createMockAssignment({
          id: "assignment-2",
          title: "Apple Assignment",
          due_date: new Date(now + 24 * 60 * 60 * 1000).toISOString(), // 24 hours (badge)
        }),
      ];

      render(
        <StudentDashboardContent
          assignments={assignments}
          stats={mockStats}
          studentId={mockStudentId}
        />
      );

      // Default sort by due date - Apple should be first with badge
      let assignmentElements = screen.getAllByRole("heading", { level: 3 });
      expect(assignmentElements[0]).toHaveTextContent("Apple Assignment");
      expect(screen.getByText("Due Soon")).toBeInTheDocument();

      // Sort by title A-Z
      const sortDropdown = screen.getByRole("combobox");
      fireEvent.click(sortDropdown);
      const titleAscOption = screen.getByRole("option", { name: /Title \(A-Z\)/i });
      fireEvent.click(titleAscOption);

      // Apple still first, should still have badge
      assignmentElements = screen.getAllByRole("heading", { level: 3 });
      expect(assignmentElements[0]).toHaveTextContent("Apple Assignment");
      expect(screen.getByText("Due Soon")).toBeInTheDocument();
    });
  });
});

