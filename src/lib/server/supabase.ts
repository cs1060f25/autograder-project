import { createServerClient } from "@supabase/ssr";
import type { RequestEvent } from "@sveltejs/kit";

export function createClient(event: RequestEvent) {
  return createServerClient(
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
}
