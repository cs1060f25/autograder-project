"use client";

import { useState, useEffect } from "react";
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
import { getRubricByAssignment, updateRubric } from "@/lib/rubric-actions";
import { Rubric, RubricCriterion } from "@/lib/data-utils";
import {
  getAIGradingStatus,
  regenerateAIGrade,
  AIGradeData,
} from "@/lib/ai-grading-actions";
import {
  FileText,
  Download,
  MessageSquare,
  User,
  Calendar,
  Plus,
  Trash2,
  Edit3,
  Save,
  RefreshCw,
  Bot,
} from "lucide-react";
import { LaTeXText } from "@/components/ui/latex-text";

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string | null;
  onGradeSubmitted: () => void;
  submissionIds?: string[];
  currentSubmissionIndex?: number;
  onNavigateSubmission?: (submissionId: string) => void;
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
  submissionIds,
  currentSubmissionIndex,
  onNavigateSubmission,
}: GradingModalProps) {
  const [submission, setSubmission] = useState<SubmissionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [editingRubric, setEditingRubric] = useState(false);
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([]);
  const [aiGradeData, setAiGradeData] = useState<AIGradeData | null>(null);
  const [aiGradingStatus, setAiGradingStatus] = useState<string>("pending");
  const [aiGradedAt, setAiGradedAt] = useState<string | null>(null);
  const [regeneratingAI, setRegeneratingAI] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(
    currentSubmissionIndex ?? 0
  );
  const [focusedCriterionId, setFocusedCriterionId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (isOpen && submissionId) {
      loadSubmissionDetails();
    }
  }, [isOpen, submissionId]);

  // Update current index when submissionId changes
  useEffect(() => {
    if (submissionIds && submissionId) {
      const index = submissionIds.indexOf(submissionId);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    } else if (currentSubmissionIndex !== undefined) {
      setCurrentIndex(currentSubmissionIndex);
    }
  }, [submissionId, submissionIds, currentSubmissionIndex]);

  // Keyboard navigation handlers
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.getAttribute("contenteditable") === "true";

      // Arrow key navigation (only when not in input)
      if (!isInputFocused && submissionIds && submissionIds.length > 1) {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          const newIndex =
            e.key === "ArrowLeft"
              ? Math.max(0, currentIndex - 1)
              : Math.min(submissionIds.length - 1, currentIndex + 1);

          if (newIndex !== currentIndex && submissionIds[newIndex]) {
            // Navigate to new submission
            const newSubmissionId = submissionIds[newIndex];
            setCurrentIndex(newIndex);
            if (onNavigateSubmission) {
              onNavigateSubmission(newSubmissionId);
            }
          }
        }
      }

      // Number key shortcuts for presets
      // Work when focused on a rubric input OR when in rubric section (not typing in feedback)
      const isFeedbackInput = activeElement?.id === "feedback";
      const isGradeInput = activeElement?.id === "grade";
      const isRubricInput = activeElement?.id?.startsWith("score-");

      // Only handle number keys for presets when in rubric context
      // Don't interfere with typing in feedback or grade inputs
      if (rubricCriteria.length > 0 && !isFeedbackInput && !isGradeInput) {
        // Determine which criterion to use
        let targetCriterionId: string | null = null;

        if (isRubricInput && activeElement?.id) {
          // Extract criterion ID from input ID (e.g., "score-123" -> "123")
          targetCriterionId = activeElement.id.replace("score-", "");
        } else if (!isInputFocused && focusedCriterionId) {
          // Use focused criterion when not typing in any input
          targetCriterionId = focusedCriterionId;
        }

        if (targetCriterionId) {
          const criterion = rubricCriteria.find(
            (c) => c.id === targetCriterionId
          );
          if (criterion && criterion.presets && criterion.presets.length > 0) {
            const keyNum = parseInt(e.key);
            if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
              const presetIndex = keyNum - 1;
              if (criterion.presets[presetIndex]) {
                e.preventDefault();
                e.stopPropagation();
                const preset = criterion.presets[presetIndex];
                // Update rubric score directly using state setter
                setRubricScores((prev) => ({
                  ...prev,
                  [criterion.id]: preset.points,
                }));
                // Optionally update feedback with preset description
                if (preset.description) {
                  setFeedback((prev) => {
                    const existing = prev || "";
                    return existing
                      ? `${existing}\n\n${preset.description}`
                      : preset.description;
                  });
                }
              }
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isOpen,
    submissionIds,
    currentIndex,
    focusedCriterionId,
    rubricCriteria,
    onClose,
    onGradeSubmitted,
  ]);

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

        // Auto-preview PDF if exactly one PDF attachment exists
        const pdfAttachments = result.submission.attachments.filter(
          (file: FileAttachment) => file.name.toLowerCase().endsWith(".pdf")
        );
        if (pdfAttachments.length === 1 && !selectedFile) {
          setSelectedFile(pdfAttachments[0]);
        }

        // Load AI grading status
        const aiStatusResult = await getAIGradingStatus(submissionId);
        if (aiStatusResult.success && aiStatusResult.status) {
          setAiGradingStatus(aiStatusResult.status.status);
          setAiGradeData(aiStatusResult.status.ai_grade_data || null);
          setAiGradedAt(aiStatusResult.status.ai_graded_at || null);
        }

        // Load rubric for this assignment
        const rubricResult = await getRubricByAssignment(
          result.submission.assignment.id
        );
        if (rubricResult.success && rubricResult.rubric) {
          setRubric(rubricResult.rubric);
          setRubricCriteria(rubricResult.rubric.criteria);

          // Initialize rubric scores with AI suggestions if available
          const initialScores: Record<string, number> = {};
          rubricResult.rubric.criteria.forEach((criterion: RubricCriterion) => {
            if (
              aiStatusResult.success &&
              aiStatusResult.status?.ai_grade_data
            ) {
              // Pre-fill with AI scores
              const aiItem = aiStatusResult.status.ai_grade_data.items.find(
                (item) => item.id === criterion.id
              );
              initialScores[criterion.id] = aiItem?.points || 0;
            } else {
              initialScores[criterion.id] = 0;
            }
          });
          setRubricScores(initialScores);
        }
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
    if (!submissionId) {
      setError("No submission selected");
      return;
    }

    // If using rubric, validate rubric scores
    if (rubric && rubricCriteria.length > 0) {
      const hasValidScores = rubricCriteria.every(
        (criterion) =>
          rubricScores[criterion.id] !== undefined &&
          rubricScores[criterion.id] >= 0 &&
          rubricScores[criterion.id] <= criterion.max_points
      );

      if (!hasValidScores) {
        setError("Please provide valid scores for all rubric criteria");
        return;
      }

      setGrading(true);
      setError(null);

      try {
        const result = await gradeSubmission(
          submissionId,
          0, // grade not used when rubric scores provided
          feedback,
          rubricScores
        );

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
            setRubric(null);
            setRubricScores({});
            setRubricCriteria([]);
          }, 1500);
        } else {
          setError(result.error || "Failed to submit grade");
        }
      } catch (err) {
        setError("Failed to submit grade. Please try again.");
      } finally {
        setGrading(false);
      }
    } else {
      // Traditional grading
      if (!grade.trim()) {
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
        const result = await gradeSubmission(
          submissionId,
          gradeValue,
          feedback
        );
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

  const addCriterion = () => {
    const newCriterion: RubricCriterion = {
      id: Date.now().toString(),
      name: "",
      description: "",
      max_points: 0,
    };
    setRubricCriteria([...rubricCriteria, newCriterion]);
  };

  const removeCriterion = (id: string) => {
    setRubricCriteria(rubricCriteria.filter((c) => c.id !== id));
    // Remove from scores as well
    const newScores = { ...rubricScores };
    delete newScores[id];
    setRubricScores(newScores);
  };

  const updateCriterion = (
    id: string,
    field: keyof RubricCriterion,
    value: string | number
  ) => {
    setRubricCriteria(
      rubricCriteria.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const addPreset = (criterionId: string) => {
    setRubricCriteria(
      rubricCriteria.map((c) => {
        if (c.id === criterionId) {
          const presets = c.presets || [];
          if (presets.length >= 9) return c; // Max 9 presets
          return {
            ...c,
            presets: [...presets, { points: 0, description: "" }],
          };
        }
        return c;
      })
    );
  };

  const removePreset = (criterionId: string, presetIndex: number) => {
    setRubricCriteria(
      rubricCriteria.map((c) => {
        if (c.id === criterionId && c.presets) {
          return {
            ...c,
            presets: c.presets.filter((_, i) => i !== presetIndex),
          };
        }
        return c;
      })
    );
  };

  const updatePreset = (
    criterionId: string,
    presetIndex: number,
    field: "points" | "description",
    value: number | string
  ) => {
    setRubricCriteria(
      rubricCriteria.map((c) => {
        if (c.id === criterionId && c.presets) {
          return {
            ...c,
            presets: c.presets.map((p, i) =>
              i === presetIndex ? { ...p, [field]: value } : p
            ),
          };
        }
        return c;
      })
    );
  };

  const updateRubricScore = (criterionId: string, score: number) => {
    setRubricScores({
      ...rubricScores,
      [criterionId]: score,
    });
  };

  const getTotalRubricPoints = () => {
    return rubricCriteria.reduce(
      (sum, criterion) => sum + criterion.max_points,
      0
    );
  };

  const getTotalRubricScore = () => {
    return Object.values(rubricScores).reduce((sum, score) => sum + score, 0);
  };

  const handleSaveRubricChanges = async () => {
    if (!rubric) return;

    setGrading(true);
    setError(null);

    try {
      const result = await updateRubric(rubric.id, rubricCriteria);
      if (result.success) {
        setRubric({ ...rubric, criteria: rubricCriteria });
        setEditingRubric(false);
        setSuccess("Rubric updated successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to update rubric");
      }
    } catch (err) {
      setError("Failed to update rubric. Please try again.");
    } finally {
      setGrading(false);
    }
  };

  const handleRegenerateAI = async () => {
    if (!submissionId) return;

    setRegeneratingAI(true);
    setError(null);

    try {
      const result = await regenerateAIGrade(submissionId);
      if (result.success) {
        setSuccess("AI grading regenerated successfully!");
        // Reload submission details to get new AI data
        await loadSubmissionDetails();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to regenerate AI grade");
      }
    } catch (err) {
      setError("Failed to regenerate AI grade. Please try again.");
    } finally {
      setRegeneratingAI(false);
    }
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
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                Grade Assignment: {submission.assignment.title}
              </DialogTitle>
              <DialogDescription>
                {submission.assignment.course.code} -{" "}
                {submission.assignment.course.name}
                {submissionIds && submissionIds.length > 1 && (
                  <span className="ml-2 text-blue-600">
                    ({currentIndex + 1} of {submissionIds.length})
                  </span>
                )}
              </DialogDescription>
            </div>
            <div className="flex flex-col gap-1 text-xs mt-4 text-gray-500">
              {submissionIds && submissionIds.length > 1 && (
                <div className="flex items-center gap-1">
                  <span>← →</span>
                  <span>Navigate</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* AI Grading Status */}
        {aiGradingStatus === "pending" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
              <span className="text-sm text-yellow-800">
                AI grading in progress...
              </span>
            </div>
          </div>
        )}

        {aiGradingStatus === "failed" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">
                AI grading failed. Please grade manually.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 min-h-0">
          {/* Left Column - Assignment Details and PDF Viewer */}
          <div className="space-y-4 xl:col-span-3">
            {/* Assignment Instructions */}
            {submission.assignment.instructions && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium mb-2">Assignment Instructions</h3>
                <div className="text-sm text-gray-700">
                  <LaTeXText content={submission.assignment.instructions} />
                </div>
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

            {selectedFile && (
              <iframe
                src={selectedFile.url + "#toolbar=0"}
                className="w-full h-[70vh] min-h-[600px]"
                title="PDF Viewer"
              />
            )}

            {/* Text Content */}
            {submission.content && (
              <div className="space-y-2">
                <h3 className="font-medium">Student Comments</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <LaTeXText content={submission.content} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Grading Form */}
          <div className="space-y-4 xl:col-span-2">
            <div className="space-y-4">
              {rubric && rubricCriteria.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Grading Rubric</h3>
                    <div className="flex items-center gap-2">
                      {aiGradingStatus === "completed" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRegenerateAI}
                          disabled={regeneratingAI}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <RefreshCw
                            className={`h-4 w-4 mr-2 ${
                              regeneratingAI ? "animate-spin" : ""
                            }`}
                          />
                          {regeneratingAI
                            ? "Regenerating..."
                            : "Regenerate Grade"}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRubric(!editingRubric)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        {editingRubric ? "Cancel Edit" : "Edit Rubric"}
                      </Button>
                    </div>
                  </div>

                  {editingRubric ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Edit the rubric criteria. Changes will be saved to the
                        assignment.
                      </p>

                      {rubricCriteria.map((criterion, index) => (
                        <div
                          key={criterion.id}
                          className="p-4 border rounded-lg space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">
                              Criterion {index + 1}
                            </h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCriterion(criterion.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input
                              value={criterion.name}
                              onChange={(e) =>
                                updateCriterion(
                                  criterion.id,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder="e.g., Code Quality"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Description</Label>
                            <textarea
                              value={criterion.description}
                              onChange={(e) =>
                                updateCriterion(
                                  criterion.id,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Describe what this criterion evaluates..."
                              className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Max Points</Label>
                            <Input
                              type="number"
                              min="1"
                              value={criterion.max_points}
                              onChange={(e) =>
                                updateCriterion(
                                  criterion.id,
                                  "max_points",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              placeholder="10"
                            />
                          </div>
                          <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">
                                Scoring Presets
                              </Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addPreset(criterion.id)}
                                disabled={(criterion.presets?.length || 0) >= 9}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Preset
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              Define preset scores that can be quickly applied
                              during grading.
                            </p>
                            {criterion.presets &&
                              criterion.presets.length > 0 && (
                                <div className="space-y-2">
                                  {criterion.presets.map(
                                    (preset, presetIndex) => (
                                      <div
                                        key={presetIndex}
                                        className="flex items-center gap-2 p-2  rounded"
                                      >
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-medium flex-shrink-0">
                                          {presetIndex + 1}
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                          <Input
                                            type="number"
                                            min="0"
                                            max={criterion.max_points}
                                            value={preset.points}
                                            onChange={(e) =>
                                              updatePreset(
                                                criterion.id,
                                                presetIndex,
                                                "points",
                                                parseInt(e.target.value) || 0
                                              )
                                            }
                                            placeholder="Points"
                                            className="h-8"
                                          />
                                          <Input
                                            type="text"
                                            value={preset.description}
                                            onChange={(e) =>
                                              updatePreset(
                                                criterion.id,
                                                presetIndex,
                                                "description",
                                                e.target.value
                                              )
                                            }
                                            placeholder="Description (optional)"
                                            className="h-8"
                                          />
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            removePreset(
                                              criterion.id,
                                              presetIndex
                                            )
                                          }
                                          className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={addCriterion}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Criterion
                      </Button>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleSaveRubricChanges}
                          disabled={grading}
                          className="flex-1"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Rubric Changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingRubric(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Rubric scoring mode
                    <div className="space-y-4">
                      {rubricCriteria.map((criterion, index) => {
                        // Get AI feedback for this criterion
                        const aiItem = aiGradeData?.items.find(
                          (item) => item.id === criterion.id
                        );
                        const hasAIFeedback =
                          aiItem && aiGradingStatus === "completed";

                        return (
                          <div
                            key={criterion.id}
                            className={`p-4 border rounded-lg ${
                              hasAIFeedback
                                ? "bg-blue-50/30 border-blue-200"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{criterion.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                  {rubricScores[criterion.id] || 0} /{" "}
                                  {criterion.max_points} points
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              <LaTeXText
                                content={criterion.description || ""}
                              />
                            </p>

                            {hasAIFeedback && (
                              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                <div className="flex items-center gap-2 mb-1">
                                  <Bot className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs font-medium text-blue-800">
                                    AI Suggestion: {aiItem.points} /{" "}
                                    {aiItem.maxPoints} points
                                  </span>
                                </div>
                                {aiItem.comments && (
                                  <div className="text-xs text-blue-700">
                                    <LaTeXText content={aiItem.comments} />
                                  </div>
                                )}
                              </div>
                            )}

                            {criterion.presets &&
                              criterion.presets.length > 0 && (
                                <div className="mb-3 space-y-2">
                                  {criterion.presets.map(
                                    (preset, presetIndex) => {
                                      const currentScore =
                                        rubricScores[criterion.id] || 0;
                                      const isSelected =
                                        currentScore === preset.points;

                                      return (
                                        <button
                                          key={presetIndex}
                                          type="button"
                                          onClick={() => {
                                            updateRubricScore(
                                              criterion.id,
                                              preset.points
                                            );
                                            if (preset.description) {
                                              setFeedback((prev) => {
                                                const existing = prev || "";
                                                return existing
                                                  ? `${existing}\n\n${preset.description}`
                                                  : preset.description;
                                              });
                                            }
                                          }}
                                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm border rounded text-left transition-colors cursor-pointer ${
                                            isSelected
                                              ? "bg-blue-100 hover:bg-blue-200 border-blue-400"
                                              : "hover:bg-gray-100 border-gray-300"
                                          }`}
                                        >
                                          <span
                                            className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-medium flex-shrink-0 ${
                                              isSelected
                                                ? "bg-blue-700"
                                                : "bg-blue-600"
                                            }`}
                                          >
                                            {presetIndex + 1}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <div
                                              className={`font-medium ${
                                                isSelected
                                                  ? "text-blue-900"
                                                  : "text-gray-900"
                                              }`}
                                            >
                                              {preset.points} points
                                            </div>
                                            {preset.description && (
                                              <div
                                                className={`text-xs mt-0.5 ${
                                                  isSelected
                                                    ? "text-blue-700"
                                                    : "text-gray-600"
                                                }`}
                                              >
                                                <LaTeXText
                                                  content={preset.description}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              )}

                            <div className="flex items-center gap-2">
                              <Label htmlFor={`score-${criterion.id}`}>
                                Score:
                              </Label>
                              <Input
                                id={`score-${criterion.id}`}
                                type="number"
                                min="0"
                                max={criterion.max_points}
                                value={rubricScores[criterion.id] || 0}
                                onChange={(e) =>
                                  updateRubricScore(
                                    criterion.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                onFocus={() =>
                                  setFocusedCriterionId(criterion.id)
                                }
                                onBlur={() => setFocusedCriterionId(null)}
                                className="w-20"
                              />
                              <span className="text-sm text-gray-500">
                                / {criterion.max_points}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Score:</span>
                          <span className="font-bold text-blue-600">
                            {getTotalRubricScore()} / {getTotalRubricPoints()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Traditional grading
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Traditional Grading</h3>
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
                </div>
              )}

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
            disabled={
              grading ||
              (rubric && rubricCriteria.length > 0
                ? false // Enable for rubric grading (validation happens in handleGradeSubmit)
                : !grade.trim()) // Only require grade for traditional grading
            }
          >
            {grading ? "Submitting..." : "Submit Grade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
