"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { resolveRegradeRequest } from "@/lib/regrade-actions";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Clock,
  User,
  FileText,
  AlertTriangle,
  History,
} from "lucide-react";
import type { RegradeRequest } from "@/types/regrade";
import { LaTeXText } from "@/components/ui/latex-text";

interface RegradeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RegradeRequest & {
    assignments?: { title: string };
    students?: { first_name: string; last_name: string; email: string };
  };
  onResolved?: () => void;
}

export function RegradeReviewModal({
  isOpen,
  onClose,
  request,
  onResolved,
}: RegradeReviewModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [pointsAwarded, setPointsAwarded] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submission, setSubmission] = useState<any>(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);

  // Fetch submission content when modal opens
  useEffect(() => {
    if (isOpen && request.submission_id) {
      fetchSubmission();
    }
  }, [isOpen, request.submission_id]);

  const fetchSubmission = async () => {
    setLoadingSubmission(true);
    try {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();

      const { data, error } = await supabase
        .from("submissions")
        .select("content, attachments, submitted_at")
        .eq("id", request.submission_id)
        .single();

      if (!error && data) {
        setSubmission(data);
      }
    } catch (err) {
      console.error("Error fetching submission:", err);
    } finally {
      setLoadingSubmission(false);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setResolutionNotes("");
      setPointsAwarded(request.audit_metadata?.max_points || 0);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, request]);

  const handleApprove = async () => {
    console.log("Approve clicked", {
      requestId: request.id,
      resolutionNotes,
      pointsAwarded,
    });
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await resolveRegradeRequest({
        requestId: request.id,
        status: "approved",
        resolutionNotes,
        pointsAwarded,
      });

      console.log("Approve result:", result);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onResolved?.();
          onClose();
        }, 1500);
      } else {
        setError(result.error || "Failed to approve regrade request");
      }
    } catch (err) {
      console.error("Approve error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeny = async () => {
    console.log("Deny clicked", { requestId: request.id, resolutionNotes });
    if (!resolutionNotes.trim()) {
      setError(
        "You must provide an explanation when denying a regrade request"
      );
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await resolveRegradeRequest({
        requestId: request.id,
        status: "rejected",
        resolutionNotes,
      });

      console.log("Deny result:", result);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onResolved?.();
          onClose();
        }, 1500);
      } else {
        setError(result.error || "Failed to deny regrade request");
      }
    } catch (err) {
      console.error("Deny error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentName = request.students
    ? `${request.students.first_name} ${request.students.last_name}`
    : "Unknown Student";

  const assignmentTitle = request.assignments?.title || "Unknown Assignment";
  const auditMetadata = request.audit_metadata;
  const maxPoints = auditMetadata?.max_points || 0;
  const originalDeduction = auditMetadata?.original_deduction || 0;
  const originalScore = maxPoints - originalDeduction;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Regrade Request</DialogTitle>
          <DialogDescription>
            Evaluate the student's regrade request and decide whether to approve
            or deny it.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Regrade request resolved successfully!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Request Overview */}
            <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Request Details</h3>
                <Badge
                  variant={
                    request.status === "pending" ? "default" : "secondary"
                  }
                >
                  {request.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-700">Student</p>
                    <p className="text-gray-900">{studentName}</p>
                    <p className="text-gray-500 text-xs">
                      {request.students?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-700">Assignment</p>
                    <p className="text-gray-900">{assignmentTitle}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-700">Submitted</p>
                    <p className="text-gray-900">
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rubric Item & Scoring */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Rubric Item in Question
              </h3>

              {auditMetadata?.rubric_criterion_text && (
                <div className="bg-blue-50 border-blue-200 border rounded p-3">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Criterion Description
                  </p>
                  <div className="text-sm text-blue-800">
                    <LaTeXText content={auditMetadata.rubric_criterion_text} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-100 rounded p-3">
                  <p className="text-xs text-gray-600 mb-1">Max Points</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {maxPoints}
                  </p>
                </div>
                <div className="bg-red-50 rounded p-3">
                  <p className="text-xs text-red-600 mb-1">Original Score</p>
                  <p className="text-2xl font-bold text-red-700">
                    {originalScore}
                  </p>
                </div>
                <div className="bg-red-100 rounded p-3">
                  <p className="text-xs text-red-700 mb-1">Deduction</p>
                  <p className="text-2xl font-bold text-red-800">
                    -{originalDeduction}
                  </p>
                </div>
              </div>
            </div>

            {/* Student Submission */}
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-lg">Student's Submission</h3>
              {loadingSubmission ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">
                    Loading submission...
                  </p>
                </div>
              ) : submission ? (
                <div className="space-y-3">
                  {submission.content && (
                    <div className="bg-gray-50 border rounded p-3 max-h-96 overflow-y-auto">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Submission Content:
                      </p>
                      <div className="text-sm text-gray-900 font-mono">
                        <LaTeXText content={submission.content || ""} />
                      </div>
                    </div>
                  )}

                  {submission.attachments &&
                    submission.attachments.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">
                          Attachments ({submission.attachments.length}):
                        </p>
                        {submission.attachments.map(
                          (attachment: any, idx: number) => {
                            const isPdf =
                              attachment.name?.toLowerCase().endsWith(".pdf") ||
                              attachment.type?.includes("pdf");

                            return (
                              <div
                                key={idx}
                                className="border rounded-lg overflow-hidden"
                              >
                                <div className="bg-blue-50 border-blue-200 border-b p-2 flex items-center justify-between">
                                  <span className="text-sm font-medium text-blue-900">
                                    📎 {attachment.name}
                                  </span>
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    Open in new tab
                                  </a>
                                </div>
                                {isPdf ? (
                                  <iframe
                                    src={attachment.url}
                                    className="w-full h-[600px]"
                                    title={attachment.name}
                                  />
                                ) : (
                                  <div className="p-4 text-center">
                                    <a
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      Click to view {attachment.name}
                                    </a>
                                  </div>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}

                  {submission.submitted_at && (
                    <p className="text-xs text-gray-500">
                      Submitted:{" "}
                      {new Date(submission.submitted_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No submission content available
                </p>
              )}
            </div>

            {/* AI Rationale */}
            {auditMetadata?.ai_rationale && (
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-lg">AI Grading Rationale</h3>
                <div className="bg-purple-50 border-purple-200 border rounded p-3">
                  <div className="text-sm text-purple-900">
                    <LaTeXText content={auditMetadata.ai_rationale} />
                  </div>
                </div>
              </div>
            )}

            {/* TA Override History */}
            {auditMetadata?.ta_override_history &&
              auditMetadata.ta_override_history.length > 0 && (
                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Previous TA Overrides
                  </h3>
                  <div className="space-y-2">
                    {auditMetadata.ta_override_history.map((override, idx) => (
                      <div
                        key={idx}
                        className="bg-yellow-50 border-yellow-200 border rounded p-3 text-sm"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium">Override by TA</p>
                          <p className="text-xs text-gray-600">
                            {new Date(override.overridden_at).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-gray-700">
                          Changed score from{" "}
                          <span className="font-semibold">
                            {override.previous_score}
                          </span>{" "}
                          to{" "}
                          <span className="font-semibold">
                            {override.new_score}
                          </span>
                        </p>
                        {override.reason && (
                          <p className="text-gray-600 mt-1 italic">
                            {override.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Student Explanation */}
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-lg">Student's Explanation</h3>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-sm text-gray-900">
                  <LaTeXText content={request.student_explanation} />
                </div>
              </div>
            </div>

            {/* Resolution Form */}
            {request.status === "pending" && (
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold text-lg">Your Decision</h3>

                <div className="space-y-2">
                  <Label htmlFor="points-awarded">
                    Points to Award (if approving)
                  </Label>
                  <input
                    id="points-awarded"
                    type="number"
                    min="0"
                    max={maxPoints}
                    value={pointsAwarded}
                    onChange={(e) => setPointsAwarded(Number(e.target.value))}
                    className="w-full p-2 border rounded-md"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-gray-500">
                    Enter the new score for this rubric item (0 to {maxPoints}{" "}
                    points)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolution-notes">
                    Resolution Notes *
                    <span className="text-sm text-gray-500 ml-2">
                      (Required for both approval and denial)
                    </span>
                  </Label>
                  <Textarea
                    id="resolution-notes"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Explain your decision. If approving, explain why the student's argument is valid. If denying, explain why the original grade stands."
                    rows={6}
                    required
                    disabled={isSubmitting}
                    className="resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeny}
                    disabled={isSubmitting || !resolutionNotes.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Deny Request"
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleApprove}
                    disabled={isSubmitting || !resolutionNotes.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Approve & Regrade"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Resolution Display (for resolved requests) */}
            {request.status !== "pending" && (
              <div className="border-t pt-6 space-y-3">
                <h3 className="font-semibold text-lg">Resolution</h3>
                <div
                  className={`rounded-lg p-4 ${
                    request.status === "approved"
                      ? "bg-green-50 border-green-200 border"
                      : "bg-red-50 border-red-200 border"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {request.status === "approved" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <p className="font-semibold">
                      {request.status === "approved"
                        ? "Request Approved"
                        : "Request Denied"}
                    </p>
                  </div>

                  {request.points_awarded !== null &&
                    request.points_awarded !== undefined && (
                      <p className="text-sm mb-2">
                        <span className="font-medium">Points Awarded:</span>{" "}
                        {request.points_awarded}
                      </p>
                    )}

                  <p className="text-sm mb-2">
                    <span className="font-medium">Resolved:</span>{" "}
                    {request.resolved_at
                      ? new Date(request.resolved_at).toLocaleString()
                      : "N/A"}
                  </p>

                  {request.resolution_notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium mb-1">
                        Resolution Notes:
                      </p>
                      <div className="text-sm">
                        <LaTeXText content={request.resolution_notes} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
