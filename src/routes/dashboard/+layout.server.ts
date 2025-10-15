import { redirect } from "@sveltejs/kit";
import { requireAuth } from "$lib/server/user-utils";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  const userProfile = await requireAuth({ locals } as any);
  return {
    userProfile,
  };
};
