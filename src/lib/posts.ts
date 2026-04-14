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
  statut: string;
  assigne_a: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
}

export const POST_STATUTS = [
  { id: "idee", label: "Idée", color: "bg-muted text-muted-foreground" },
  { id: "en_production", label: "En production", color: "bg-blue-100 text-blue-700" },
  { id: "en_attente_validation", label: "En attente validation", color: "bg-orange-100 text-orange-700" },
  { id: "valide", label: "Validé", color: "bg-green-100 text-green-700" },
  { id: "publie", label: "Publié", color: "bg-purple-100 text-purple-700" },
  { id: "refuse", label: "Refusé", color: "bg-red-100 text-red-700" },
] as const;

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
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("post-media")
    .upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("post-media").getPublicUrl(path);
  return data.publicUrl;
}
