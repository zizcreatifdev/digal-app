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

export interface CumulativeStats {
  date_debut: string;
  nb_mois: number;
  total_posts_publies: number;
  total_liens: number;
  taux_approbation: number;
  temps_moyen_validation_h: number | null;
  meilleur_mois: string | null;
  moyenne_posts_par_mois: number;
}

export interface MonthlyKpiRow {
  mois: string;
  data: KpiMetriques;
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
      { key: "likes", label: "Likes" },
      { key: "commentaires", label: "Commentaires" },
      { key: "partages", label: "Partages" },
      { key: "reach_stories", label: "Reach Stories" },
      { key: "vues_reels", label: "Vues Reels" },
    ],
  },
  facebook: {
    label: "Facebook",
    fields: [
      { key: "fans", label: "Fans" },
      { key: "portee", label: "Portée" },
      { key: "likes", label: "Likes" },
      { key: "commentaires", label: "Commentaires" },
      { key: "partages", label: "Partages" },
      { key: "engagement", label: "Engagement" },
      { key: "clics", label: "Clics" },
    ],
  },
  linkedin: {
    label: "LinkedIn",
    fields: [
      { key: "followers", label: "Followers" },
      { key: "impressions", label: "Impressions" },
      { key: "reactions", label: "Réactions" },
      { key: "commentaires", label: "Commentaires" },
      { key: "partages", label: "Partages" },
      { key: "taux_engagement", label: "Taux engagement" },
      { key: "clics", label: "Clics" },
    ],
  },
  x: {
    label: "X / Twitter",
    fields: [
      { key: "abonnes", label: "Abonnés" },
      { key: "impressions", label: "Impressions" },
      { key: "likes", label: "Likes" },
      { key: "retweets", label: "Retweets" },
      { key: "reponses", label: "Réponses" },
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
      { key: "commentaires", label: "Commentaires" },
      { key: "partages", label: "Partages" },
      { key: "favoris", label: "Favoris" },
      { key: "portee", label: "Portée" },
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

/** Formate un identifiant mois (YYYY-MM, depuis:DATE, YYYY-QX, plage) en label lisible. */
export function formatMoisLabel(ym: string): string {
  if (ym.startsWith("depuis:")) {
    const d = new Date(ym.slice(7));
    return `Depuis le ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;
  }
  if (/^\d{4}-Q\d$/.test(ym)) {
    const [y, q] = ym.split("-Q").map(Number);
    return `T${q} ${y}`;
  }
  if (ym.includes("/")) {
    const [s, e] = ym.split("/");
    const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    return `${fmt(s)} — ${fmt(e)}`;
  }
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1).toLocaleString("fr-FR", { month: "long", year: "numeric" });
}

export async function fetchCumulativeStats(clientId: string): Promise<CumulativeStats> {
  const now = new Date();

  const { data: clientData } = await supabase
    .from("clients")
    .select("created_at")
    .eq("id", clientId)
    .single();

  const dateDebut = clientData?.created_at ?? now.toISOString();
  const startDate = new Date(dateDebut);
  const nbMois = Math.max(1, Math.ceil(
    (now.getTime() - new Date(startDate.getFullYear(), startDate.getMonth(), 1).getTime()) /
    (30.44 * 24 * 60 * 60 * 1000)
  ));

  const [postsResult, liensResult, linksResult] = await Promise.all([
    supabase.from("posts").select("date_publication").eq("client_id", clientId).eq("statut", "publie"),
    supabase.from("preview_links").select("id", { count: "exact", head: true }).eq("client_id", clientId),
    supabase.from("preview_links").select("id, created_at").eq("client_id", clientId),
  ]);

  const totalPostsPublies = postsResult.data?.length ?? 0;
  const totalLiens = liensResult.count ?? 0;

  // Taux d'approbation + temps moyen
  let tauxApprobation = 0;
  let tempsMoyenH: number | null = null;
  const linkIds = (linksResult.data ?? []).map((l) => l.id);

  if (linkIds.length > 0) {
    const { data: actions } = await supabase
      .from("preview_actions")
      .select("post_id, decision, preview_link_id, created_at")
      .in("preview_link_id", linkIds)
      .not("post_id", "is", null);

    if (actions && actions.length > 0) {
      const lastByPost = new Map<string, string>();
      for (const a of actions) {
        if (a.post_id) lastByPost.set(a.post_id, a.decision);
      }
      const total = lastByPost.size;
      const approved = [...lastByPost.values()].filter((d) => d === "valide").length;
      tauxApprobation = total > 0 ? Math.round((approved / total) * 100) : 0;

      const linkCreatedMap = new Map((linksResult.data ?? []).map((l) => [l.id, l.created_at]));
      let totalMs = 0;
      let count = 0;
      for (const a of actions.filter((x) => x.decision === "valide")) {
        const linkCreated = linkCreatedMap.get(a.preview_link_id);
        if (linkCreated) {
          const diff = new Date(a.created_at).getTime() - new Date(linkCreated).getTime();
          if (diff > 0) { totalMs += diff; count++; }
        }
      }
      tempsMoyenH = count > 0 ? Math.round(totalMs / count / (1000 * 60 * 60)) : null;
    }
  }

  // Meilleur mois
  const moisCount: Record<string, number> = {};
  for (const p of postsResult.data ?? []) {
    const m = p.date_publication.slice(0, 7);
    moisCount[m] = (moisCount[m] ?? 0) + 1;
  }
  let meilleurMois: string | null = null;
  let maxCount = 0;
  for (const [m, c] of Object.entries(moisCount)) {
    if (c > maxCount) { maxCount = c; meilleurMois = m; }
  }
  if (meilleurMois) {
    const [y, mo] = meilleurMois.split("-").map(Number);
    meilleurMois = new Date(y, mo - 1).toLocaleString("fr-FR", { month: "long", year: "numeric" });
  }

  return {
    date_debut: dateDebut,
    nb_mois: nbMois,
    total_posts_publies: totalPostsPublies,
    total_liens: totalLiens,
    taux_approbation: tauxApprobation,
    temps_moyen_validation_h: tempsMoyenH,
    meilleur_mois: meilleurMois,
    moyenne_posts_par_mois: Math.round((totalPostsPublies / nbMois) * 10) / 10,
  };
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
