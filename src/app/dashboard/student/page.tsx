import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StudentDashboardContent } from "@/components/dashboard/student-dashboard-content";
import { requireRole } from "@/lib/user-utils";
import { getStudentAssignments, getStudentEnrolledCourses } from "@/lib/data-utils";

export default async function StudentDashboard() {
  const userProfile = await requireRole("student");
  const [{ assignments, stats }, courses] = await Promise.all([
    getStudentAssignments(userProfile),
    getStudentEnrolledCourses(userProfile),
  ]);

  return (
    <DashboardLayout
      userProfile={userProfile}
      title="Student Dashboard"
      description="View your courses and assignments."
      requiredRole="student"
    >
      <StudentDashboardContent
        assignments={assignments}
        stats={stats}
        studentId={userProfile.id}
        courses={courses}
      />
    </DashboardLayout>
  );
}
