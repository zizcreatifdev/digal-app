import { DashboardLayout } from "@/components/DashboardLayout";
import { EditorialCalendar } from "@/components/calendar/EditorialCalendar";
import { GeneratePreviewLinkModal } from "@/components/preview/GeneratePreviewLinkModal";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CalendarClient {
  id: string;
  nom: string;
  couleur_marque: string | null;
  logo_url: string | null;
  assigned_cm: string | null;
  preview_slug: string | null;
}

interface CmInfo { prenom: string; nom: string; avatar_url: string | null; }

const CalendarPage = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<CalendarClient[]>([]);
  const [networks, setNetworks] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileRole, setProfileRole] = useState<string | null | undefined>(undefined);
  const [cmInfo, setCmInfo] = useState<CmInfo | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfileRole(data?.role ?? null));
  }, [user]);

  useEffect(() => {
    if (!user || profileRole === undefined) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from("clients") as any)
      .select("id, nom, couleur_marque, logo_url, assigned_cm, preview_slug")
      .eq("statut", "actif")
      .order("nom");

    if (profileRole === "cm") {
      query = query.or(`user_id.eq.${user.id},assigned_cm.eq.${user.id}`);
    } else {
      query = query.eq("user_id", user.id);
    }

    query.then(({ data }: { data: CalendarClient[] | null }) => {
      const list = data ?? [];
      setClients(list);
      if (list.length > 0) setSelectedClient(list[0].id);
      setLoading(false);
    });
  }, [user, profileRole]);

  useEffect(() => {
    if (!selectedClient) return;
    const client = clients.find((c) => c.id === selectedClient);
    if (client?.assigned_cm) {
      supabase
        .from("users")
        .select("prenom, nom, avatar_url")
        .eq("user_id", client.assigned_cm)
        .maybeSingle()
        .then(({ data }) => setCmInfo(data ?? null));
    } else {
      setCmInfo(null);
    }
  }, [selectedClient, clients]);

  useEffect(() => {
    if (!selectedClient) return;
    supabase
      .from("client_networks")
      .select("reseau")
      .eq("client_id", selectedClient)
      .then(({ data }) => setNetworks((data ?? []).map((n) => n.reseau)));
  }, [selectedClient]);

  const selected = clients.find((c) => c.id === selectedClient);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-serif">Calendrier éditorial</h1>
            <p className="text-muted-foreground text-sm">Planifiez et gérez vos publications</p>
            {cmInfo && (
              <div className="flex items-center gap-1.5 mt-1">
                <Avatar className="h-5 w-5 shrink-0">
                  {cmInfo.avatar_url && <AvatarImage src={cmInfo.avatar_url} />}
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {cmInfo.prenom[0]}{cmInfo.nom[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground font-sans">
                  CM : {cmInfo.prenom} {cmInfo.nom}
                </span>
              </div>
            )}
          </div>
          {clients.length > 0 && (
            <div className="flex items-center gap-3">
              {selected && (
                selected.logo_url ? (
                  <img
                    src={selected.logo_url}
                    alt={selected.nom}
                    className="h-8 w-8 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: selected.couleur_marque ?? "hsl(var(--primary))" }}
                  >
                    {selected.nom.charAt(0).toUpperCase()}
                  </div>
                )
              )}
              <Select value={selectedClient ?? ""} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-[220px]">
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
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3">
            <CalendarDays className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground font-sans">Aucun client actif. Ajoutez un client pour accéder au calendrier.</p>
          </div>
        ) : selected ? (
          <>
            <EditorialCalendar
              clientId={selected.id}
              clientName={selected.nom}
              clientColor={selected.couleur_marque ?? "#C4522A"}
              activeNetworks={networks}
              onGenerateLink={() => setShowPreviewModal(true)}
            />
            <GeneratePreviewLinkModal
              open={showPreviewModal}
              onOpenChange={setShowPreviewModal}
              clientId={selected.id}
              clientName={selected.nom}
              clientSlug={selected.preview_slug}
            />
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
