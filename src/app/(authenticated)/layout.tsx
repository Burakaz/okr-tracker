import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { AppShell } from "./AppShell";
import { DataPreloader } from "@/components/DataPreloader";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabase, serviceClient] = await Promise.all([
    createClient(),
    createServiceClient(),
  ]);

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/auth/login");
  }

  // Fetch profile and logo in parallel
  const [profileResult, logoResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single(),
    serviceClient.storage
      .from("logos")
      .list("", {
        limit: 10,
        sortBy: { column: "created_at", order: "desc" },
      })
      .catch(() => ({ data: null })),
  ]);

  const user = profileResult.data;

  if (!user) {
    redirect("/auth/login");
  }

  if (user.status !== "active") {
    redirect("/auth/login?error=suspended");
  }

  // Process logo
  let orgLogo: string | null = null;

  try {
    const logoFiles = logoResult?.data;
    if (logoFiles && logoFiles.length > 0) {
      const imageFile = logoFiles.find((file) => {
        const ext = file.name.split(".").pop()?.toLowerCase();
        return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
      });
      if (imageFile) {
        const { data: urlData } = serviceClient.storage
          .from("logos")
          .getPublicUrl(imageFile.name);
        orgLogo = urlData.publicUrl;
      }
    }
  } catch {
    // Logo loading is non-critical
  }

  return (
    <>
      <DataPreloader />
      <AppShell user={user} orgLogo={orgLogo}>
        {children}
      </AppShell>
    </>
  );
}
