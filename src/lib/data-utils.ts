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
  show_score_distribution?: boolean;
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
  ai_grade_data: any | null;
  ai_graded_at: string | null;
  ai_grade_status: string | null;
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
  presets?: Array<{
    points: number;
    description: string;
  }>;
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
  ai_comments: Record<string, string> | null; // criterion_id -> AI comment
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

// Course Detail Data Functions
export async function getCourseById(courseId: string): Promise<Course | null> {
  const supabase = await createClient();

  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (error || !course) {
    return null;
  }

  return course;
}

export async function getCourseAssignments(
  courseId: string,
  includeStats: boolean = true
): Promise<
  (Assignment & {
    submissions_count: number;
    graded_count: number;
    average_grade: number | null;
  })[]
> {
  const supabase = await createClient();

  const { data: assignments, error } = await supabase
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
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error || !assignments) {
    return [];
  }

  if (!includeStats) {
    return assignments.map((a) => ({
      ...a,
      submissions_count: 0,
      graded_count: 0,
      average_grade: null,
    }));
  }

  // Get stats for each assignment
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

  return assignmentsWithStats;
}

export async function getInstructorCourseDetail(
  courseId: string,
  userProfile: UserProfile
): Promise<{
  course: Course & {
    assignments_count: number;
    students_count: number;
    average_grade: number | null;
  };
  assignments: (Assignment & {
    submissions_count: number;
    graded_count: number;
    average_grade: number | null;
  })[];
} | null> {
  const supabase = await createClient();

  // Get course and verify ownership
  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("instructor_id", userProfile.id)
    .single();

  if (error || !course) {
    return null;
  }

  // Get assignment count
  const { count: assignmentsCount } = await supabase
    .from("assignments")
    .select("*", { count: "exact", head: true })
    .eq("course_id", courseId);

  // Get student count
  const { count: studentsCount } = await supabase
    .from("course_enrollments")
    .select("*", { count: "exact", head: true })
    .eq("course_id", courseId);

  // Get assignments with stats
  const assignments = await getCourseAssignments(courseId);

  // Calculate average grade
  const allGrades = assignments.flatMap((a) =>
    a.average_grade ? [a.average_grade] : []
  );
  const average_grade =
    allGrades.length > 0
      ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length
      : null;

  return {
    course: {
      ...course,
      assignments_count: assignmentsCount || 0,
      students_count: studentsCount || 0,
      average_grade,
    },
    assignments,
  };
}

// Student Course Data Functions
export async function getStudentEnrolledCourses(
  userProfile: UserProfile
): Promise<
  (Course & {
    assignments_count: number;
    pending_count: number;
    submitted_count: number;
  })[]
> {
  const supabase = await createClient();

  // Get courses the student is enrolled in
  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select(
      `
      course_id,
      course:course_id (
        id,
        name,
        code,
        description,
        instructor_id,
        semester,
        year,
        created_at,
        updated_at
      )
    `
    )
    .eq("student_id", userProfile.id);

  if (!enrollments || enrollments.length === 0) {
    return [];
  }

  // Get stats for each course
  const coursesWithStats = await Promise.all(
    enrollments.map(async (enrollment) => {
      const course = enrollment.course as unknown as Course;

      // Get published assignments for this course
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id")
        .eq("course_id", course.id)
        .eq("status", "published");

      const assignmentIds = assignments?.map((a) => a.id) || [];

      // Get submissions for these assignments
      const { data: submissions } = await supabase
        .from("submissions")
        .select("assignment_id, status")
        .eq("student_id", userProfile.id)
        .in("assignment_id", assignmentIds);

      const submittedAssignmentIds = new Set(
        submissions
          ?.filter((s) => s.status === "submitted" || s.status === "graded")
          .map((s) => s.assignment_id) || []
      );

      return {
        ...course,
        assignments_count: assignmentIds.length,
        submitted_count: submittedAssignmentIds.size,
        pending_count: assignmentIds.length - submittedAssignmentIds.size,
      };
    })
  );

  return coursesWithStats;
}

export async function getStudentCourseDetail(
  courseId: string,
  userProfile: UserProfile
): Promise<{
  course: Course;
  assignments: (Assignment & { submission?: Submission })[];
} | null> {
  const supabase = await createClient();

  // Verify student is enrolled in this course
  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("course_id")
    .eq("course_id", courseId)
    .eq("student_id", userProfile.id)
    .single();

  if (!enrollment) {
    return null;
  }

  // Get course
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (!course) {
    return null;
  }

  // Get published assignments for this course
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
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("due_date", { ascending: true });

  if (!assignments) {
    return { course, assignments: [] };
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

  return {
    course,
    assignments: assignmentsWithSubmissions,
  };
}

// Score Distribution Data
export interface ScoreDistribution {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
  histogram: {
    range: string;
    count: number;
  }[];
  totalGraded: number;
}

export async function getScoreDistribution(
  assignmentId: string
): Promise<ScoreDistribution | null> {
  const supabase = await createClient();

  // Get all graded submissions for this assignment
  const { data: submissions, error } = await supabase
    .from("submissions")
    .select("grade")
    .eq("assignment_id", assignmentId)
    .eq("status", "graded")
    .not("grade", "is", null);

  if (error || !submissions || submissions.length === 0) {
    return null;
  }

  const grades = submissions.map((s) => s.grade as number).sort((a, b) => a - b);
  const n = grades.length;

  // Calculate mean
  const mean = grades.reduce((sum, grade) => sum + grade, 0) / n;

  // Calculate median
  const median =
    n % 2 === 0
      ? (grades[n / 2 - 1] + grades[n / 2]) / 2
      : grades[Math.floor(n / 2)];

  // Calculate min and max
  const min = grades[0];
  const max = grades[n - 1];

  // Calculate standard deviation
  const variance =
    grades.reduce((sum, grade) => sum + Math.pow(grade - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Calculate quartiles
  const q1Index = Math.floor(n * 0.25);
  const q2Index = Math.floor(n * 0.5);
  const q3Index = Math.floor(n * 0.75);

  const q1 = grades[q1Index];
  const q2 = median;
  const q3 = grades[q3Index];

  // Create histogram (10-point ranges: 0-9, 10-19, ..., 90-100)
  const histogram: { range: string; count: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const start = i * 10;
    const end = i === 9 ? 100 : (i + 1) * 10 - 1;
    const count = grades.filter((g) => g >= start && g <= end).length;
    histogram.push({
      range: `${start}-${end}`,
      count,
    });
  }

  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    quartiles: {
      q1: Math.round(q1 * 100) / 100,
      q2: Math.round(q2 * 100) / 100,
      q3: Math.round(q3 * 100) / 100,
    },
    histogram,
    totalGraded: n,
  };
}
