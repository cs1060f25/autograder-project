"use server";

import { createClient } from "@/utils/supabase/server";
import { UserProfile } from "./user-utils";

// Types for our data structures
export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  course_id: string | null;
  instructor_id: string;
  due_date: string;
  max_points: number;
  assignment_type: string;
  status: string;
  instructions: string | null;
  attachments: any[];
  created_at: string;
  updated_at: string;
  course?: {
    id: string;
    name: string;
    code: string;
  };
  rubric?: Rubric;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string | null;
  attachments: any[];
  submitted_at: string | null;
  status: string;
  grade: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  created_at: string;
  updated_at: string;
  assignment?: Assignment;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  instructor_id: string;
  semester: string | null;
  year: number | null;
  created_at: string;
  updated_at: string;
  _count?: {
    assignments: number;
    enrollments: number;
  };
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  max_points: number;
}

export interface Rubric {
  id: string;
  assignment_id: string;
  criteria: RubricCriterion[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RubricScores {
  id: string;
  submission_id: string;
  rubric_id: string;
  scores: Record<string, number>; // criterion_id -> score
  total_score: number;
  graded_by: string;
  graded_at: string;
  created_at: string;
  updated_at: string;
}

// Student Dashboard Data Functions
export async function getStudentAssignments(userProfile: UserProfile): Promise<{
  assignments: (Assignment & { submission?: Submission })[];
  stats: {
    total: number;
    submitted: number;
    pending: number;
  };
}> {
  const supabase = await createClient();

  // Get courses the student is enrolled in
  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select("course_id")
    .eq("student_id", userProfile.id);

  if (!enrollments || enrollments.length === 0) {
    return {
      assignments: [],
      stats: { total: 0, submitted: 0, pending: 0 },
    };
  }

  const courseIds = enrollments.map((e) => e.course_id);

  // Get assignments for enrolled courses
  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      `
      *,
      course:course_id (
        id,
        name,
        code
      )
    `
    )
    .in("course_id", courseIds)
    .eq("status", "published")
    .order("due_date", { ascending: true });

  if (!assignments) {
    return {
      assignments: [],
      stats: { total: 0, submitted: 0, pending: 0 },
    };
  }

  // Get submissions for these assignments
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("student_id", userProfile.id)
    .in(
      "assignment_id",
      assignments.map((a) => a.id)
    );

  // Combine assignments with submissions
  const assignmentsWithSubmissions = assignments.map((assignment) => {
    const submission = submissions?.find(
      (s) => s.assignment_id === assignment.id
    );
    return {
      ...assignment,
      submission,
    };
  });

  // Calculate stats
  const stats = {
    total: assignments.length,
    submitted: assignmentsWithSubmissions.filter(
      (a) =>
        a.submission?.status === "submitted" ||
        a.submission?.status === "graded"
    ).length,
    pending: assignmentsWithSubmissions.filter(
      (a) => !a.submission || a.submission.status === "draft"
    ).length,
  };

  return {
    assignments: assignmentsWithSubmissions,
    stats,
  };
}

// TA Dashboard Data Functions
export async function getTAAssignments(userProfile: UserProfile): Promise<{
  assignments: (Assignment & {
    submissions_count: number;
    graded_count: number;
    average_grade: number | null;
  })[];
  pendingGrading: (Submission & {
    assignment: Assignment;
    student: { first_name: string; last_name: string };
  })[];
  stats: {
    total: number;
    pending: number;
    graded_today: number;
    average_grade: number | null;
  };
}> {
  const supabase = await createClient();

  // Get courses the TA is assigned to
  const { data: taAssignments } = await supabase
    .from("course_ta_assignments")
    .select("course_id")
    .eq("ta_id", userProfile.id);

  if (!taAssignments || taAssignments.length === 0) {
    return {
      assignments: [],
      pendingGrading: [],
      stats: { total: 0, pending: 0, graded_today: 0, average_grade: null },
    };
  }

  const courseIds = taAssignments.map((a) => a.course_id);

  // Get assignments for assigned courses
  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      `
      *,
      course:course_id (
        id,
        name,
        code
      )
    `
    )
    .in("course_id", courseIds)
    .eq("status", "published")
    .order("due_date", { ascending: true });

  if (!assignments) {
    return {
      assignments: [],
      pendingGrading: [],
      stats: { total: 0, pending: 0, graded_today: 0, average_grade: null },
    };
  }

  // Get submission counts and grades for each assignment
  const assignmentsWithStats = await Promise.all(
    assignments.map(async (assignment) => {
      const { data: submissions } = await supabase
        .from("submissions")
        .select("id, status, grade")
        .eq("assignment_id", assignment.id);

      const submissions_count = submissions?.length || 0;
      const graded_count =
        submissions?.filter((s) => s.status === "graded").length || 0;
      const grades =
        submissions?.filter((s) => s.grade !== null).map((s) => s.grade!) || [];
      const average_grade =
        grades.length > 0
          ? grades.reduce((a, b) => a + b, 0) / grades.length
          : null;

      return {
        ...assignment,
        submissions_count,
        graded_count,
        average_grade,
      };
    })
  );

