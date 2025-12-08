"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
  FileAttachment,
  createSubmission,
  uploadFileToStorage,
  deleteFileFromStorage,
} from "@/lib/submission-actions";
import {
  Rubric,
  RubricCriterion,
  RubricScores,
  ScoreDistribution,
  getScoreDistribution,
} from "@/lib/data-utils";
import { getRubricByAssignment, getRubricScores } from "@/lib/rubric-actions";
import {
  Upload,
  X,
  FileText,
  Send,
  Star,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import { LaTeXText } from "@/components/ui/latex-text";

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  assignmentTitle: string;
  dueDate: string;
  studentId: string;
  instructions?: string;
  submissionId?: string; // Add submission ID for AI grading status
  showScoreDistribution?: boolean;
  maxPoints?: number;
  existingSubmission?: {
    content: string;
    attachments: FileAttachment[];
    status: string;
    grade?: number;
    feedback?: string;
    graded_at?: string;
  };
}

export function SubmissionModal({
  isOpen,
  onClose,
  assignmentId,
  assignmentTitle,
  dueDate,
  studentId,
  instructions,
  submissionId,
  showScoreDistribution,
  maxPoints,
  existingSubmission,
}: SubmissionModalProps) {
  const [content, setContent] = useState(existingSubmission?.content || "");
  const [attachments, setAttachments] = useState<FileAttachment[]>(
    existingSubmission?.attachments || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rubricScores, setRubricScores] = useState<RubricScores | null>(null);
  const [loadingRubric, setLoadingRubric] = useState(false);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [scoreDistribution, setScoreDistribution] =
    useState<ScoreDistribution | null>(null);
  const [loadingDistribution, setLoadingDistribution] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load rubric always; scores only when graded
  useEffect(() => {
    if (!isOpen) return;
    loadRubric();
    if (
      existingSubmission?.status === "graded" &&
      existingSubmission.grade &&
      submissionId
    ) {
      loadRubricScores();
    }
    // Load score distribution if enabled and graded
    if (showScoreDistribution && existingSubmission?.status === "graded") {
      loadScoreDistribution();
    }
  }, [
    isOpen,
    existingSubmission?.status,
    existingSubmission?.grade,
    submissionId,
    showScoreDistribution,
  ]);

  const loadRubricScores = async () => {
    if (!existingSubmission) return;

    setLoadingRubric(true);
    try {
      if (!submissionId) return;
      const res = await getRubricScores(submissionId);
      if ((res as any).success) {
        setRubricScores(
          ((res as any).rubricScores || null) as RubricScores | null
        );
      }
    } catch (error) {
      console.error("Failed to load rubric scores:", error);
    } finally {
      setLoadingRubric(false);
    }
  };

  const loadRubric = async () => {
    setLoadingRubric(true);
    try {
      const res = await getRubricByAssignment(assignmentId as string);
      if ((res as any).success && (res as any).rubric) {
        setRubric((res as any).rubric as Rubric);
      } else {
        setRubric(null);
      }
    } catch (error) {
      console.error("Failed to load rubric:", error);
      setRubric(null);
    } finally {
      setLoadingRubric(false);
    }
  };

  const loadScoreDistribution = async () => {
    setLoadingDistribution(true);
    try {
      const distribution = await getScoreDistribution(assignmentId);
      setScoreDistribution(distribution);
    } catch (error) {
      console.error("Failed to load score distribution:", error);
      setScoreDistribution(null);
    } finally {
      setLoadingDistribution(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File size must be less than 10MB");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await uploadFileToStorage(file, assignmentId, studentId);

      if (result.success && result.fileAttachment) {
        setAttachments((prev) => [...prev, result.fileAttachment!]);
        setSuccess("File uploaded successfully");
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFile = async (index: number) => {
    const fileToRemove = attachments[index];

    try {
      const result = await deleteFileFromStorage(fileToRemove.url);
      if (result.success) {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
        setSuccess("File removed successfully");
      } else {
        setError(result.error || "Failed to remove file");
      }
    } catch (err) {
      setError("Failed to remove file. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && attachments.length === 0) {
      setError("Please provide content or upload a file");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createSubmission(assignmentId, content, attachments);

      if (result.success) {
        setSuccess("Assignment submitted successfully!");
        setTimeout(() => {
          onClose();
          // Reset form
          setContent("");
          setAttachments([]);
          setSuccess(null);
        }, 500);
      } else {
        setError(result.error || "Failed to submit assignment");
      }
    } catch (err) {
      setError("Failed to submit assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Assignment: {assignmentTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {instructions && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Instructions:</h4>
              <div className="text-sm text-gray-700">
                <LaTeXText content={instructions} />
              </div>
            </div>
          )}

          {/* Grade Display */}
          {existingSubmission?.status === "graded" &&
            existingSubmission.grade !== undefined &&
            maxPoints && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-800">
                    Assignment Graded
                  </h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">Grade:</span>
                  <span className="text-lg font-bold text-green-800">
                    {existingSubmission.grade} / {maxPoints} (
                    {((existingSubmission.grade / maxPoints) * 100).toFixed(1)}
                    %)
                  </span>
                </div>
                {existingSubmission.graded_at && (
                  <p className="text-xs text-green-600 mt-1">
                    Graded on{" "}
                    {new Date(
                      existingSubmission.graded_at
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

          {/* Rubric Display */}
          {rubric && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">Rubric</h4>
                <span className="text-xs text-gray-500">
                  Max{" "}
                  {rubric.criteria.reduce((s, c) => s + (c.max_points || 0), 0)}{" "}
                  pts
                </span>
              </div>
              <div className="space-y-3">
                {rubric.criteria.map((c: RubricCriterion) => (
                  <div
                    key={c.id}
                    className="p-3 bg-white border border-gray-200 rounded-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {c.name}
                      </span>
                      <span className="text-sm text-gray-600">
                        {existingSubmission?.status === "graded" &&
                        rubricScores?.scores &&
                        rubricScores.scores[c.id] !== undefined
                          ? `${rubricScores.scores[c.id]} / ${c.max_points} pts`
                          : `/ ${c.max_points} pts`}
                      </span>
                    </div>
                    {c.description && (
                      <div className="text-sm text-gray-700 mt-1">
                        <LaTeXText content={c.description} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rubric Scores Display */}
          {existingSubmission?.status === "graded" && rubricScores && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-800">Rubric Breakdown</h4>
              </div>
              <div className="space-y-2">
                {Object.entries(rubricScores.scores).map(
                  ([criterionId, score]) => {
                    const criterionName = rubric?.criteria.find(
                      (c) => c.id === criterionId
                    )?.name;
                    return (
                      <div
                        key={criterionId}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-blue-700">
                          {criterionName || `Criterion ${criterionId}`}:
                        </span>
                        <span className="font-medium text-blue-800">
                          {score} points
                        </span>
                      </div>
                    );
                  }
                )}
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <div className="flex justify-between items-center font-medium">
                    <span className="text-blue-800">Total Score:</span>
                    <span className="text-blue-800">
                      {rubricScores.total_score} points
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Display */}
          {existingSubmission?.status === "graded" &&
            existingSubmission.feedback && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">
                  Instructor Feedback
                </h4>
                <div className="text-sm text-yellow-700">
                  <LaTeXText content={existingSubmission.feedback} />
                </div>
              </div>
            )}

          {/* Score Distribution Display */}
          {showScoreDistribution &&
            existingSubmission?.status === "graded" &&
            scoreDistribution && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium text-purple-800">
                    Class Score Distribution
                  </h4>
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white p-3 rounded border border-purple-100">
                    <p className="text-xs text-purple-600 mb-1">Mean</p>
                    <p className="text-lg font-semibold text-purple-900">
                      {scoreDistribution.mean}
                      {maxPoints && ` / ${maxPoints}`}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border border-purple-100">
                    <p className="text-xs text-purple-600 mb-1">Median</p>
                    <p className="text-lg font-semibold text-purple-900">
                      {scoreDistribution.median}
                      {maxPoints && ` / ${maxPoints}`}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border border-purple-100">
                    <p className="text-xs text-purple-600 mb-1">Std Dev</p>
                    <p className="text-lg font-semibold text-purple-900">
                      {scoreDistribution.stdDev}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border border-purple-100">
                    <p className="text-xs text-purple-600 mb-1">Total Graded</p>
                    <p className="text-lg font-semibold text-purple-900">
                      {scoreDistribution.totalGraded}
                    </p>
                  </div>
                </div>

                {/* Quartiles */}
                <div className="mb-4">
                  <p className="text-xs text-purple-600 mb-2">Quartiles</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-purple-700">
                      Q1: {scoreDistribution.quartiles.q1}
                    </span>
                    <span className="text-purple-400">|</span>
                    <span className="text-purple-700">
                      Q2: {scoreDistribution.quartiles.q2}
                    </span>
                    <span className="text-purple-400">|</span>
                    <span className="text-purple-700">
                      Q3: {scoreDistribution.quartiles.q3}
                    </span>
                  </div>
                </div>

                {/* Histogram */}
                <div>
                  <p className="text-xs text-purple-600 mb-2">
                    Score Distribution
                  </p>
                  <div className="space-y-1">
                    {scoreDistribution.histogram.map((bin) => {
                      const percentage =
                        (bin.count / scoreDistribution.totalGraded) * 100;
                      return (
                        <div
                          key={bin.range}
                          className="flex items-center gap-2"
                        >
                          <span className="text-xs text-purple-700 w-16">
                            {bin.range}
                          </span>
                          <div className="flex-1 bg-purple-100 rounded-full h-4 overflow-hidden">
                            <div
                              className="bg-purple-500 h-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-purple-700 w-12 text-right">
                            {bin.count} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Your Position */}
                {existingSubmission.grade !== undefined && maxPoints && (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <p className="text-sm text-purple-700">
                      <strong>Your Score:</strong> {existingSubmission.grade} /{" "}
                      {maxPoints} (
                      {((existingSubmission.grade / maxPoints) * 100).toFixed(
                        1
                      )}
                      %)
                    </p>
                  </div>
                )}
              </div>
            )}

          {loadingDistribution && showScoreDistribution && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-600">
                Loading score distribution...
              </p>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload PDF Files</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                Click to upload PDF files (max 10MB each)
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
              >
                Choose Files
              </Button>
            </div>
          </div>

          {/* Uploaded Files */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Files</Label>
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
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
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Text Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Submission Comments (Optional)</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your comments here..."
              className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md resize-vertical"
            />
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

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                isSaving ||
                (!content.trim() && attachments.length === 0)
              }
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
