import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { NotificationsContent } from "@/components/dashboard/notifications-content";
import { requireAuth } from "@/lib/user-utils";

export default async function NotificationsPage() {
  const userProfile = await requireAuth();

  return (
    <DashboardLayout
      userProfile={userProfile}
      title="Notifications"
      description="Stay updated with your assignments and grades"
    >
      <NotificationsContent />
    </DashboardLayout>
  );
}
