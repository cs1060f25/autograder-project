import { requireAuth } from "@/lib/user-utils";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ProfileForm } from "@/components/profile-form";

interface ProfilePageProps {
  searchParams?: {
    link_success?: string;
    link_error?: string;
  };
}

const LINK_SUCCESS_MESSAGES: Record<string, string> = {
  google:
    "Google account linked successfully. You can now sign in with Google.",
  github:
    "GitHub account linked successfully. You can now sign in with GitHub.",
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const userProfile = await requireAuth();
  const successKey = searchParams?.link_success || "";
  const initialSuccessMessage = LINK_SUCCESS_MESSAGES[successKey] || undefined;
  const initialErrorMessage = searchParams?.link_error;

  return (
    <DashboardLayout
      userProfile={userProfile}
      title="Profile Settings"
      description="Manage your account information and login preferences."
      requiredRole={userProfile.role}
    >
      <ProfileForm
        userProfile={userProfile}
        initialSuccessMessage={initialSuccessMessage}
        initialErrorMessage={initialErrorMessage}
      />
    </DashboardLayout>
  );
}
