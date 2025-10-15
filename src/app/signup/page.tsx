import { SignupForm } from "@/components/signup-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { MarketingPanel } from "@/components/auth/marketing-panel";
import { Alert } from "@/components/ui/alert";
import { Box } from "@mui/material";

interface PageProps {
  searchParams: {
    error?: string;
    message?: string;
  };
}

export default function Page({ searchParams }: PageProps) {
  return (
    <AuthLayout panel={<MarketingPanel />}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {searchParams.error && (
          <Alert variant="destructive">{searchParams.error}</Alert>
        )}
        {searchParams.message && (
          <Alert variant="success">{searchParams.message}</Alert>
        )}
        <SignupForm />
      </Box>
    </AuthLayout>
  );
}