  // Get pending submissions for grading
  const { data: pendingSubmissions } = await supabase
    .from("submissions")
    .select(
      `
      *,
      assignment:assignment_id (
        id,
        title,
        course:course_id (
          id,
          name,
          code
        )
      ),
      student:student_id (
        first_name,
        last_name
      )
    `
    )
    .in(
      "assignment_id",
      assignments.map((a) => a.id)
    )
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true });

  // Calculate overall stats
  const totalAssignments = assignmentsWithStats.length;
  const totalPending = assignmentsWithStats.reduce(
    (acc, a) => acc + (a.submissions_count - a.graded_count),
    0
  );
  const allGrades = assignmentsWithStats.flatMap((a) =>
    a.average_grade ? [a.average_grade] : []
  );
  const overallAverage =
    allGrades.length > 0
      ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length
      : null;

  // Get graded today count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { count: gradedToday } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .in(
      "assignment_id",
      assignments.map((a) => a.id)
    )
    .eq("status", "graded")
    .gte("graded_at", today.toISOString())
    .lt("graded_at", tomorrow.toISOString());

  return {
    assignments: assignmentsWithStats,
    pendingGrading: pendingSubmissions || [],
    stats: {
      total: totalAssignments,
      pending: totalPending,
      graded_today: gradedToday || 0,
      average_grade: overallAverage,
    },
  };
}

// Instructor Dashboard Data Functions
export async function getInstructorData(userProfile: UserProfile): Promise<{
  courses: (Course & {
    assignments_count: number;
    students_count: number;
    average_grade: number | null;
  })[];
  recentAssignments: (Assignment & {
    submissions_count: number;
    graded_count: number;
    average_grade: number | null;
  })[];
  stats: {
    total_courses: number;
    total_students: number;
    active_assignments: number;
    average_grade: number | null;
  };
}> {
  const supabase = await createClient();

  // Get instructor's courses
  const { data: courses } = await supabase
    .from("courses")
    .select(
      `
      *,
      _count:course_enrollments(count),
      assignments:assignments(count)
    `
    )
    .eq("instructor_id", userProfile.id)
    .order("created_at", { ascending: false });

  if (!courses) {
    return {
      courses: [],
      recentAssignments: [],
      stats: {
        total_courses: 0,
        total_students: 0,
        active_assignments: 0,
        average_grade: null,
      },
    };
  }

  // Get detailed course data with assignment and student counts
  const coursesWithStats = await Promise.all(
    courses.map(async (course) => {
      // Get assignment count
      const { count: assignmentsCount } = await supabase
        .from("assignments")
        .select("*", { count: "exact", head: true })
        .eq("course_id", course.id);

      // Get student count
      const { count: studentsCount } = await supabase
        .from("course_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("course_id", course.id);

      // Get average grade for this course
      const { data: submissions } = await supabase
        .from("submissions")
        .select("grade")
        .in(
          "assignment_id",
          (
            await supabase
              .from("assignments")
              .select("id")
              .eq("course_id", course.id)
          ).data?.map((a) => a.id) || []
        )
        .not("grade", "is", null);

      const grades = submissions?.map((s) => s.grade) || [];
      const average_grade =
        grades.length > 0
          ? grades.reduce((a, b) => a + b, 0) / grades.length
          : null;

      return {
        ...course,
        assignments_count: assignmentsCount || 0,
        students_count: studentsCount || 0,
        average_grade,
      };
    })
  );

  // Get recent assignments across all courses
  const { data: recentAssignments } = await supabase
    .from("assignments")
    .select(
      `
      *,
      course:course_id (
        id,
        name,
        code
      )
    `
    )
    .eq("instructor_id", userProfile.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Get assignment stats
  const assignmentsWithStats = await Promise.all(
    (recentAssignments || []).map(async (assignment) => {
      const { data: submissions } = await supabase
        .from("submissions")
        .select("id, status, grade")
        .eq("assignment_id", assignment.id);

      const submissions_count = submissions?.length || 0;
      const graded_count =
        submissions?.filter((s) => s.status === "graded").length || 0;
      const grades =
        submissions?.filter((s) => s.grade !== null).map((s) => s.grade!) || [];
      const average_grade =
        grades.length > 0
          ? grades.reduce((a, b) => a + b, 0) / grades.length
          : null;

      return {
        ...assignment,
        submissions_count,
        graded_count,
        average_grade,
      };
    })
  );

  // Calculate overall stats
  const totalCourses = coursesWithStats.length;
  const totalStudents = coursesWithStats.reduce(
    (acc, c) => acc + c.students_count,
    0
  );
  const activeAssignments = assignmentsWithStats.filter(
    (a) => a.status !== "graded"
  ).length;

  const allGrades = [
    ...coursesWithStats.flatMap((c) =>
      c.average_grade ? [c.average_grade] : []
    ),
    ...assignmentsWithStats.flatMap((a) =>
      a.average_grade ? [a.average_grade] : []
    ),
  ];
  const overallAverage =
    allGrades.length > 0
      ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length
      : null;

  return {
    courses: coursesWithStats,
    recentAssignments: assignmentsWithStats,
    stats: {
      total_courses: totalCourses,
      total_students: totalStudents,
      active_assignments: activeAssignments,
      average_grade: overallAverage,
    },
  };
}
