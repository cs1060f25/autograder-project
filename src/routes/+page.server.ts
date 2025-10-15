import { redirect } from "@sveltejs/kit";
import { requireAuth, getDashboardPath } from "$lib/server/user-utils";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const userProfile = await requireAuth({ locals } as any);
  const dashboardPath = getDashboardPath(userProfile.role);
  throw redirect(303, dashboardPath);
};
