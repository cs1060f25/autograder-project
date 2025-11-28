import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock next/navigation
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useParams: () => ({
    courseId: "course-1",
  }),
}));

// Mock course data
const mockCourse = {
  id: "course-1",
  name: "Introduction to Computer Science",
  code: "CS101",
  description: "An introductory course to computer science fundamentals",
  instructor_id: "instructor-1",
  created_at: "2024-01-01T00:00:00Z",
};

// Mock assignments for the course
const mockAssignments = [
  {
    id: "assignment-1",
    title: "Homework 1",
    description: "First homework assignment",
    course_id: "course-1",
    instructor_id: "instructor-1",
    due_date: "2024-02-01T23:59:59Z",
    max_points: 100,
    status: "published",
    submissions_count: 25,
    graded_count: 20,
    average_grade: 85,
  },
  {
    id: "assignment-2",
    title: "Midterm Project",
    description: "Midterm project submission",
    course_id: "course-1",
    instructor_id: "instructor-1",
    due_date: "2024-03-01T23:59:59Z",
    max_points: 200,
    status: "published",
    submissions_count: 30,
    graded_count: 0,
    average_grade: null,
  },
];

const mockEmptyAssignments: typeof mockAssignments = [];

// Placeholder component - will be replaced with actual implementation
const CourseDetail = ({
  course,
  assignments,
  onBack,
  onAssignmentClick,
}: {
  course: typeof mockCourse;
  assignments: typeof mockAssignments;
  onBack: () => void;
  onAssignmentClick: (assignmentId: string) => void;
}) => {
  return (
    <div data-testid="course-detail">
      <button onClick={onBack} data-testid="back-button">
        Back to Courses
      </button>

      <div data-testid="course-header">
        <h1>{course.name}</h1>
        <p>{course.code}</p>
        <p>{course.description}</p>
      </div>

      <div data-testid="assignments-section">
        <h2>Assignments</h2>
        {assignments.length === 0 ? (
          <div data-testid="empty-assignments">
            <p>No assignments yet</p>
            <p>Create your first assignment to get started</p>
          </div>
        ) : (
          <div data-testid="assignment-list">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                data-testid="assignment-card"
                onClick={() => onAssignmentClick(assignment.id)}
                role="button"
                tabIndex={0}
              >
                <h3>{assignment.title}</h3>
                <p>Due: {new Date(assignment.due_date).toLocaleDateString()}</p>
                <p>{assignment.max_points} points</p>
                <p>
                  {assignment.submissions_count} submissions, {assignment.graded_count} graded
                </p>
                {assignment.average_grade && <p>Average: {assignment.average_grade}%</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

describe("CourseDetail Component", () => {
  const mockOnBack = jest.fn();
  const mockOnAssignmentClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Course Information Display", () => {
    test("displays course name", () => {
      render(
        <CourseDetail
          course={mockCourse}
          assignments={mockAssignments}
          onBack={mockOnBack}
          onAssignmentClick={mockOnAssignmentClick}
        />
      );

      expect(screen.getByText("Introduction to Computer Science")).toBeInTheDocument();
    });

    test("displays course code", () => {
      render(
        <CourseDetail
          course={mockCourse}
          assignments={mockAssignments}
          onBack={mockOnBack}
          onAssignmentClick={mockOnAssignmentClick}
        />
      );

      expect(screen.getByText("CS101")).toBeInTheDocument();
    });

    test("displays course description", () => {
      render(
        <CourseDetail
          course={mockCourse}
          assignments={mockAssignments}
          onBack={mockOnBack}
          onAssignmentClick={mockOnAssignmentClick}
        />
      );

      expect(
        screen.getByText("An introductory course to computer science fundamentals")
      ).toBeInTheDocument();
    });
  });

  describe("Assignments Display", () => {
    test("shows assignments section", () => {
      render(
        <CourseDetail
          course={mockCourse}
          assignments={mockAssignments}
          onBack={mockOnBack}
          onAssignmentClick={mockOnAssignmentClick}
        />
      );

      expect(screen.getByTestId("assignments-section")).toBeInTheDocument();
      expect(screen.getByText("Assignments")).toBeInTheDocument();
    });

    test("displays all assignments for the course", () => {
      render(
        <CourseDetail
          course={mockCourse}
          assignments={mockAssignments}
          onBack={mockOnBack}
          onAssignmentClick={mockOnAssignmentClick}
        />
      );

      expect(screen.getAllByTestId("assignment-card")).toHaveLength(2);
      expect(screen.getByText("Homework 1")).toBeInTheDocument();
      expect(screen.getByText("Midterm Project")).toBeInTheDocument();
    });

    test("displays assignment due dates", () => {
      render(
        <CourseDetail
          course={mockCourse}
          assignments={mockAssignments}
          onBack={mockOnBack}
          onAssignmentClick={mockOnAssignmentClick}
        />
      );

      // Check for formatted dates
      expect(screen.getByText(/Due:/)).toBeInTheDocument();
    });

    test("displays assignment points", () => {
      render(
        <CourseDetail
          course={mockCourse}
          assignments={mockAssignments}
          onBack={mockOnBack}
          onAssignmentClick={mockOnAssignmentClick}
        />
      );

      expect(screen.getByText("100 points")).toBeInTheDocument();
      expect(screen.getByText("200 points")).toBeInTheDocument();
    });

    test("displays submission counts", () => {
      render(
        <CourseDetail
          course={mockCourse}
          assignments={mockAssignments}
          onBack={mockOnBack}
          onAssignmentClick={mockOnAssignmentClick}
        />
      );

      expect(screen.getByText("25 submissions, 20 graded")).toBeInTheDocument();
      expect(screen.getByText("30 submissions, 0 graded")).toBeInTheDocument();
    });
  });

  describe("Empty Assignments State", () => {
    test("shows empty state when no assignments", () => {
      render(
        <CourseDetail
          course={mockCourse}
          assignments={mockEmptyAssignments}
          onBack={mockOnBack}
          onAssignmentClick={mockOnAssignmentClick}
        />
      );

      expect(screen.getByTestId("empty-assignments")).toBeInTheDocument();
      expect(screen.getByText("No assignments yet")).toBeInTheDocument();
    });

    test("shows call to action in empty state", () => {
      render(
        <CourseDetail
          course={mockCourse}
          assignments={mockEmptyAssignments}
          onBack={mockOnBack}
          onAssignmentClick={mockOnAssignmentClick}
        />
      );

      expect(screen.getByText(/create your first assignment/i)).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    test("shows back navigation button", () => {
      render(
        <CourseDetail
          course={mockCourse}
          assignments={mockAssignments}
          onBack={mockOnBack}
          onAssignmentClick={mockOnAssignmentClick}
        />
      );

      expect(screen.getByTestId("back-button")).toBeInTheDocument();
    });

    test("clicking back button calls onBack", () => {
      render(
        <CourseDetail
          course={mockCourse}
          assignments={mockAssignments}
          onBack={mockOnBack}
          onAssignmentClick={mockOnAssignmentClick}
        />
      );

      fireEvent.click(screen.getByTestId("back-button"));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    test("clicking assignment calls onAssignmentClick with assignment id", () => {
      render(
        <CourseDetail
          course={mockCourse}
          assignments={mockAssignments}
          onBack={mockOnBack}
          onAssignmentClick={mockOnAssignmentClick}
        />
      );

      const assignmentCards = screen.getAllByTestId("assignment-card");
      fireEvent.click(assignmentCards[0]);

      expect(mockOnAssignmentClick).toHaveBeenCalledWith("assignment-1");
    });
  });

  describe("Accessibility", () => {
    test("assignment cards have role button", () => {
      render(
        <CourseDetail
          course={mockCourse}
          assignments={mockAssignments}
          onBack={mockOnBack}
          onAssignmentClick={mockOnAssignmentClick}
        />
      );

      const assignmentCards = screen.getAllByTestId("assignment-card");
      assignmentCards.forEach((card) => {
        expect(card).toHaveAttribute("role", "button");
      });
    });

    test("assignment cards have tabIndex for keyboard navigation", () => {
      render(
        <CourseDetail
          course={mockCourse}
          assignments={mockAssignments}
          onBack={mockOnBack}
          onAssignmentClick={mockOnAssignmentClick}
        />
      );

      const assignmentCards = screen.getAllByTestId("assignment-card");
      assignmentCards.forEach((card) => {
        expect(card).toHaveAttribute("tabIndex", "0");
      });
    });
  });
});
