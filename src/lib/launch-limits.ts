import { supabase } from "@/integrations/supabase/client";

export async function getLaunchCounts(): Promise<{ cmProCount: number; studioCount: number }> {
  const [cmProResult, studioResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("plan", "solo_standard")
      .eq("statut", "actif")
      .gt("licence_expiration", new Date().toISOString()),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("plan", "agence_standard")
      .eq("statut", "actif")
      .gt("licence_expiration", new Date().toISOString()),
  ]);

  return {
    cmProCount: cmProResult.count ?? 0,
    studioCount: studioResult.count ?? 0,
  };
}
