import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { V2Shell } from "@/components/v2/layout/V2Shell";
import "./v2.css";

export default async function V2PreviewLayout({
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
    <div className="theme-v2">
      <V2Shell user={user} orgLogo={orgLogo}>
        {children}
      </V2Shell>
    </div>
  );
}
