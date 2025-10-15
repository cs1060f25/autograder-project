"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CourseModal } from "@/components/modals/course-modal";
import { AssignmentModal } from "@/components/modals/assignment-modal";
import { EnrollmentModal } from "@/components/modals/enrollment-modal";
import { deleteCourse } from "@/lib/course-actions";
import {
  deleteAssignment,
  publishAssignment,
  closeAssignment,
} from "@/lib/assignment-actions";
import { Course, Assignment } from "@/lib/data-utils";
import {
  School as GraduationCapIcon,
  Description as FileTextIcon,
  People as UsersIcon,
  BarChart as BarChart3Icon,
  Add as PlusIcon,
  Visibility as EyeIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as ClockIcon,
  CheckCircle as CheckCircleIcon,
  Delete as Trash2Icon,
  PlayArrow as PlayIcon,
  Stop as SquareIcon,
} from "@mui/icons-material";
import { Box, Typography, Chip, IconButton, Stack } from "@mui/material";

interface InstructorDashboardContentProps {
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
}

export function InstructorDashboardContent({
  courses,
  recentAssignments,
  stats,
}: InstructorDashboardContentProps) {
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const formatGrade = (averageGrade: number | null) => {
    if (!averageGrade) return "N/A";

    let letterGrade = "F";
    if (averageGrade >= 90) letterGrade = "A";
    else if (averageGrade >= 80) letterGrade = "B";
    else if (averageGrade >= 70) letterGrade = "C";
    else if (averageGrade >= 60) letterGrade = "D";

    return letterGrade;
  };

  const getStatusIcon = (assignment: Assignment) => {
    switch (assignment.status) {
      case "graded":
        return <CheckCircleIcon sx={{ fontSize: 20, color: "success.main" }} />;
      case "published":
        return <ClockIcon sx={{ fontSize: 20, color: "warning.main" }} />;
      case "draft":
        return <ClockIcon sx={{ fontSize: 20, color: "text.disabled" }} />;
      default:
        return <ClockIcon sx={{ fontSize: 20, color: "text.disabled" }} />;
    }
  };

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setCourseModalOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseModalOpen(true);
  };

  const handleCreateAssignment = () => {
    setEditingAssignment(null);
    setAssignmentModalOpen(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setAssignmentModalOpen(true);
  };

  const handleManageEnrollment = (course: Course) => {
    setSelectedCourse(course);
    setEnrollmentModalOpen(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this course? This action cannot be undone."
      )
    ) {
      await deleteCourse(courseId);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this assignment? This action cannot be undone."
      )
    ) {
      await deleteAssignment(assignmentId);
    }
  };

  const handlePublishAssignment = async (assignmentId: string) => {
    await publishAssignment(assignmentId);
  };

  const handleCloseAssignment = async (assignmentId: string) => {
    await closeAssignment(assignmentId);
  };

  return (
    <>
      <Box sx={{ display: "grid", gap: 3 }}>
        {/* Quick Stats */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          <Card>
            <CardHeader
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                pb: 1,
              }}
            >
              <CardTitle sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                Total Courses
              </CardTitle>
              <GraduationCapIcon
                sx={{ fontSize: 16, color: "text.secondary" }}
              />
            </CardHeader>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {stats.total_courses}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                pb: 1,
              }}
            >
              <CardTitle sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                Total Students
              </CardTitle>
              <UsersIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            </CardHeader>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {stats.total_students}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                pb: 1,
              }}
            >
              <CardTitle sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                Active Assignments
              </CardTitle>
              <FileTextIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            </CardHeader>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {stats.active_assignments}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                pb: 1,
              }}
            >
              <CardTitle sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                Average Grade
              </CardTitle>
              <TrendingUpIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            </CardHeader>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {stats.average_grade ? formatGrade(stats.average_grade) : "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
            gap: 3,
          }}
        >
          {/* Courses Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Courses</CardTitle>
              <Button size="sm" onClick={handleCreateCourse}>
                <PlusIcon sx={{ mr: 1, fontSize: 16 }} />
                New Course
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.length === 0 ? (
                  <Box
                    sx={{ textAlign: "center", py: 4, color: "text.secondary" }}
                  >
                    <GraduationCapIcon
                      sx={{
                        fontSize: 48,
                        mx: "auto",
                        mb: 2,
                        color: "text.disabled",
                      }}
                    />
                    <Typography>
                      No courses found. Create your first course to get started.
                    </Typography>
                  </Box>
                ) : (
                  courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {course.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {course.code} • {course.students_count} students
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>{course.assignments_count} assignments</span>
                          <span>Avg: {formatGrade(course.average_grade)}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleManageEnrollment(course)}
                        >
                          <UsersIcon sx={{ mr: 1, fontSize: 16 }} />
                          Manage
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCourse(course)}
                        >
                          <EditIcon sx={{ mr: 1, fontSize: 16 }} />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCourse(course.id)}
                          sx={{
                            color: "error.main",
                            "&:hover": { color: "error.dark" },
                          }}
                        >
                          <Trash2Icon sx={{ fontSize: 16 }} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Assignments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Assignments</CardTitle>
              <Button size="sm" onClick={handleCreateAssignment}>
                <PlusIcon sx={{ mr: 1, fontSize: 16 }} />
                New Assignment
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAssignments.length === 0 ? (
                  <Box
                    sx={{ textAlign: "center", py: 4, color: "text.secondary" }}
                  >
                    <FileTextIcon
                      sx={{
                        fontSize: 48,
                        mx: "auto",
                        mb: 2,
                        color: "text.disabled",
                      }}
                    />
                    <Typography>
                      No assignments found. Create your first assignment to get
                      started.
                    </Typography>
                  </Box>
                ) : (
                  recentAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(assignment)}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {assignment.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {assignment.course?.code || "Unknown Course"} • Due:{" "}
                            {new Date(assignment.due_date).toLocaleDateString()}
                          </p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>
                              {assignment.submissions_count} submissions
                            </span>
                            <span>{assignment.graded_count} graded</span>
                            {assignment.average_grade && (
                              <span>
                                Avg: {formatGrade(assignment.average_grade)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditAssignment(assignment)}
                        >
                          <EditIcon sx={{ mr: 1, fontSize: 16 }} />
                          Edit
                        </Button>
                        {assignment.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handlePublishAssignment(assignment.id)
                            }
                            sx={{
                              color: "success.main",
                              "&:hover": { color: "success.dark" },
                            }}
                          >
                            <PlayIcon sx={{ mr: 1, fontSize: 16 }} />
                            Publish
                          </Button>
                        )}
                        {assignment.status === "published" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCloseAssignment(assignment.id)}
                            sx={{
                              color: "warning.main",
                              "&:hover": { color: "warning.dark" },
                            }}
                          >
                            <SquareIcon sx={{ mr: 1, fontSize: 16 }} />
                            Close
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          sx={{
                            color: "error.main",
                            "&:hover": { color: "error.dark" },
                          }}
                        >
                          <Trash2Icon sx={{ fontSize: 16 }} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Modals */}
      <CourseModal
        isOpen={courseModalOpen}
        setIsOpen={setCourseModalOpen}
        course={editingCourse}
        mode={editingCourse ? "edit" : "create"}
      />

      <AssignmentModal
        isOpen={assignmentModalOpen}
        setIsOpen={setAssignmentModalOpen}
        assignment={editingAssignment}
        courses={courses}
        mode={editingAssignment ? "edit" : "create"}
      />

      {selectedCourse && (
        <EnrollmentModal
          isOpen={enrollmentModalOpen}
          setIsOpen={setEnrollmentModalOpen}
          course={selectedCourse}
        />
      )}
    </>
  );
}
