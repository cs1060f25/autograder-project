# Autograder Orchestration Service

A comprehensive orchestration service that connects document management, grading, and storage into a unified autograding pipeline.

## Overview

The **AutograderService** is the core backend service for the Internal Autograder platform. It orchestrates the complete autograding workflow:

1. **Document Management**: Retrieves and validates student submission documents
2. **Rubric Retrieval**: Fetches assignment rubrics from the database
3. **Grading Coordination**: Coordinates with the AI grading service to evaluate submissions
4. **Result Storage**: Stores grading results and AI comments in the database
5. **Status Management**: Tracks autograding status throughout the pipeline

This service provides a clean, high-level API that abstracts away the complexity of the underlying systems.

## Architecture

```
AutograderService (Orchestration Layer)
    ├── Document Management
    │   ├── Retrieval from Supabase Storage
    │   ├── Validation (file type, size, URL)
    │   └── PDF filtering
    │
    ├── Grading Service Integration
    │   ├── GradingService
    │   ├── OpenAI Provider (production)
    │   └── Mock Provider (testing)
    │
    └── Database Operations
        ├── Rubric fetching
        ├── Result storage
        └── Status updates
```

## Key Features

- **End-to-End Orchestration**: Manages the entire autograding pipeline from start to finish
- **Robust Error Handling**: Gracefully handles errors at each stage with appropriate status codes
- **Batch Processing**: Supports grading multiple submissions in parallel or sequentially
- **Status Tracking**: Provides real-time status updates throughout the grading process
- **Document Validation**: Ensures only valid PDF documents are processed
- **Flexible Configuration**: Supports both production (OpenAI) and mock grading providers

## Installation

The service is already integrated into the application. No additional installation is required.

## Quick Start

### Basic Usage

```typescript
import { AutograderService } from "@/services/autograder";

// Initialize the service
const autograder = new AutograderService();

// Check if ready
const isReady = await autograder.isReady();
if (!isReady) {
  console.error("Autograder service is not ready");
  return;
}

// Grade a submission
const result = await autograder.autograde({
  submissionId: "sub-123",
  assignmentId: "assign-456",
  documents: [
    {
      id: "doc-1",
      url: "https://example.com/submission.pdf",
      name: "submission.pdf",
      type: "application/pdf",
      size: 1024 * 1024, // 1MB
    },
  ],
});

console.log(`Status: ${result.status}`);
if (result.status === "completed") {
  console.log(`Score: ${result.totalAwarded}/${result.totalPossible}`);
  console.log(`Feedback: ${result.overallFeedback}`);
}
```

### Batch Processing

```typescript
import { AutograderService } from "@/services/autograder";

const autograder = new AutograderService();

// Grade multiple submissions
const batchResult = await autograder.autogradeBatch({
  requests: [
    {
      submissionId: "sub-1",
      assignmentId: "assign-1",
      documents: [/* ... */],
    },
    {
      submissionId: "sub-2",
      assignmentId: "assign-1",
      documents: [/* ... */],
    },
  ],
  parallel: true, // Process in parallel (default)
});

console.log(`Completed: ${batchResult.summary.completed}/${batchResult.summary.total}`);
console.log(`Failed: ${batchResult.summary.failed}`);
```

### Checking Status

```typescript
const status = await autograder.getStatus("sub-123");

console.log(`Current status: ${status.status}`);
if (status.result) {
  console.log(`Graded at: ${status.result.gradedAt}`);
  console.log(`Score: ${status.result.totalAwarded}/${status.result.totalPossible}`);
}
```

## API Reference

### AutograderService

#### Constructor

```typescript
new AutograderService(config?: AutograderConfig)
```

**Parameters:**
- `config.maxRetries?`: number - Maximum retry attempts (default: 3)
- `config.retryDelay?`: number - Delay between retries in ms (default: 1000)
- `config.useMockGrading?`: boolean - Use mock grading provider (default: false, or from env)

#### Methods

##### `autograde(request: AutogradeRequest): Promise<AutogradeResult>`

Autograde a single submission through the complete pipeline.

**Parameters:**
```typescript
interface AutogradeRequest {
  submissionId: string;
  assignmentId: string;
  documents: SubmissionDocument[];
}
```

