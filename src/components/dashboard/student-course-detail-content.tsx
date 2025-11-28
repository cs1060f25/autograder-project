"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubmissionModal } from "@/components/modals/submission-modal";
import { RegradeRequestModal } from "@/components/modals/regrade-request-modal";
import { ViewRegradeRequestModal } from "@/components/modals/view-regrade-request-modal";
import { Assignment, Submission, Course } from "@/lib/data-utils";
import { getMyRegradeRequests } from "@/lib/regrade-actions";
import type { RegradeRequest } from "@/types/regrade";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle,
  Upload,
  Eye,
  FileText,
  AlertCircle,
} from "lucide-react";

type AssignmentWithSubmission = Assignment & { submission?: Submission };

interface StudentCourseDetailContentProps {
  course: Course;
  assignments: AssignmentWithSubmission[];
  studentId: string;
}

export function StudentCourseDetailContent({
  course,
  assignments,
  studentId,
}: StudentCourseDetailContentProps) {
  const [selectedAssignment, setSelectedAssignment] =
    useState<AssignmentWithSubmission | null>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isRegradeModalOpen, setIsRegradeModalOpen] = useState(false);
  const [regradeAssignment, setRegradeAssignment] =
    useState<AssignmentWithSubmission | null>(null);
  const [rubricData, setRubricData] = useState<{
    rubricScoreId: string;
    items: Array<{
      id: string;
      name: string;
      description: string;
      points: number;
      deduction?: number;
    }>;
  } | null>(null);
  const [loadingRubric, setLoadingRubric] = useState(false);
  const [regradeRequests, setRegradeRequests] = useState<
    (RegradeRequest & { assignments?: { title: string } })[]
  >([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [viewingRequest, setViewingRequest] = useState<RegradeRequest | null>(
    null
  );
  const [isViewRequestModalOpen, setIsViewRequestModalOpen] = useState(false);

  // Calculate stats
  const stats = {
    total: assignments.length,
    submitted: assignments.filter(
      (a) =>
        a.submission?.status === "submitted" ||
        a.submission?.status === "graded"
    ).length,
    pending: assignments.filter(
      (a) => !a.submission || a.submission.status === "draft"
    ).length,
  };

  useEffect(() => {
    loadRegradeRequests();
  }, []);

  const loadRegradeRequests = async () => {
    setLoadingRequests(true);
    const result = await getMyRegradeRequests();
    if (result.success && result.requests) {
      setRegradeRequests(result.requests as any);
    }
    setLoadingRequests(false);
  };

  const getStatusIcon = (assignment: AssignmentWithSubmission) => {
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

  const getStatusBadge = (assignment: AssignmentWithSubmission) => {
    if (!assignment.submission) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Not Started
        </Badge>
      );
    }

    switch (assignment.submission.status) {
      case "submitted":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Submitted
          </Badge>
        );
      case "graded":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Graded
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Draft
          </Badge>
        );
      default:
        return <Badge variant="secondary">{assignment.submission.status}</Badge>;
    }
  };

  const getGradeDisplay = (assignment: AssignmentWithSubmission) => {
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

  const handleViewSubmission = (assignment: AssignmentWithSubmission) => {
    if (assignment.submission) {
      setSelectedAssignment(assignment);
      setIsSubmissionModalOpen(true);
    }
  };

  const handleRequestRegrade = async (assignment: AssignmentWithSubmission) => {
    if (!assignment.submission) return;

    setRegradeAssignment(assignment);
    setIsRegradeModalOpen(true);
    setLoadingRubric(true);

    const { getRubricItemsForSubmission } = await import(
      "@/lib/regrade-actions"
    );
    const result = await getRubricItemsForSubmission(assignment.submission.id);

    if (result.success && result.items && result.rubricScoreId) {
      setRubricData({
        rubricScoreId: result.rubricScoreId,
        items: result.items,
      });
    } else {
      console.error("Failed to load rubric data:", result.error);
    }

    setLoadingRubric(false);
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
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link href="/dashboard/student">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>

      {/* Course Stats */}
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
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No assignments yet</p>
                <p className="text-sm mt-1">
                  Your instructor hasn&apos;t published any assignments for this
                  course yet.
                </p>
              </div>
            ) : (
              assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  data-testid="assignment-card"
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(assignment)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {assignment.title}
                        </h3>
                        {getStatusBadge(assignment)}
                      </div>
                      <p className="text-sm text-gray-500">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                        {isAssignmentOverdue(assignment.due_date) && (
                          <span className="text-red-500 ml-2">(Overdue)</span>
                        )}
                        {" • "}
                        {assignment.max_points} points
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
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSubmission(assignment)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>

                          {assignment.submission.status === "graded" &&
                            (() => {
                              const existingRequest = regradeRequests.find(
                                (req) => req.assignment_id === assignment.id
                              );
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (existingRequest) {
                                      setViewingRequest(existingRequest);
                                      setIsViewRequestModalOpen(true);
                                    } else {
                                      handleRequestRegrade(assignment);
                                    }
                                  }}
                                  className="text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
                                >
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  {existingRequest
                                    ? "View Regrade Request"
                                    : "Request Regrade"}
                                </Button>
                              );
                            })()}
                        </>
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
          submissionId={selectedAssignment.submission?.id}
          showScoreDistribution={selectedAssignment.show_score_distribution}
          maxPoints={selectedAssignment.max_points}
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

      {/* Regrade Request Modal */}
      {regradeAssignment && regradeAssignment.submission && rubricData && (
        <RegradeRequestModal
          isOpen={isRegradeModalOpen}
          onClose={() => {
            setIsRegradeModalOpen(false);
            setRegradeAssignment(null);
            setRubricData(null);
            loadRegradeRequests();
          }}
          submissionId={regradeAssignment.submission.id}
          assignmentId={regradeAssignment.id}
          assignmentTitle={regradeAssignment.title}
          rubricScoreId={rubricData.rubricScoreId}
          rubricItems={rubricData.items}
        />
      )}

      {/* View Regrade Request Modal */}
      {viewingRequest && (
        <ViewRegradeRequestModal
          isOpen={isViewRequestModalOpen}
          onClose={() => {
            setIsViewRequestModalOpen(false);
            setViewingRequest(null);
          }}
          request={viewingRequest as any}
        />
      )}
    </div>
  );
}
