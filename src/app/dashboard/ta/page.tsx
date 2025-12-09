"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/user-utils";
import { getTAAssignments, Assignment, Submission } from "@/lib/data-utils";
import { createClient } from "@/utils/supabase/client";
import { GradingModal } from "@/components/modals/grading-modal";
import {
  FileText,
  Clock,
  CheckCircle,
  Star,
  BarChart3,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TADashboardData {
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
}

export default function TADashboard() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [data, setData] = useState<TADashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [allSubmissionIds, setAllSubmissionIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const profile = await requireRole("ta");
      setUserProfile(profile);

      const dashboardData = await getTAAssignments(profile);
      setData(dashboardData);

      // Collect all submission IDs from all assignments for navigation
      // Get ALL submissions (not just pending) for full navigation
      const supabase = createClient();
      const assignmentIds = dashboardData.assignments.map((a) => a.id);
      if (assignmentIds.length > 0) {
        const { data: allSubmissions } = await supabase
          .from("submissions")
          .select("id")
          .in("assignment_id", assignmentIds)
          .order("submitted_at", { ascending: false });

        const allIds = allSubmissions?.map((s) => s.id) || [];
        setAllSubmissionIds(allIds);
      } else {
        setAllSubmissionIds([]);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeClick = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setGradingModalOpen(true);
  };

  const handleNavigateSubmission = (newSubmissionId: string) => {
    setSelectedSubmissionId(newSubmissionId);
    // Reload to get fresh data
    loadData();
  };

  const handleGradeSubmitted = () => {
    // Reload data after grading
    loadData();
  };

  if (loading || !userProfile || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const formatGrade = (averageGrade: number | null) => {
    if (!averageGrade) return "N/A";

    let letterGrade = "F";
    if (averageGrade >= 90) letterGrade = "A";
    else if (averageGrade >= 80) letterGrade = "B";
    else if (averageGrade >= 70) letterGrade = "C";
    else if (averageGrade >= 60) letterGrade = "D";

    return letterGrade;
  };

  return (
    <>
      <DashboardLayout
        userProfile={userProfile}
        title="Teaching Assistant Dashboard"
        description="Grade assignments and manage submissions."
        requiredRole="ta"
      >
        <div className="grid gap-6">
          {/* Quick Actions */}
          <div className="flex justify-end">
            <Link href="/dashboard/regrade-requests">
              <Button variant="outline" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                View Regrade Requests
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Assignments
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Grading
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Graded Today
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.stats.graded_today}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Grade
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.stats.average_grade
                    ? formatGrade(data.stats.average_grade)
                    : "N/A"}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assignments Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.assignments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>
                        No assignments found. You may not be assigned to any
                        courses yet.
                      </p>
                    </div>
                  ) : (
                    data.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() =>
                          router.push(
                            `/dashboard/ta/assignments/${assignment.id}`
                          )
                        }
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-950">
                            {assignment.title}
                          </h3>
                          <p className="text-sm text-gray-700">
                            {assignment.course?.code || "Unknown Course"} • Due:{" "}
                            {new Date(assignment.due_date).toLocaleDateString()}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span>
                              {assignment.submissions_count} submissions
                            </span>
                            <span>{assignment.graded_count} graded</span>
                            <span>
                              Avg: {formatGrade(assignment.average_grade)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-600 flex-shrink-0 ml-4" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pending Grading Queue */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Grading Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.pendingGrading.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No pending submissions to grade. Great job!</p>
                    </div>
                  ) : (
                    data.pendingGrading.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleGradeClick(item.id)}
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-950">
                            {item.student?.first_name} {item.student?.last_name}
                          </h3>
                          <p className="text-sm text-gray-700">
                            {item.assignment?.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            Submitted:{" "}
                            {item.submitted_at
                              ? new Date(item.submitted_at).toLocaleDateString()
                              : "Unknown"}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-600 flex-shrink-0 ml-4" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>

      <GradingModal
        isOpen={gradingModalOpen}
        onClose={() => {
          setGradingModalOpen(false);
          setSelectedSubmissionId(null);
        }}
        submissionId={selectedSubmissionId}
        onGradeSubmitted={handleGradeSubmitted}
        submissionIds={
          allSubmissionIds.length > 0 ? allSubmissionIds : undefined
        }
        currentSubmissionIndex={
          selectedSubmissionId && allSubmissionIds.length > 0
            ? allSubmissionIds.indexOf(selectedSubmissionId)
            : undefined
        }
        onNavigateSubmission={handleNavigateSubmission}
      />
    </>
  );
}
