import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const encrypted_next = searchParams.get("next");
  const next = encrypted_next ? decodeURIComponent(encrypted_next) : "/";

  if (code) {
    // OAuth callback
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth error:", error);
      if (error.message.includes("Multiple accounts with the same email")) {
        return NextResponse.redirect(
          new URL(
            "/login?error=An account with this email already exists.",
            request.url
          )
        );
      }

      // Redirect on auth error
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error.message)}`,
          request.url
        )
      );
    }

    // Successful OAuth authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Upsert user record to handle OAuth users and account linking
      const { error: upsertError } = await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email,
          first_name:
            user.user_metadata?.first_name ||
            user.user_metadata?.full_name?.split(" ")[0] ||
            null,
          last_name:
            user.user_metadata?.last_name ||
            user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ||
            null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
          ignoreDuplicates: false,
        }
      );

      if (upsertError && !upsertError.message.includes("duplicate key")) {
        console.error("Error upserting user:", upsertError);
      }

      // Check if user needs onboarding
      const { data: userData } = await supabase
        .from("users")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (!userData) {
        // User doesn't exist in users table, redirect to onboarding
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }

      if (!userData.onboarding_completed) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }

    return NextResponse.redirect(new URL(next, request.url));
  }

  if (token_hash && type) {
    // Email verification callback
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Check if user needs onboarding
        const { data: userData } = await supabase
          .from("users")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        if (userData && !userData.onboarding_completed) {
          return NextResponse.redirect(new URL("/onboarding", request.url));
        }
      }
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
