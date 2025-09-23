import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StudentDashboardContent } from "@/components/dashboard/student-dashboard-content";
import { requireRole } from "@/lib/user-utils";
import { getStudentAssignments } from "@/lib/data-utils";

export default async function StudentDashboard() {
  const userProfile = await requireRole("student");
  const { assignments, stats } = await getStudentAssignments(userProfile);

  return (
    <DashboardLayout
      userProfile={userProfile}
      title="Student Dashboard"
      description="View your assignments and submit your work."
      requiredRole="student"
    >
      <StudentDashboardContent
        assignments={assignments}
        stats={stats}
        studentId={userProfile.id}
      />
    </DashboardLayout>
  );
}
