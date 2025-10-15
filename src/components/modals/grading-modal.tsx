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
import { getRubricByAssignment, updateRubric } from "@/lib/rubric-actions";
import { Rubric, RubricCriterion } from "@/lib/data-utils";
import {
  getAIGradingStatus,
  regenerateAIGrade,
  AIGradeData,
} from "@/lib/ai-grading-actions";
import {
  Description as FileTextIcon,
  Download as DownloadIcon,
  Star as StarIcon,
  Message as MessageSquareIcon,
  Person as UserIcon,
  CalendarToday as CalendarIcon,
  AutoAwesome as SparklesIcon,
  Add as PlusIcon,
  Delete as Trash2Icon,
  Edit as Edit3Icon,
  Save as SaveIcon,
  Refresh as RefreshCwIcon,
  SmartToy as BotIcon,
  ExpandMore as ChevronDownIcon,
  ExpandLess as ChevronUpIcon,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Alert,
} from "@mui/material";

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
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [editingRubric, setEditingRubric] = useState(false);
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([]);
  const [aiGradeData, setAiGradeData] = useState<AIGradeData | null>(null);
  const [aiGradingStatus, setAiGradingStatus] = useState<string>("pending");
  const [aiGradedAt, setAiGradedAt] = useState<string | null>(null);
  const [regeneratingAI, setRegeneratingAI] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

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

  const handleFileDownloadIcon = (file: FileAttachment) => {
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

  const handleSaveIconRubricChanges = async () => {
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
      <Dialog open={isOpen} onClose={onClose}>
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
      <Dialog open={isOpen} onClose={onClose}>
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
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent
        allowWide
        className="max-w-[98vw] max-h-[95vh] w-[98vw] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StarIcon className="h-5 w-5" />
            Grade Assignment: {submission.assignment.title}
          </DialogTitle>
          <DialogDescription>
            {submission.assignment.course.code} -{" "}
            {submission.assignment.course.name}
          </DialogDescription>
        </DialogHeader>

        {/* AI Suggestions Panel */}
        {aiGradeData && aiGradingStatus === "completed" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowAISuggestions(!showAISuggestions)}
                className="flex items-center gap-2 text-sm font-medium text-blue-800 hover:text-blue-900"
              >
                <BotIcon className="h-4 w-4" />
                AI Suggestions
                {showAISuggestions ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRegenerateAI}
                disabled={regeneratingAI}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <RefreshCwIcon
                  className={`h-4 w-4 mr-2 ${
                    regeneratingAI ? "animate-spin" : ""
                  }`}
                />
                {regeneratingAI ? "Regenerating..." : "Regenerate AI Grade"}
              </Button>
            </div>

            {showAISuggestions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <SparklesIcon className="h-4 w-4" />
                  <span>AI-Generated Scores and Feedback</span>
                  {aiGradedAt && (
                    <span className="text-xs text-blue-600 ml-auto">
                      Generated: {new Date(aiGradedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* AI Rubric Scores */}
                <div className="space-y-3">
                  {aiGradeData.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg p-3 border border-blue-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {item.label}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {item.points} / {item.maxPoints} points
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            AI Generated
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {item.comments}
                      </p>
                    </div>
                  ))}
                </div>

                {/* AI Overall Feedback */}
                {aiGradeData.overallFeedback && (
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <MessageSquareIcon className="h-4 w-4" />
                      Overall AI Feedback
                    </h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {aiGradeData.overallFeedback}
                    </p>
                  </div>
                )}

                <div className="bg-blue-100 rounded-lg p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-blue-800">
                      AI Total Score:
                    </span>
                    <span className="font-bold text-blue-900">
                      {aiGradeData.totalAwarded} / {aiGradeData.totalPossible}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
              <BotIcon className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">
                AI grading failed. Please grade manually.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 min-h-0">
          {/* Left Column - Assignment Details and PDF Viewer */}
          <div className="space-y-4 xl:col-span-3">
            {/* Student Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Student Information
              </h3>
              <p className="text-sm">
                {submission.student.first_name} {submission.student.last_name}
              </p>
              <p className="text-xs text-gray-500">
                {submission.student.email}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <CalendarIcon className="h-3 w-3" />
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
                        <FileTextIcon className="h-4 w-4 text-red-500" />
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
                          handleFileDownloadIcon(file);
                        }}
                      >
                        <DownloadIcon className="h-4 w-4" />
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
              {rubric && rubricCriteria.length > 0 ? (
                // Rubric-based grading
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Rubric Grading</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRubric(!editingRubric)}
                    >
                      <Edit3Icon className="h-4 w-4 mr-2" />
                      {editingRubric ? "Cancel Edit" : "Edit Rubric"}
                    </Button>
                  </div>

                  {editingRubric ? (
                    // Rubric editing mode
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
                              <Trash2Icon className="h-4 w-4" />
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
                              value={criterion.max_points}
                              onChange={(e) =>
                                updateCriterion(
                                  criterion.id,
                                  "max_points",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              placeholder="10"
                              inputProps={{ min: 1 }}
                            />
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={addCriterion}
                        className="w-full"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Criterion
                      </Button>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleSaveIconRubricChanges}
                          disabled={grading}
                          className="flex-1"
                        >
                          <SaveIcon className="h-4 w-4 mr-2" />
                          SaveIcon Rubric Changes
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
                      {rubricCriteria.map((criterion, index) => (
                        <div
                          key={criterion.id}
                          className="p-4 border rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{criterion.name}</h4>
                            <span className="text-sm text-gray-500">
                              {rubricScores[criterion.id] || 0} /{" "}
                              {criterion.max_points} points
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {criterion.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`score-${criterion.id}`}>
                              Score:
                            </Label>
                            <Input
                              id={`score-${criterion.id}`}
                              type="number"
                              value={rubricScores[criterion.id] || 0}
                              onChange={(e) =>
                                updateRubricScore(
                                  criterion.id,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              sx={{ width: 80 }}
                              inputProps={{ min: 0, max: criterion.max_points }}
                            />
                            <span className="text-sm text-gray-500">
                              / {criterion.max_points}
                            </span>
                          </div>
                        </div>
                      ))}

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
                      value={grade}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow integers
                        if (value === "" || /^\d+$/.test(value)) {
                          setGrade(value);
                        }
                      }}
                      placeholder="Enter grade (0-100)"
                      inputProps={{ min: 0, max: 100, step: 1 }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="feedback" className="flex items-center gap-2">
                  <MessageSquareIcon className="h-4 w-4" />
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
