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
import {
  Plus,
  Trash2,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

interface AssignmentModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  assignment?: Assignment | null;
  courses: Course[];
  mode: "create" | "edit";
}

// Collapsible Criterion Card Component
interface CriterionCardProps {
  criterion: RubricCriterion;
  index: number;
  onUpdate: (id: string, field: keyof RubricCriterion, value: string | number) => void;
  onRemove: (id: string) => void;
  onAddPreset: (criterionId: string) => void;
  onRemovePreset: (criterionId: string, presetIndex: number) => void;
  onUpdatePreset: (
    criterionId: string,
    presetIndex: number,
    field: "points" | "description",
    value: number | string
  ) => void;
}

function CriterionCard({
  criterion,
  index,
  onUpdate,
  onRemove,
  onAddPreset,
  onRemovePreset,
  onUpdatePreset,
}: CriterionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isComplete = criterion.name.trim() && criterion.description.trim() && criterion.max_points > 0;

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all ${
        isComplete ? "border-green-200 bg-green-50/30" : "border-gray-200"
      }`}
    >
      {/* Criterion Header - Always visible */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div
          className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
            isComplete
              ? "bg-green-500 text-white"
              : "bg-gray-300 text-gray-600"
          }`}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {criterion.name || `Criterion ${index + 1}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {criterion.max_points > 0 ? `${criterion.max_points} pts` : "No points set"}
            {criterion.presets && criterion.presets.length > 0 && (
              <span className="ml-2">• {criterion.presets.length} preset(s)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(criterion.id);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Criterion Details - Collapsible */}
      {isExpanded && (
        <div className="p-3 pt-0 space-y-3 border-t bg-white">
          <div className="grid gap-2">
            <Label htmlFor={`criterion-name-${criterion.id}`} className="text-xs font-medium">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`criterion-name-${criterion.id}`}
              value={criterion.name}
              onChange={(e) => onUpdate(criterion.id, "name", e.target.value)}
              placeholder="e.g., Code Quality, Documentation, Testing"
              className="h-9"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`criterion-description-${criterion.id}`} className="text-xs font-medium">
              Description <span className="text-red-500">*</span>
            </Label>
            <textarea
              id={`criterion-description-${criterion.id}`}
              value={criterion.description}
              onChange={(e) => onUpdate(criterion.id, "description", e.target.value)}
              placeholder="Describe what this criterion evaluates and how points are awarded..."
              className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`criterion-points-${criterion.id}`} className="text-xs font-medium">
              Max Points <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`criterion-points-${criterion.id}`}
              type="number"
              min="1"
              value={criterion.max_points || ""}
              onChange={(e) => onUpdate(criterion.id, "max_points", parseInt(e.target.value) || 0)}
              placeholder="e.g., 25"
              className="h-9 w-32"
            />
          </div>

          {/* Presets Section */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Scoring Presets</Label>
                <p className="text-xs text-muted-foreground">
                  Quick-apply scores during grading
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddPreset(criterion.id)}
                disabled={(criterion.presets?.length || 0) >= 9}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            {criterion.presets && criterion.presets.length > 0 && (
              <div className="space-y-2">
                {criterion.presets.map((preset, presetIndex) => (
                  <div
                    key={presetIndex}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded border"
                  >
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-medium flex-shrink-0">
                      {presetIndex + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        min="0"
                        max={criterion.max_points}
                        value={preset.points}
                        onChange={(e) =>
                          onUpdatePreset(criterion.id, presetIndex, "points", parseInt(e.target.value) || 0)
                        }
                        placeholder="Points"
                        className="h-7 text-xs"
                      />
                      <Input
                        type="text"
                        value={preset.description}
                        onChange={(e) =>
                          onUpdatePreset(criterion.id, presetIndex, "description", e.target.value)
                        }
                        placeholder="Label (optional)"
                        className="h-7 text-xs"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemovePreset(criterion.id, presetIndex)}
                      className="text-red-600 hover:text-red-700 h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AssignmentModal({
  isOpen,
  setIsOpen,
  assignment,
  courses,
  mode,
}: AssignmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRubric, setShowRubric] = useState(false);
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([]);
  const [maxPoints, setMaxPoints] = useState(assignment?.max_points || 100);
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

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
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
                defaultValue={assignment?.course_id || ""}
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
                defaultValue={
                  assignment?.due_date
                    ? new Date(assignment.due_date).toISOString().slice(0, 16)
                    : ""
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                name="status"
                defaultValue={assignment?.status || "draft"}
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

            {/* Rubric Section - Revamped with clearer workflow */}
            <div className="border-t pt-4">
              {/* Rubric Header with Status Indicator */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      showRubric && rubricCriteria.length > 0
                        ? getTotalPoints() === maxPoints
                          ? "bg-green-100 text-green-600"
                          : "bg-amber-100 text-amber-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {showRubric && rubricCriteria.length > 0 ? (
                      getTotalPoints() === maxPoints ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )
                    ) : (
                      <ClipboardList className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <Label className="text-base font-semibold">
                      Grading Rubric
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {!showRubric
                        ? "Optional: Define grading criteria"
                        : rubricCriteria.length === 0
                        ? "Add criteria to build your rubric"
                        : getTotalPoints() === maxPoints
                        ? `${rubricCriteria.length} criteria, ${getTotalPoints()} points total`
                        : `${rubricCriteria.length} criteria, ${getTotalPoints()}/${maxPoints} points`}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant={showRubric ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (showRubric && rubricCriteria.length > 0) {
                      // Confirm before removing rubric with criteria
                      if (
                        window.confirm(
                          "Remove rubric? All criteria will be deleted."
                        )
                      ) {
                        setShowRubric(false);
                        setRubricCriteria([]);
                      }
                    } else {
                      setShowRubric(!showRubric);
                      if (!showRubric && rubricCriteria.length === 0) {
                        // Auto-add first criterion when enabling rubric
                        addCriterion();
                      }
                    }
                  }}
                >
                  {showRubric ? (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Rubric
                    </>
                  )}
                </Button>
              </div>

              {showRubric && (
                <div className="space-y-4">
                  {/* Points Progress Bar */}
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
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
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
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
                      <p className="text-xs mt-2 text-gray-600">
                        {getTotalPoints() < maxPoints
                          ? `Add ${
                              maxPoints - getTotalPoints()
                            } more points to criteria`
                          : `Remove ${
                              getTotalPoints() - maxPoints
                            } points from criteria`}
                      </p>
                    )}
                  </div>

                  {/* Criteria List */}
                  <div className="space-y-3">
                    {rubricCriteria.map((criterion, index) => (
                      <CriterionCard
                        key={criterion.id}
                        criterion={criterion}
                        index={index}
                        onUpdate={updateCriterion}
                        onRemove={removeCriterion}
                        onAddPreset={addPreset}
                        onRemovePreset={removePreset}
                        onUpdatePreset={updatePreset}
                      />
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
                    Add Criterion
                  </Button>

                  {/* Quick Tips */}
                  {rubricCriteria.length === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">
                        Tips for creating a good rubric:
                      </h4>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>
                          - Break down the assignment into distinct, gradable
                          components
                        </li>
                        <li>
                          - Use clear, measurable criteria (e.g., "Code
                          compiles", "Tests pass")
                        </li>
                        <li>
                          - Add scoring presets for common deductions (e.g., -5
                          for late submission)
                        </li>
                      </ul>
                    </div>
                  )}
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
