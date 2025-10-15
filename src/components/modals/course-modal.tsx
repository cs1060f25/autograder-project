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
import { createCourseAction, updateCourseAction } from "@/lib/course-actions";
import { Course } from "@/lib/data-utils";
import { Box, FormControl, InputLabel, MenuItem } from "@mui/material";

interface CourseModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  course?: Course | null;
  mode: "create" | "edit";
}

export function CourseModal({
  isOpen,
  setIsOpen,
  course,
  mode,
}: CourseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let result;
      if (mode === "create") {
        result = await createCourseAction(formData);
      } else if (course) {
        result = await updateCourseAction(course.id, formData);
      } else {
        throw new Error("Invalid mode or missing course");
      }

      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    } catch (error) {
      console.error("Error saving course:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear + i);

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
      <DialogContent className="sm:max-w-[425px]">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await handleSubmit(formData);
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Create New Course" : "Edit Course"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Create a new course for your students to enroll in."
                : "Update the course information."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Course Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Introduction to Computer Science"
                defaultValue={course?.name || ""}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="code">Course Code</Label>
              <Input
                id="code"
                name="code"
                placeholder="e.g., CS 101"
                defaultValue={course?.code || ""}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Brief description of the course"
                defaultValue={course?.description || ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Box sx={{ display: "grid", gap: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    name="semester"
                    defaultValue={course?.semester || ""}
                    label="Semester"
                  >
                    <MenuItem value="Fall">Fall</MenuItem>
                    <MenuItem value="Spring">Spring</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: "grid", gap: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Year</InputLabel>
                  <Select
                    name="year"
                    defaultValue={course?.year?.toString() || ""}
                    label="Year"
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year.toString()}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
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
                ? "Create Course"
                : "Update Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
