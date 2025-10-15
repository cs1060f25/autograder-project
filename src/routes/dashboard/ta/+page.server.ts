import { getTAAssignments } from "$lib/server/data-utils";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const userProfile = await locals.getUserProfile();
  if (!userProfile || userProfile.role !== "ta") {
    throw new Error("Unauthorized");
  }

  const data = await getTAAssignments(locals.supabase, userProfile);
  return {
    ...data,
    userProfile,
  };
};
