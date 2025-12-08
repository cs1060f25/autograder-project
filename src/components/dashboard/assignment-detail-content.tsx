"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SubmissionDetailModal } from "@/components/modals/submission-detail-modal";
import { toggleScoreDistribution } from "@/lib/assignment-actions";
import { ScoreDistribution, getScoreDistribution } from "@/lib/data-utils";
import { useEffect } from "react";
import { LaTeXText } from "@/components/ui/latex-text";
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Calendar,
  Award,
  BarChart3,
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
  show_score_distribution?: boolean;
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
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDistribution, setShowDistribution] = useState(
    assignment.show_score_distribution || false
  );
  const [isTogglingDistribution, setIsTogglingDistribution] = useState(false);
  const [scoreDistribution, setScoreDistribution] =
    useState<ScoreDistribution | null>(null);
  const [loadingDistribution, setLoadingDistribution] = useState(false);

  // Load score distribution when there are graded submissions
  useEffect(() => {
    if (stats.graded > 0) {
      loadScoreDistribution();
    }
  }, [stats.graded, assignment.id]);

  const loadScoreDistribution = async () => {
    setLoadingDistribution(true);
    try {
      const distribution = await getScoreDistribution(assignment.id);
      setScoreDistribution(distribution);
    } catch (error) {
      console.error("Failed to load score distribution:", error);
      setScoreDistribution(null);
    } finally {
      setLoadingDistribution(false);
    }
  };

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

  const handleToggleDistribution = async (checked: boolean) => {
    setIsTogglingDistribution(true);
    try {
      const result = await toggleScoreDistribution(assignment.id, checked);
      if (result.success) {
        setShowDistribution(checked);
      } else {
        console.error("Failed to toggle distribution:", result.error);
      }
    } catch (error) {
      console.error("Error toggling distribution:", error);
    } finally {
      setIsTogglingDistribution(false);
    }
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
                <div className="text-gray-600">
                  <LaTeXText content={assignment.description || ""} />
                </div>
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
                <div className="text-sm text-gray-600">
                  <LaTeXText content={assignment.instructions} />
                </div>
              </div>
            )}

            {/* Score Distribution Toggle */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-gray-500" />
                  <div>
                    <Label
                      htmlFor="score-distribution"
                      className="text-sm font-medium"
                    >
                      Show Score Distribution to Students
                    </Label>
                    <p className="text-xs text-gray-500">
                      Allow students to see class statistics for this assignment
                    </p>
                  </div>
                </div>
                <Switch
                  id="score-distribution"
                  checked={showDistribution}
                  onCheckedChange={handleToggleDistribution}
                  disabled={isTogglingDistribution}
                />
              </div>
            </div>
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

        {/* Score Distribution Card */}
        {scoreDistribution && stats.graded > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <CardTitle>Score Distribution</CardTitle>
                </div>
                <Badge variant="outline" className="text-purple-700">
                  {scoreDistribution.totalGraded} graded
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Summary Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <p className="text-xs text-purple-600 mb-1 font-medium">
                      Mean
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {scoreDistribution.mean}
                      <span className="text-sm text-purple-600 ml-1">
                        / {assignment.max_points}
                      </span>
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <p className="text-xs text-purple-600 mb-1 font-medium">
                      Median
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {scoreDistribution.median}
                      <span className="text-sm text-purple-600 ml-1">
                        / {assignment.max_points}
                      </span>
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <p className="text-xs text-purple-600 mb-1 font-medium">
                      Std Dev
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {scoreDistribution.stdDev}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <p className="text-xs text-purple-600 mb-1 font-medium">
                      Min
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {scoreDistribution.min}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <p className="text-xs text-purple-600 mb-1 font-medium">
                      Max
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {scoreDistribution.max}
                    </p>
                  </div>
                </div>

                {/* Quartiles */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-100">
                  <p className="text-sm font-medium text-purple-800 mb-3">
                    Quartiles
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-center flex-1">
                      <p className="text-xs text-purple-600 mb-1">Q1 (25th)</p>
                      <p className="text-xl font-bold text-purple-900">
                        {scoreDistribution.quartiles.q1}
                      </p>
                    </div>
                    <div className="h-12 w-px bg-purple-300"></div>
                    <div className="text-center flex-1">
                      <p className="text-xs text-purple-600 mb-1">Q2 (50th)</p>
                      <p className="text-xl font-bold text-purple-900">
                        {scoreDistribution.quartiles.q2}
                      </p>
                    </div>
                    <div className="h-12 w-px bg-purple-300"></div>
                    <div className="text-center flex-1">
                      <p className="text-xs text-purple-600 mb-1">Q3 (75th)</p>
                      <p className="text-xl font-bold text-purple-900">
                        {scoreDistribution.quartiles.q3}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Histogram */}
                <div>
                  <p className="text-sm font-medium text-purple-800 mb-3">
                    Score Distribution Histogram
                  </p>
                  <div className="space-y-2">
                    {scoreDistribution.histogram.map((bin) => {
                      const percentage =
                        (bin.count / scoreDistribution.totalGraded) * 100;
                      return (
                        <div
                          key={bin.range}
                          className="flex items-center gap-3"
                        >
                          <span className="text-sm font-medium text-purple-700 w-20">
                            {bin.range}
                          </span>
                          <div className="flex-1 bg-purple-100 rounded-full h-8 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all flex items-center justify-end pr-2"
                              style={{ width: `${Math.max(percentage, 2)}%` }}
                            >
                              {bin.count > 0 && (
                                <span className="text-xs font-medium text-white">
                                  {bin.count}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-purple-700 w-16 text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loadingDistribution && (
          <Card>
            <CardContent className="py-8">
              <div className="flex items-center justify-center gap-2 text-purple-600">
                <BarChart3 className="h-5 w-5 animate-pulse" />
                <p className="text-sm">Loading score distribution...</p>
              </div>
            </CardContent>
          </Card>
        )}

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
