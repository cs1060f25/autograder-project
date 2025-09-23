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
  GraduationCap,
  FileText,
  Users,
  BarChart3,
  Plus,
  Eye,
  Edit,
  TrendingUp,
  Clock,
  CheckCircle,
  Trash2,
  Play,
  Square,
} from "lucide-react";

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
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "published":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "draft":
        return <Clock className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
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
      <div className="grid gap-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Courses
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_courses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_students}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Assignments
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.active_assignments}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Grade
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.average_grade ? formatGrade(stats.average_grade) : "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Courses Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Courses</CardTitle>
              <Button size="sm" onClick={handleCreateCourse}>
                <Plus className="h-4 w-4 mr-2" />
                New Course
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>
                      No courses found. Create your first course to get started.
                    </p>
                  </div>
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
                          <Users className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCourse(course)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
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
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAssignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>
                      No assignments found. Create your first assignment to get
                      started.
                    </p>
                  </div>
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
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        {assignment.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handlePublishAssignment(assignment.id)
                            }
                            className="text-green-600 hover:text-green-700"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Publish
                          </Button>
                        )}
                        {assignment.status === "published" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCloseAssignment(assignment.id)}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <Square className="h-4 w-4 mr-2" />
                            Close
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
