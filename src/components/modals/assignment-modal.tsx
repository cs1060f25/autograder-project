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
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Alert,
} from "@mui/material";

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
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogContent sx={{ maxHeight: "90vh", overflow: "auto" }}>
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

          <Box sx={{ display: "grid", gap: 2, py: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Box sx={{ display: "grid", gap: 1 }}>
              <Label htmlFor="title">Assignment Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., React Components Assignment"
                defaultValue={assignment?.title || ""}
                required
              />
            </Box>

            <Box sx={{ display: "grid", gap: 1 }}>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Brief description of the assignment"
                defaultValue={assignment?.description || ""}
              />
            </Box>

            <Box sx={{ display: "grid", gap: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Course</InputLabel>
                <Select
                  name="course_id"
                  defaultValue={assignment?.course_id || ""}
                  label="Course"
                >
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <Box sx={{ display: "grid", gap: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Assignment Type</InputLabel>
                  <Select
                    name="assignment_type"
                    defaultValue={assignment?.assignment_type || "homework"}
                    label="Assignment Type"
                  >
                    <MenuItem value="homework">Homework</MenuItem>
                    <MenuItem value="quiz">Quiz</MenuItem>
                    <MenuItem value="exam">Exam</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: "grid", gap: 1 }}>
                <Label htmlFor="max_points">Max Points</Label>
                <Input
                  id="max_points"
                  name="max_points"
                  type="number"
                  placeholder="100"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(parseInt(e.target.value) || 0)}
                  required
                  inputProps={{ min: 1, max: 1000 }}
                />
              </Box>
            </Box>

            <Box sx={{ display: "grid", gap: 1 }}>
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
            </Box>

            <Box sx={{ display: "grid", gap: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  defaultValue={assignment?.status || "draft"}
                  label="Status"
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: "grid", gap: 1 }}>
              <Label htmlFor="instructions">Instructions</Label>
              <TextField
                id="instructions"
                name="instructions"
                multiline
                rows={4}
                placeholder="Detailed instructions for the assignment..."
                defaultValue={assignment?.instructions || ""}
                fullWidth
              />
            </Box>

            {/* Rubric Section */}
            <Box
              sx={{
                display: "grid",
                gap: 2,
                borderTop: 1,
                borderColor: "divider",
                pt: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <DescriptionIcon sx={{ fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Grading Rubric
                  </Typography>
                </Box>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRubric(!showRubric)}
                >
                  {showRubric ? "Remove Rubric" : "Add Rubric"}
                </Button>
              </Box>

              {showRubric && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Define criteria for grading this assignment. The total
                    points must equal the assignment max points.
                  </Typography>

                  {rubricCriteria.map((criterion, index) => (
                    <Box
                      key={criterion.id}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="subtitle2">
                          Criterion {index + 1}
                        </Typography>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCriterion(criterion.id)}
                          sx={{ color: "error.main", minWidth: "auto", p: 1 }}
                        >
                          <DeleteIcon sx={{ fontSize: 20 }} />
                        </Button>
                      </Box>

                      <Box sx={{ display: "grid", gap: 1 }}>
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
                      </Box>

                      <Box sx={{ display: "grid", gap: 1 }}>
                        <Label
                          htmlFor={`criterion-description-${criterion.id}`}
                        >
                          Description
                        </Label>
                        <TextField
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
                          multiline
                          rows={3}
                          fullWidth
                          required
                        />
                      </Box>

                      <Box sx={{ display: "grid", gap: 1 }}>
                        <Label htmlFor={`criterion-points-${criterion.id}`}>
                          Max Points
                        </Label>
                        <Input
                          id={`criterion-points-${criterion.id}`}
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
                          required
                          inputProps={{ min: 1 }}
                        />
                      </Box>
                    </Box>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCriterion}
                    sx={{ width: "100%" }}
                  >
                    <AddIcon sx={{ mr: 1, fontSize: 20 }} />
                    Add Criterion
                  </Button>

                  {rubricCriteria.length > 0 && (
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: "info.light",
                        borderRadius: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="subtitle2">
                          Total Points:
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: "bold",
                            color:
                              getTotalPoints() === maxPoints
                                ? "success.main"
                                : "error.main",
                          }}
                        >
                          {getTotalPoints()}
                        </Typography>
                      </Box>
                      {getTotalPoints() !== maxPoints && (
                        <Typography
                          variant="body2"
                          color="error.main"
                          sx={{ mt: 0.5 }}
                        >
                          Must equal assignment max points ({maxPoints})
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>

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
