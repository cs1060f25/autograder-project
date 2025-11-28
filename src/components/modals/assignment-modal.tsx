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
import { Plus, Trash2, FileText } from "lucide-react";

interface AssignmentModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  assignment?: Assignment | null;
  courses: Course[];
  mode: "create" | "edit";
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

            {/* Rubric Section */}
            <div className="grid gap-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <Label className="text-base font-medium">
                    Grading Rubric
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRubric(!showRubric)}
                >
                  {showRubric ? "Remove Rubric" : "Add Rubric"}
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

                  {rubricCriteria.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Points:</span>
                        <span
                          className={`font-bold ${
                            getTotalPoints() === maxPoints
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {getTotalPoints()}
                        </span>
                      </div>
                      {getTotalPoints() !== maxPoints && (
                        <p className="text-sm text-red-600 mt-1">
                          Must equal assignment max points ({maxPoints})
                        </p>
                      )}
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
