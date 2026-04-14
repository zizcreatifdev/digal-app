import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, addMonths } from "date-fns";

export interface PreviewLink {
  id: string;
  client_id: string;
  user_id: string;
  slug: string;
  periode_debut: string;
  periode_fin: string;
  created_at: string;
  expires_at: string;
  statut: string;
  welcome_message: string | null;
}

export interface PreviewAction {
  id: string;
  preview_link_id: string;
  post_id: string | null;
  decision: string;
  commentaire: string | null;
  created_at: string;
}

export type PeriodOption = "semaine_courante" | "mois_courant" | "semaine_suivante" | "mois_suivant";

export const PERIOD_OPTIONS: { id: PeriodOption; label: string }[] = [
  { id: "semaine_courante", label: "Semaine en cours" },
  { id: "mois_courant", label: "Mois en cours" },
  { id: "semaine_suivante", label: "Semaine suivante" },
  { id: "mois_suivant", label: "Mois suivant" },
];

export function getPeriodDates(period: PeriodOption): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "semaine_courante":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "mois_courant":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "semaine_suivante": {
      const next = addWeeks(now, 1);
      return { start: startOfWeek(next, { weekStartsOn: 1 }), end: endOfWeek(next, { weekStartsOn: 1 }) };
    }
    case "mois_suivant": {
      const next = addMonths(now, 1);
      return { start: startOfMonth(next), end: endOfMonth(next) };
    }
  }
}

function generateSlug(clientSlug?: string | null): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const random = () => Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return clientSlug ? `${clientSlug}-${random()}` : random() + random();
}

export async function createPreviewLink(
  clientId: string,
  userId: string,
  period: PeriodOption,
  options?: { clientSlug?: string | null; welcomeMessage?: string }
) {
  const { start, end } = getPeriodDates(period);
  const slug = generateSlug(options?.clientSlug);

  const { data, error } = await supabase
    .from("preview_links")
    .insert({
      client_id: clientId,
      user_id: userId,
      slug,
      periode_debut: start.toISOString(),
      periode_fin: end.toISOString(),
      welcome_message: options?.welcomeMessage || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as PreviewLink;
}

export async function fetchPreviewLinkBySlug(slug: string) {
  const { data, error } = await supabase
    .from("preview_links")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data as PreviewLink;
}

export async function fetchPreviewActions(linkId: string) {
  const { data, error } = await supabase
    .from("preview_actions")
    .select("*")
    .eq("preview_link_id", linkId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as PreviewAction[];
}

export async function submitPreviewAction(
  linkId: string,
  postId: string | null,
  decision: "valide" | "refuse",
  commentaire?: string
) {
  const { error } = await supabase
    .from("preview_actions")
    .insert({
      preview_link_id: linkId,
      post_id: postId,
      decision,
      commentaire: commentaire || null,
    });
  if (error) throw error;
}

export function getPreviewUrl(slug: string) {
  return `${window.location.origin}/preview/${slug}`;
}
