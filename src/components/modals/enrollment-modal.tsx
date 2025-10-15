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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { enrollStudentAction, assignTAAction } from "@/lib/course-actions";
import { Course } from "@/lib/data-utils";
import {
  People as UsersIcon,
  PersonAdd as UserCheckIcon,
  Email as MailIcon,
  PersonAddAlt as UserPlusIcon,
} from "@mui/icons-material";
import { Box, Typography, Chip, IconButton } from "@mui/material";

interface EnrollmentModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  course: Course;
}

export function EnrollmentModal({
  isOpen,
  setIsOpen,
  course,
}: EnrollmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [studentEmail, setStudentEmail] = useState("");
  const [taEmail, setTaEmail] = useState("");
  const [activeTab, setActiveTab] = useState("students");
  const router = useRouter();

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await enrollStudentAction(course.id, studentEmail.trim());

      if (result.success) {
        setSuccess(
          `Student ${result.student?.first_name} ${result.student?.last_name} enrolled successfully!`
        );
        setStudentEmail("");
        router.refresh();
      } else {
        setError(result.error || "Failed to enroll student");
      }
    } catch (error) {
      console.error("Error enrolling student:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignTA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taEmail.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await assignTAAction(course.id, taEmail.trim());

      if (result.success) {
        setSuccess(
          `TA ${result.ta?.first_name} ${result.ta?.last_name} assigned successfully!`
        );
        setTaEmail("");
        router.refresh();
      } else {
        setError(result.error || "Failed to assign TA");
      }
    } catch (error) {
      console.error("Error assigning TA:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        setIsOpen(false);
        clearMessages();
        setStudentEmail("");
        setTaEmail("");
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Manage Course Enrollment
          </DialogTitle>
          <DialogDescription>
            Add students and TAs to <strong>{course.name}</strong> (
            {course.code})
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={(newValue) => setActiveTab(newValue)}
            sx={{ width: "100%" }}
          >
            <TabsList
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                width: "100%",
              }}
            >
              <TabsTrigger
                value="students"
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <UserPlusIcon sx={{ fontSize: 16 }} />
                    Add Students
                  </Box>
                }
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              />
              <TabsTrigger
                value="tas"
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <UserCheckIcon sx={{ fontSize: 16 }} />
                    Assign TAs
                  </Box>
                }
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              />
            </TabsList>

            {activeTab === "students" && (
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
              >
                <form onSubmit={handleEnrollStudent} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="student-email"
                      className="flex items-center gap-2"
                    >
                      <MailIcon className="h-4 w-4" />
                      Student Email
                    </Label>
                    <Input
                      id="student-email"
                      type="email"
                      placeholder="student@university.edu"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                    <p className="text-sm text-gray-500">
                      Enter the email address of the student you want to enroll.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !studentEmail.trim()}
                    className="w-full"
                  >
                    {isSubmitting ? "Enrolling..." : "Enroll Student"}
                  </Button>
                </form>
              </Box>
            )}

            {activeTab === "tas" && (
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
              >
                <form onSubmit={handleAssignTA} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="ta-email"
                      className="flex items-center gap-2"
                    >
                      <MailIcon className="h-4 w-4" />
                      TA Email
                    </Label>
                    <Input
                      id="ta-email"
                      type="email"
                      placeholder="ta@university.edu"
                      value={taEmail}
                      onChange={(e) => setTaEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                    <p className="text-sm text-gray-500">
                      Enter the email address of the TA you want to assign to
                      this course.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !taEmail.trim()}
                    className="w-full"
                  >
                    {isSubmitting ? "Assigning..." : "Assign TA"}
                  </Button>
                </form>
              </Box>
            )}
          </Tabs>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
