import { requireAuth } from "@/lib/user-utils";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const userProfile = await requireAuth();

  return (
    <DashboardLayout
      userProfile={userProfile}
      title="Profile Settings"
      description="Manage your account information and preferences"
      requiredRole={userProfile.role}
    >
      <ProfileForm userProfile={userProfile} />
    </DashboardLayout>
  );
}
