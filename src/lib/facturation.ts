import { supabase } from "@/integrations/supabase/client";

export interface DocumentLine {
  id?: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
  brs_applicable: boolean;
  montant: number;
  ordre: number;
}

export interface Document {
  id: string;
  user_id: string;
  client_id: string;
  type: "devis" | "facture";
  numero: string;
  statut: string;
  date_emission: string;
  date_echeance: string | null;
  sous_total: number;
  taux_brs: number;
  montant_brs: number;
  taux_tva: number;
  montant_tva: number;
  total: number;
  methodes_paiement: string[];
  notes: string | null;
  converted_from_id: string | null;
  created_at: string;
  updated_at: string;
  clients?: { nom: string; logo_url: string | null; couleur_marque: string | null };
}

export interface Payment {
  id: string;
  document_id: string;
  montant: number;
  date_paiement: string;
  methode: string;
  notes: string | null;
  created_at: string;
}

export const STATUT_COLORS: Record<string, string> = {
  brouillon: "bg-muted text-muted-foreground",
  envoye: "bg-blue-100 text-blue-700",
  paye: "bg-emerald-100 text-emerald-700",
  partiellement_paye: "bg-amber-100 text-amber-700",
  en_retard: "bg-red-100 text-red-700",
  annule: "bg-gray-200 text-gray-500",
  archive: "bg-gray-100 text-gray-400",
};

export const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  paye: "Payé",
  partiellement_paye: "Partiellement payé",
  en_retard: "En retard",
  annule: "Annulé",
  archive: "Archivé",
};

export const METHODE_LABELS: Record<string, string> = {
  wave: "Wave",
  yas: "YAS",
  orange_money: "Orange Money",
  virement: "Virement",
  cash: "Cash",
};

export async function generateNumero(type: "devis" | "facture", userId: string): Promise<string> {
  const prefix = type === "devis" ? "DEV" : "FAC";
  const year = new Date().getFullYear();

  // Read agency sigle from billing settings (globally unique key in site_settings)
  const { data: sigleSetting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "billing_sigle")
    .maybeSingle();
  const sigle = (sigleSetting?.value ?? "").trim().toUpperCase();

  // Format: DEV-LCS-2026-0001 (with sigle) or DEV-2026-0001 (without)
  const pattern = sigle ? `${prefix}-${sigle}-${year}-` : `${prefix}-${year}-`;

  const { count } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", type)
    .like("numero", `${pattern}%`);

  const next = (count ?? 0) + 1;
  return `${pattern}${String(next).padStart(4, "0")}`;
}

export function calculateTotals(
  lines: DocumentLine[],
  tauxBrs: number,
  tauxTva: number
) {
  const sousTotal = lines.reduce((sum, l) => sum + l.quantite * l.prix_unitaire, 0);
  const brsBase = lines
    .filter((l) => l.brs_applicable)
    .reduce((sum, l) => sum + l.quantite * l.prix_unitaire, 0);
  const montantBrs = Math.round(brsBase * (tauxBrs / 100));
  const montantTva = Math.round((sousTotal + montantBrs) * (tauxTva / 100));
  const total = sousTotal + montantBrs + montantTva;
  return { sousTotal, montantBrs, montantTva, total };
}

export async function fetchDocuments(userId: string, type?: string) {
  let query = supabase
    .from("documents")
    .select("*, clients(nom, logo_url, couleur_marque)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Document[];
}

export async function fetchDocumentWithLines(docId: string) {
  const [docRes, linesRes, paymentsRes] = await Promise.all([
    supabase.from("documents").select("*, clients(nom, logo_url, couleur_marque)").eq("id", docId).single(),
    supabase.from("document_lines").select("*").eq("document_id", docId).order("ordre"),
    supabase.from("payments").select("*").eq("document_id", docId).order("created_at"),
  ]);
  if (docRes.error) throw docRes.error;
  return {
    document: docRes.data as Document,
    lines: (linesRes.data ?? []) as (DocumentLine & { id: string })[],
    payments: (paymentsRes.data ?? []) as Payment[],
  };
}

export async function createDocument(
  doc: {
    user_id: string;
    client_id: string;
    type: string;
    numero: string;
    date_emission: string;
    date_echeance: string | null;
    sous_total: number;
    taux_brs: number;
    montant_brs: number;
    taux_tva: number;
    montant_tva: number;
    total: number;
    methodes_paiement: string[];
    notes: string;
    converted_from_id?: string | null;
  },
  lines: DocumentLine[]
) {
  const { data, error } = await supabase.from("documents").insert(doc).select().single();
  if (error) throw error;

  if (lines.length > 0) {
    const lineRows = lines.map((l, i) => ({
      document_id: data.id,
      description: l.description,
      quantite: l.quantite,
      prix_unitaire: l.prix_unitaire,
      brs_applicable: l.brs_applicable,
      montant: l.quantite * l.prix_unitaire,
      ordre: i,
    }));
    const { error: lErr } = await supabase.from("document_lines").insert(lineRows);
    if (lErr) throw lErr;
  }

  return data;
}

export async function convertDevisToFacture(devisId: string, userId: string) {
  const { document: devis, lines } = await fetchDocumentWithLines(devisId);
  const numero = await generateNumero("facture", userId);

  const newDoc = await createDocument(
    {
      user_id: userId,
      client_id: devis.client_id,
      type: "facture",
      numero,
      date_emission: new Date().toISOString().split("T")[0],
      date_echeance: devis.date_echeance,
      sous_total: devis.sous_total,
      taux_brs: Number(devis.taux_brs),
      montant_brs: devis.montant_brs,
      taux_tva: Number(devis.taux_tva),
      montant_tva: devis.montant_tva,
      total: devis.total,
      methodes_paiement: devis.methodes_paiement,
      notes: devis.notes ?? "",
      converted_from_id: devisId,
    },
    lines.map((l) => ({
      description: l.description,
      quantite: l.quantite,
      prix_unitaire: l.prix_unitaire,
      brs_applicable: l.brs_applicable,
      montant: l.montant,
      ordre: l.ordre,
    }))
  );

  return newDoc;
}

export async function addPayment(
  documentId: string,
  montant: number,
  methode: string,
  datePaiement: string,
  notes?: string
) {
  const { error } = await supabase.from("payments").insert({
    document_id: documentId,
    montant,
    methode,
    date_paiement: datePaiement,
    notes: notes ?? null,
  });
  if (error) throw error;

  // Check total payments and update status
  const { data: payments } = await supabase
    .from("payments")
    .select("montant")
    .eq("document_id", documentId);

  const totalPaid = (payments ?? []).reduce((s, p) => s + p.montant, 0);

  const { data: doc } = await supabase
    .from("documents")
    .select("total")
    .eq("id", documentId)
    .single();

  if (doc) {
    const newStatut = totalPaid >= doc.total ? "paye" : "partiellement_paye";
    await supabase.from("documents").update({ statut: newStatut }).eq("id", documentId);
  }
}

export async function updateDocumentStatut(docId: string, statut: string) {
  const { error } = await supabase.from("documents").update({ statut }).eq("id", docId);
  if (error) throw error;
}

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-SN", {
    style: "decimal",
    minimumFractionDigits: 0,
  }).format(amount) + " FCFA";
}
