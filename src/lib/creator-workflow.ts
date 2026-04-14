import { supabase } from "@/integrations/supabase/client";
import { Post, uploadPostMedia } from "@/lib/posts";
import { createNotification } from "@/lib/notifications";

export interface AssignedTask extends Post {
  client_nom?: string;
  client_couleur?: string;
}

/** Fetch posts assigned to a specific creator */
export async function fetchAssignedTasks(creatorUserId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("*, clients(nom, couleur_marque)")
    .eq("assigne_a", creatorUserId)
    .in("statut", ["en_production", "refuse"])
    .order("date_publication", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    ...p,
    client_nom: p.clients?.nom,
    client_couleur: p.clients?.couleur_marque,
  })) as AssignedTask[];
}

/** Creator uploads media for a post → status changes to en_attente_validation */
export async function submitCreatorUpload(
  postId: string,
  userId: string,
  file: File,
  cmUserId: string
) {
  const mediaUrl = await uploadPostMedia(userId, file);

  const { error } = await supabase
    .from("posts")
    .update({
      media_url: mediaUrl,
      statut: "en_attente_validation",
      review_comment: null,
    })
    .eq("id", postId);
  if (error) throw error;

  // Notify CM
  await createNotification(
    cmUserId,
    "Fichier uploadé par le créateur",
    `Un créateur a soumis un fichier pour validation.`,
    "task",
  );
}

/** CM validates creator upload → status to en_attente_validation (client) */
export async function validateCreatorUpload(postId: string, creatorUserId: string) {
  const { error } = await supabase
    .from("posts")
    .update({ statut: "en_attente_validation", review_comment: null })
    .eq("id", postId);
  if (error) throw error;

  await createNotification(
    creatorUserId,
    "Fichier validé par le CM",
    "Votre fichier a été approuvé et sera envoyé au client pour validation.",
    "success",
  );
}

/** CM rejects creator upload → delete media, status back to en_production */
export async function rejectCreatorUpload(
  postId: string,
  creatorUserId: string,
  comment: string,
  mediaUrl: string | null
) {
  // Delete media file from storage
  if (mediaUrl) {
    const path = mediaUrl.split("/post-media/")[1];
    if (path) {
      await supabase.storage.from("post-media").remove([path]);
    }
  }

  const { error } = await supabase
    .from("posts")
    .update({
      media_url: null,
      statut: "en_production",
      review_comment: comment,
    })
    .eq("id", postId);
  if (error) throw error;

  await createNotification(
    creatorUserId,
    "Fichier rejeté",
    `Votre fichier a été rejeté : "${comment}". Veuillez soumettre une nouvelle version.`,
    "warning",
  );
}

/** Fetch team members for an agency (DM view) */
export async function fetchTeamMembers(agenceId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("agence_id", agenceId);
  if (error) throw error;
  return data ?? [];
}

/** Get stats for a team member */
export async function getTeamMemberStats(userId: string) {
  const { data: assigned } = await supabase
    .from("posts")
    .select("id, statut")
    .eq("assigne_a", userId);

  const posts = assigned ?? [];
  const total = posts.length;
  const completed = posts.filter((p: any) => ["valide", "publie", "en_attente_validation"].includes(p.statut)).length;
  const rejected = posts.filter((p: any) => p.statut === "refuse").length;

  return { total, completed, rejected };
}
