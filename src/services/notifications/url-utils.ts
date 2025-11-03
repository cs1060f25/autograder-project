/**
 * URL Utilities for Notifications
 * Generate consistent URLs for notification links
 */

/**
 * Get the base application URL
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Generate URL for assignment page
 */
export function getAssignmentUrl(assignmentId: string): string {
  return `${getBaseUrl()}/assignments/${assignmentId}`;
}

/**
 * Generate URL for submission page
 * TODO: Create the actual route at /assignments/{assignmentId}/submissions/{submissionId}
 */
export function getSubmissionUrl(assignmentId: string, submissionId: string): string {
  // Placeholder URL until the route is created
  return `${getBaseUrl()}/assignments/${assignmentId}/submissions/${submissionId}`;
}

/**
 * Generate URL for course page
 * Currently routes to dashboard
 * TODO: Create dedicated course page at /courses/{courseId}
 */
export function getCourseUrl(courseId: string): string {
  return `${getBaseUrl()}/dashboard`;
}

/**
 * Generate URL for student dashboard
 */
export function getDashboardUrl(): string {
  return `${getBaseUrl()}/dashboard/student`;
}

/**
 * Generate URL for instructor grading page
 * Routes to TA dashboard where grading happens
 */
export function getGradingUrl(assignmentId: string): string {
  return `${getBaseUrl()}/dashboard/ta`;
}
