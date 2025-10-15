import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  if (session) {
    throw redirect(303, "/");
  }
};

export const actions: Actions = {
  signup: async ({ request, locals }) => {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const role = formData.get("role") as string;

    if (password !== confirmPassword) {
      return {
        error: "Passwords do not match",
      };
    }

    const { error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
        },
      },
    });

    if (error) {
      return {
        error: error.message,
      };
    }

    throw redirect(
      303,
      "/login?message=Check your email to confirm your account."
    );
  },
};
