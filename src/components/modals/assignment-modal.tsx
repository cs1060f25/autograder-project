"use client";

import { useState } from "react";
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
                  <p className="text-sm text-gray-600">
                    Define criteria for grading this assignment. The total
                    points must equal the assignment max points.
                  </p>

                  {rubricCriteria.map((criterion, index) => (
                    <div
                      key={criterion.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Criterion {index + 1}</h4>
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
                        <Label htmlFor={`criterion-name-${criterion.id}`}>
                          Name
                        </Label>
                        <Input
                          id={`criterion-name-${criterion.id}`}
                          value={criterion.name}
                          onChange={(e) =>
                            updateCriterion(
                              criterion.id,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Code Quality"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label
                          htmlFor={`criterion-description-${criterion.id}`}
                        >
                          Description
                        </Label>
                        <textarea
                          id={`criterion-description-${criterion.id}`}
                          value={criterion.description}
                          onChange={(e) =>
                            updateCriterion(
                              criterion.id,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Describe what this criterion evaluates..."
                          className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor={`criterion-points-${criterion.id}`}>
                          Max Points
                        </Label>
                        <Input
                          id={`criterion-points-${criterion.id}`}
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
                          required
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
