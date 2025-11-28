import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

function extractNamesFromMetadata(
  userMetadata: Record<string, any> | undefined
): { first_name: string | null; last_name: string | null } {
  if (!userMetadata) {
    return { first_name: null, last_name: null };
  }

  if (userMetadata.given_name && userMetadata.family_name) {
    return {
      first_name: userMetadata.given_name,
      last_name: userMetadata.family_name,
    };
  }

  if (userMetadata.first_name && userMetadata.last_name) {
    return {
      first_name: userMetadata.first_name,
      last_name: userMetadata.last_name,
    };
  }

  const displayName = userMetadata.name || userMetadata.full_name || null;

  if (displayName) {
    const nameParts = displayName.trim().split(/\s+/);
    if (nameParts.length === 1) {
      return { first_name: nameParts[0], last_name: null };
    } else if (nameParts.length >= 2) {
      return {
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(" "),
      };
    }
  }

  if (userMetadata.first_name) {
    return {
      first_name: userMetadata.first_name,
      last_name: userMetadata.last_name || null,
    };
  }

  return { first_name: null, last_name: null };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const encrypted_next = searchParams.get("next");
  const next = encrypted_next ? decodeURIComponent(encrypted_next) : "/";

  // Check for OAuth error parameters from Supabase
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  if (error || errorCode) {
    // Forward error parameters to login page
    const loginUrl = new URL("/login", request.url);
    if (error) {
      loginUrl.searchParams.set("error", error);
    }
    if (errorCode) {
      loginUrl.searchParams.set("error_code", errorCode);
    }
    if (errorDescription) {
      loginUrl.searchParams.set("error_description", errorDescription);
    }
    return NextResponse.redirect(loginUrl);
  }

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
      const { first_name, last_name } = extractNamesFromMetadata(
        user.user_metadata
      );

      const { error: upsertError } = await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email,
          first_name,
          last_name,
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
