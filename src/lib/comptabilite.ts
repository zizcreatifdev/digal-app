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
}

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
}) {
  const { error } = await supabase.from("depenses").insert(depense);
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

function nextMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (m === 12) return `${y + 1}-01-01`;
  return `${y}-${String(m + 1).padStart(2, "0")}-01`;
}
