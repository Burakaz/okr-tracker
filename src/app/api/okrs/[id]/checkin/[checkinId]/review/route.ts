import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";
import { z } from "zod";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  status: z.enum(["approved", "noted", "rejected"]),
  comment: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; checkinId: string }> }
) {
  const requestId = generateRequestId();
  const { id: okrId, checkinId } = await params;
  const reqLog = logger.request("POST", `/api/okrs/${okrId}/checkin/${checkinId}/review`, { requestId });

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      reqLog.finish(401);
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 }))
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      reqLog.finish(400);
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ error: "Ungültiger JSON-Body" }, { status: 400 }))
      );
    }

    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      reqLog.finish(400);
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ error: "Validierungsfehler", details: parsed.error.flatten() }, { status: 400 }))
      );
    }

    const serviceClient = await createServiceClient();

    // Verify reviewer is manager/HR/admin in same org as check-in owner
    const { data: requesterProfile } = await serviceClient
      .from("profiles")
      .select("role, organization_id, name")
      .eq("id", user.id)
      .single();

    if (!requesterProfile || !["manager", "hr", "admin", "super_admin"].includes(requesterProfile.role)) {
      reqLog.finish(403);
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ error: "Nur Manager können Reviews erstellen" }, { status: 403 }))
      );
    }

    // Verify check-in exists and belongs to same org
    const { data: checkin } = await serviceClient
      .from("okr_checkins")
      .select("id, user_id, okr_id")
      .eq("id", checkinId)
      .eq("okr_id", okrId)
      .single();

    if (!checkin) {
      reqLog.finish(404);
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ error: "Check-in nicht gefunden" }, { status: 404 }))
      );
    }

    // Verify check-in owner is in same org
    const { data: ownerProfile } = await serviceClient
      .from("profiles")
      .select("organization_id")
      .eq("id", checkin.user_id)
      .single();

    if (!ownerProfile || ownerProfile.organization_id !== requesterProfile.organization_id) {
      reqLog.finish(403);
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 }))
      );
    }

    // Cannot review own check-in
    if (checkin.user_id === user.id) {
      reqLog.finish(400);
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ error: "Eigene Check-ins können nicht bewertet werden" }, { status: 400 }))
      );
    }

    // UPSERT review
    const { data: review, error: reviewError } = await serviceClient
      .from("checkin_reviews")
      .upsert(
        {
          checkin_id: checkinId,
          reviewer_id: user.id,
          status: parsed.data.status,
          comment: parsed.data.comment || null,
        },
        { onConflict: "checkin_id" }
      )
      .select()
      .single();

    if (reviewError || !review) {
      logger.error("Review upsert failed", { requestId, error: reviewError?.message });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(NextResponse.json({ error: "Fehler beim Speichern des Reviews" }, { status: 500 }))
      );
    }

    logger.audit("checkin_review.created", {
      requestId,
      reviewerId: user.id,
      checkinId,
      okrId,
      status: parsed.data.status,
    });

    reqLog.finish(201, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({
        review: {
          ...review,
          reviewer_name: requesterProfile.name,
        }
      }, { status: 201 }))
    );
  } catch (error) {
    logger.error("POST checkin review error", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    reqLog.finish(500);
    return withRateLimitHeaders(
      withCorsHeaders(NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 }))
    );
  }
}
