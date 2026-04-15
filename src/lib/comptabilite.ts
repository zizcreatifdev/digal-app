import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";

export interface Depense {
  id: string;
  user_id: string;
  libelle: string;
  montant: number;
  categorie: string;
  date_depense: string;
  piece_jointe_url: string | null;
  created_at: string;
  // Boost/publicité fields (added in migration 20260415000005)
  client_id: string | null;
  reseau: string | null;
  inclure_facture: boolean;
}

export const BOOST_RESEAU_LABELS: Record<string, string> = {
  facebook_ads: "Facebook Ads",
  instagram_ads: "Instagram Ads",
  tiktok_ads: "TikTok Ads",
  linkedin_ads: "LinkedIn Ads",
  google_ads: "Google Ads",
};

export interface Salaire {
  id: string;
  user_id: string;
  membre_nom: string;
  salaire_mensuel: number;
  mois: string;
  statut_paiement: string;
  date_paiement: string | null;
  methode_paiement: string | null;
  inclure_facture: boolean;
}

export const CATEGORIE_LABELS: Record<string, string> = {
  logiciel: "Logiciel",
  publicite: "Publicité",
  freelance: "Freelance",
  autre: "Autre",
};

export const CATEGORIE_COLORS: Record<string, string> = {
  logiciel: "bg-blue-100 text-blue-700",
  publicite: "bg-purple-100 text-purple-700",
  freelance: "bg-amber-100 text-amber-700",
  autre: "bg-gray-100 text-gray-600",
};

export async function fetchDepenses(userId: string, month?: string) {
  let query = supabase
    .from("depenses")
    .select("*")
    .eq("user_id", userId)
    .order("date_depense", { ascending: false });

  if (month) {
    query = query
      .gte("date_depense", `${month}-01`)
      .lt("date_depense", nextMonth(month));
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Depense[];
}

export async function createDepense(depense: {
  user_id: string;
  libelle: string;
  montant: number;
  categorie: string;
  date_depense: string;
  piece_jointe_url?: string | null;
  client_id?: string | null;
  reseau?: string | null;
}) {
  const { error } = await supabase.from("depenses").insert(depense);
  if (error) throw error;
}

/** Returns publicité depenses for a client that have not yet been included in a document */
export async function fetchBoostDepenses(userId: string, clientId: string): Promise<Depense[]> {
  const { data, error } = await supabase
    .from("depenses")
    .select("*")
    .eq("user_id", userId)
    .eq("categorie", "publicite")
    .eq("client_id", clientId)
    .eq("inclure_facture", false)
    .order("date_depense", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Depense[];
}

/** Mark a boost depense as included in a document */
export async function markBoostIncluded(depenseId: string): Promise<void> {
  const { error } = await supabase
    .from("depenses")
    .update({ inclure_facture: true })
    .eq("id", depenseId);
  if (error) throw error;
}

export async function deleteDepense(id: string) {
  const { error } = await supabase.from("depenses").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchSalaires(userId: string, mois: string) {
  const { data, error } = await supabase
    .from("salaires")
    .select("*")
    .eq("user_id", userId)
    .eq("mois", mois)
    .order("membre_nom");
  if (error) throw error;
  return (data ?? []) as Salaire[];
}

export async function upsertSalaire(salaire: {
  id?: string;
  user_id: string;
  membre_nom: string;
  salaire_mensuel: number;
  mois: string;
  statut_paiement?: string;
  date_paiement?: string | null;
  methode_paiement?: string | null;
  inclure_facture?: boolean;
}) {
  if (salaire.id) {
    const { error } = await supabase.from("salaires").update(salaire).eq("id", salaire.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("salaires").insert(salaire);
    if (error) throw error;
  }
}

export async function markSalairePaid(id: string, methode: string) {
  const { error } = await supabase.from("salaires").update({
    statut_paiement: "paye",
    date_paiement: new Date().toISOString().split("T")[0],
    methode_paiement: methode,
  }).eq("id", id);
  if (error) throw error;
}

export function exportComptabiliteCSV(
  depenses: Depense[],
  salaires: Salaire[],
  mois: string,
  clientsMap: Record<string, string> = {}
): void {
  const [y, m] = mois.split("-");
  const filename = `comptabilite-${m}-${y}.csv`;

  // Section dépenses
  const depenseRows = depenses.map((d) => ({
    Section: "Dépenses",
    Date: d.date_depense,
    Catégorie: CATEGORIE_LABELS[d.categorie] ?? d.categorie,
    Description: d.libelle,
    "Montant FCFA": d.montant,
    "Client affecté": d.client_id ? (clientsMap[d.client_id] ?? d.client_id) : "",
  }));

  // Section masse salariale
  const salaireRows = salaires.map((s) => ({
    Section: "Masse salariale",
    Date: s.date_paiement ?? mois,
    Catégorie: "Salaire",
    Description: s.membre_nom,
    "Montant FCFA": s.salaire_mensuel,
    "Client affecté": "",
  }));

  const csv = Papa.unparse([...depenseRows, ...salaireRows], {
    delimiter: ";",
    header: true,
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (m === 12) return `${y + 1}-01-01`;
  return `${y}-${String(m + 1).padStart(2, "0")}-01`;
}
