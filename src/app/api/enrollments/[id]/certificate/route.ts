import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { withCorsHeaders, withRateLimitHeaders } from "@/lib/api-utils";
import { logger, generateRequestId } from "@/lib/logger";

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id } = await params;
  const reqLog = logger.request("POST", `/api/enrollments/${id}/certificate`, {
    requestId,
  });

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      reqLog.finish(401);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
        )
      );
    }

    if (!isValidUUID(id)) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Ungültige Einschreibungs-ID" },
            { status: 400 }
          )
        )
      );
    }

    const serviceClient = await createServiceClient();

    // Verify ownership
    const { data: enrollment, error: enrollmentError } = await serviceClient
      .from("enrollments")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (enrollmentError || !enrollment) {
      reqLog.finish(404, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Einschreibung nicht gefunden" },
            { status: 404 }
          )
        )
      );
    }

    // Parse multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Ungültige Formulardaten" },
            { status: 400 }
          )
        )
      );
    }

    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Keine Datei hochgeladen" },
            { status: 400 }
          )
        )
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Datei darf maximal 10 MB groß sein" },
            { status: 400 }
          )
        )
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      reqLog.finish(400, { userId: user.id });
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            {
              error:
                "Ungültiger Dateityp. Erlaubt sind: PDF, PNG, JPG, JPEG, WebP",
            },
            { status: 400 }
          )
        )
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const filePath = `${user.id}/${id}/${file.name}`;

    const { error: uploadError } = await serviceClient.storage
      .from("certificates")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      logger.error("Certificate upload failed", {
        requestId,
        userId: user.id,
        enrollmentId: id,
        error: uploadError.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Hochladen des Zertifikats" },
            { status: 500 }
          )
        )
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = serviceClient.storage.from("certificates").getPublicUrl(filePath);

    // Insert certificate row
    const { data: certificate, error: insertError } = await serviceClient
      .from("certificates")
      .insert({
        enrollment_id: id,
        user_id: user.id,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (insertError) {
      logger.error("Certificate record insert failed", {
        requestId,
        userId: user.id,
        enrollmentId: id,
        error: insertError.message,
      });
      reqLog.finish(500);
      return withRateLimitHeaders(
        withCorsHeaders(
          NextResponse.json(
            { error: "Fehler beim Speichern des Zertifikats" },
            { status: 500 }
          )
        )
      );
    }

    logger.audit("certificate.uploaded", {
      requestId,
      userId: user.id,
      enrollmentId: id,
      certificateId: certificate.id,
    });

    reqLog.finish(201, { userId: user.id });
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json({ certificate }, { status: 201 })
      )
    );
  } catch (error) {
    logger.error(
      "POST /api/enrollments/[id]/certificate unhandled error",
      {
        requestId,
        enrollmentId: id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
    );
    reqLog.finish(500);
    return withRateLimitHeaders(
      withCorsHeaders(
        NextResponse.json(
          { error: "Interner Serverfehler" },
          { status: 500 }
        )
      )
    );
  }
}
