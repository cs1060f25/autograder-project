"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getSubmissionAuditLog } from "@/lib/regrade-actions";
import { History, User, Clock, AlertCircle, Shield } from "lucide-react";

interface AuditLogViewerProps {
  submissionId: string;
  className?: string;
}

export function AuditLogViewer({ submissionId, className = "" }: AuditLogViewerProps) {
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAuditLog();
  }, [submissionId]);

  const loadAuditLog = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getSubmissionAuditLog(submissionId);

      if (result.success && result.auditLog) {
        setAuditLog(result.auditLog);
      } else {
        setError(result.error || "Failed to load audit log");
      }
    } catch (err) {
      console.error("Error loading audit log:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "regrade_approved":
        return <Badge variant="default" className="bg-green-500">Regrade Approved</Badge>;
      case "ta_override":
        return <Badge variant="default" className="bg-blue-500">TA Override</Badge>;
      case "grade_updated":
        return <Badge variant="default" className="bg-amber-500">Grade Updated</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Grade Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Loading audit log...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Grade Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Grade Audit Log
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>Immutable Record</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Complete history of all grade changes and overrides
        </p>
      </CardHeader>
      <CardContent>
        {auditLog.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No audit log entries found</p>
            <p className="text-sm mt-1">This submission has no recorded grade changes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {auditLog.map((entry, index) => {
              const reviewerName = entry.reviewer
                ? `${entry.reviewer.first_name} ${entry.reviewer.last_name}`
                : "Unknown Reviewer";

              const scoreDiff = entry.new_score - entry.previous_score;
              const isIncrease = scoreDiff > 0;

              return (
                <div
                  key={entry.id || index}
                  className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getActionBadge(entry.action)}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-3 w-3" />
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-white rounded p-3 border">
                      <p className="text-xs text-gray-600 mb-1">Previous Score</p>
                      <p className="text-2xl font-bold text-gray-700">{entry.previous_score}</p>
                    </div>
                    <div className="bg-white rounded p-3 border">
                      <p className="text-xs text-gray-600 mb-1">New Score</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-2xl font-bold ${isIncrease ? "text-green-600" : "text-red-600"}`}>
                          {entry.new_score}
                        </p>
                        <span className={`text-sm font-medium ${isIncrease ? "text-green-600" : "text-red-600"}`}>
                          ({isIncrease ? "+" : ""}{scoreDiff})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Changed by:</span>
                      <span className="text-gray-900">{reviewerName}</span>
                      {entry.reviewer?.email && (
                        <span className="text-gray-500">({entry.reviewer.email})</span>
                      )}
                    </div>

                    {entry.reason && (
                      <div className="bg-white rounded p-3 border">
                        <p className="text-xs text-gray-600 mb-1 font-medium">Reason:</p>
                        <p className="text-sm text-gray-800">{entry.reason}</p>
                      </div>
                    )}

                    {entry.metadata && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                          Additional Metadata
                        </summary>
                        <div className="mt-2 bg-white rounded p-3 border">
                          {entry.metadata.previous_total !== undefined && (
                            <p className="mb-1">
                              <span className="font-medium">Previous Total:</span> {entry.metadata.previous_total}
                            </p>
                          )}
                          {entry.metadata.new_total !== undefined && (
                            <p className="mb-1">
                              <span className="font-medium">New Total:</span> {entry.metadata.new_total}
                            </p>
                          )}
                          {entry.metadata.original_grader && (
                            <p className="mb-1">
                              <span className="font-medium">Original Grader:</span> {entry.metadata.original_grader}
                            </p>
                          )}
                          {entry.metadata.original_graded_at && (
                            <p>
                              <span className="font-medium">Originally Graded:</span>{" "}
                              {new Date(entry.metadata.original_graded_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </details>
                    )}
                  </div>

                  {/* Immutability indicator */}
                  <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-gray-500">
                    <Shield className="h-3 w-3" />
                    <span>This entry is immutable and cannot be modified</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
