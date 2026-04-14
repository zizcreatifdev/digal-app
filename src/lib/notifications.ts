import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  titre: string;
  message: string | null;
  type: string;
  lien: string | null;
  lu: boolean;
  created_at: string;
}

export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as Notification[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ lu: true })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ lu: true })
    .eq("user_id", userId)
    .eq("lu", false);
  if (error) throw error;
}

export async function createNotification(
  userId: string,
  titre: string,
  message: string,
  type: string = "info",
  lien?: string
) {
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      titre,
      message,
      type,
      lien: lien || null,
    });
  if (error) throw error;
}

export async function getUnreadCount(userId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("lu", false);
  if (error) return 0;
  return count ?? 0;
}
