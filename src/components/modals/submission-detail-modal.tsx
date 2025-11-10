"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { GradingModal } from "@/components/modals/grading-modal";
import {
  FileText,
  Download,
  User,
  Calendar,
  Award,
  MessageSquare,
  Star,
} from "lucide-react";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface FileAttachment {
  name: string;
  url: string;
  size: number;
}

interface Submission {
  id: string;
  student_id: string;
  content: string | null;
  attachments: FileAttachment[];
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
  course?: {
    id: string;
    name: string;
    code: string;
  };
}

interface SubmissionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission;
  assignment: Assignment;
}

export function SubmissionDetailModal({
  isOpen,
  onClose,
  submission,
  assignment,
}: SubmissionDetailModalProps) {
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileDownload = (file: FileAttachment) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Submission Details</DialogTitle>
            <DialogDescription>
              {assignment.title} - {assignment.course?.code}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Student Information */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">
                    {submission.student?.first_name}{" "}
                    {submission.student?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{submission.student?.email}</p>
                </div>
              </div>
            </div>

            {/* Submission Status and Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-500">Submitted</p>
                </div>
                <p className="font-medium">
                  {submission.submitted_at
                    ? new Date(submission.submitted_at).toLocaleString()
                    : "Not submitted"}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-500">Status</p>
                </div>
                {getStatusBadge(submission.status)}
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-500">Grade</p>
                </div>
                <p className="font-medium">
                  {formatGrade(submission.grade, assignment.max_points)}
                </p>
              </div>
            </div>

            {/* Submitted Files */}
            {submission.attachments && submission.attachments.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submitted Files
                </h3>
                <div className="space-y-2">
                  {submission.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFileDownload(file)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submission Content */}
            {submission.content && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {submission.content}
                  </p>
                </div>
              </div>
            )}

            {/* Grade and Feedback */}
            {submission.status === "graded" && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Grade & Feedback
                </h3>
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Final Grade:</span>
                      <span className="text-lg font-bold text-green-800">
                        {formatGrade(submission.grade, assignment.max_points)}
                      </span>
                    </div>
                    {submission.graded_at && (
                      <p className="text-xs text-green-600 mt-1">
                        Graded on{" "}
                        {new Date(submission.graded_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {submission.feedback && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">
                        Feedback
                      </h4>
                      <p className="text-sm text-yellow-700 whitespace-pre-wrap">
                        {submission.feedback}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {submission.status !== "draft" && (
                <Button onClick={() => setIsGradingModalOpen(true)}>
                  <Star className="h-4 w-4 mr-2" />
                  {submission.status === "graded" ? "Update Grade" : "Grade Submission"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grading Modal */}
      <GradingModal
        isOpen={isGradingModalOpen}
        onClose={() => setIsGradingModalOpen(false)}
        submissionId={submission.id}
        onGradeSubmitted={() => {
          setIsGradingModalOpen(false);
          onClose();
          window.location.reload(); // Refresh to show updated grade
        }}
        // Single submission, no navigation needed
      />
    </>
  );
}
