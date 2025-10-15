import { getInstructorData } from "$lib/server/data-utils";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const userProfile = await locals.getUserProfile();
  if (!userProfile || userProfile.role !== "instructor") {
    throw new Error("Unauthorized");
  }

  const data = await getInstructorData(locals.supabase, userProfile);
  return {
    ...data,
    userProfile,
  };
};