**Returns:**
```typescript
interface AutogradeResult {
  submissionId: string;
  status: "completed" | "failed" | "no_rubric" | "no_documents";
  totalAwarded?: number;
  totalPossible?: number;
  items?: GradedItem[];
  overallFeedback?: string;
  error?: string;
  gradedAt: string;
}
```

**Possible Statuses:**
- `completed`: Successfully graded
- `failed`: Grading failed due to an error
- `no_rubric`: No rubric found for the assignment
- `no_documents`: No valid PDF documents found

##### `autogradeBatch(request: BatchAutogradeRequest): Promise<BatchAutogradeResult>`

Grade multiple submissions in batch.

**Parameters:**
```typescript
interface BatchAutogradeRequest {
  requests: AutogradeRequest[];
  parallel?: boolean; // Default: true
}
```

**Returns:**
```typescript
interface BatchAutogradeResult {
  results: AutogradeResult[];
  summary: {
    total: number;
    completed: number;
    failed: number;
    noRubric: number;
    noDocuments: number;
  };
}
```

##### `getStatus(submissionId: string): Promise<{ status: AutogradeStatus; result?: AutogradeResult }>`

Get the current status of an autograding job.

**Returns:**
- `status`: Current autograding status
- `result`: Complete grading result (if available)

##### `isReady(): Promise<boolean>`

Check if the autograder service is ready to process submissions.

**Returns:** `true` if ready, `false` otherwise

### Types

#### SubmissionDocument

```typescript
interface SubmissionDocument {
  id: string;
  url: string;      // Public or signed URL to the document
  name: string;     // Original filename
  type: string;     // MIME type (e.g., "application/pdf")
  size: number;     // Size in bytes
}
```

#### GradedItem

```typescript
interface GradedItem {
  id: string;       // Rubric criterion ID
  label: string;    // Criterion name
  maxPoints: number;
  points: number;   // Points awarded
  comments: string; // AI feedback for this criterion
}
```

#### AutogradeStatus

```typescript
type AutogradeStatus = 
  | "pending"      // Not started
  | "processing"   // Currently grading
  | "completed"    // Successfully graded
  | "failed"       // Error occurred
  | "no_rubric"    // No rubric found
  | "no_documents" // No valid documents
```

## Integration with Existing Code

The AutograderService is integrated into the existing codebase through `src/lib/ai-grading-actions.ts`:

```typescript
import { AutograderService } from "@/services/autograder";

export async function triggerAIGrading(submissionId: string) {
  // ... auth checks ...
  
  // Initialize service
  const autograder = new AutograderService();
  
  // Execute autograding
  const result = await autograder.autograde({
    submissionId,
    assignmentId,
    documents,
  });
  
  return { success: result.status === "completed" };
}
```

This simplifies the previous implementation from ~200 lines to ~50 lines.

## Document Validation

The service automatically validates documents:

1. **File Type**: Only PDF files (`application/pdf`) are processed
2. **File Size**: Maximum 50MB per document
3. **URL Validation**: URLs must start with `http` or `https`
4. **Existence**: Documents must exist and be accessible

Invalid documents are filtered out and logged.

## Database Integration

The service integrates with the following database tables:

### `submissions`
- Stores autograding results in `ai_grade_data`
- Tracks status in `ai_grade_status`
- Records timestamp in `ai_graded_at`

### `rubrics`
- Fetches grading criteria for assignments
- Validates rubric format

### `rubric_scores`
- Stores AI comments for each rubric criterion
- Creates or updates entries as needed

## Error Handling

The service provides comprehensive error handling:

### Error Types

1. **No Rubric**: Assignment has no rubric configured
   - Status: `no_rubric`
   - Message: "No rubric found for this assignment"

2. **No Documents**: No valid PDF documents found
   - Status: `no_documents`
   - Message: "No valid PDF documents found"

3. **Grading Failure**: AI grading service failed
   - Status: `failed`
   - Message: Specific error from grading service

### Error Recovery

- Submission status is always updated, even on failure
- Failed autograding attempts are logged
- Database operations use transactions where possible

## Performance

