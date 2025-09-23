import { LoginForm } from "@/components/login-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { MarketingPanel } from "@/components/auth/marketing-panel";
import { Alert } from "@/components/ui/alert";

interface PageProps {
  searchParams: {
    error?: string;
    message?: string;
  };
}

export default function Page({ searchParams }: PageProps) {
  return (
    <AuthLayout panel={<MarketingPanel />}>
      <div className="space-y-4">
        {searchParams.error && (
          <Alert variant="destructive">{searchParams.error}</Alert>
        )}
        {searchParams.message && (
          <Alert variant="success">{searchParams.message}</Alert>
        )}
        <LoginForm />
      </div>
    </AuthLayout>
  );
}
