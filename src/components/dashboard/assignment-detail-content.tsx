"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubmissionDetailModal } from "@/components/modals/submission-detail-modal";
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Calendar,
  Award,
} from "lucide-react";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Submission {
  id: string;
  student_id: string;
  content: string | null;
  attachments: any[];
  submitted_at: string | null;
  status: string;
  grade: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  student?: Student;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  max_points: number;
  due_date: string;
  status: string;
  assignment_type: string;
  course?: {
    id: string;
    name: string;
    code: string;
  };
}

interface AssignmentDetailContentProps {
  assignment: Assignment;
  submissions: Submission[];
  stats: {
    total: number;
    graded: number;
    pending: number;
    averageGrade: number | null;
  };
}

export function AssignmentDetailContent({
  assignment,
  submissions,
  stats,
}: AssignmentDetailContentProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatGrade = (grade: number | null, maxPoints: number) => {
    if (grade === null) return "Not graded";
    const percentage = (grade / maxPoints) * 100;
    let letterGrade = "F";
    if (percentage >= 90) letterGrade = "A";
    else if (percentage >= 80) letterGrade = "B";
    else if (percentage >= 70) letterGrade = "C";
    else if (percentage >= 60) letterGrade = "D";
    return `${letterGrade} (${grade}/${maxPoints})`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "graded":
        return <Badge className="bg-green-500">Graded</Badge>;
      case "submitted":
        return <Badge className="bg-blue-500">Submitted</Badge>;
      case "draft":
        return <Badge className="bg-gray-500">Draft</Badge>;
      default:
        return <Badge className="bg-gray-400">{status}</Badge>;
    }
  };

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Assignment Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{assignment.title}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {assignment.course?.code} - {assignment.course?.name}
                </p>
              </div>
              <Badge
                className={
                  assignment.status === "published"
                    ? "bg-green-500"
                    : assignment.status === "draft"
                    ? "bg-gray-500"
                    : "bg-orange-500"
                }
              >
                {assignment.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignment.description && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">
                  Description
                </h4>
                <p className="text-gray-600">{assignment.description}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="text-sm font-medium">
                    {new Date(assignment.due_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Max Points</p>
                  <p className="text-sm font-medium">{assignment.max_points}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-sm font-medium capitalize">
                    {assignment.assignment_type}
                  </p>
                </div>
              </div>
            </div>
            {assignment.instructions && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">
                  Instructions
                </h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {assignment.instructions}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Submissions
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Graded</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.graded}</div>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Grade
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageGrade
                  ? `${stats.averageGrade.toFixed(1)}%`
                  : "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        <Card>
          <CardHeader>
            <CardTitle>Student Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No submissions yet.</p>
                </div>
              ) : (
                submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {submission.student?.first_name}{" "}
                            {submission.student?.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {submission.student?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>
                          Submitted:{" "}
                          {submission.submitted_at
                            ? new Date(
                                submission.submitted_at
                              ).toLocaleDateString()
                            : "Not submitted"}
                        </span>
                        {submission.attachments &&
                          submission.attachments.length > 0 && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {submission.attachments.length} file(s)
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(submission.status)}
                      {submission.grade !== null && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                          {formatGrade(submission.grade, assignment.max_points)}
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewSubmission(submission)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <SubmissionDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSubmission(null);
          }}
          submission={selectedSubmission}
          assignment={assignment}
        />
      )}
    </>
  );
}
