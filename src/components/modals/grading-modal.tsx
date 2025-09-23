"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  gradeSubmission,
  getSubmissionDetails,
  FileAttachment,
} from "@/lib/submission-actions";
import {
  FileText,
  Download,
  Star,
  MessageSquare,
  User,
  Calendar,
  Sparkles,
} from "lucide-react";

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string | null;
  onGradeSubmitted: () => void;
}

interface SubmissionDetails {
  id: string;
  content: string | null;
  attachments: FileAttachment[];
  submitted_at: string | null;
  grade: number | null;
  feedback: string | null;
  assignment: {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    max_points: number;
    due_date: string;
    course: {
      id: string;
      name: string;
      code: string;
    };
  };
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function GradingModal({
  isOpen,
  onClose,
  submissionId,
  onGradeSubmitted,
}: GradingModalProps) {
  const [submission, setSubmission] = useState<SubmissionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);

  useEffect(() => {
    if (isOpen && submissionId) {
      loadSubmissionDetails();
    }
  }, [isOpen, submissionId]);

  const loadSubmissionDetails = async () => {
    if (!submissionId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getSubmissionDetails(submissionId);
      if (result.success && result.submission) {
        setSubmission(result.submission);
        setGrade(result.submission.grade?.toString() || "");
        setFeedback(result.submission.feedback || "");
      } else {
        setError(result.error || "Failed to load submission details");
      }
    } catch (err) {
      setError("Failed to load submission details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async () => {
    if (!submissionId || !grade.trim()) {
      setError("Please enter a grade");
      return;
    }

    const gradeValue = parseInt(grade);
    if (
      isNaN(gradeValue) ||
      gradeValue < 0 ||
      gradeValue > 100 ||
      !Number.isInteger(gradeValue)
    ) {
      setError("Grade must be a whole number between 0 and 100");
      return;
    }

    setGrading(true);
    setError(null);

    try {
      const result = await gradeSubmission(submissionId, gradeValue, feedback);
      if (result.success) {
        setSuccess("Grade submitted successfully!");
        setTimeout(() => {
          onGradeSubmitted();
          onClose();
          // Reset form
          setGrade("");
          setFeedback("");
          setSuccess(null);
          setSubmission(null);
        }, 1500);
      } else {
        setError(result.error || "Failed to submit grade");
      }
    } catch (err) {
      setError("Failed to submit grade. Please try again.");
    } finally {
      setGrading(false);
    }
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!submission && loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent allowWide className="max-w-[98vw] max-h-[95vh] w-[98vw]">
          <DialogHeader>
            <DialogTitle>Loading Submission</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading submission details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!submission) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent allowWide className="max-w-[98vw] max-h-[95vh] w-[98vw]">
          <DialogHeader>
            <DialogTitle>Error Loading Submission</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load submission details</p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        allowWide
        className="max-w-[98vw] max-h-[95vh] w-[98vw] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Grade Assignment: {submission.assignment.title}
          </DialogTitle>
          <DialogDescription>
            {submission.assignment.course.code} -{" "}
            {submission.assignment.course.name}
          </DialogDescription>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 p-4 shadow-sm backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
          <div className="relative flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                AI-Assisted Grading Coming Soon
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                We will add AI-assistance features after this milestone. For
                now, this is just meant to demonstrate the primary user journey.
              </p>
            </div>
          </div>
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-60"></div>
          <div className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 opacity-40"></div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 min-h-0">
          {/* Left Column - Assignment Details and PDF Viewer */}
          <div className="space-y-4 xl:col-span-3">
            {/* Student Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Student Information
              </h3>
              <p className="text-sm">
                {submission.student.first_name} {submission.student.last_name}
              </p>
              <p className="text-xs text-gray-500">
                {submission.student.email}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                Submitted:{" "}
                {submission.submitted_at
                  ? new Date(submission.submitted_at).toLocaleDateString()
                  : "Unknown"}
              </p>
            </div>

            {/* Assignment Instructions */}
            {submission.assignment.instructions && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium mb-2">Assignment Instructions</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {submission.assignment.instructions}
                </p>
              </div>
            )}

            {/* PDF Files */}
            {submission.attachments.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Submitted Files</h3>
                <div className="space-y-2">
                  {submission.attachments.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedFile?.url === file.url
                          ? "border-blue-500 bg-blue-50"
                          : ""
                      }`}
                      onClick={() => setSelectedFile(file)}
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileDownload(file);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PDF Viewer */}
            {selectedFile && (
              <div className="space-y-2">
                <h3 className="font-medium">PDF Viewer</h3>
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={selectedFile.url}
                    className="w-full h-[70vh] min-h-[600px]"
                    title="PDF Viewer"
                  />
                </div>
              </div>
            )}

            {/* Text Content */}
            {submission.content && (
              <div className="space-y-2">
                <h3 className="font-medium">Student Comments</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {submission.content}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Grading Form */}
          <div className="space-y-4 xl:col-span-2">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium mb-2">Assignment Details</h3>
              <p className="text-sm">
                <strong>Max Points:</strong> {submission.assignment.max_points}
              </p>
              <p className="text-sm">
                <strong>Due Date:</strong>{" "}
                {new Date(submission.assignment.due_date).toLocaleDateString()}
              </p>
            </div>

            {/* Grading Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade (0-100)</Label>
                <Input
                  id="grade"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={grade}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow integers
                    if (value === "" || /^\d+$/.test(value)) {
                      setGrade(value);
                    }
                  }}
                  placeholder="Enter grade (0-100)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Feedback (Optional)
                </Label>
                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter feedback for the student..."
                  className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md resize-vertical"
                />
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={grading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGradeSubmit}
            disabled={grading || !grade.trim()}
          >
            {grading ? "Submitting..." : "Submit Grade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
