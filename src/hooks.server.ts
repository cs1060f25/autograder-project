import { createServerClient } from "@supabase/ssr";
import { redirect } from "@sveltejs/kit";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return event.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            event.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  event.locals.getSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession();
    return session;
  };

  event.locals.getUser = async () => {
    const {
      data: { user },
    } = await event.locals.supabase.auth.getUser();
    return user;
  };

  event.locals.getUserProfile = async () => {
    const user = await event.locals.getUser();
    if (!user) return null;

    const { data: profile } = await event.locals.supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return profile;
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === "content-range";
    },
  });
};
