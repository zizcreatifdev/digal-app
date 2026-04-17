import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Link2, BarChart3, Receipt, Archive, Loader2,
  Calendar, FolderOpen, Activity, Pencil, Lock, CheckCircle2,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { EditorialCalendar } from "@/components/calendar/EditorialCalendar";
import { useState, useEffect } from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { GeneratePreviewLinkModal } from "@/components/preview/GeneratePreviewLinkModal";
import { CreateKpiReportModal } from "@/components/kpi/CreateKpiReportModal";
import { fetchClient, fetchClientNetworks, archiveClient, restoreClient, updateClientSlug, slugifyClientName, Client, ClientNetwork, RESEAUX } from "@/lib/clients";
import { EditClientModal } from "@/components/clients/EditClientModal";
import { DropBoxReview } from "@/components/clients/DropBoxReview";
import { PreviewLinksHistory } from "@/components/clients/PreviewLinksHistory";
import { FreemiumLimitModal } from "@/components/FreemiumLimitModal";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

const FREEMIUM_ARCHIVE_LIMIT = 3;

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [networks, setNetworks] = useState<ClientNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [archiveLimitModalOpen, setArchiveLimitModalOpen] = useState(false);
  const [factureLimitModalOpen, setFactureLimitModalOpen] = useState(false);
  const [slugEdit, setSlugEdit] = useState<string | null>(null);
  const [savingSlug, setSavingSlug] = useState(false);
  const [profile, setProfile] = useState<{ role: string; plan: string | null } | null>(null);
  const [monthProgress, setMonthProgress] = useState<{ total: number; validated: number } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([fetchClient(id), fetchClientNetworks(id)])
      .then(([c, n]) => {
        setClient(c);
        setNetworks(n);
        setSlugEdit(c.preview_slug ?? slugifyClientName(c.nom));
      })
      .catch(() => toast.error("Client introuvable"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("users")
      .select("role, plan")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) setProfile(data);
      });
  }, [user]);

  useEffect(() => {
    if (!id) return;
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    supabase
      .from("posts")
      .select("statut")
      .eq("client_id", id)
      .gte("date_publication", start.toISOString())
      .lte("date_publication", end.toISOString())
      .then(({ data }) => {
        if (!data) return;
        const validated = data.filter((p) =>
          ["programme_valide", "publie"].includes(p.statut)
        ).length;
        setMonthProgress({ total: data.length, validated });
      });
  }, [id]);

  const isFreemium = profile?.role === "freemium" && !profile?.plan;

  const handleFactureClick = () => {
    if (isFreemium) {
      setFactureLimitModalOpen(true);
    } else {
      navigate("/dashboard/facturation", { state: { clientId: client?.id, openCreate: true } });
    }
  };

  const handleSaveSlug = async () => {
    if (!client || slugEdit === null) return;
    setSavingSlug(true);
    try {
      await updateClientSlug(client.id, slugEdit.trim());
      setClient({ ...client, preview_slug: slugEdit.trim() || null });
      toast.success("Slug mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour du slug");
    } finally {
      setSavingSlug(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!client || !user) return;
    try {
      if (client.statut === "actif") {
        // Freemium: check archived clients limit
        const { data: profile } = await supabase
          .from("users")
          .select("role, plan")
          .eq("user_id", user.id)
          .single();
        const isFreemium = profile?.role === "freemium" && !profile?.plan;
        if (isFreemium) {
          const { count } = await supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("statut", "archive");
          if ((count ?? 0) >= FREEMIUM_ARCHIVE_LIMIT) {
            setArchiveLimitModalOpen(true);
            return;
          }
        }
        await archiveClient(client.id);
        setClient({ ...client, statut: "archive" });
        toast.success("Client archivé");
      } else {
        await restoreClient(client.id);
        setClient({ ...client, statut: "actif" });
        toast.success("Client restauré");
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Client">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout pageTitle="Client">
        <div className="text-center py-24">
          <p className="text-muted-foreground font-sans">Client introuvable.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/clients")}>
            <ArrowLeft className="h-4 w-4" /> Retour aux clients
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle={client.nom}>
      <div className="animate-fade-in space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/clients")} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-1">
            <div
              className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold font-serif text-xl shrink-0"
              style={{ backgroundColor: client.couleur_marque }}
            >
              {client.nom.charAt(0).toUpperCase()}
            </div>
            {client.couleur_secondaire && (
              <div
                className="h-6 w-6 rounded-full border-2 border-background -ml-3 mt-8"
                style={{ backgroundColor: client.couleur_secondaire }}
                title={`Couleur secondaire : ${client.couleur_secondaire}`}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight truncate">{client.nom}</h1>
              <Badge variant={client.statut === "actif" ? "success" : "outline"}>
                {client.statut === "actif" ? "Actif" : "Archivé"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {networks.map((n) => {
                const info = RESEAUX.find((r) => r.id === n.reseau);
                return (
                  <Badge key={n.id} variant="secondary" className="text-[10px]">
                    {info?.label ?? n.reseau}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setPreviewModalOpen(true)}>
              <Link2 className="h-4 w-4" /> Lien validation
            </Button>
            <Button size="sm" variant="outline" onClick={() => setKpiModalOpen(true)}>
              <BarChart3 className="h-4 w-4" /> Rapport KPI
            </Button>
            <Button size="sm" variant="outline" onClick={handleFactureClick}>
              {isFreemium ? <Lock className="h-4 w-4" /> : <Receipt className="h-4 w-4" />} Facture
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditModalOpen(true)}>
              <Pencil className="h-4 w-4" /> Modifier
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={handleArchiveToggle}
            >
              <Archive className="h-4 w-4" />
              {client.statut === "actif" ? "Archiver" : "Restaurer"}
            </Button>
          </div>
        </div>

        {/* Progression du contenu — mois en cours */}
        {monthProgress !== null && monthProgress.total > 0 && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <p className="text-sm font-semibold font-sans">Contenu ce mois</p>
              </div>
              <span className="text-sm font-semibold font-mono text-primary">
                {monthProgress.validated}/{monthProgress.total}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((monthProgress.validated / monthProgress.total) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground font-sans">
              {monthProgress.validated} post{monthProgress.validated !== 1 ? "s" : ""} validé{monthProgress.validated !== 1 ? "s" : ""} sur {monthProgress.total} ce mois
            </p>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="calendrier">
          <TabsList>
            <TabsTrigger value="calendrier" className="font-sans">
              <Calendar className="h-3.5 w-3.5 mr-1" /> Calendrier
            </TabsTrigger>
            <TabsTrigger value="fichiers" className="font-sans">
              <FolderOpen className="h-3.5 w-3.5 mr-1" /> Fichiers
            </TabsTrigger>
            <TabsTrigger value="factures" className="font-sans">
              <Receipt className="h-3.5 w-3.5 mr-1" /> Factures
            </TabsTrigger>
            <TabsTrigger value="activite" className="font-sans">
              <Activity className="h-3.5 w-3.5 mr-1" /> Activité
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendrier" className="mt-4">
            <EditorialCalendar
              clientId={client.id}
              clientName={client.nom}
              clientColor={client.couleur_marque}
              activeNetworks={networks.map((n) => n.reseau)}
              onGenerateLink={() => setPreviewModalOpen(true)}
            />
          </TabsContent>

          <TabsContent value="fichiers" className="mt-4">
            <DropBoxReview clientId={client.id} />
          </TabsContent>

          <TabsContent value="factures" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Factures</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground font-sans text-center py-12">
                  La facturation sera bientôt disponible ici.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activite" className="mt-4">
            <PreviewLinksHistory clientId={client.id} />
          </TabsContent>
        </Tabs>

        {/* Contact info card */}
        {(client.contact_nom || client.contact_email) && (
          <Card>
            <CardHeader><CardTitle className="text-base">Interlocuteur</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-3 text-sm font-sans">
                {client.contact_nom && <div><span className="text-muted-foreground">Nom :</span> {client.contact_nom}</div>}
                {client.contact_email && <div><span className="text-muted-foreground">Email :</span> {client.contact_email}</div>}
                {client.contact_telephone && <div><span className="text-muted-foreground">Tél :</span> {client.contact_telephone}</div>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview slug card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              Slug du lien de validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono shrink-0">/preview/</span>
              <Input
                className="font-mono text-sm flex-1"
                value={slugEdit ?? ""}
                onChange={(e) => setSlugEdit(e.target.value.replace(/[^a-z0-9-]/g, "-").toLowerCase())}
                placeholder={slugifyClientName(client.nom)}
              />
              <Button size="sm" onClick={handleSaveSlug} disabled={savingSlug}>
                {savingSlug ? "..." : "Enregistrer"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground font-sans mt-2">
              Ce slug apparaîtra dans l'URL du lien de validation partagé avec le client.
            </p>
          </CardContent>
        </Card>
      </div>

      <GeneratePreviewLinkModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        clientId={client.id}
        clientName={client.nom}
        clientSlug={client.preview_slug}
      />

      <CreateKpiReportModal
        open={kpiModalOpen}
        onOpenChange={setKpiModalOpen}
        clientId={client.id}
        clientName={client.nom}
        clientLogoUrl={client.logo_url}
        activeNetworks={networks.map((n) => {
          const info = RESEAUX.find((r) => r.id === n.reseau);
          return info?.label ?? n.reseau;
        })}
        onCreated={() => {}}
      />

      <EditClientModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        client={client}
        networks={networks}
        onSuccess={() => {
          if (!id) return;
          Promise.all([fetchClient(id), fetchClientNetworks(id)])
            .then(([c, n]) => { setClient(c); setNetworks(n); })
            .catch(() => toast.error("Erreur lors du rechargement du client"));
        }}
      />

      <FreemiumLimitModal
        open={archiveLimitModalOpen}
        onOpenChange={setArchiveLimitModalOpen}
        description={`Les comptes Découverte peuvent archiver au maximum ${FREEMIUM_ARCHIVE_LIMIT} clients. Activez une licence pour archiver sans limite.`}
      />

      <FreemiumLimitModal
        open={factureLimitModalOpen}
        onOpenChange={setFactureLimitModalOpen}
        title="Fonctionnalité CM Pro & Studio & Elite"
        description="La facturation est disponible à partir du plan CM Pro."
      />
    </DashboardLayout>
  );
};

export default ClientDetail;
