"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmissionModal } from "@/components/modals/submission-modal";
import { Assignment, Submission } from "@/lib/data-utils";

// Type for assignments with optional submission data
type AssignmentWithSubmission = Assignment & { submission?: Submission };
import {
  MenuBook as BookOpenIcon,
  AccessTime as ClockIcon,
  CheckCircle as CheckCircleIcon,
  Upload as UploadIcon,
  Visibility as EyeIcon,
  Description as FileTextIcon,
} from "@mui/icons-material";
import { Box, Typography, Chip, IconButton } from "@mui/material";

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
      return <ClockIcon sx={{ fontSize: 20, color: "warning.main" }} />;
    }

    switch (assignment.submission.status) {
      case "submitted":
        return <CheckCircleIcon sx={{ fontSize: 20, color: "success.main" }} />;
      case "graded":
        return <CheckCircleIcon sx={{ fontSize: 20, color: "primary.main" }} />;
      case "draft":
        return <ClockIcon sx={{ fontSize: 20, color: "warning.main" }} />;
      default:
        return <ClockIcon sx={{ fontSize: 20, color: "text.disabled" }} />;
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
    <Box sx={{ display: "grid", gap: 3 }}>
      {/* Quick Stats */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        <Card>
          <CardContent>
            <CardTitle sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
              Total Assignments
            </CardTitle>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              {stats.total}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <CardTitle sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
              Submitted
            </CardTitle>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              {stats.submitted}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <CardTitle sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
              Pending
            </CardTitle>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {stats.pending}
              </Typography>
            </CardContent>
          </CardContent>
        </Card>
      </Box>

      {/* Assignments List */}
      <Card>
        <CardContent>
          <CardTitle>Your Assignments</CardTitle>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {assignments.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  color: "text.secondary",
                }}
              >
                <BookOpenIcon
                  sx={{
                    fontSize: 48,
                    mx: "auto",
                    mb: 2,
                    color: "text.disabled",
                  }}
                />
                <Typography>
                  No assignments found. You may not be enrolled in any courses
                  yet.
                </Typography>
              </Box>
            ) : (
              assignments.map((assignment) => (
                <Box
                  key={assignment.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 2,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      flex: 1,
                    }}
                  >
                    {getStatusIcon(assignment)}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {assignment.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {assignment.course?.code || "Unknown Course"} • Due:{" "}
                        {new Date(assignment.due_date).toLocaleDateString()}
                        {isAssignmentOverdue(assignment.due_date) && (
                          <Box
                            component="span"
                            sx={{ color: "error.main", ml: 1 }}
                          >
                            (Overdue)
                          </Box>
                        )}
                      </Typography>
                      {assignment.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 0.5,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {assignment.description}
                        </Typography>
                      )}
                      {assignment.submission?.attachments &&
                        assignment.submission.attachments.length > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              mt: 0.5,
                            }}
                          >
                            <FileTextIcon
                              sx={{ fontSize: 12, color: "text.disabled" }}
                            />
                            <Typography variant="caption" color="text.disabled">
                              {assignment.submission.attachments.length} file(s)
                              attached
                            </Typography>
                          </Box>
                        )}
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {getGradeDisplay(assignment) && (
                      <Chip
                        label={getGradeDisplay(assignment)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}

                    <Box sx={{ display: "flex", gap: 1 }}>
                      {assignment.submission && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSubmission(assignment)}
                        >
                          <EyeIcon sx={{ mr: 1, fontSize: 16 }} />
                          View
                        </Button>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleSubmitAssignment(assignment)}
                        variant={canSubmit(assignment) ? "default" : "outline"}
                        disabled={!canSubmit(assignment)}
                      >
                        <UploadIcon sx={{ mr: 1, fontSize: 16 }} />
                        {assignment.submission ? "Resubmit" : "Submit"}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              ))
            )}
          </Box>
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
    </Box>
  );
}
