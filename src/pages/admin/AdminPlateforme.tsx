import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CalendarClock, Eye, EyeOff, Users2, MessageCircle, MessageSquare } from "lucide-react";
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

const TIER_KEYS = ["3", "5", "10", "20"];

export default function AdminPlateforme() {
  const queryClient = useQueryClient();
  const [dateValue, setDateValue] = useState("");
  const [showCountdown, setShowCountdown] = useState(true);
  // Referral settings
  const [referralEnabled, setReferralEnabled] = useState(true);
  const [tierValues, setTierValues] = useState<Record<string, string>>({ "3": "1", "5": "2", "10": "3", "20": "5" });
  const [waTemplate, setWaTemplate] = useState("Bonjour ! Je t'invite à essayer Digal, la plateforme pour les Community Managers et agences au Sénégal. Rejoins-moi ici : [Lien]");
  const [thanksMsg, setThanksMsg] = useState("Merci pour vos retours !\nVotre Community Manager va prendre en compte vos commentaires.");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-plateforme-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["launch_date", "show_countdown", "referral_enabled", "referral_tiers", "referral_whatsapp_template", "preview_thanks_message"]);
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

    const enabledRow = settings.find((r) => r.key === "referral_enabled");
    if (enabledRow) setReferralEnabled(enabledRow.value !== "false");

    const tiersRow = settings.find((r) => r.key === "referral_tiers");
    if (tiersRow?.value) {
      try {
        const parsed = JSON.parse(tiersRow.value) as Record<string, number>;
        setTierValues(Object.fromEntries(TIER_KEYS.map((k) => [k, String(parsed[k] ?? "")])));
      } catch { /* ignore */ }
    }

    const waRow = settings.find((r) => r.key === "referral_whatsapp_template");
    if (waRow?.value) setWaTemplate(waRow.value);

    const thanksRow = settings.find((r) => r.key === "preview_thanks_message");
    if (thanksRow?.value) setThanksMsg(thanksRow.value);
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

  const referralMutation = useMutation({
    mutationFn: async () => {
      const tiers = Object.fromEntries(
        TIER_KEYS.filter((k) => tierValues[k] && tierValues[k] !== "").map((k) => [k, parseInt(tierValues[k], 10)])
      );
      const ops = [
        supabase.from("site_settings").upsert({ key: "referral_enabled", value: String(referralEnabled) }, { onConflict: "key" }),
        supabase.from("site_settings").upsert({ key: "referral_tiers", value: JSON.stringify(tiers) }, { onConflict: "key" }),
        supabase.from("site_settings").upsert({ key: "referral_whatsapp_template", value: waTemplate }, { onConflict: "key" }),
      ];
      const results = await Promise.all(ops);
      for (const { error } of results) {
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plateforme-settings"] });
      toast.success("Paramètres parrainage enregistrés.");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde."),
  });

  const thanksMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "preview_thanks_message", value: thanksMsg }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plateforme-settings"] });
      toast.success("Message de remerciement enregistré.");
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
          <>
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

          {/* ── Paramètres parrainage ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users2 className="h-5 w-5 text-primary" />
                Système de parrainage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toggle activation */}
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Activer le parrainage</div>
                  <p className="text-xs text-muted-foreground font-sans">
                    Si désactivé, les liens de parrainage ne fonctionnent plus.
                  </p>
                </div>
                <Switch checked={referralEnabled} onCheckedChange={setReferralEnabled} />
              </div>

              {/* Paliers (tiers) */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Paliers de récompense</Label>
                <p className="text-xs text-muted-foreground font-sans">
                  Nombre de filleuls payants → mois offerts au parrain
                </p>
                <div className="space-y-2">
                  {TIER_KEYS.map((key) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm font-sans w-32 text-muted-foreground">
                        {key} filleul{parseInt(key) > 1 ? "s" : ""} payant{parseInt(key) > 1 ? "s" : ""}
                      </span>
                      <span className="text-sm text-muted-foreground">→</span>
                      <Input
                        type="number"
                        min="0"
                        className="h-8 w-24 text-xs"
                        placeholder="0"
                        value={tierValues[key] ?? ""}
                        onChange={(e) => setTierValues((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                      <span className="text-xs text-muted-foreground font-sans">mois</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp template */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  Modèle message WhatsApp
                </Label>
                <p className="text-xs text-muted-foreground font-sans">
                  Variables disponibles : [Prénom parrain], [Lien]
                </p>
                <Textarea
                  rows={4}
                  className="text-sm font-sans resize-none"
                  value={waTemplate}
                  onChange={(e) => setWaTemplate(e.target.value)}
                />
              </div>

              <Button
                onClick={() => referralMutation.mutate()}
                disabled={referralMutation.isPending}
                className="w-full sm:w-auto"
              >
                {referralMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer les paramètres parrainage
              </Button>
            </CardContent>
          </Card>
          {/* ── Message de remerciement preview ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
                Message après validation preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground font-sans">
                Affiché au client une fois qu'il a cliqué sur "Envoyer mes retours au CM".
              </p>
              <Textarea
                rows={4}
                className="text-sm font-sans resize-none"
                value={thanksMsg}
                onChange={(e) => setThanksMsg(e.target.value)}
              />
              <Button
                onClick={() => thanksMutation.mutate()}
                disabled={thanksMutation.isPending || !thanksMsg.trim()}
                className="w-full sm:w-auto"
              >
                {thanksMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer le message
              </Button>
            </CardContent>
          </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
