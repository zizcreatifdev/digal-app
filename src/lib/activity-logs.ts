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
  ip_address: string | null;
  browser: string | null;
  os: string | null;
  device_type: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  created_at: string;
}

export async function getClientIp(): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("get_client_ip");
    if (error) return null;
    return (data as string | null) ?? null;
  } catch {
    return null;
  }
}

export function getDeviceInfo(): { browser: string; os: string; device: string } {
  const ua = navigator.userAgent;
  const browser =
    ua.includes("Chrome") && !ua.includes("Edg") ? "Chrome" :
    ua.includes("Safari") && !ua.includes("Chrome") ? "Safari" :
    ua.includes("Firefox") ? "Firefox" :
    ua.includes("Edg") ? "Edge" : "Autre";
  const os =
    ua.includes("Windows") ? "Windows" :
    ua.includes("Mac") ? "macOS" :
    ua.includes("iPhone") ? "iOS" :
    ua.includes("Android") ? "Android" :
    ua.includes("Linux") ? "Linux" : "Autre";
  const isMobile = /iPhone|Android|iPad/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);
  const device = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";
  return { browser, os, device };
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
  metadata?: Record<string, unknown>,
  ipAddress?: string | null,
  deviceInfo?: { browser?: string; os?: string; device?: string }
): Promise<string | null> {
  try {
    const { data } = await supabase.from("activity_logs").insert({
      user_id: userId,
      action,
      type_action: typeAction,
      detail: detail ?? null,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      metadata: metadata ?? {},
      ip_address: ipAddress ?? null,
      browser: deviceInfo?.browser ?? null,
      os: deviceInfo?.os ?? null,
      device_type: deviceInfo?.device ?? null,
    }).select("id").single();
    return data?.id ?? null;
  } catch {
    // Silent fail: logging should never break the app
    return null;
  }
}

// Calls geolocate-ip edge function asynchronously (fire-and-forget)
export function geolocateLog(logId: string): void {
  supabase.functions
    .invoke("geolocate-ip", { body: { logId } })
    .catch(() => { /* silent fail */ });
}

export async function fetchActivityLogs(
  userId: string,
  filters?: {
    typeAction?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<{ logs: ActivityLog[]; count: number }> {
  const pageSize = filters?.pageSize ?? 20;
  const page = filters?.page ?? 0;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("activity_logs")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters?.typeAction && filters.typeAction !== "all") {
    query = query.eq("type_action", filters.typeAction);
  }
  if (filters?.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
  }
  if (filters?.dateTo) {
    query = query.lte("created_at", `${filters.dateTo}T23:59:59`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { logs: (data ?? []) as ActivityLog[], count: count ?? 0 };
}

// Convenience helpers
export const logAuth = (userId: string, action: string, ipAddress?: string | null): Promise<string | null> => {
  const deviceInfo = getDeviceInfo();
  return logActivity(userId, action, "auth", undefined, undefined, undefined, undefined, ipAddress, deviceInfo);
};

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
