import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const serviceClient = await createServiceClient();

      // Check if user exists
      const { data: existingUser } = await serviceClient
        .from("profiles")
        .select("id, status")
        .eq("id", data.user.id)
        .single();

      if (existingUser?.status === "suspended" || existingUser?.status === "inactive") {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/auth/login?error=suspended`);
      }

      // Check if it's the first user (becomes super_admin)
      // Note: The trigger creates a profile on auth signup, so count will be 1 for the first user
      const { count } = await serviceClient
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const isFirstUser = !existingUser && (count === 0 || count === 1);

      // Always update avatar_url from OAuth provider on each login
      const newAvatarUrl = data.user.user_metadata.avatar_url ||
                           data.user.user_metadata.picture ||
                           null;

      const { error: upsertError } = await serviceClient.from("profiles").upsert(
        {
          id: data.user.id,
          email: data.user.email!.toLowerCase(),
          name:
            data.user.user_metadata.full_name ||
            data.user.user_metadata.name ||
            data.user.email!.split("@")[0],
          avatar_url: newAvatarUrl,
          role: isFirstUser ? "super_admin" : existingUser ? undefined : "employee",
          status: "active",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
          ignoreDuplicates: false,
        }
      );

      if (upsertError) {
        console.error("Error upserting user:", upsertError);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
