import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StudentCourseDetailContent } from "@/components/dashboard/student-course-detail-content";
import { requireRole } from "@/lib/user-utils";
import { getStudentCourseDetail } from "@/lib/data-utils";

interface CourseDetailPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function StudentCourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { courseId } = await params;
  const userProfile = await requireRole("student");

  const courseData = await getStudentCourseDetail(courseId, userProfile);

  if (!courseData) {
    notFound();
  }

  return (
    <DashboardLayout
      userProfile={userProfile}
      title={courseData.course.name}
      description={`${courseData.course.code} • ${courseData.assignments.length} assignments`}
      requiredRole="student"
    >
      <StudentCourseDetailContent
        course={courseData.course}
        assignments={courseData.assignments}
        studentId={userProfile.id}
      />
    </DashboardLayout>
  );
}
