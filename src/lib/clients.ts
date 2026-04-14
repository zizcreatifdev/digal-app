import { supabase } from "@/integrations/supabase/client";

export interface Client {
  id: string;
  user_id: string;
  nom: string;
  logo_url: string | null;
  couleur_marque: string;
  couleur_secondaire: string | null;
  contact_nom: string | null;
  contact_email: string | null;
  contact_telephone: string | null;
  facturation_adresse: string | null;
  facturation_mode: string;
  statut: string;
  created_at: string;
  updated_at: string;
}

export interface ClientNetwork {
  id: string;
  client_id: string;
  reseau: string;
  formats: string[];
  frequence_posts: number;
  notes_editoriales: string | null;
  created_at: string;
}

export const RESEAUX = [
  { id: "instagram", label: "Instagram", formats: ["Image", "Vidéo", "Reel", "Story", "Carrousel"] },
  { id: "facebook", label: "Facebook", formats: ["Image", "Vidéo", "Story", "Lien"] },
  { id: "linkedin", label: "LinkedIn", formats: ["Image", "Vidéo", "Article", "Carrousel"] },
  { id: "x", label: "X (Twitter)", formats: ["Tweet", "Image", "Vidéo", "Thread"] },
  { id: "tiktok", label: "TikTok", formats: ["Vidéo", "Story"] },
] as const;

export const PAYMENT_MODES = [
  { id: "wave", label: "Wave" },
  { id: "orange_money", label: "Orange Money" },
  { id: "virement", label: "Virement bancaire" },
  { id: "cash", label: "Cash" },
] as const;

export async function fetchClients(statut: "actif" | "archive" = "actif") {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .eq("statut", statut)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Client[];
}

export async function fetchClient(id: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Client;
}

export async function fetchClientNetworks(clientId: string) {
  const { data, error } = await supabase
    .from("client_networks")
    .select("*")
    .eq("client_id", clientId);
  if (error) throw error;
  return data as ClientNetwork[];
}

export async function createClient(
  client: Omit<Client, "id" | "created_at" | "updated_at">,
  networks: { reseau: string; formats: string[]; frequence_posts: number; notes_editoriales: string }[]
) {
  const { data, error } = await supabase
    .from("clients")
    .insert(client)
    .select()
    .single();
  if (error) throw error;

  if (networks.length > 0) {
    const networkRows = networks.map((n) => ({ ...n, client_id: data.id }));
    const { error: netErr } = await supabase.from("client_networks").insert(networkRows);
    if (netErr) throw netErr;
  }

  return data as Client;
}

export async function archiveClient(id: string) {
  const { error } = await supabase
    .from("clients")
    .update({ statut: "archive" })
    .eq("id", id);
  if (error) throw error;
}

export async function restoreClient(id: string) {
  const { error } = await supabase
    .from("clients")
    .update({ statut: "actif" })
    .eq("id", id);
  if (error) throw error;
}
