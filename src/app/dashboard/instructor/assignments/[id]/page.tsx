import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { requireRole } from "@/lib/user-utils";
import { getAssignmentWithSubmissions } from "@/lib/assignment-actions";
import { AssignmentDetailContent } from "@/components/dashboard/assignment-detail-content";
import { redirect } from "next/navigation";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userProfile = await requireRole("instructor");
  const result = await getAssignmentWithSubmissions(id);

  if (!result.success || !result.assignment || !result.submissions || !result.stats) {
    redirect("/dashboard/instructor?error=" + encodeURIComponent(result.error || "Assignment not found"));
  }

  return (
    <DashboardLayout
      userProfile={userProfile}
      title={result.assignment.title}
      description={`View and manage submissions for ${result.assignment.title}`}
      requiredRole="instructor"
    >
      <AssignmentDetailContent
        assignment={result.assignment}
        submissions={result.submissions}
        stats={result.stats}
      />
    </DashboardLayout>
  );
}
