import { supabase } from "@/integrations/supabase/client";

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  type_action: string;
  detail: string | null;
  metadata: Record<string, unknown>;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

export const ACTION_TYPE_LABELS: Record<string, string> = {
  auth: "Authentification",
  post: "Post",
  client: "Client",
  preview: "Lien validation",
  document: "Facturation",
  kpi: "Rapport KPI",
  fichier: "Fichier",
  parametre: "Paramètre",
  autre: "Autre",
};

export const ACTION_TYPE_COLORS: Record<string, string> = {
  auth: "bg-blue-100 text-blue-700",
  post: "bg-violet-100 text-violet-700",
  client: "bg-emerald-100 text-emerald-700",
  preview: "bg-amber-100 text-amber-700",
  document: "bg-orange-100 text-orange-700",
  kpi: "bg-pink-100 text-pink-700",
  fichier: "bg-cyan-100 text-cyan-700",
  parametre: "bg-gray-100 text-gray-600",
  autre: "bg-gray-100 text-gray-500",
};

export async function logActivity(
  userId: string,
  action: string,
  typeAction: string,
  detail?: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await supabase.from("activity_logs").insert({
      user_id: userId,
      action,
      type_action: typeAction,
      detail: detail ?? null,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      metadata: metadata ?? {},
    });
  } catch {
    // Silent fail: logging should never break the app
  }
}

export async function fetchActivityLogs(
  userId: string,
  filters?: {
    typeAction?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  let query = supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters?.typeAction && filters.typeAction !== "all") {
    query = query.eq("type_action", filters.typeAction);
  }
  if (filters?.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
  }
  if (filters?.dateTo) {
    query = query.lte("created_at", `${filters.dateTo}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ActivityLog[];
}

// Convenience helpers
export const logAuth = (userId: string, action: string) =>
  logActivity(userId, action, "auth");

export const logPostAction = (userId: string, action: string, detail: string, postId?: string) =>
  logActivity(userId, action, "post", detail, "post", postId);

export const logClientAction = (userId: string, action: string, detail: string, clientId?: string) =>
  logActivity(userId, action, "client", detail, "client", clientId);

export const logPreviewAction = (userId: string, action: string, detail: string, linkId?: string) =>
  logActivity(userId, action, "preview", detail, "preview_link", linkId);

export const logDocumentAction = (userId: string, action: string, detail: string, docId?: string) =>
  logActivity(userId, action, "document", detail, "document", docId);

export const logKpiAction = (userId: string, action: string, detail: string, reportId?: string) =>
  logActivity(userId, action, "kpi", detail, "kpi_report", reportId);
