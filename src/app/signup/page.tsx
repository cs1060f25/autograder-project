import { SignupForm } from "@/components/signup-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { MarketingPanel } from "@/components/auth/marketing-panel";
import { Alert } from "@/components/ui/alert";

interface PageProps {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <AuthLayout panel={<MarketingPanel />}>
      <div className="space-y-4">
        {params.error && (
          <Alert variant="destructive">{params.error}</Alert>
        )}
        {params.message && (
          <Alert variant="success">{params.message}</Alert>
        )}
        <SignupForm />
      </div>
    </AuthLayout>
  );
}
