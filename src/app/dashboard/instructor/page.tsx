import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { requireRole } from "@/lib/user-utils";
import { getInstructorData } from "@/lib/data-utils";
import { InstructorDashboardContent } from "@/components/dashboard/instructor-dashboard-content";

export default async function InstructorDashboard() {
  const userProfile = await requireRole("instructor");
  const { courses, recentAssignments, stats } = await getInstructorData(
    userProfile
  );

  return (
    <DashboardLayout
      userProfile={userProfile}
      title="Instructor Dashboard"
      description="Manage courses, create assignments, and monitor student progress."
      requiredRole="instructor"
    >
      <InstructorDashboardContent
        courses={courses}
        recentAssignments={recentAssignments}
        stats={stats}
      />
    </DashboardLayout>
  );
}