### Single Submission
- **Processing Time**: 5-15 seconds (depends on document size and AI provider)
- **Retries**: Up to 3 attempts with exponential backoff
- **Timeout**: Configured per grading provider

### Batch Processing
- **Parallel Mode**: Processes all submissions simultaneously
- **Sequential Mode**: Processes one at a time (useful for rate limiting)
- **Throughput**: ~10-20 submissions per minute (parallel mode)

## Configuration

### Environment Variables

```bash
# OpenAI API key (required for production)
OPENAI_KEY=sk-...

# OpenAI model to use (optional)
OPENAI_MODEL=gpt-4o-mini

# Use mock grading (optional, for development)
USE_MOCK_GRADING=false

# Application URL (required for API calls)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development Configuration

For development, use the mock grading provider:

```typescript
const autograder = new AutograderService({
  useMockGrading: true,
  maxRetries: 1,
  retryDelay: 500,
});
```

## Testing

### Unit Tests

Comprehensive unit tests are located in `src/__tests__/services/autograder-service.test.ts`.

Run tests:
```bash
npm test -- autograder-service.test.ts
```

### Test Coverage

The test suite covers:
- ✅ Successful autograding with valid inputs
- ✅ No rubric found scenario
- ✅ No documents found scenario
- ✅ Grading service failure handling
- ✅ Document validation and filtering
- ✅ Batch processing (parallel and sequential)
- ✅ Status retrieval
- ✅ Service readiness checks

### Integration Testing

To test the full pipeline:

1. Create a test assignment with a rubric
2. Submit a PDF document
3. Trigger autograding via `triggerAIGrading()`
4. Verify results in database

## Best Practices

1. **Always Check Readiness**: Call `isReady()` before autograding
2. **Handle All Status Types**: Check for `completed`, `failed`, `no_rubric`, and `no_documents`
3. **Use Batch Processing**: For multiple submissions, use `autogradeBatch()` for better performance
4. **Log Errors**: Always log errors for debugging
5. **Use Mock Provider in Development**: Set `USE_MOCK_GRADING=true` to avoid API costs
6. **Monitor Performance**: Track autograding duration and success rates

## Troubleshooting

### "Autograder service is not ready"

**Cause:** OpenAI API key not configured or invalid

**Solution:**
1. Verify `OPENAI_KEY` is set in environment
2. Check API key is valid
3. Ensure network connectivity to OpenAI API

### "No rubric found for this assignment"

**Cause:** Assignment has no rubric configured

**Solution:**
1. Create a rubric for the assignment
2. Ensure rubric has at least one criterion
3. Verify rubric is associated with the correct assignment

### "No valid PDF documents found"

**Cause:** Submission has no PDF attachments or invalid documents

**Solution:**
1. Ensure submission has PDF attachments
2. Check document URLs are valid and accessible
3. Verify document size is under 50MB

### Grading Takes Too Long

**Cause:** Large PDF or complex rubric

**Solution:**
1. Optimize PDF size (compress images)
2. Simplify rubric criteria
3. Increase timeout configuration
4. Use batch processing for multiple submissions

## Future Enhancements

Potential improvements for the autograder service:

- [ ] Support for multiple document formats (DOCX, images)
- [ ] Parallel processing of multiple documents per submission
- [ ] Caching of grading results
- [ ] Webhooks for asynchronous grading notifications
- [ ] Advanced analytics and insights
- [ ] Custom grading providers (e.g., Anthropic, Google)
- [ ] Retry queue for failed autograding attempts
- [ ] Rate limiting and quota management

## Contributing

When contributing to the autograder service:

1. **Write Tests**: Add unit tests for new features
2. **Update Documentation**: Keep this README up to date
3. **Follow Patterns**: Use existing patterns for consistency
4. **Handle Errors**: Provide clear error messages
5. **Log Appropriately**: Use console.log for info, console.error for errors

## Dependencies

- **Supabase**: Database and storage
- **GradingService**: AI grading functionality
- **Next.js**: Server actions and API routes

## License

Part of the CS1060 Autograder project.

## Support

For issues or questions:
1. Check this documentation
2. Review unit tests for examples
3. Check application logs for errors
4. Contact the development team

---

**Last Updated**: November 2025
**Version**: 1.0.0

