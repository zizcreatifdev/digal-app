import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateKpiReportModal } from "@/components/kpi/CreateKpiReportModal";
import { FileText, Plus, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { KpiReportPreviewModal } from "@/components/kpi/KpiReportPreviewModal";
import type { KpiReportPreviewData } from "@/components/kpi/KpiReportPreview";
import { generateKpiPdf } from "@/lib/kpi-pdf";
import type { KpiReport } from "@/lib/kpi-reports";

function getPrevMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

const KpiReportsPage = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<{ id: string; nom: string; logo_url: string | null }[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [reports, setReports] = useState<KpiReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<KpiReportPreviewData | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("clients")
      .select("id, nom, logo_url")
      .eq("user_id", user.id)
      .eq("statut", "actif")
      .order("nom")
      .then(({ data }) => {
        setClients(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const refreshReports = () => {
    if (!selectedClient || !user) return;
    supabase
      .from("kpi_reports")
      .select("*")
      .eq("client_id", selectedClient)
      .eq("user_id", user.id)
      .order("mois", { ascending: false })
      .then(({ data }) => setReports(data ?? []));
  };

  useEffect(() => {
    refreshReports();
  }, [selectedClient, user]);

  const selectedClientData = clients.find((c) => c.id === selectedClient);
  const cmName = user?.email?.split("@")[0] ?? "CM";

  const handlePreview = (report: KpiReport) => {
    const prevMonth = getPrevMonth(report.mois);
    const prevReport = reports.find((r) => r.mois === prevMonth) ?? null;
    setPreviewData({
      report,
      clientName: selectedClientData?.nom ?? "",
      clientLogoUrl: selectedClientData?.logo_url ?? null,
      cmName,
      previousReport: prevReport,
    });
    setPreviewOpen(true);
  };

  const handleDownload = () => {
    if (!previewData) return;
    const pdf = generateKpiPdf(
      previewData.report,
      previewData.clientName,
      previewData.clientLogoUrl,
      previewData.cmName,
      previewData.previousReport
    );
    pdf.save(`KPI-${previewData.clientName}-${previewData.report.mois}.pdf`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-serif">Rapports KPI</h1>
            <p className="text-muted-foreground text-sm">Générez des rapports de performance pour vos clients</p>
          </div>
          <div className="flex gap-2">
            {selectedClient && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" /> Nouveau rapport
              </Button>
            )}
          </div>
        </div>

        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Sélectionner un client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!selectedClient ? (
          <div className="text-center py-16 text-muted-foreground">
            Sélectionnez un client pour voir ses rapports KPI.
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Aucun rapport pour ce client. Créez votre premier rapport.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((r) => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{r.mois}</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Créé le {format(new Date(r.created_at), "d MMMM yyyy", { locale: fr })}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePreview(r)}>
                      <Eye className="h-3 w-3 mr-1" /> Aperçu
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      handlePreview(r);
                      setTimeout(handleDownload, 100);
                    }}>
                      <Download className="h-3 w-3 mr-1" /> PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedClient && (
        <CreateKpiReportModal
          open={showCreate}
          onOpenChange={setShowCreate}
          clientId={selectedClient}
          clientName={selectedClientData?.nom ?? ""}
          clientLogoUrl={selectedClientData?.logo_url ?? null}
          activeNetworks={[]}
          onCreated={refreshReports}
        />
      )}

      {previewData && (
        <KpiReportPreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          data={previewData}
          onDownload={handleDownload}
        />
      )}
    </DashboardLayout>
  );
};

export default KpiReportsPage;
