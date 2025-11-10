# Grading Service

A modular and extensible service for automated grading of student submissions using AI.

## Overview

The Grading Service provides a clean abstraction layer for grading submissions with different AI providers. It supports:

- **Multiple Providers**: OpenAI, Mock (for testing), and easy to extend
- **Automatic Retries**: Configurable retry logic with exponential backoff
- **Validation**: Comprehensive result validation to ensure data integrity
- **Batch Processing**: Grade multiple submissions in parallel
- **Testing Support**: Built-in mock provider for development and testing

## Architecture

```
GradingService (main service)
    ├── IGradingProvider (interface)
    │   ├── OpenAIGradingProvider (production)
    │   └── MockGradingProvider (testing/development)
    └── Types (shared types and interfaces)
```

## Quick Start

### Basic Usage

```typescript
import {
  GradingService,
  OpenAIGradingProvider,
  RubricItem,
} from "@/services/grading";

// Create a provider
const provider = new OpenAIGradingProvider({
  apiKey: process.env.OPENAI_KEY,
  model: "gpt-5-mini",
});

// Create the service
const gradingService = new GradingService({
  provider,
  maxRetries: 3,
  retryDelay: 1000,
});

// Define rubric
const rubric: RubricItem[] = [
  {
    id: "clarity",
    label: "Clarity",
    maxPoints: 10,
    guidance: "Is the writing clear and understandable?",
  },
  {
    id: "accuracy",
    label: "Accuracy",
    maxPoints: 15,
    guidance: "Are the facts correct?",
  },
];

// Grade a submission
const result = await gradingService.grade({
  fileUrl: "https://example.com/submission.pdf",
  rubric,
});

console.log(`Score: ${result.totalAwarded}/${result.totalPossible}`);
console.log(`Feedback: ${result.overallFeedback}`);
```

### Using Mock Provider (for Testing)

```typescript
import { GradingService, MockGradingProvider } from "@/services/grading";

const mockProvider = new MockGradingProvider({
  scorePercentage: 0.85, // Award 85% of points
  simulatedDelay: 500, // 500ms delay
  addVariation: true, // Add randomness to scores
});

const gradingService = new GradingService({
  provider: mockProvider,
});

const result = await gradingService.grade({
  fileUrl: "https://example.com/test.pdf",
  rubric: myRubric,
});
```

## API Reference

### GradingService

The main service class that handles grading requests.

#### Constructor

```typescript
new GradingService(config: GradingServiceConfig)
```

**Parameters:**
- `config.provider`: IGradingProvider - The grading provider to use
- `config.maxRetries?`: number - Maximum retry attempts (default: 3)
- `config.retryDelay?`: number - Delay between retries in ms (default: 1000)

#### Methods

##### `grade(request: GradeRequest): Promise<GradeResult>`

Grade a single submission.

**Parameters:**
- `request.fileUrl`: string - Public URL to the PDF file
- `request.rubric`: RubricItem[] - Grading rubric

**Returns:** Promise<GradeResult>

**Throws:** Error if grading fails after all retries

##### `gradeBatch(requests: GradeRequest[]): Promise<BatchResult[]>`

Grade multiple submissions in parallel.

**Parameters:**
- `requests`: GradeRequest[] - Array of grading requests

**Returns:** Promise<Array<{ success: boolean; result?: GradeResult; error?: string }>>

##### `isReady(): Promise<boolean>`

Check if the service is ready to use.

##### `getProviderName(): string`

Get the name of the current provider.

### Providers

#### OpenAIGradingProvider

Production provider that uses OpenAI's API.

```typescript
new OpenAIGradingProvider(config?: OpenAIGradingProviderConfig)
```

**Config:**
- `apiKey?`: string - OpenAI API key (defaults to process.env.OPENAI_KEY)
- `model?`: string - Model to use (default: "gpt-5-mini")
- `systemPrompt?`: string - Custom system prompt
- `maxRetries?`: number - API retry attempts (default: 3)

#### MockGradingProvider

Testing provider that simulates grading without API calls.

```typescript
new MockGradingProvider(config?: MockGradingProviderConfig)
```

**Config:**
- `scorePercentage?`: number - Percentage of points to award (0-1, default: 0.85)
- `simulatedDelay?`: number - Delay in ms (default: 500)
- `addVariation?`: boolean - Add random variation to scores (default: true)
- `simulateFailure?`: boolean - Simulate failures (default: false)
- `failureRate?`: number - Failure rate if enabled (0-1, default: 0.1)

**Methods:**
- `updateConfig(config: Partial<MockGradingProviderConfig>)`: Update configuration at runtime

### Types

#### RubricItem

```typescript
interface RubricItem {
  id: string;           // Stable identifier
  label: string;        // Human-readable name
  maxPoints: number;    // Maximum points
  guidance?: string;    // Optional grading guidance
}
```

#### GradeResult

```typescript
interface GradeResult {
  totalAwarded: number;      // Total points awarded
  totalPossible: number;     // Total points possible
  items: GradeItem[];        // Individual criterion results
  overallFeedback: string;   // General feedback
}
```

