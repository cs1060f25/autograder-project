import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { InstructorCourseDetailContent } from "@/components/dashboard/instructor-course-detail-content";
import { requireRole } from "@/lib/user-utils";
import { getInstructorCourseDetail, getInstructorData } from "@/lib/data-utils";

interface CourseDetailPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function InstructorCourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { courseId } = await params;
  const userProfile = await requireRole("instructor");

  const courseData = await getInstructorCourseDetail(courseId, userProfile);

  if (!courseData) {
    notFound();
  }

  // Get all courses for the assignment modal
  const { courses: allCourses } = await getInstructorData(userProfile);

  return (
    <DashboardLayout
      userProfile={userProfile}
      title={courseData.course.name}
      description={`${courseData.course.code} • ${courseData.course.students_count} students • ${courseData.course.assignments_count} assignments`}
      requiredRole="instructor"
    >
      <InstructorCourseDetailContent
        course={courseData.course}
        assignments={courseData.assignments}
        allCourses={allCourses}
      />
    </DashboardLayout>
  );
}
