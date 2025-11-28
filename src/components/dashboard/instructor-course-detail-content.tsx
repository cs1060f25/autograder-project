"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { AssignmentModal } from "@/components/modals/assignment-modal";
import { EnrollmentModal } from "@/components/modals/enrollment-modal";
import {
  deleteAssignment,
  publishAssignment,
  closeAssignment,
} from "@/lib/assignment-actions";
import { Course, Assignment } from "@/lib/data-utils";
import {
  ArrowLeft,
  FileText,
  Users,
  Plus,
  Edit,
  TrendingUp,
  Clock,
  CheckCircle,
  Trash2,
  Play,
  Square,
  BarChart3,
} from "lucide-react";

interface InstructorCourseDetailContentProps {
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
  allCourses: (Course & {
    assignments_count: number;
    students_count: number;
    average_grade: number | null;
  })[];
}

export function InstructorCourseDetailContent({
  course,
  assignments,
  allCourses,
}: InstructorCourseDetailContentProps) {
  const router = useRouter();
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<
    | (Assignment & {
        submissions_count: number;
        graded_count: number;
        average_grade: number | null;
      })
    | null
  >(null);

  const formatGrade = (averageGrade: number | null) => {
    if (!averageGrade) return "N/A";

    let letterGrade = "F";
    if (averageGrade >= 90) letterGrade = "A";
    else if (averageGrade >= 80) letterGrade = "B";
    else if (averageGrade >= 70) letterGrade = "C";
    else if (averageGrade >= 60) letterGrade = "D";

    return letterGrade;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "graded":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Graded
          </Badge>
        );
      case "published":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Published
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const handleCreateAssignment = () => {
    setEditingAssignment(null);
    setAssignmentModalOpen(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setAssignmentModalOpen(true);
  };

  const handleDeleteAssignment = (
    assignment: Assignment & {
      submissions_count: number;
      graded_count: number;
      average_grade: number | null;
    }
  ) => {
    setAssignmentToDelete(assignment);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAssignment = async () => {
    if (assignmentToDelete) {
      setDeleteDialogOpen(false);
      const assignmentId = assignmentToDelete.id;
      setAssignmentToDelete(null);
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
      <div className="space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard/instructor">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEnrollmentModalOpen(true)}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Students
          </Button>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {course.assignments_count}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{course.students_count}</div>
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
                {formatGrade(course.average_grade)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Submissions
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assignments.reduce((acc, a) => acc + a.submissions_count, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Assignments</CardTitle>
            <Button size="sm" onClick={handleCreateAssignment}>
              <Plus className="h-4 w-4 mr-2" />
              New Assignment
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No assignments yet</p>
                  <p className="text-sm mt-1">
                    Create your first assignment to get started.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={handleCreateAssignment}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    data-testid="assignment-card"
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() =>
                      router.push(
                        `/dashboard/instructor/assignments/${assignment.id}`
                      )
                    }
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {assignment.title}
                          </h3>
                          {getStatusBadge(assignment.status)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}{" "}
                          • {assignment.max_points} points
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
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

                    <div
                      className="flex space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                        onClick={() => handleDeleteAssignment(assignment)}
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

      {/* Modals */}
      <AssignmentModal
        isOpen={assignmentModalOpen}
        setIsOpen={setAssignmentModalOpen}
        assignment={editingAssignment}
        courses={allCourses}
        mode={editingAssignment ? "edit" : "create"}
        defaultCourseId={course.id}
      />

      <EnrollmentModal
        isOpen={enrollmentModalOpen}
        setIsOpen={setEnrollmentModalOpen}
        course={course}
      />

      {/* Delete Assignment Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assignment? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {assignmentToDelete && (
            <Alert variant="destructive">
              <div className="space-y-1">
                <p className="font-semibold">{assignmentToDelete.title}</p>
                {assignmentToDelete.submissions_count > 0 && (
                  <p className="text-sm">
                    This assignment has {assignmentToDelete.submissions_count}{" "}
                    submission
                    {assignmentToDelete.submissions_count !== 1 ? "s" : ""}. All
                    associated submissions and grades will also be deleted.
                  </p>
                )}
              </div>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setAssignmentToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAssignment}>
              Delete Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