#### GradeItem

```typescript
interface GradeItem {
  id: string;           // Matches RubricItem.id
  label: string;        // Criterion name
  maxPoints: number;    // Maximum points
  points: number;       // Points awarded
  comments: string;     // Feedback for this criterion
}
```

## API Endpoint

The grading service is exposed via `/api/grade` endpoint.

### Request

**Method:** POST

**Content-Type:** multipart/form-data

**Parameters:**
- `file`: string - Public URL to the PDF file
- `rubric`: string - JSON-encoded rubric array
- `useMock?`: string - Set to "true" to use mock provider (optional)

### Response

**Success (200):**
```json
{
  "totalAwarded": 25,
  "totalPossible": 30,
  "items": [
    {
      "id": "clarity",
      "label": "Clarity",
      "maxPoints": 10,
      "points": 8,
      "comments": "Clear writing with minor improvements needed."
    },
    ...
  ],
  "overallFeedback": "Good work overall. Focus on improving clarity and detail."
}
```

**Error (4xx/5xx):**
```json
{
  "error": "Error message"
}
```

### Example Usage

```typescript
const formData = new FormData();
formData.append("file", "https://example.com/submission.pdf");
formData.append("rubric", JSON.stringify(rubric));
formData.append("useMock", "true"); // Optional

const response = await fetch("/api/grade", {
  method: "POST",
  body: formData,
});

const result = await response.json();
```

## Testing

### Unit Tests

Run unit tests for the grading service:

```bash
npm test -- src/__tests__/services/
```

### Integration Tests

Run integration tests for the API:

```bash
npm run test:integration -- grading-api
```

### Test Coverage

The test suite covers:
- ✅ Successful grading with mock provider
- ✅ Retry logic on provider failures
- ✅ Validation of grading results
- ✅ Batch grading
- ✅ Provider availability checks
- ✅ Error handling
- ✅ API endpoint validation

## Configuration

### Environment Variables

- `OPENAI_KEY`: OpenAI API key (required for production)
- `USE_MOCK_GRADING`: Set to "true" to use mock provider globally (optional)
- `NEXT_PUBLIC_APP_URL`: Base URL for API endpoints (required for integration tests)

### Example .env

```bash
OPENAI_KEY=sk-...
USE_MOCK_GRADING=false
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Extending with Custom Providers

You can create custom grading providers by implementing the `IGradingProvider` interface:

```typescript
import { IGradingProvider, GradeRequest, GradeResult } from "@/services/grading";

export class CustomGradingProvider implements IGradingProvider {
  async grade(request: GradeRequest): Promise<GradeResult> {
    // Your custom grading logic here
    return {
      totalAwarded: 25,
      totalPossible: 30,
      items: [...],
      overallFeedback: "...",
    };
  }

  getName(): string {
    return "CustomGradingProvider";
  }

  async isAvailable(): Promise<boolean> {
    // Check if your provider is ready
    return true;
  }
}

// Use it with the service
const provider = new CustomGradingProvider();
const service = new GradingService({ provider });
```

## Best Practices

1. **Use Mock Provider in Development**: Set `USE_MOCK_GRADING=true` during development to avoid API costs
2. **Configure Retries**: Adjust `maxRetries` based on your reliability requirements
3. **Validate Results**: The service automatically validates results, but add custom validation for domain-specific rules
4. **Batch Processing**: Use `gradeBatch()` for multiple submissions to improve performance
5. **Error Handling**: Always wrap grading calls in try-catch blocks
6. **Monitor API Usage**: Track OpenAI API usage to manage costs

## Troubleshooting

### "Provider is not available"

- Check that `OPENAI_KEY` is set in your environment
- Verify API key is valid
- Ensure network connectivity to OpenAI API

### "Grading failed after N attempts"

- Check OpenAI API status
- Verify PDF URL is accessible
- Review rubric format
- Check API rate limits

### "Result has M items but rubric has N items"

- Ensure provider returns results for all rubric items
- Check rubric IDs are unique and valid

## Dependencies

- **Document Management**: Requires PDF files to be accessible via public URLs
- **LLM Provider**: Currently supports OpenAI API (extensible to other providers)
- **Supabase**: For storing grading results and rubrics

## Performance

- **Mock Provider**: ~0-1 second per submission
- **OpenAI Provider**: ~5-15 seconds per submission (depends on PDF size and complexity)
- **Batch Processing**: Processes submissions in parallel, ~N seconds for N submissions

## Security

- API keys are never exposed to clients
- File URLs should be signed or temporary
- Validation ensures no malicious data in results
- Rate limiting recommended for production use

## Future Enhancements

- [ ] Support for more LLM providers (Anthropic, Google, etc.)
- [ ] Caching of grading results
- [ ] Asynchronous grading with webhooks
- [ ] Support for non-PDF documents
- [ ] Fine-tuned models for specific subjects
- [ ] Grading analytics and insights

