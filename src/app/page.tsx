import { requireAuth, getDashboardPath } from "@/lib/user-utils";
import { redirect } from "next/navigation";

export default async function Home() {
  const userProfile = await requireAuth();
  const dashboardPath = await getDashboardPath(userProfile.role);

  redirect(dashboardPath);
}
