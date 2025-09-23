"use client";

import React, { useState, useRef } from "react";
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
  FileAttachment,
  createSubmission,
  saveDraftSubmission,
  uploadFileToStorage,
  deleteFileFromStorage,
} from "@/lib/submission-actions";
import { Upload, X, FileText, Save, Send } from "lucide-react";

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  assignmentTitle: string;
  dueDate: string;
  studentId: string;
  instructions?: string;
  existingSubmission?: {
    content: string;
    attachments: FileAttachment[];
    status: string;
  };
}

export function SubmissionModal({
  isOpen,
  onClose,
  assignmentId,
  assignmentTitle,
  dueDate,
  studentId,
  instructions,
  existingSubmission,
}: SubmissionModalProps) {
  const [content, setContent] = useState(existingSubmission?.content || "");
  const [attachments, setAttachments] = useState<FileAttachment[]>(
    existingSubmission?.attachments || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File size must be less than 10MB");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await uploadFileToStorage(file, assignmentId, studentId);

      if (result.success && result.fileAttachment) {
        setAttachments((prev) => [...prev, result.fileAttachment!]);
        setSuccess("File uploaded successfully");
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFile = async (index: number) => {
    const fileToRemove = attachments[index];

    try {
      const result = await deleteFileFromStorage(fileToRemove.url);
      if (result.success) {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
        setSuccess("File removed successfully");
      } else {
        setError(result.error || "Failed to remove file");
      }
    } catch (err) {
      setError("Failed to remove file. Please try again.");
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await saveDraftSubmission(
        assignmentId,
        content,
        attachments
      );

      if (result.success) {
        setSuccess("Draft saved successfully");
      } else {
        setError(result.error || "Failed to save draft");
      }
    } catch (err) {
      setError("Failed to save draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && attachments.length === 0) {
      setError("Please provide content or upload a file");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createSubmission(assignmentId, content, attachments);

      if (result.success) {
        setSuccess("Assignment submitted successfully!");
        setTimeout(() => {
          onClose();
          // Reset form
          setContent("");
          setAttachments([]);
          setSuccess(null);
        }, 1500);
      } else {
        setError(result.error || "Failed to submit assignment");
      }
    } catch (err) {
      setError("Failed to submit assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Assignment: {assignmentTitle}</DialogTitle>
          <DialogDescription>
            Due: {new Date(dueDate).toLocaleDateString()} at{" "}
            {new Date(dueDate).toLocaleTimeString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {instructions && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Instructions:</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {instructions}
              </p>
            </div>
          )}

          {/* Text Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Submission Comments (Optional)</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your comments here..."
              className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md resize-vertical"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload PDF Files</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                Click to upload PDF files (max 10MB each)
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
              >
                Choose Files
              </Button>
            </div>
          </div>

          {/* Uploaded Files */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Files</Label>
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
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
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

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

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                isSaving ||
                (!content.trim() && attachments.length === 0)
              }
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
