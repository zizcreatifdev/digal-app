import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Eye } from "lucide-react";
import { logKpiAction } from "@/lib/activity-logs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  KpiMetriques,
  NETWORK_METRICS_CONFIG,
  saveKpiReport,
  fetchKpiReports,
} from "@/lib/kpi-reports";
import { generateKpiPdf } from "@/lib/kpi-pdf";
import { KpiReportPreviewModal } from "./KpiReportPreviewModal";
import type { KpiReportPreviewData } from "./KpiReportPreview";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  clientLogoUrl: string | null;
  activeNetworks: string[];
  onCreated: () => void;
}

type PeriodType = "mensuel" | "trimestriel" | "personnalise";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${q}`;
}

function generateMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("fr-FR", { month: "long", year: "numeric" });
    options.push({ value: ym, label });
  }
  return options;
}

function getPrevMonth(ym: string): string | null {
  if (!/^\d{4}-\d{2}$/.test(ym)) return null; // Only works for monthly format
  const [y, m] = ym.split("-").map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

function getMoisValue(periodType: PeriodType, mois: string, customDebut: string, customFin: string): string {
  if (periodType === "trimestriel") return getCurrentQuarter();
  if (periodType === "personnalise" && customDebut && customFin) return `${customDebut}/${customFin}`;
  return mois;
}

export function CreateKpiReportModal({
  open,
  onOpenChange,
  clientId,
  clientName,
  clientLogoUrl,
  activeNetworks,
  onCreated,
}: Props) {
  const { user } = useAuth();
  const [periodType, setPeriodType] = useState<PeriodType>("mensuel");
  const [mois, setMois] = useState(getCurrentMonth());
  const [customDateDebut, setCustomDateDebut] = useState("");
  const [customDateFin, setCustomDateFin] = useState("");
  const [metriques, setMetriques] = useState<KpiMetriques>({});
  const [pointsForts, setPointsForts] = useState("");
  const [axesAmelioration, setAxesAmelioration] = useState("");
  const [objectifs, setObjectifs] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<KpiReportPreviewData | null>(null);
  const [cmName, setCmName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("users")
      .select("prenom, nom")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data: profile }) => {
        setCmName(profile ? `${profile.prenom} ${profile.nom}` : user.email?.split("@")[0] ?? "CM");
      });
  }, [user]);

  const monthOptions = generateMonthOptions();

  const networkMap: Record<string, string> = {
    Instagram: "instagram",
    Facebook: "facebook",
    LinkedIn: "linkedin",
    "X (Twitter)": "x",
    TikTok: "tiktok",
  };

  const relevantNetworks = activeNetworks
    .map((n) => networkMap[n])
    .filter((k): k is string => !!k && !!NETWORK_METRICS_CONFIG[k]);

  const networksToShow = relevantNetworks.length > 0 ? relevantNetworks : Object.keys(NETWORK_METRICS_CONFIG);

  const updateMetric = (network: string, field: string, value: string) => {
    const num = value === "" ? undefined : parseInt(value);
    setMetriques((prev) => ({
      ...prev,
      [network]: {
        ...(prev[network as keyof KpiMetriques] ?? {}),
        [field]: num,
      },
    }));
  };

  const buildPreviewData = async (): Promise<KpiReportPreviewData> => {
    const effectiveMois = getMoisValue(periodType, mois, customDateDebut, customDateFin);
    const allReports = await fetchKpiReports(clientId);
    const prevMonth = getPrevMonth(effectiveMois);
    const previousReport = prevMonth ? (allReports.find((r) => r.mois === prevMonth) ?? null) : null;

    return {
      report: {
        id: "preview",
        user_id: user?.id ?? "",
        client_id: clientId,
        mois: effectiveMois,
        metriques,
        points_forts: pointsForts,
        axes_amelioration: axesAmelioration,
        objectifs,
        pdf_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      clientName,
      clientLogoUrl,
      cmName,
      previousReport,
    };
  };

  const handlePreview = async () => {
    const data = await buildPreviewData();
    setPreviewData(data);
    setShowPreview(true);
  };

  const handleDownloadFromPreview = async () => {
    if (!previewData) return;
    const pdf = await generateKpiPdf(
      previewData.report,
      previewData.clientName,
      previewData.clientLogoUrl,
      previewData.cmName,
      previewData.previousReport
    );
    pdf.save(`KPI-${clientName}-${previewData.report.mois}.pdf`);
  };

  const handleSaveAndDownload = async () => {
    if (!user) return;
    const effectiveMois = getMoisValue(periodType, mois, customDateDebut, customDateFin);
    if (periodType === "personnalise" && (!customDateDebut || !customDateFin)) {
      toast.error("Veuillez sélectionner une date de début et de fin");
      return;
    }
    setLoading(true);
    try {
      const data = await buildPreviewData();
      const reportId = await saveKpiReport({
        user_id: user.id,
        client_id: clientId,
        mois: effectiveMois,
        metriques,
        points_forts: pointsForts,
        axes_amelioration: axesAmelioration,
        objectifs,
      });

      const pdf = await generateKpiPdf(
        { ...data.report, id: reportId },
        clientName,
        clientLogoUrl,
        cmName,
        data.previousReport
      );

      pdf.save(`KPI-${clientName}-${effectiveMois}.pdf`);
      toast.success("Rapport KPI généré et téléchargé");
      logKpiAction(user.id, "Rapport KPI généré", `${clientName} · ${effectiveMois}`, reportId);
      onCreated();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Rapport KPI · {clientName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Period type selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Type de période</Label>
                <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensuel">Mensuel</SelectItem>
                    <SelectItem value="trimestriel">Trimestriel</SelectItem>
                    <SelectItem value="personnalise">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Monthly select */}
              {periodType === "mensuel" && (
                <div className="sm:col-span-2">
                  <Label>Mois</Label>
                  <Select value={mois} onValueChange={setMois}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Quarterly info */}
              {periodType === "trimestriel" && (
                <div className="sm:col-span-2 flex items-end">
                  <p className="text-sm text-muted-foreground font-sans pb-2">
                    Période : 3 derniers mois glissants ({getCurrentQuarter().replace("-Q", " · T")})
                  </p>
                </div>
              )}

              {/* Custom date pickers */}
              {periodType === "personnalise" && (
                <>
                  <div>
                    <Label>Date de début</Label>
                    <Input
                      type="date"
                      value={customDateDebut}
                      onChange={(e) => setCustomDateDebut(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Date de fin</Label>
                    <Input
                      type="date"
                      value={customDateFin}
                      min={customDateDebut}
                      onChange={(e) => setCustomDateFin(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </div>

            {networksToShow.map((netKey) => {
              const config = NETWORK_METRICS_CONFIG[netKey];
              if (!config) return null;

              return (
                <div key={netKey} className="space-y-2">
                  <h3 className="text-sm font-semibold font-serif text-primary">{config.label}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {config.fields.map((field) => (
                      <div key={field.key}>
                        <Label className="text-xs">{field.label}</Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder=""
                          value={(metriques[netKey as keyof KpiMetriques])?.[field.key] ?? ""}
                          onChange={(e) => updateMetric(netKey, field.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div>
              <Label>Points forts du mois</Label>
              <Textarea
                value={pointsForts}
                onChange={(e) => setPointsForts(e.target.value)}
                placeholder="Les points marquants de ce mois..."
                rows={3}
              />
            </div>
            <div>
              <Label>Axes d'amélioration</Label>
              <Textarea
                value={axesAmelioration}
                onChange={(e) => setAxesAmelioration(e.target.value)}
                placeholder="Ce qui peut être amélioré..."
                rows={3}
              />
            </div>
            <div>
              <Label>Objectifs mois prochain</Label>
              <Textarea
                value={objectifs}
                onChange={(e) => setObjectifs(e.target.value)}
                placeholder="Objectifs pour le mois suivant..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button variant="secondary" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-1" /> Aperçu
              </Button>
              <Button onClick={handleSaveAndDownload} disabled={loading}>
                <FileDown className="h-4 w-4 mr-1" />
                {loading ? "Génération..." : "Sauvegarder et télécharger"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {previewData && (
        <KpiReportPreviewModal
          open={showPreview}
          onOpenChange={setShowPreview}
          data={previewData}
          onDownload={handleDownloadFromPreview}
        />
      )}
    </>
  );
}
