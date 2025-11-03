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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  enrollStudentAction,
  assignTAAction,
  getEnrolledStudentsAction,
  getAssignedTAsAction,
  removeStudentAction,
  removeTAAction,
} from "@/lib/course-actions";
import { Course } from "@/lib/data-utils";
import {
  Users,
  UserCheck,
  Mail,
  UserPlus,
  Trash2,
  Loader2,
} from "lucide-react";

interface EnrollmentModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  course: Course;
}

interface EnrolledStudent {
  enrollmentId: string;
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  enrolledAt: string;
}

interface AssignedTA {
  assignmentId: string;
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  assignedAt: string;
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
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>(
    []
  );
  const [assignedTAs, setAssignedTAs] = useState<AssignedTA[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(
    null
  );
  const [removingTAId, setRemovingTAId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{
    type: "student" | "ta";
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const router = useRouter();

  // Fetch enrolled students and TAs when modal opens
  useEffect(() => {
    if (isOpen && course.id) {
      fetchEnrolledStudents();
      fetchAssignedTAs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, course.id]);

  const fetchEnrolledStudents = async () => {
    setIsLoadingLists(true);
    try {
      const result = await getEnrolledStudentsAction(course.id);
      if (result.success) {
        setEnrolledStudents(result.students || []);
      } else {
        console.error("Failed to fetch enrolled students:", result.error);
        setError(result.error || "Failed to load enrolled students");
      }
    } catch (error) {
      console.error("Error fetching enrolled students:", error);
      setError("An unexpected error occurred while loading students");
    } finally {
      setIsLoadingLists(false);
    }
  };

  const fetchAssignedTAs = async () => {
    try {
      const result = await getAssignedTAsAction(course.id);
      if (result.success) {
        setAssignedTAs(result.tas || []);
      } else {
        console.error("Failed to fetch assigned TAs:", result.error);
        setError(result.error || "Failed to load assigned TAs");
      }
    } catch (error) {
      console.error("Error fetching assigned TAs:", error);
      setError("An unexpected error occurred while loading TAs");
    }
  };

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
        await fetchEnrolledStudents();
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
        await fetchAssignedTAs();
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

  const handleRemoveStudent = (enrollmentId: string) => {
    const student = enrolledStudents.find(
      (s) => s.enrollmentId === enrollmentId
    );
    if (student) {
      setPendingRemoval({
        type: "student",
        id: enrollmentId,
        name: `${student.first_name} ${student.last_name}`,
        email: student.email,
      });
      setConfirmDialogOpen(true);
    }
  };

  const confirmRemoveStudent = async () => {
    if (!pendingRemoval || pendingRemoval.type !== "student") return;

    setConfirmDialogOpen(false);
    setRemovingStudentId(pendingRemoval.id);
    setError(null);
    setSuccess(null);

    try {
      const result = await removeStudentAction(course.id, pendingRemoval.id);
      if (result.success) {
        setSuccess("Student removed successfully!");
        await fetchEnrolledStudents();
        router.refresh();
      } else {
        setError(result.error || "Failed to remove student");
      }
    } catch (error) {
      console.error("Error removing student:", error);
      setError("An unexpected error occurred");
    } finally {
      setRemovingStudentId(null);
      setPendingRemoval(null);
    }
  };

  const handleRemoveTA = (assignmentId: string) => {
    const ta = assignedTAs.find((t) => t.assignmentId === assignmentId);
    if (ta) {
      setPendingRemoval({
        type: "ta",
        id: assignmentId,
        name: `${ta.first_name} ${ta.last_name}`,
        email: ta.email,
      });
      setConfirmDialogOpen(true);
    }
  };

  const confirmRemoveTA = async () => {
    if (!pendingRemoval || pendingRemoval.type !== "ta") return;

    setConfirmDialogOpen(false);
    setRemovingTAId(pendingRemoval.id);
    setError(null);
    setSuccess(null);

    try {
      const result = await removeTAAction(course.id, pendingRemoval.id);
      if (result.success) {
        setSuccess("TA removed successfully!");
        await fetchAssignedTAs();
        router.refresh();
      } else {
        setError(result.error || "Failed to remove TA");
      }
    } catch (error) {
      console.error("Error removing TA:", error);
      setError("An unexpected error occurred");
    } finally {
      setRemovingTAId(null);
      setPendingRemoval(null);
    }
  };

  const handleConfirmRemoval = async () => {
    if (!pendingRemoval) return;

    if (pendingRemoval.type === "student") {
      await confirmRemoveStudent();
    } else {
      await confirmRemoveTA();
    }
  };

  const handleCancelRemoval = () => {
    setConfirmDialogOpen(false);
    setPendingRemoval(null);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          clearMessages();
          setStudentEmail("");
          setTaEmail("");
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
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

          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="students" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Students
              </TabsTrigger>
              <TabsTrigger value="tas" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Assign TAs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="space-y-4">
              {/* Enrolled Students List */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  Enrolled Students ({enrolledStudents.length})
                </Label>
                {isLoadingLists ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : enrolledStudents.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center border rounded-lg">
                    No students enrolled yet.
                  </p>
                ) : (
                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {enrolledStudents.map((student) => (
                      <div
                        key={student.enrollmentId}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {student.email}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveStudent(student.enrollmentId)
                          }
                          disabled={
                            isSubmitting ||
                            removingStudentId === student.enrollmentId
                          }
                          className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {removingStudentId === student.enrollmentId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Student Form */}
              <div className="border-t pt-4">
                <form onSubmit={handleEnrollStudent} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="student-email"
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
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
              </div>
            </TabsContent>

            <TabsContent value="tas" className="space-y-4">
              {/* Assigned TAs List */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  Assigned TAs ({assignedTAs.length})
                </Label>
                {isLoadingLists ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : assignedTAs.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center border rounded-lg">
                    No TAs assigned yet.
                  </p>
                ) : (
                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {assignedTAs.map((ta) => (
                      <div
                        key={ta.assignmentId}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {ta.first_name} {ta.last_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {ta.email}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTA(ta.assignmentId)}
                          disabled={
                            isSubmitting || removingTAId === ta.assignmentId
                          }
                          className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {removingTAId === ta.assignmentId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign TA Form */}
              <div className="border-t pt-4">
                <form onSubmit={handleAssignTA} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="ta-email"
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
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
              </div>
            </TabsContent>
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

      {/* Confirmation Dialog for Removal */}
      <Dialog
        open={confirmDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelRemoval();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {pendingRemoval?.type === "student"
                ? "Remove Student?"
                : "Remove TA?"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {pendingRemoval?.name} ({pendingRemoval?.email})
              </strong>{" "}
              from <strong>{course.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelRemoval}
              disabled={
                (pendingRemoval?.type === "student" &&
                  removingStudentId === pendingRemoval.id) ||
                (pendingRemoval?.type === "ta" &&
                  removingTAId === pendingRemoval.id)
              }
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmRemoval}
              disabled={
                (pendingRemoval?.type === "student" &&
                  removingStudentId === pendingRemoval.id) ||
                (pendingRemoval?.type === "ta" &&
                  removingTAId === pendingRemoval.id)
              }
            >
              {(pendingRemoval?.type === "student" &&
                removingStudentId === pendingRemoval.id) ||
              (pendingRemoval?.type === "ta" &&
                removingTAId === pendingRemoval.id)
                ? "Removing..."
                : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
