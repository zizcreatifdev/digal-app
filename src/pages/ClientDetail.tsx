import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Link2, BarChart3, Receipt, Archive, Loader2,
  Calendar, FolderOpen, Activity, Pencil, Lock, CheckCircle2,
  User, Briefcase, Mail, Phone, Users,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParams, useNavigate } from "react-router-dom";
import { EditorialCalendar } from "@/components/calendar/EditorialCalendar";
import { useRef, useState, useEffect } from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { GeneratePreviewLinkModal } from "@/components/preview/GeneratePreviewLinkModal";
import { CreateKpiReportModal } from "@/components/kpi/CreateKpiReportModal";
import { archiveClient, restoreClient, updateClientSlug, slugifyClientName, RESEAUX } from "@/lib/clients";
import type { Client } from "@/lib/clients";
import { EditClientModal } from "@/components/clients/EditClientModal";
import { ClientLogoButton } from "@/components/clients/ClientLogoButton";
import { DropBoxReview } from "@/components/clients/DropBoxReview";
import { PreviewLinksHistory } from "@/components/clients/PreviewLinksHistory";
import { FreemiumLimitModal } from "@/components/FreemiumLimitModal";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useClient, useClientNetworks } from "@/hooks/useClientQueries";

const FREEMIUM_ARCHIVE_LIMIT = 3;

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Server state (React Query) ─────────────────────────────────────
  const { data: client, isLoading: clientLoading, isError: clientError } = useClient(id);
  const { data: networks = [], isLoading: networksLoading } = useClientNetworks(id);
  const loading = clientLoading || networksLoading;

  // ── Local UI state ────────────────────────────────────────────────
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [archiveLimitModalOpen, setArchiveLimitModalOpen] = useState(false);
  const [factureLimitModalOpen, setFactureLimitModalOpen] = useState(false);
  const [savingSlug, setSavingSlug] = useState(false);
  const [profile, setProfile] = useState<{ role: string; plan: string | null } | null>(null);
  const [monthProgress, setMonthProgress] = useState<{ total: number; validated: number } | null>(null);

  // Contact form state
  const [contactEditing, setContactEditing] = useState(false);
  const [contactNom, setContactNom] = useState("");
  const [contactPoste, setContactPoste] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactTel, setContactTel] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  // Team state
  interface TeamMember { user_id: string; prenom: string; nom: string; avatar_url: string | null; role: string; }
  const [dmInfo, setDmInfo] = useState<TeamMember | null>(null);
  const [teamCms, setTeamCms] = useState<TeamMember[]>([]);
  const [teamCreators, setTeamCreators] = useState<TeamMember[]>([]);
  const [assignedCm, setAssignedCm] = useState<string>("");
  const [assignedCreator, setAssignedCreator] = useState<string>("");
  const [savingTeam, setSavingTeam] = useState(false);

  // Slug edit — initialized once per client id, not reset on logo/status updates
  const [slugEdit, setSlugEdit] = useState<string | null>(null);
  const prevClientIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (client && client.id !== prevClientIdRef.current) {
      prevClientIdRef.current = client.id;
      setSlugEdit(client.preview_slug ?? slugifyClientName(client.nom));
    }
  }, [client]);

  // Sync contact fields when client loads
  useEffect(() => {
    if (!client) return;
    setContactNom(client.contact_nom ?? "");
    setContactPoste(client.contact_poste ?? "");
    setContactEmail(client.contact_email ?? "");
    setContactTel(client.contact_telephone ?? "");
    setAssignedCm(client.assigned_cm ?? "");
    setAssignedCreator(client.assigned_creator ?? "");
  }, [client]);

  // Load team members for Équipe tab
  useEffect(() => {
    if (!client) return;
    (async () => {
      // Fetch the DM (owner of the client)
      const { data: dmData } = await supabase
        .from("users")
        .select("user_id, prenom, nom, avatar_url, role, agence_id")
        .eq("user_id", client.user_id)
        .maybeSingle();
      if (dmData) setDmInfo({ user_id: dmData.user_id, prenom: dmData.prenom, nom: dmData.nom, avatar_url: dmData.avatar_url, role: dmData.role });

      // Fetch team members via agence_id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const agenceId = (dmData as any)?.agence_id;
      if (!agenceId) return;
      const { data: members } = await supabase
        .from("users")
        .select("user_id, prenom, nom, avatar_url, role")
        .eq("agence_id", agenceId);
      const list = (members ?? []) as TeamMember[];
      setTeamCms(list.filter((m) => m.role === "cm"));
      setTeamCreators(list.filter((m) => m.role === "createur"));
    })();
  }, [client]);

  const handleSaveContacts = async () => {
    if (!client) return;
    setSavingContact(true);
    const { error } = await supabase
      .from("clients")
      .update({
        contact_nom: contactNom.trim() || null,
        contact_poste: contactPoste.trim() || null,
        contact_email: contactEmail.trim() || null,
        contact_telephone: contactTel.trim() || null,
      })
      .eq("id", client.id);
    setSavingContact(false);
    if (error) {
      toast.error("Erreur lors de l'enregistrement");
    } else {
      queryClient.invalidateQueries({ queryKey: ["client", client.id] });
      setContactEditing(false);
      toast.success("Contacts enregistrés");
    }
  };

  const handleSaveTeam = async () => {
    if (!client) return;
    setSavingTeam(true);
    const { error } = await supabase
      .from("clients")
      .update({
        assigned_cm: assignedCm === "none" ? null : assignedCm || null,
        assigned_creator: assignedCreator === "none" ? null : assignedCreator || null,
      })
      .eq("id", client.id);
    setSavingTeam(false);
    if (error) {
      toast.error("Erreur lors de l'assignation");
    } else {
      queryClient.invalidateQueries({ queryKey: ["client", client.id] });
      toast.success("Équipe assignée");
    }
  };

  // Profile fetch (for freemium check)
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

  // Monthly progress
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

  // Show toast on client fetch error
  useEffect(() => {
    if (clientError) toast.error("Client introuvable");
  }, [clientError]);

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
      queryClient.setQueryData<Client>(["client", id], (old) =>
        old ? { ...old, preview_slug: slugEdit.trim() || null } : old
      );
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
        const { data: profileData } = await supabase
          .from("users")
          .select("role, plan")
          .eq("user_id", user.id)
          .single();
        const isFreemiumCheck = profileData?.role === "freemium" && !profileData?.plan;
        if (isFreemiumCheck) {
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
        queryClient.setQueryData<Client>(["client", id], (old) =>
          old ? { ...old, statut: "archive" } : old
        );
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        toast.success("Client archivé");
      } else {
        await restoreClient(client.id);
        queryClient.setQueryData<Client>(["client", id], (old) =>
          old ? { ...old, statut: "actif" } : old
        );
        queryClient.invalidateQueries({ queryKey: ["clients"] });
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

  if (clientError || !client) {
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
            <ClientLogoButton
              client={client}
              size="lg"
              onLogoChange={(url) => {
                // Optimistic update — invalidation already triggered in ClientLogoButton
                queryClient.setQueryData<Client>(["client", id], (old) =>
                  old ? { ...old, logo_url: url } : old
                );
              }}
            />
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
            <TabsTrigger value="equipe" className="font-sans">
              <Users className="h-3.5 w-3.5 mr-1" /> Équipe
            </TabsTrigger>
            <TabsTrigger value="contacts" className="font-sans">
              <User className="h-3.5 w-3.5 mr-1" /> Contacts
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

          <TabsContent value="equipe" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-serif">Équipe assignée</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* DM row — automatic */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium font-sans w-36 shrink-0">Digital Manager</span>
                  {dmInfo ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Avatar className="h-7 w-7 shrink-0">
                        {dmInfo.avatar_url && <AvatarImage src={dmInfo.avatar_url} />}
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {dmInfo.prenom[0]}{dmInfo.nom[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-sans">{dmInfo.prenom} {dmInfo.nom}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground font-sans flex-1">—</span>
                  )}
                </div>

                {/* CM row */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium font-sans w-36 shrink-0">Community Manager</span>
                  <div className="flex items-center gap-2 flex-1">
                    {teamCms.length > 0 ? (
                      <Select value={assignedCm} onValueChange={setAssignedCm}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Sélectionner un CM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Aucun —</SelectItem>
                          {teamCms.map((m) => (
                            <SelectItem key={m.user_id} value={m.user_id}>
                              {m.prenom} {m.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-muted-foreground font-sans">Aucun CM dans votre équipe</span>
                    )}
                  </div>
                </div>

                {/* Creator row */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium font-sans w-36 shrink-0">Créateur</span>
                  <div className="flex items-center gap-2 flex-1">
                    {teamCreators.length > 0 ? (
                      <Select value={assignedCreator} onValueChange={setAssignedCreator}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Sélectionner un créateur (optionnel)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Aucun —</SelectItem>
                          {teamCreators.map((m) => (
                            <SelectItem key={m.user_id} value={m.user_id}>
                              {m.prenom} {m.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-muted-foreground font-sans">Aucun créateur dans votre équipe</span>
                    )}
                  </div>
                </div>

                <Button onClick={handleSaveTeam} disabled={savingTeam} size="sm">
                  {savingTeam && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  Assigner
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-serif">Contact principal</CardTitle>
              </CardHeader>
              <CardContent>
                {!contactEditing && (client.contact_nom || client.contact_email) ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {client.contact_nom && (
                        <div className="flex items-center gap-2 text-sm font-sans">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{client.contact_nom}</span>
                        </div>
                      )}
                      {client.contact_poste && (
                        <div className="flex items-center gap-2 text-sm font-sans">
                          <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{client.contact_poste}</span>
                        </div>
                      )}
                      {client.contact_email && (
                        <div className="flex items-center gap-2 text-sm font-sans">
                          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                          <a href={`mailto:${client.contact_email}`} className="text-primary hover:underline">
                            {client.contact_email}
                          </a>
                        </div>
                      )}
                      {client.contact_telephone && (
                        <div className="flex items-center gap-2 text-sm font-sans">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <a href={`tel:${client.contact_telephone}`} className="hover:underline">
                            {client.contact_telephone}
                          </a>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setContactEditing(true)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Modifier
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-md">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="font-sans text-sm">Nom du contact *</Label>
                        <Input
                          placeholder="Fatou Diallo"
                          value={contactNom}
                          onChange={(e) => setContactNom(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-sans text-sm">Poste</Label>
                        <Input
                          placeholder="Responsable Marketing"
                          value={contactPoste}
                          onChange={(e) => setContactPoste(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-sans text-sm">Email *</Label>
                      <Input
                        type="email"
                        placeholder="contact@exemple.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-sans text-sm">Téléphone *</Label>
                      <Input
                        type="tel"
                        placeholder="+221 77 000 00 00"
                        value={contactTel}
                        onChange={(e) => setContactTel(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={handleSaveContacts} disabled={savingContact}>
                        {savingContact ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                        Enregistrer les contacts
                      </Button>
                      {(client.contact_nom || client.contact_email) && (
                        <Button variant="ghost" size="sm" onClick={() => setContactEditing(false)}>
                          Annuler
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
        onSuccess={() => {}}
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
