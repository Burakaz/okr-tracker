import { createServiceClient } from "@/lib/supabase/server";
import type { AuditAction } from "@/types";
import { headers } from "next/headers";

interface AuditLogParams {
  userId: string;
  orgId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

export async function createAuditLog({
  userId,
  orgId,
  action,
  resourceType,
  resourceId,
  details = {},
}: AuditLogParams): Promise<void> {
  const supabase = await createServiceClient();
  const headersList = await headers();

  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0] ||
    headersList.get("x-real-ip") ||
    "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";

  const { error } = await supabase.from("okr_audit_logs").insert({
    organization_id: orgId,
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId || null,
    details,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  if (error) {
    console.error("Failed to create audit log:", error);
  }
}

// Specialized audit functions
export async function logOKRCreate(
  userId: string,
  orgId: string,
  okrId: string,
  title: string
): Promise<void> {
  await createAuditLog({
    userId,
    orgId,
    action: "okr_create",
    resourceType: "okr",
    resourceId: okrId,
    details: { title },
  });
}

export async function logOKRUpdate(
  userId: string,
  orgId: string,
  okrId: string,
  changedFields: Record<string, { old: unknown; new: unknown }>
): Promise<void> {
  await createAuditLog({
    userId,
    orgId,
    action: "okr_update",
    resourceType: "okr",
    resourceId: okrId,
    details: { changes: changedFields },
  });
}

export async function logOKRDelete(
  userId: string,
  orgId: string,
  okrId: string,
  title: string
): Promise<void> {
  await createAuditLog({
    userId,
    orgId,
    action: "okr_delete",
    resourceType: "okr",
    resourceId: okrId,
    details: { title },
  });
}

export async function logOKRArchive(
  userId: string,
  orgId: string,
  okrId: string,
  title: string
): Promise<void> {
  await createAuditLog({
    userId,
    orgId,
    action: "okr_archive",
    resourceType: "okr",
    resourceId: okrId,
    details: { title },
  });
}

export async function logOKRRestore(
  userId: string,
  orgId: string,
  okrId: string,
  title: string
): Promise<void> {
  await createAuditLog({
    userId,
    orgId,
    action: "okr_restore",
    resourceType: "okr",
    resourceId: okrId,
    details: { title },
  });
}

export async function logOKRDuplicate(
  userId: string,
  orgId: string,
  okrId: string,
  newOkrId: string,
  targetQuarter: string
): Promise<void> {
  await createAuditLog({
    userId,
    orgId,
    action: "okr_duplicate",
    resourceType: "okr",
    resourceId: okrId,
    details: { new_okr_id: newOkrId, target_quarter: targetQuarter },
  });
}

export async function logCheckinCreate(
  userId: string,
  orgId: string,
  checkinId: string,
  okrId: string
): Promise<void> {
  await createAuditLog({
    userId,
    orgId,
    action: "checkin_create",
    resourceType: "checkin",
    resourceId: checkinId,
    details: { okr_id: okrId },
  });
}

export async function logFocusToggle(
  userId: string,
  orgId: string,
  okrId: string,
  isFocus: boolean
): Promise<void> {
  await createAuditLog({
    userId,
    orgId,
    action: "focus_toggle",
    resourceType: "okr",
    resourceId: okrId,
    details: { is_focus: isFocus },
  });
}
