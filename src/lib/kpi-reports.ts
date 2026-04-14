import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface NetworkMetrics {
  [key: string]: number | undefined;
}

export interface KpiMetriques {
  instagram?: NetworkMetrics;
  facebook?: NetworkMetrics;
  linkedin?: NetworkMetrics;
  x?: NetworkMetrics;
  tiktok?: NetworkMetrics;
}

export interface KpiReport {
  id: string;
  user_id: string;
  client_id: string;
  mois: string;
  metriques: KpiMetriques;
  points_forts: string | null;
  axes_amelioration: string | null;
  objectifs: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export const NETWORK_METRICS_CONFIG: Record<string, { label: string; fields: { key: string; label: string }[] }> = {
  instagram: {
    label: "Instagram",
    fields: [
      { key: "abonnes", label: "Abonnés" },
      { key: "portee", label: "Portée" },
      { key: "impressions", label: "Impressions" },
      { key: "engagement", label: "Engagement" },
      { key: "reach_stories", label: "Reach Stories" },
      { key: "vues_reels", label: "Vues Reels" },
    ],
  },
  facebook: {
    label: "Facebook",
    fields: [
      { key: "fans", label: "Fans" },
      { key: "portee", label: "Portée" },
      { key: "engagement", label: "Engagement" },
      { key: "clics", label: "Clics" },
    ],
  },
  linkedin: {
    label: "LinkedIn",
    fields: [
      { key: "followers", label: "Followers" },
      { key: "impressions", label: "Impressions" },
      { key: "taux_engagement", label: "Taux engagement" },
      { key: "clics", label: "Clics" },
    ],
  },
  x: {
    label: "X / Twitter",
    fields: [
      { key: "abonnes", label: "Abonnés" },
      { key: "impressions", label: "Impressions" },
      { key: "engagements", label: "Engagements" },
      { key: "clics", label: "Clics" },
    ],
  },
  tiktok: {
    label: "TikTok",
    fields: [
      { key: "abonnes", label: "Abonnés" },
      { key: "vues", label: "Vues" },
      { key: "likes", label: "Likes" },
      { key: "partages", label: "Partages" },
      { key: "commentaires", label: "Commentaires" },
    ],
  },
};

export async function fetchKpiReports(clientId: string) {
  const { data, error } = await supabase
    .from("kpi_reports")
    .select("*")
    .eq("client_id", clientId)
    .order("mois", { ascending: false });
  if (error) throw error;
  return (data ?? []) as KpiReport[];
}

export async function fetchKpiReport(id: string) {
  const { data, error } = await supabase
    .from("kpi_reports")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as KpiReport;
}

export async function saveKpiReport(report: {
  id?: string;
  user_id: string;
  client_id: string;
  mois: string;
  metriques: KpiMetriques;
  points_forts: string;
  axes_amelioration: string;
  objectifs: string;
}) {
  if (report.id) {
    const { error } = await supabase
      .from("kpi_reports")
      .update({
        metriques: report.metriques as unknown as Json,
        points_forts: report.points_forts,
        axes_amelioration: report.axes_amelioration,
        objectifs: report.objectifs,
      })
      .eq("id", report.id);
    if (error) throw error;
    return report.id;
  } else {
    const { data, error } = await supabase
      .from("kpi_reports")
      .insert({
        user_id: report.user_id,
        client_id: report.client_id,
        mois: report.mois,
        metriques: report.metriques as unknown as Json,
        points_forts: report.points_forts,
        axes_amelioration: report.axes_amelioration,
        objectifs: report.objectifs,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }
}

export function hasMetrics(metriques: KpiMetriques): boolean {
  return Object.values(metriques).some(
    (net) => net && Object.values(net).some((v) => v !== undefined && v !== null && v !== 0)
  );
}

export function getFilledMetrics(networkMetrics: NetworkMetrics | undefined): { key: string; label: string; value: number }[] {
  if (!networkMetrics) return [];
  return Object.entries(networkMetrics)
    .filter(([, v]) => v !== undefined && v !== 0 && v !== null)
    .map(([key, value]) => {
      // Find the label from config
      for (const net of Object.values(NETWORK_METRICS_CONFIG)) {
        const field = net.fields.find((f) => f.key === key);
        if (field) return { key, label: field.label, value: value as number };
      }
      return { key, label: key, value: value as number };
    });
}
