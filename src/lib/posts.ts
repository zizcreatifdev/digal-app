import { supabase } from "@/integrations/supabase/client";

export interface Post {
  id: string;
  client_id: string;
  user_id: string;
  reseau: string;
  format: string;
  date_publication: string;
  texte: string | null;
  hashtags: string | null;
  media_url: string | null;
  media_urls: string[];
  statut: string;
  assigne_a: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
}

export const POST_STATUTS = [
  { id: "brouillon", label: "Brouillon", color: "bg-slate-100 text-slate-600" },
  { id: "idee", label: "Idée", color: "bg-muted text-muted-foreground" },
  { id: "en_production", label: "En production", color: "bg-blue-100 text-blue-700" },
  { id: "en_attente_validation", label: "En attente validation", color: "bg-orange-100 text-orange-700" },
  { id: "lien_envoye", label: "Lien envoyé", color: "bg-blue-100 text-blue-700" },
  { id: "programme_valide", label: "Validé client", color: "bg-emerald-100 text-emerald-700" },
  { id: "valide", label: "Validé", color: "bg-green-100 text-green-700" },
  { id: "publie", label: "Publié", color: "bg-purple-100 text-purple-700" },
  { id: "archive", label: "Archivé", color: "bg-gray-100 text-gray-500" },
  { id: "refuse", label: "Refusé", color: "bg-red-100 text-red-700" },
] as const;

export const POST_STATUT_HEX: Record<string, string> = {
  brouillon: "#9ca3af",
  idee: "#9ca3af",
  en_production: "#60a5fa",
  en_attente_validation: "#f97316",
  lien_envoye: "#3b82f6",
  programme_valide: "#22c55e",
  valide: "#22c55e",
  publie: "#15803d",
  archive: "#4b5563",
  refuse: "#ef4444",
};

/** Règle 1 : vérifie les prérequis avant de soumettre un brouillon en validation. */
export function getMissingFieldsForSubmission(
  texte: string | null,
  mediaUrls: string[],
  datePublication: string | null,
  reseau: string | null
): string[] {
  const missing: string[] = [];
  if (!texte?.trim() && mediaUrls.length === 0) missing.push("texte ou fichier média");
  if (!datePublication) missing.push("date de publication");
  if (!reseau) missing.push("réseau social");
  return missing;
}

export const RESEAU_COLORS: Record<string, string> = {
  instagram: "border-l-pink-500",
  facebook: "border-l-blue-600",
  linkedin: "border-l-blue-400",
  x: "border-l-gray-800",
  tiktok: "border-l-black",
};

export const RESEAU_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  x: "X",
  tiktok: "TikTok",
};

export async function fetchPosts(clientId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("client_id", clientId)
    .order("date_publication", { ascending: true });
  if (error) throw error;
  return data as Post[];
}

export async function createPost(post: Omit<Post, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("posts")
    .insert(post)
    .select()
    .single();
  if (error) throw error;
  return data as Post;
}

export async function updatePostStatus(postId: string, statut: string) {
  const { error } = await supabase
    .from("posts")
    .update({ statut })
    .eq("id", postId);
  if (error) throw error;
}

export async function updatePost(postId: string, updates: Partial<Omit<Post, "id" | "created_at" | "updated_at">>) {
  const { error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", postId);
  if (error) throw error;
}

export async function deletePost(postId: string) {
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);
  if (error) throw error;
}

export async function uploadPostMedia(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("post-media")
    .upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("post-media").getPublicUrl(path);
  return data.publicUrl;
}

/** Upload multiple files and return their public URLs (parallel). */
export async function uploadPostMediaFiles(userId: string, files: File[]): Promise<string[]> {
  return Promise.all(files.map((f) => uploadPostMedia(userId, f)));
}
