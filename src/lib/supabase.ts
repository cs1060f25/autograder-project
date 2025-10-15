import { createBrowserClient } from "@supabase/ssr";
import { browser } from "$app/environment";

export function createClient() {
  return createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY!
  );
}
