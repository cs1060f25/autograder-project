"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmissionModal } from "@/components/modals/submission-modal";
import { Assignment, Submission } from "@/lib/data-utils";

// Type for assignments with optional submission data
type AssignmentWithSubmission = Assignment & { submission?: Submission };
import {
  BookOpen,
  Clock,
  CheckCircle,
  Upload,
  Eye,
  FileText,
} from "lucide-react";

interface StudentDashboardContentProps {
  assignments: (Assignment & { submission?: Submission })[];
  stats: {
    total: number;
    submitted: number;
    pending: number;
  };
  studentId: string;
}

export function StudentDashboardContent({
  assignments,
  stats,
  studentId,
}: StudentDashboardContentProps) {
  const [selectedAssignment, setSelectedAssignment] =
    useState<AssignmentWithSubmission | null>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  const getStatusIcon = (
    assignment: Assignment & { submission?: Submission }
  ) => {
    if (!assignment.submission) {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    }

    switch (assignment.submission.status) {
      case "submitted":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "graded":
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case "draft":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getGradeDisplay = (
    assignment: Assignment & { submission?: Submission }
  ) => {
    if (!assignment.submission?.grade) return null;

    const percentage =
      (assignment.submission.grade / assignment.max_points) * 100;
    let letterGrade = "F";

    if (percentage >= 90) letterGrade = "A";
    else if (percentage >= 80) letterGrade = "B";
    else if (percentage >= 70) letterGrade = "C";
    else if (percentage >= 60) letterGrade = "D";

    return `${letterGrade} (${assignment.submission.grade}/${assignment.max_points})`;
  };

  const handleSubmitAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsSubmissionModalOpen(true);
  };

  const handleViewSubmission = (
    assignment: Assignment & { submission?: Submission }
  ) => {
    if (assignment.submission) {
      setSelectedAssignment(assignment);
      setIsSubmissionModalOpen(true);
    }
  };

  const isAssignmentOverdue = (dueDate: string) => {
    return new Date() > new Date(dueDate);
  };

  const canSubmit = (assignment: Assignment) => {
    return (
      !isAssignmentOverdue(assignment.due_date) &&
      assignment.status === "published"
    );
  };

  return (
    <div className="grid gap-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assignments
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submitted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  No assignments found. You may not be enrolled in any courses
                  yet.
                </p>
              </div>
            ) : (
              assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(assignment)}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {assignment.course?.code || "Unknown Course"} • Due:{" "}
                        {new Date(assignment.due_date).toLocaleDateString()}
                        {isAssignmentOverdue(assignment.due_date) && (
                          <span className="text-red-500 ml-2">(Overdue)</span>
                        )}
                      </p>
                      {assignment.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                      {assignment.submission?.attachments &&
                        assignment.submission.attachments.length > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            <FileText className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {assignment.submission.attachments.length} file(s)
                              attached
                            </span>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getGradeDisplay(assignment) && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                        {getGradeDisplay(assignment)}
                      </span>
                    )}

                    <div className="flex space-x-2">
                      {assignment.submission && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSubmission(assignment)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleSubmitAssignment(assignment)}
                        variant={canSubmit(assignment) ? "default" : "outline"}
                        disabled={!canSubmit(assignment)}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        {assignment.submission ? "Resubmit" : "Submit"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submission Modal */}
      {selectedAssignment && (
        <SubmissionModal
          isOpen={isSubmissionModalOpen}
          onClose={() => {
            setIsSubmissionModalOpen(false);
            setSelectedAssignment(null);
          }}
          assignmentId={selectedAssignment.id}
          assignmentTitle={selectedAssignment.title}
          dueDate={selectedAssignment.due_date}
          studentId={studentId}
          instructions={selectedAssignment.instructions || undefined}
          existingSubmission={
            selectedAssignment.submission
              ? {
                  content: selectedAssignment.submission.content || "",
                  attachments: selectedAssignment.submission.attachments || [],
                  status: selectedAssignment.submission.status,
                  grade: selectedAssignment.submission.grade ?? undefined,
                  feedback: selectedAssignment.submission.feedback ?? undefined,
                  graded_at:
                    selectedAssignment.submission.graded_at ?? undefined,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
