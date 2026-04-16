import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CalendarClock, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function daysFromNow(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export default function AdminPlateforme() {
  const queryClient = useQueryClient();
  const [dateValue, setDateValue] = useState("");
  const [showCountdown, setShowCountdown] = useState(true);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-plateforme-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["launch_date", "show_countdown"]);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!settings) return;
    const launchRow = settings.find((r) => r.key === "launch_date");
    const showRow = settings.find((r) => r.key === "show_countdown");
    if (launchRow?.value) setDateValue(toDatetimeLocal(launchRow.value));
    if (showRow) setShowCountdown(showRow.value !== "false");
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async () => {
      const isoDate = new Date(dateValue).toISOString();
      const ops = [
        supabase.from("site_settings").upsert({ key: "launch_date", value: isoDate }, { onConflict: "key" }),
        supabase.from("site_settings").upsert({ key: "show_countdown", value: String(showCountdown) }, { onConflict: "key" }),
      ];
      const results = await Promise.all(ops);
      for (const { error } of results) {
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plateforme-settings"] });
      toast.success("Paramètres enregistrés.");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde."),
  });

  const currentLaunchDate = settings?.find((r) => r.key === "launch_date")?.value ?? "";
  const days = currentLaunchDate ? daysFromNow(currentLaunchDate) : null;
  const isPast = currentLaunchDate ? new Date(currentLaunchDate).getTime() < Date.now() : false;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Paramètres plateforme</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarClock className="h-5 w-5 text-primary" />
                Countdown de lancement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preview */}
              <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-sm font-sans">
                {isPast ? (
                  <span className="text-emerald-600 font-medium">Digal est lancé — date passée.</span>
                ) : days !== null ? (
                  <span>
                    Le countdown affiche{" "}
                    <span className="font-bold text-primary">{days} jour{days !== 1 ? "s" : ""}</span>
                    {" "}restant{days !== 1 ? "s" : ""} avec cette date.
                  </span>
                ) : (
                  <span className="text-muted-foreground">Aucune date configurée.</span>
                )}
              </div>

              {/* Date input */}
              <div className="space-y-2">
                <Label htmlFor="launch-date">Date et heure de lancement</Label>
                <Input
                  id="launch-date"
                  type="datetime-local"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                />
              </div>

              {/* Toggle show/hide */}
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {showCountdown ? (
                      <Eye className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    Afficher le countdown sur la landing
                  </div>
                  <p className="text-xs text-muted-foreground font-sans">
                    Si désactivé, le countdown est masqué même si la date n'est pas atteinte.
                  </p>
                </div>
                <Switch
                  checked={showCountdown}
                  onCheckedChange={setShowCountdown}
                />
              </div>

              {/* Save */}
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !dateValue}
                className="w-full sm:w-auto"
              >
                {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
