import { redirect } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "instructor" | "student" | "ta";
  created_at: string;
  updated_at: string;
}

export async function requireAuth(event: RequestEvent): Promise<UserProfile> {
  const user = await event.locals.getUser();
  if (!user) {
    throw redirect(303, "/login");
  }

  const profile = await event.locals.getUserProfile();
  if (!profile) {
    throw redirect(303, "/onboarding");
  }

  return profile;
}

export function getDashboardPath(role: string): string {
  switch (role) {
    case "instructor":
      return "/dashboard/instructor";
    case "student":
      return "/dashboard/student";
    case "ta":
      return "/dashboard/ta";
    default:
      return "/unauthorized";
  }
}
