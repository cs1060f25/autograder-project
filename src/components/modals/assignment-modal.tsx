"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createAssignmentAction,
  updateAssignmentAction,
} from "@/lib/assignment-actions";
import { getRubricByAssignment } from "@/lib/rubric-actions";
import { Assignment, Course, RubricCriterion } from "@/lib/data-utils";
import { Plus, Trash2, FileText, ChevronDown, ChevronUp, Info, CheckCircle2, AlertCircle } from "lucide-react";

interface AssignmentModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  assignment?: Assignment | null;
  courses: Course[];
  mode: "create" | "edit";
  defaultCourseId?: string;
}

export function AssignmentModal({
  isOpen,
  setIsOpen,
  assignment,
  courses,
  mode,
  defaultCourseId,
}: AssignmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRubric, setShowRubric] = useState(false);
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([]);
  const [maxPoints, setMaxPoints] = useState(assignment?.max_points || 100);
  const [dueDate, setDueDate] = useState<string>(
    assignment?.due_date
      ? new Date(assignment.due_date).toISOString().slice(0, 16)
      : ""
  );
  const [status, setStatus] = useState<string>(assignment?.status || "draft");
  const [dueDateWarning, setDueDateWarning] = useState<string | null>(null);
  const router = useRouter();

  // Load existing rubric when editing
  useEffect(() => {
    const loadExistingRubric = async () => {
      if (mode === "edit" && assignment?.id && isOpen) {
        try {
          const rubricResult = await getRubricByAssignment(assignment.id);
          if (rubricResult.success && rubricResult.rubric) {
            setRubricCriteria(rubricResult.rubric.criteria);
            setShowRubric(rubricResult.rubric.criteria.length > 0);
          } else {
            setRubricCriteria([]);
            setShowRubric(false);
          }
        } catch (error) {
          console.error("Failed to load rubric:", error);
          setRubricCriteria([]);
          setShowRubric(false);
        }
      } else if (mode === "create") {
        // Reset for create mode
        setRubricCriteria([]);
        setShowRubric(false);
      }
    };

    loadExistingRubric();
  }, [mode, assignment?.id, isOpen]);

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

  const getTotalPoints = () => {
    return rubricCriteria.reduce(
      (sum, criterion) => sum + criterion.max_points,
      0
    );
  };

  const validateDueDate = (dateString: string, currentStatus: string) => {
    if (!dateString || currentStatus === "draft") {
      setDueDateWarning(null);
      return true;
    }

    const selectedDate = new Date(dateString);
    const now = new Date();

    // Check if date is valid
    if (isNaN(selectedDate.getTime())) {
      setDueDateWarning("Invalid date format");
      return false;
    }

    // Check if date is in the past (with 1 minute grace period)
    if (selectedDate.getTime() < now.getTime() - 60000) {
      setDueDateWarning("Due date is in the past. Students will see this assignment as overdue immediately.");
      return false;
    }

    setDueDateWarning(null);
    return true;
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDueDate(newDate);
    validateDueDate(newDate, status);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    validateDueDate(dueDate, newStatus);
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Client-side validation for due date
      const dueDateValue = formData.get("due_date") as string;
      const statusValue = formData.get("status") as string;
      
      if (!validateDueDate(dueDateValue, statusValue)) {
        setError("Due date must be in the future for published or closed assignments.");
        setIsSubmitting(false);
        return;
      }

      // Validate rubric if enabled
      if (showRubric && rubricCriteria.length > 0) {
        const totalPoints = getTotalPoints();
        const formMaxPoints = parseInt(formData.get("max_points") as string);

        if (totalPoints !== formMaxPoints) {
          setError(
            `Rubric total (${totalPoints}) must equal assignment max points (${formMaxPoints})`
          );
          setIsSubmitting(false);
          return;
        }

        // Check for empty criteria
        const hasEmptyCriteria = rubricCriteria.some(
          (c) => !c.name.trim() || !c.description.trim() || c.max_points <= 0
        );

        if (hasEmptyCriteria) {
          setError(
            "All rubric criteria must have a name, description, and points > 0"
          );
          setIsSubmitting(false);
          return;
        }

        formData.set("rubric_data", JSON.stringify(rubricCriteria));
      }

      let result;
      if (mode === "create") {
        result = await createAssignmentAction(formData);
      } else if (assignment) {
        result = await updateAssignmentAction(assignment.id, formData);
      } else {
        throw new Error("Invalid mode or missing assignment");
      }

      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    } catch (error) {
      console.error("Error saving assignment:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await handleSubmit(formData);
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Create New Assignment" : "Edit Assignment"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Create a new assignment for your students."
                : "Update the assignment information."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="title">Assignment Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., React Components Assignment"
                defaultValue={assignment?.title || ""}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Brief description of the assignment"
                defaultValue={assignment?.description || ""}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="course_id">Course</Label>
              <Select
                name="course_id"
                defaultValue={assignment?.course_id || defaultCourseId || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="assignment_type">Assignment Type</Label>
                <Select
                  name="assignment_type"
                  defaultValue={assignment?.assignment_type || "homework"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="max_points">Max Points</Label>
                <Input
                  id="max_points"
                  name="max_points"
                  type="number"
                  min="1"
                  max="1000"
                  placeholder="100"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                name="due_date"
                type="datetime-local"
                value={dueDate}
                onChange={handleDueDateChange}
                required
              />
              {dueDateWarning && status !== "draft" && (
                <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{dueDateWarning}</span>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                name="status"
                value={status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              {status === "draft" && dueDate && new Date(dueDate) < new Date() && (
                <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Draft assignments can have past due dates. This will be validated when you publish.</span>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="instructions">Instructions</Label>
              <textarea
                id="instructions"
                name="instructions"
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Detailed instructions for the assignment..."
                defaultValue={assignment?.instructions || ""}
              />
            </div>

            {/* Rubric Section */}
            <div className="border-t pt-4">
              {/* Rubric Header */}
              <button
                type="button"
                onClick={() => setShowRubric(!showRubric)}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-slate-900">Grading Rubric</div>
                    <div className="text-xs text-slate-500">
                      {rubricCriteria.length === 0
                        ? "Define criteria for consistent grading"
                        : `${rubricCriteria.length} criteria • ${getTotalPoints()}/${maxPoints} pts`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {rubricCriteria.length > 0 && (
                    getTotalPoints() === maxPoints ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )
                  )}
                  {showRubric ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </button>

              {showRubric && (
                <div className="mt-4 space-y-4">
                  {/* Helper Text */}
                  {rubricCriteria.length === 0 && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium">How rubrics work:</p>
                        <ul className="mt-1 space-y-1 text-blue-600">
                          <li>• Add criteria that submissions will be graded on</li>
                          <li>• Assign points to each criterion</li>
                          <li>• Total points must equal max points ({maxPoints})</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Points Progress */}
                  {rubricCriteria.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">
                          Points Allocation
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            getTotalPoints() === maxPoints
                              ? "text-green-600"
                              : getTotalPoints() > maxPoints
                              ? "text-red-600"
                              : "text-amber-600"
                          }`}
                        >
                          {getTotalPoints()} / {maxPoints} pts
                          {getTotalPoints() === maxPoints && " ✓"}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            getTotalPoints() === maxPoints
                              ? "bg-green-500"
                              : getTotalPoints() > maxPoints
                              ? "bg-red-500"
                              : "bg-amber-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              (getTotalPoints() / maxPoints) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      {getTotalPoints() !== maxPoints && (
                        <p className="text-xs text-slate-500 mt-2">
                          {getTotalPoints() < maxPoints
                            ? `Add ${maxPoints - getTotalPoints()} more points to criteria`
                            : `Remove ${getTotalPoints() - maxPoints} points from criteria`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Criteria List */}
                  <div className="space-y-3">
                    {rubricCriteria.map((criterion, index) => (
                      <div
                        key={criterion.id}
                        className="border rounded-lg bg-white overflow-hidden"
                      >
                        {/* Criterion Header */}
                        <div className="flex items-center gap-2 p-3 bg-slate-50 border-b">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-slate-700 flex-1">
                            {criterion.name || "New Criterion"}
                          </span>
                          <span className="text-sm font-bold text-slate-600">
                            {criterion.max_points} pts
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCriterion(criterion.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Criterion Fields */}
                        <div className="p-3 space-y-3">
                          <div className="grid grid-cols-[1fr,80px] gap-3">
                            <div>
                              <Label className="text-xs text-slate-500">Name</Label>
                              <Input
                                value={criterion.name}
                                onChange={(e) =>
                                  updateCriterion(criterion.id, "name", e.target.value)
                                }
                                placeholder="e.g., Code Quality"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-slate-500">Points</Label>
                              <Input
                                type="number"
                                min="0"
                                max={maxPoints}
                                value={criterion.max_points}
                                onChange={(e) =>
                                  updateCriterion(
                                    criterion.id,
                                    "max_points",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Description</Label>
                            <textarea
                              value={criterion.description}
                              onChange={(e) =>
                                updateCriterion(criterion.id, "description", e.target.value)
                              }
                              placeholder="What does this criterion evaluate?"
                              className="mt-1 w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                          </div>

                          {/* Presets Section */}
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs text-slate-500">Quick Score Presets (Optional)</Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => addPreset(criterion.id)}
                                className="h-6 text-xs"
                                disabled={(criterion.presets?.length || 0) >= 9}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Preset
                              </Button>
                            </div>
                            {criterion.presets && criterion.presets.length > 0 && (
                              <div className="space-y-2">
                                {criterion.presets.map((preset, presetIndex) => (
                                  <div key={presetIndex} className="flex items-center gap-2">
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
                                      className="w-16 h-8 text-sm"
                                      placeholder="Pts"
                                    />
                                    <Input
                                      value={preset.description}
                                      onChange={(e) =>
                                        updatePreset(
                                          criterion.id,
                                          presetIndex,
                                          "description",
                                          e.target.value
                                        )
                                      }
                                      className="flex-1 h-8 text-sm"
                                      placeholder="e.g., Excellent work"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removePreset(criterion.id, presetIndex)}
                                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Criterion Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCriterion}
                    className="w-full border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add {rubricCriteria.length === 0 ? "First" : "Another"} Criterion
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === "create"
                  ? "Creating..."
                  : "Updating..."
                : mode === "create"
                ? "Create Assignment"
                : "Update Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
