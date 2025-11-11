"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireRole } from "@/lib/user-utils";
import { getCourseRegradeRequests } from "@/lib/regrade-actions";
import { RegradeReviewModal } from "@/components/modals/regrade-review-modal";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Filter,
  RefreshCw
} from "lucide-react";
import type { RegradeRequest } from "@/types/regrade";

type ExtendedRegradeRequest = RegradeRequest & {
  assignments?: { title: string; course_id: string };
  students?: { first_name: string; last_name: string; email: string };
};

export default function RegradeRequestsPage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [requests, setRequests] = useState<ExtendedRegradeRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ExtendedRegradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ExtendedRegradeRequest | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const pendingRequests = requests.filter(r => r.status === "pending");
  const resolvedRequests = requests.filter(r => r.status === "approved" || r.status === "rejected");

  useEffect(() => {
    // Apply status filter
    if (statusFilter === "all") {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(req => req.status === statusFilter));
    }
  }, [statusFilter, requests]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is TA or instructor
      let profile;
      try {
        profile = await requireRole("ta");
      } catch {
        profile = await requireRole("instructor");
      }
      
      setUserProfile(profile);

      const result = await getCourseRegradeRequests();
      
      if (result.success && result.requests) {
        setRequests(result.requests as ExtendedRegradeRequest[]);
      } else {
        setError(result.error || "Failed to load regrade requests");
      }
    } catch (err) {
      console.error("Failed to load regrade requests:", err);
      setError("You do not have permission to view regrade requests");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (request: ExtendedRegradeRequest) => {
    setSelectedRequest(request);
    setReviewModalOpen(true);
  };

  const handleResolved = () => {
    setReviewModalOpen(false);
    setSelectedRequest(null);
    loadData(); // Reload data after resolution
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="default" className="bg-yellow-500">Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Denied</Badge>;
      case "withdrawn":
        return <Badge variant="secondary">Withdrawn</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    denied: requests.filter(r => r.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading regrade requests...</p>
        </div>
      </div>
    );
  }

  if (error && !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <DashboardLayout
        userProfile={userProfile}
        title="Regrade Requests"
        description="Review and process student regrade requests."
        requiredRole={userProfile?.role}
      >
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Denied</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.denied}</div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Pending Requests
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {pendingRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No pending requests</p>
                  <p className="text-sm">
                    All regrade requests have been reviewed!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => {
                    const studentName = request.students
                      ? `${request.students.first_name} ${request.students.last_name}`
                      : "Unknown Student";
                    const assignmentTitle = request.assignments?.title || "Unknown Assignment";
                    const maxPoints = request.audit_metadata?.max_points || 0;
                    const originalDeduction = request.audit_metadata?.original_deduction || 0;

                    return (
                      <div
                        key={request.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleReviewClick(request)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{studentName}</h3>
                              {getStatusBadge(request.status)}
                            </div>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              {assignmentTitle}
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p className="flex items-center gap-1 justify-end">
                              <Clock className="h-3 w-3" />
                              {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                          <div className="bg-gray-100 rounded p-2 text-center">
                            <p className="text-xs text-gray-600">Max Points</p>
                            <p className="font-semibold">{maxPoints}</p>
                          </div>
                          <div className="bg-red-50 rounded p-2 text-center">
                            <p className="text-xs text-red-600">Original Score</p>
                            <p className="font-semibold text-red-700">{maxPoints - originalDeduction}</p>
                          </div>
                          <div className="bg-red-100 rounded p-2 text-center">
                            <p className="text-xs text-red-700">Deduction</p>
                            <p className="font-semibold text-red-800">-{originalDeduction}</p>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <p className="text-xs text-gray-600 mb-1 font-medium">Student's Explanation:</p>
                          <p className="text-sm text-gray-800 line-clamp-2">
                            {request.student_explanation}
                          </p>
                        </div>

                        {request.status === "pending" && (
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReviewClick(request);
                              }}
                            >
                              Review Request
                            </Button>
                          </div>
                        )}

                        {request.status !== "pending" && request.resolved_at && (
                          <div className="text-xs text-gray-500 flex items-center gap-2 pt-2 border-t">
                            <User className="h-3 w-3" />
                            Resolved on {new Date(request.resolved_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolved Requests */}
          {resolvedRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Resolved Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {resolvedRequests.map((request) => {
                    const studentName = request.students
                      ? `${request.students.first_name} ${request.students.last_name}`
                      : "Unknown Student";
                    const assignmentTitle = request.assignments?.title || "Unknown Assignment";
                    const maxPoints = request.audit_metadata?.max_points || 0;
                    const originalDeduction = request.audit_metadata?.original_deduction || 0;

                    return (
                      <div
                        key={request.id}
                        className={`border rounded-lg p-4 ${
                          request.status === "approved" 
                            ? "bg-green-50 border-green-200" 
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{studentName}</h3>
                              {getStatusBadge(request.status)}
                            </div>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              {assignmentTitle}
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p className="flex items-center gap-1 justify-end">
                              <Clock className="h-3 w-3" />
                              {request.resolved_at 
                                ? new Date(request.resolved_at).toLocaleDateString()
                                : new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {request.status === "approved" && request.points_awarded !== null && (
                          <div className="bg-white rounded p-3 mb-3 border border-green-300">
                            <p className="text-sm font-medium text-green-800">
                              Points Awarded: {request.points_awarded} / {maxPoints}
                            </p>
                          </div>
                        )}

                        {request.resolution_notes && (
                          <div className="bg-white rounded p-3">
                            <p className="text-xs text-gray-600 mb-1 font-medium">Resolution:</p>
                            <p className="text-sm text-gray-800 line-clamp-2">
                              {request.resolution_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>

      {selectedRequest && (
        <RegradeReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onResolved={handleResolved}
        />
      )}
    </>
  );
}
