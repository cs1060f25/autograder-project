"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { RegradeRequest } from "@/types/regrade";

interface ViewRegradeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RegradeRequest & { assignments?: { title: string } };
}

export function ViewRegradeRequestModal({
  isOpen,
  onClose,
  request,
}: ViewRegradeRequestModalProps) {
  const getStatusBadge = () => {
    switch (request.status) {
      case "pending":
        return <Badge className="bg-yellow-500">Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Denied</Badge>;
      case "withdrawn":
        return <Badge variant="secondary">Withdrawn</Badge>;
      default:
        return <Badge variant="secondary">{request.status}</Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (request.status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const auditMetadata = request.audit_metadata;
  const maxPoints = auditMetadata?.max_points || 0;
  const originalDeduction = auditMetadata?.original_deduction || 0;
  const originalScore = maxPoints - originalDeduction;
  const isResolved = request.status === 'approved' || request.status === 'rejected';
  const isApproved = request.status === 'approved';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Regrade Request {isResolved ? (isApproved ? '- Approved' : '- Denied') : ''}
          </DialogTitle>
          <DialogDescription>
            {request.assignments?.title || "Assignment"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          {request.status === 'pending' && (
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium text-gray-900">Waiting for instructor/TA review</p>
              </div>
              <Badge className="bg-yellow-500">Pending Review</Badge>
            </div>
          )}

          {isResolved && (
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              isApproved 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`font-medium ${isApproved ? 'text-green-900' : 'text-red-900'}`}>
                  {isApproved ? 'Your request has been approved!' : 'Your request has been denied'}
                </p>
                {request.resolved_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Resolved on {new Date(request.resolved_at).toLocaleString()}
                  </p>
                )}
              </div>
              {getStatusBadge()}
            </div>
          )}

          {/* Rubric Item & Scoring */}
          {auditMetadata && (
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-lg">Rubric Item</h3>
              
              {auditMetadata.rubric_criterion_text && (
                <div className="bg-blue-50 border-blue-200 border rounded p-3">
                  <p className="text-sm text-blue-900">{auditMetadata.rubric_criterion_text}</p>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-100 rounded p-2">
                  <p className="text-xs text-gray-600">Max Points</p>
                  <p className="text-xl font-bold text-gray-900">{maxPoints}</p>
                </div>
                <div className="bg-red-50 rounded p-2">
                  <p className="text-xs text-red-600">Original Score</p>
                  <p className="text-xl font-bold text-red-700">{originalScore}</p>
                </div>
                <div className="bg-red-100 rounded p-2">
                  <p className="text-xs text-red-700">Deduction</p>
                  <p className="text-xl font-bold text-red-800">-{originalDeduction}</p>
                </div>
              </div>
            </div>
          )}

          {/* Your Explanation */}
          <div className="border rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-lg">Your Explanation</h3>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {request.student_explanation}
              </p>
            </div>
          </div>

          {/* Resolution Details (if resolved) */}
          {isResolved && (
            <>
              {/* Points Awarded (if approved) */}
              {isApproved && request.points_awarded !== null && request.points_awarded !== undefined && (
                <div className="border border-green-300 rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold text-lg text-green-900 mb-2">Points Awarded</h3>
                  <div className="text-center bg-white rounded p-3">
                    <p className="text-3xl font-bold text-green-700">
                      {request.points_awarded} / {maxPoints}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Your grade has been updated
                    </p>
                  </div>
                </div>
              )}

              {/* TA/Instructor Comment */}
              {request.resolution_notes && (
                <div className={`border rounded-lg p-4 ${
                  isApproved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <h3 className={`font-semibold text-lg mb-2 ${
                    isApproved ? 'text-green-900' : 'text-red-900'
                  }`}>
                    TA/Instructor Comment
                  </h3>
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {request.resolution_notes}
                    </p>
                  </div>
                </div>
              )}

              {/* AI Grading Context (if available) */}
              {auditMetadata?.ai_rationale && (
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h3 className="font-semibold text-lg text-blue-900 mb-2">Original AI Grading Context</h3>
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {auditMetadata.ai_rationale}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Submission Date */}
          <div className="text-sm text-gray-600">
            <p>Submitted: {new Date(request.created_at).toLocaleString()}</p>
            {!isResolved && (
              <p className="text-xs text-gray-500 mt-1">
                Your instructor or TA will review this request and respond soon.
              </p>
            )}
            {isResolved && !isApproved && (
              <p className="text-xs text-gray-500 mt-1">
                If you have further questions about this decision, please contact your instructor.
              </p>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
