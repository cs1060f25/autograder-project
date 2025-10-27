# Student Document Upload Guide

This guide explains how to use the student document upload actions in the autograder project.

## Overview

Two new server actions have been added to `/src/lib/submission-actions.ts` for students to upload and manage their assignment submission documents:

1. **`uploadSubmissionDocument`** - Upload files to the submission-files bucket
2. **`deleteSubmissionDocument`** - Delete uploaded files (before grading)

## Features

### Security & Validation
- ✅ **Role-based access**: Only students can upload/delete submission documents
- ✅ **Course enrollment check**: Verifies student is enrolled in the course
- ✅ **Due date enforcement**: Prevents uploads/deletions after due date
- ✅ **File type validation**: Supports PDF, PNG, JPEG, JPG, and TXT files
- ✅ **File size limit**: 50MB maximum per file
- ✅ **Automatic cleanup**: Removes files if URL generation fails
- ✅ **Private storage**: Uses signed URLs for secure access

### File Organization
Files are stored in the `submission-files` bucket with the following structure:
```
{studentId}/{assignmentId}/{timestamp}_{sanitized_filename}
```

## Usage Examples

### 1. Upload a Submission Document

```typescript
import { uploadSubmissionDocument } from "@/lib/submission-actions";

async function handleFileUpload(file: File, assignmentId: string) {
  const result = await uploadSubmissionDocument(file, assignmentId);
  
  if (result.success && result.fileAttachment) {
    console.log("File uploaded successfully!");
    console.log("File URL:", result.fileAttachment.url);
    console.log("File name:", result.fileAttachment.name);
    console.log("File size:", result.fileAttachment.size);
    
    // Add the attachment to your submission
    // result.fileAttachment contains: { name, url, size, type, uploaded_at }
  } else {
    console.error("Upload failed:", result.error);
  }
}
```

### 2. Delete a Submission Document

```typescript
import { deleteSubmissionDocument } from "@/lib/submission-actions";

async function handleFileDelete(fileUrl: string, assignmentId: string) {
  const result = await deleteSubmissionDocument(fileUrl, assignmentId);
  
  if (result.success) {
    console.log("File deleted successfully!");
  } else {
    console.error("Delete failed:", result.error);
  }
}
```

### 3. Complete Submission Flow

```typescript
import { uploadSubmissionDocument, createSubmission } from "@/lib/submission-actions";

async function submitAssignment(
  assignmentId: string,
  content: string,
  files: File[]
) {
  // Step 1: Upload all files
  const attachments = [];
  
  for (const file of files) {
    const uploadResult = await uploadSubmissionDocument(file, assignmentId);
    
    if (uploadResult.success && uploadResult.fileAttachment) {
      attachments.push(uploadResult.fileAttachment);
    } else {
      console.error(`Failed to upload ${file.name}:`, uploadResult.error);
      return { success: false, error: uploadResult.error };
    }
  }
  
  // Step 2: Create submission with attachments
  const submissionResult = await createSubmission(
    assignmentId,
    content,
    attachments
  );
  
  return submissionResult;
}
```

## React Component Example

```tsx
"use client";

import { useState } from "react";
import { uploadSubmissionDocument, deleteSubmissionDocument } from "@/lib/submission-actions";
import { FileAttachment } from "@/lib/submission-actions";

export function SubmissionUploader({ assignmentId }: { assignmentId: string }) {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const result = await uploadSubmissionDocument(file, assignmentId);
      
      if (result.success && result.fileAttachment) {
        setAttachments(prev => [...prev, result.fileAttachment!]);
      } else {
        alert(`Failed to upload ${file.name}: ${result.error}`);
      }
    }

    setUploading(false);
    e.target.value = ""; // Reset input
  };

  const handleDelete = async (fileUrl: string) => {
    const result = await deleteSubmissionDocument(fileUrl, assignmentId);
    
    if (result.success) {
      setAttachments(prev => prev.filter(att => att.url !== fileUrl));
    } else {
      alert(`Failed to delete file: ${result.error}`);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.txt"
        multiple
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      {uploading && <p>Uploading...</p>}
      
      <div>
        <h3>Uploaded Files:</h3>
        {attachments.map((att, idx) => (
          <div key={idx}>
            <span>{att.name}</span>
            <span>({(att.size / 1024 / 1024).toFixed(2)} MB)</span>
            <button onClick={() => handleDelete(att.url)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Error Handling

Common errors and their meanings:

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Only students can upload submission documents" | Non-student user | Ensure user is logged in as a student |
| "Assignment not found or not published" | Invalid assignment or not published | Check assignment ID and status |
| "Assignment due date has passed" | Past due date | Contact instructor for extension |
| "You are not enrolled in this course" | Not enrolled | Enroll in the course first |
| "Invalid file type" | Unsupported file format | Use PDF, PNG, JPEG, JPG, or TXT |
| "File size must be less than 50MB" | File too large | Compress or split the file |
| "Cannot delete files from a graded submission" | Submission already graded | Cannot modify graded submissions |

## Storage Bucket Details

### submission-files Bucket
- **Type**: Private (requires authentication)
- **Size Limit**: 50MB per file
- **Allowed Types**: PDF, PNG, JPEG, JPG, TXT
- **Access**: 
  - Students: Can upload/delete their own files
  - Instructors: Can view all submissions for their assignments
  - TAs: Can view submissions for assigned courses

### URL Type
- **Signed URLs**: Valid for 1 year (31,536,000 seconds)
- Automatically generated for secure access to private files
- URLs expire and need to be refreshed after 1 year

## Best Practices

1. **Validate files client-side** before uploading to provide immediate feedback
2. **Show upload progress** for better UX
3. **Handle errors gracefully** with user-friendly messages
4. **Confirm deletions** before removing files
5. **Store attachments array** in your component state for submission
6. **Check file size** before upload to avoid wasted bandwidth
7. **Sanitize file names** (handled automatically by the action)

## Integration with Existing Submission Flow

The `createSubmission` action already accepts attachments:

```typescript
export async function createSubmission(
  assignmentId: string,
  content: string,
  attachments: FileAttachment[] = []
)
```

Simply pass the `FileAttachment` objects returned from `uploadSubmissionDocument` to this function.

## Testing

To test the upload functionality:

1. Log in as a student
2. Navigate to an assignment
3. Upload a file using the upload action
4. Verify the file appears in Supabase Storage under `submission-files/{studentId}/{assignmentId}/`
5. Check that the signed URL is accessible
6. Test deletion before and after grading
7. Test due date enforcement

## Notes

- Files are automatically organized by student ID and assignment ID
- File names are sanitized to prevent path traversal attacks
- Cleanup happens automatically if URL generation fails
- The action integrates with existing RLS policies in Supabase
- AI grading is triggered automatically for PDF submissions
