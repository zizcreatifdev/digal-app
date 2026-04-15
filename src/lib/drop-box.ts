import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "@/lib/notifications";
import { sendCreatorRejectionEmail } from "@/lib/emails";

export type DropBoxStatut = "en_attente" | "valide" | "rejete";

export interface DropBoxFile {
  id: string;
  user_id: string;
  client_id: string;
  uploaded_by: string;
  file_url: string;
  file_name: string;
  file_type: string | null;
  description: string | null;
  statut: DropBoxStatut;
  commentaire: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export async function fetchDropBoxFiles(clientId: string, ownerId: string): Promise<DropBoxFile[]> {
  const { data, error } = await supabase
    .from("drop_box_files")
    .select("*")
    .eq("client_id", clientId)
    .eq("user_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as DropBoxFile[];
}

export async function fetchMyDropBoxFiles(clientId: string): Promise<DropBoxFile[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("drop_box_files")
    .select("*")
    .eq("client_id", clientId)
    .eq("uploaded_by", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as DropBoxFile[];
}

export async function uploadDropBoxFile(
  ownerId: string,
  clientId: string,
  file: File,
  description: string
): Promise<DropBoxFile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const ext = file.name.split(".").pop();
  const path = `drop-box/${clientId}/${user.id}/${Date.now()}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from("post-media")
    .upload(path, file, { upsert: false });
  if (uploadErr) throw uploadErr;

  const { data: { publicUrl } } = supabase.storage.from("post-media").getPublicUrl(path);

  const { data, error } = await supabase
    .from("drop_box_files")
    .insert({
      user_id: ownerId,
      client_id: clientId,
      uploaded_by: user.id,
      file_url: publicUrl,
      file_name: file.name,
      file_type: file.type,
      description: description || null,
      statut: "en_attente",
    })
    .select()
    .single();
  if (error) throw error;

  // Notify the owner (DM/CM)
  try {
    await createNotification(
      ownerId,
      "Nouveau fichier en attente",
      `Un créateur a déposé un fichier dans la boîte de dépôt.`,
      "info",
      `/dashboard/clients/${clientId}`
    );
  } catch {
    // Silent fail: notification must not block the upload
  }

  return data as DropBoxFile;
}

export async function validateDropBoxFile(fileId: string, uploadedBy: string): Promise<void> {
  const { error } = await supabase
    .from("drop_box_files")
    .update({ statut: "valide", reviewed_at: new Date().toISOString() })
    .eq("id", fileId);
  if (error) throw error;

  try {
    await createNotification(
      uploadedBy,
      "Fichier validé",
      "Votre fichier a été validé et ajouté à la médiathèque du client.",
      "info"
    );
  } catch { /* silent */ }
}

export async function rejectDropBoxFile(
  fileId: string,
  fileUrl: string,
  uploadedBy: string,
  commentaire: string
): Promise<void> {
  // Delete file from storage
  try {
    const url = new URL(fileUrl);
    const parts = url.pathname.split("/object/public/post-media/");
    if (parts.length > 1) {
      await supabase.storage.from("post-media").remove([decodeURIComponent(parts[1])]);
    }
  } catch { /* silent: don't block rejection */ }

  const { error } = await supabase
    .from("drop_box_files")
    .update({
      statut: "rejete",
      commentaire,
      reviewed_at: new Date().toISOString(),
      file_url: "",  // Clear URL after deletion
    })
    .eq("id", fileId);
  if (error) throw error;

  try {
    await createNotification(
      uploadedBy,
      "Fichier rejeté",
      `Votre fichier a été rejeté : ${commentaire}`,
      "info"
    );
  } catch { /* silent */ }

  // Send rejection email (silent fail)
  try {
    const { data: profile } = await supabase
      .from("users")
      .select("email, prenom")
      .eq("user_id", uploadedBy)
      .single();
    if (profile?.email) {
      await sendCreatorRejectionEmail(profile.email, profile.prenom ?? "", commentaire);
    }
  } catch { /* silent */ }
}
