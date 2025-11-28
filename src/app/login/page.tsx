import { LoginForm } from "@/components/login-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { MarketingPanel } from "@/components/auth/marketing-panel";
import { Alert } from "@/components/ui/alert";

interface PageProps {
  searchParams: Promise<{
    error?: string;
    error_code?: string;
    error_description?: string;
    message?: string;
  }>;
}

function formatErrorMessage(
  error?: string,
  errorCode?: string,
  errorDescription?: string
): string | null {
  if (!error && !errorCode) {
    return null;
  }

  // If we have a user-friendly error message, use it
  if (error && error !== "server_error") {
    return error;
  }

  // Format error based on error_code
  if (errorCode === "unexpected_failure") {
    return errorDescription || "An unexpected error occurred during authentication. Please try again.";
  }

  // Generic error message
  if (errorCode) {
    return errorDescription || `Authentication failed: ${errorCode}`;
  }

  // Fallback to error parameter
  return error || "An error occurred during authentication. Please try again.";
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const errorMessage = formatErrorMessage(
    params.error,
    params.error_code,
    params.error_description
  );

  return (
    <AuthLayout panel={<MarketingPanel />}>
      <div className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive">{errorMessage}</Alert>
        )}
        {params.message && (
          <Alert variant="success">{params.message}</Alert>
        )}
        <LoginForm />
      </div>
    </AuthLayout>
  );
}
