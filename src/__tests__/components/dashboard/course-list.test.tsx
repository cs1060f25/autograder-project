import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock course data
const mockCourses = [
  {
    id: "course-1",
    name: "Introduction to Computer Science",
    code: "CS101",
    description: "Intro course",
    instructor_id: "instructor-1",
    created_at: "2024-01-01T00:00:00Z",
    assignments_count: 5,
    students_count: 30,
    average_grade: 85,
  },
  {
    id: "course-2",
    name: "Data Structures",
    code: "CS201",
    description: "Advanced course",
    instructor_id: "instructor-1",
    created_at: "2024-01-01T00:00:00Z",
    assignments_count: 8,
    students_count: 25,
    average_grade: 78,
  },
];

const mockEmptyCourses: typeof mockCourses = [];

// Placeholder component - will be replaced with actual implementation
const CourseList = ({
  courses,
  onCourseClick,
}: {
  courses: typeof mockCourses;
  onCourseClick: (courseId: string) => void;
}) => {
  if (courses.length === 0) {
    return (
      <div data-testid="empty-state">
        <p>No courses found</p>
        <p>Create your first course to get started</p>
      </div>
    );
  }

  return (
    <div data-testid="course-list">
      {courses.map((course) => (
        <div
          key={course.id}
          data-testid="course-card"
          onClick={() => onCourseClick(course.id)}
          role="button"
          tabIndex={0}
          className="cursor-pointer"
        >
          <h3>{course.name}</h3>
          <p>{course.code}</p>
          <p>{course.students_count} students</p>
          <p>{course.assignments_count} assignments</p>
        </div>
      ))}
    </div>
  );
};

describe("CourseList Component", () => {
  const mockOnCourseClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("renders list of courses", () => {
      render(<CourseList courses={mockCourses} onCourseClick={mockOnCourseClick} />);

      expect(screen.getByTestId("course-list")).toBeInTheDocument();
      expect(screen.getAllByTestId("course-card")).toHaveLength(2);
    });

    test("displays course name for each course", () => {
      render(<CourseList courses={mockCourses} onCourseClick={mockOnCourseClick} />);

      expect(screen.getByText("Introduction to Computer Science")).toBeInTheDocument();
      expect(screen.getByText("Data Structures")).toBeInTheDocument();
    });

    test("displays course code for each course", () => {
      render(<CourseList courses={mockCourses} onCourseClick={mockOnCourseClick} />);

      expect(screen.getByText("CS101")).toBeInTheDocument();
      expect(screen.getByText("CS201")).toBeInTheDocument();
    });

    test("displays student count for each course", () => {
      render(<CourseList courses={mockCourses} onCourseClick={mockOnCourseClick} />);

      expect(screen.getByText("30 students")).toBeInTheDocument();
      expect(screen.getByText("25 students")).toBeInTheDocument();
    });

    test("displays assignment count for each course", () => {
      render(<CourseList courses={mockCourses} onCourseClick={mockOnCourseClick} />);

      expect(screen.getByText("5 assignments")).toBeInTheDocument();
      expect(screen.getByText("8 assignments")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    test("shows empty state when no courses", () => {
      render(<CourseList courses={mockEmptyCourses} onCourseClick={mockOnCourseClick} />);

      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
      expect(screen.getByText("No courses found")).toBeInTheDocument();
    });

    test("shows call to action in empty state", () => {
      render(<CourseList courses={mockEmptyCourses} onCourseClick={mockOnCourseClick} />);

      expect(screen.getByText(/create your first course/i)).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    test("course cards are clickable", () => {
      render(<CourseList courses={mockCourses} onCourseClick={mockOnCourseClick} />);

      const courseCards = screen.getAllByTestId("course-card");
      expect(courseCards[0]).toHaveAttribute("role", "button");
    });

    test("clicking course card calls onCourseClick with course id", () => {
      render(<CourseList courses={mockCourses} onCourseClick={mockOnCourseClick} />);

      const courseCards = screen.getAllByTestId("course-card");
      fireEvent.click(courseCards[0]);

      expect(mockOnCourseClick).toHaveBeenCalledWith("course-1");
    });

    test("clicking different courses passes correct course id", () => {
      render(<CourseList courses={mockCourses} onCourseClick={mockOnCourseClick} />);

      const courseCards = screen.getAllByTestId("course-card");

      fireEvent.click(courseCards[0]);
      expect(mockOnCourseClick).toHaveBeenCalledWith("course-1");

      fireEvent.click(courseCards[1]);
      expect(mockOnCourseClick).toHaveBeenCalledWith("course-2");
    });
  });

  describe("Accessibility", () => {
    test("course cards have tabIndex for keyboard navigation", () => {
      render(<CourseList courses={mockCourses} onCourseClick={mockOnCourseClick} />);

      const courseCards = screen.getAllByTestId("course-card");
      courseCards.forEach((card) => {
        expect(card).toHaveAttribute("tabIndex", "0");
      });
    });
  });
});
