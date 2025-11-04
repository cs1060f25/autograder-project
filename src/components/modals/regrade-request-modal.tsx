"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { submitRegradeRequest } from "@/lib/regrade-actions";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface RegradeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  rubricScoreId: string;
  rubricItems: Array<{
    id: string;
    name: string;
    description: string;
    points: number;
    deduction?: number;
  }>;
}

export function RegradeRequestModal({
  isOpen,
  onClose,
  submissionId,
  assignmentId,
  assignmentTitle,
  rubricScoreId,
  rubricItems,
}: RegradeRequestModalProps) {
  const [selectedRubricItem, setSelectedRubricItem] = useState<string>("");
  const [explanation, setExplanation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await submitRegradeRequest({
        submissionId,
        assignmentId,
        rubricScoreId,
        rubricItemId: selectedRubricItem,
        studentExplanation: explanation,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          // Reset form
          setSelectedRubricItem("");
          setExplanation("");
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error || "Failed to submit regrade request");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedItem = rubricItems.find((item) => item.id === selectedRubricItem);
  const characterCount = explanation.length;
  const maxCharacters = 5000;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Regrade</DialogTitle>
          <DialogDescription>
            Submit a regrade request for {assignmentTitle}. Select the rubric item you believe was graded incorrectly and explain why.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Regrade request submitted successfully! Your instructor/TA will review it soon.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="rubric-item">Select Rubric Item *</Label>
              <select
                id="rubric-item"
                value={selectedRubricItem}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRubricItem(e.target.value)}
                className="w-full p-2 border rounded-md"
                required
                disabled={isSubmitting}
              >
                <option value="">-- Select a rubric item --</option>
                {rubricItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.deduction !== undefined ? `(-${item.deduction} points)` : ""}
                  </option>
                ))}
              </select>
              {selectedItem && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                  <p className="font-medium">{selectedItem.name}</p>
                  <p className="text-gray-600 mt-1">{selectedItem.description}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <p className="text-gray-700">
                      <span className="font-medium">Max Points:</span> {selectedItem.points}
                    </p>
                    {selectedItem.deduction !== undefined && selectedItem.deduction > 0 && (
                      <>
                        <p className="text-blue-600">
                          <span className="font-medium">Your Score:</span> {selectedItem.points - selectedItem.deduction}
                        </p>
                        <p className="text-red-600">
                          <span className="font-medium">Deduction:</span> -{selectedItem.deduction} points
                        </p>
                      </>
                    )}
                    {selectedItem.deduction === 0 && (
                      <p className="text-green-600">
                        <span className="font-medium">Your Score:</span> {selectedItem.points} (Full credit)
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="explanation">
                Explanation * 
                <span className="text-sm text-gray-500 ml-2">
                  ({characterCount}/{maxCharacters} characters)
                </span>
              </Label>
              <Textarea
                id="explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain why you believe this rubric item was graded incorrectly. Be specific and provide evidence from your submission."
                rows={8}
                maxLength={maxCharacters}
                required
                disabled={isSubmitting}
                className="resize-none"
              />
              <p className="text-sm text-gray-500">
                Provide a clear explanation of why you believe the deduction was incorrect. Include specific references to your work.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedRubricItem || !explanation.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
