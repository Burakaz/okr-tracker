import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { DashboardClientWrapper } from "@/components/layout/DashboardClientWrapper";
import { DataPreloader } from "@/components/DataPreloader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create both clients in parallel
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

  // Fetch profile and logo in parallel (eliminates waterfall)
  const [profileResult, logoResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single(),
    serviceClient.storage.from("logos").list("", {
      limit: 10,
      sortBy: { column: "created_at", order: "desc" },
    }).catch(() => ({ data: null })),
  ]);

  const user = profileResult.data;

  if (!user) {
    redirect("/auth/login");
  }

  // User ist gesperrt
  if (user.status !== "active") {
    redirect("/auth/login?error=suspended");
  }

  // Process logo result
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

  if (!orgLogo) {
    orgLogo = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/web-app-manifest-512x512.png`;
  }

  return (
    <>
      <DataPreloader />
      <DashboardClientWrapper
        user={user}
        orgLogo={orgLogo}
      >
        {children}
      </DashboardClientWrapper>
    </>
  );
}
