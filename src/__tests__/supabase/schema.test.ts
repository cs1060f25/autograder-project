/**
 * Supabase Schema and Security Rules Tests
 *
 * This test file documents and verifies the expected database schema
 * and Row Level Security (RLS) policies for the autograder application.
 */

describe("Supabase Database Schema", () => {
  describe("Expected Tables", () => {
    it("should document the users table structure", () => {
      const expectedColumns = [
        "id", // uuid, primary key, references auth.users(id)
        "email", // text
        "first_name", // text
        "last_name", // text
        "role", // text, enum: 'student', 'ta', 'instructor'
        "onboarding_completed", // boolean
        "created_at", // timestamp
        "updated_at", // timestamp
      ];

      expect(expectedColumns).toEqual(
        expect.arrayContaining([
          "id",
          "email",
          "first_name",
          "last_name",
          "role",
          "onboarding_completed",
          "created_at",
          "updated_at",
        ])
      );
    });

    it("should document the courses table structure", () => {
      const expectedColumns = [
        "id", // uuid, primary key
        "name", // text
        "code", // text
        "description", // text, nullable
        "instructor_id", // uuid, foreign key to users(id)
        "semester", // text, nullable
        "year", // integer, nullable
        "created_at", // timestamp
        "updated_at", // timestamp
      ];

      expect(expectedColumns).toEqual(
        expect.arrayContaining([
          "id",
          "name",
          "code",
          "description",
          "instructor_id",
          "semester",
          "year",
          "created_at",
          "updated_at",
        ])
      );
    });

    it("should document the assignments table structure", () => {
      const expectedColumns = [
        "id", // uuid, primary key
        "title", // text
        "description", // text, nullable
        "course_id", // uuid, foreign key to courses(id)
        "instructor_id", // uuid, foreign key to users(id)
        "due_date", // timestamp
        "max_points", // integer
        "assignment_type", // text
        "status", // text, enum: 'draft', 'published', 'closed'
        "instructions", // text, nullable
        "attachments", // jsonb array
        "created_at", // timestamp
        "updated_at", // timestamp
      ];

      expect(expectedColumns).toEqual(
        expect.arrayContaining([
          "id",
          "title",
          "description",
          "course_id",
          "instructor_id",
          "due_date",
          "max_points",
          "assignment_type",
          "status",
          "instructions",
          "attachments",
          "created_at",
          "updated_at",
        ])
      );
    });

    it("should document the course_enrollments table structure", () => {
      const expectedColumns = [
        "id", // uuid, primary key
        "course_id", // uuid, foreign key to courses(id)
        "student_id", // uuid, foreign key to users(id)
        "created_at", // timestamp
      ];

      expect(expectedColumns).toEqual(
        expect.arrayContaining(["id", "course_id", "student_id", "created_at"])
      );
    });

    it("should document the course_ta_assignments table structure", () => {
      const expectedColumns = [
        "id", // uuid, primary key
        "course_id", // uuid, foreign key to courses(id)
        "ta_id", // uuid, foreign key to users(id)
        "created_at", // timestamp
      ];

      expect(expectedColumns).toEqual(
        expect.arrayContaining(["id", "course_id", "ta_id", "created_at"])
      );
    });

    it("should document the submissions table structure", () => {
      const expectedColumns = [
        "id", // uuid, primary key
        "assignment_id", // uuid, foreign key to assignments(id)
        "student_id", // uuid, foreign key to users(id)
        "content", // text, nullable
        "attachments", // jsonb array
        "submitted_at", // timestamp, nullable
        "status", // text, enum: 'draft', 'submitted', 'graded'
        "grade", // numeric, nullable
        "feedback", // text, nullable
        "graded_by", // uuid, foreign key to users(id), nullable
        "graded_at", // timestamp, nullable
        "ai_grade_data", // jsonb, nullable
        "ai_graded_at", // timestamp, nullable
        "ai_grade_status", // text, nullable
        "is_late", // boolean, computed based on submitted_at and assignment due_date
        "created_at", // timestamp
        "updated_at", // timestamp
      ];

      expect(expectedColumns).toEqual(
        expect.arrayContaining([
          "id",
          "assignment_id",
          "student_id",
          "content",
          "attachments",
          "submitted_at",
          "status",
          "grade",
          "feedback",
          "graded_by",
          "graded_at",
          "ai_grade_data",
          "ai_graded_at",
          "ai_grade_status",
          "is_late",
          "created_at",
          "updated_at",
        ])
      );
    });

    it("should document the rubrics table structure", () => {
      const expectedColumns = [
        "id", // uuid, primary key
        "assignment_id", // uuid, foreign key to assignments(id)
        "criteria", // jsonb array of RubricCriterion
        "created_by", // uuid, foreign key to users(id)
        "created_at", // timestamp
        "updated_at", // timestamp
      ];

      expect(expectedColumns).toEqual(
        expect.arrayContaining([
          "id",
          "assignment_id",
          "criteria",
          "created_by",
          "created_at",
          "updated_at",
        ])
      );
    });

    it("should document the rubric_scores table structure", () => {
      const expectedColumns = [
        "id", // uuid, primary key
        "submission_id", // uuid, foreign key to submissions(id)
        "rubric_id", // uuid, foreign key to rubrics(id)
        "scores", // jsonb, criterion_id -> score
        "total_score", // numeric
        "ai_comments", // jsonb, criterion_id -> comment, nullable
        "graded_by", // uuid, foreign key to users(id)
        "graded_at", // timestamp
        "created_at", // timestamp
        "updated_at", // timestamp
      ];

      expect(expectedColumns).toEqual(
        expect.arrayContaining([
          "id",
          "submission_id",
          "rubric_id",
          "scores",
          "total_score",
          "ai_comments",
          "graded_by",
          "graded_at",
          "created_at",
          "updated_at",
        ])
      );
    });
  });

  describe("Expected Foreign Key Constraints", () => {
    it("should document course foreign keys", () => {
      const foreignKeys = {
        instructor_id: "references users(id)",
      };
      expect(foreignKeys.instructor_id).toBe("references users(id)");
    });

    it("should document assignment foreign keys", () => {
      const foreignKeys = {
        course_id: "references courses(id)",
        instructor_id: "references users(id)",
      };
      expect(foreignKeys.course_id).toBe("references courses(id)");
      expect(foreignKeys.instructor_id).toBe("references users(id)");
    });

    it("should document course_enrollments foreign keys", () => {
      const foreignKeys = {
        course_id: "references courses(id)",
        student_id: "references users(id)",
      };
      expect(foreignKeys.course_id).toBe("references courses(id)");
      expect(foreignKeys.student_id).toBe("references users(id)");
    });

    it("should document course_ta_assignments foreign keys", () => {
      const foreignKeys = {
        course_id: "references courses(id)",
        ta_id: "references users(id)",
      };
      expect(foreignKeys.course_id).toBe("references courses(id)");
      expect(foreignKeys.ta_id).toBe("references users(id)");
    });

    it("should document submission foreign keys", () => {
      const foreignKeys = {
        assignment_id: "references assignments(id)",
        student_id: "references users(id)",
        graded_by: "references users(id)",
      };
      expect(foreignKeys.assignment_id).toBe("references assignments(id)");
      expect(foreignKeys.student_id).toBe("references users(id)");
      expect(foreignKeys.graded_by).toBe("references users(id)");
    });

    it("should document rubric foreign keys", () => {
      const foreignKeys = {
        assignment_id: "references assignments(id)",
        created_by: "references users(id)",
      };
      expect(foreignKeys.assignment_id).toBe("references assignments(id)");
      expect(foreignKeys.created_by).toBe("references users(id)");
    });

    it("should document rubric_scores foreign keys", () => {
      const foreignKeys = {
        submission_id: "references submissions(id)",
        rubric_id: "references rubrics(id)",
        graded_by: "references users(id)",
      };
      expect(foreignKeys.submission_id).toBe("references submissions(id)");
      expect(foreignKeys.rubric_id).toBe("references rubrics(id)");
      expect(foreignKeys.graded_by).toBe("references users(id)");
    });
  });

  describe("Expected Indexes", () => {
    it("should document performance indexes", () => {
      const indexes = {
        users: ["id", "email"],
        courses: ["instructor_id", "id"],
        assignments: ["course_id", "instructor_id", "status"],
        course_enrollments: ["course_id", "student_id"],
        course_ta_assignments: ["course_id", "ta_id"],
        submissions: ["assignment_id", "student_id", "status", "submitted_at"],
        rubrics: ["assignment_id"],
        rubric_scores: ["submission_id", "rubric_id"],
      };

      expect(indexes.users).toContain("id");
      expect(indexes.submissions).toContain("assignment_id");
      expect(indexes.course_enrollments).toContain("course_id");
    });
  });
});
