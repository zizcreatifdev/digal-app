import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, Briefcase, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientCard } from "@/components/clients/ClientCard";
import { AddClientModal } from "@/components/clients/AddClientModal";
import { FreemiumLimitModal } from "@/components/FreemiumLimitModal";
import { useAuth } from "@/hooks/useAuth";
import { getAccountAccess } from "@/lib/account-access";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClients } from "@/lib/clients";

const FREEMIUM_CLIENT_LIMIT = 2;

const ClientsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [profile, setProfile] = useState<{ role?: string | null; plan?: string | null } | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [networkMap, setNetworkMap] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) { setProfileLoaded(true); return; }
    supabase
      .from("users")
      .select("role, plan")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) setProfile(data);
        setProfileLoaded(true);
      });
  }, [user]);

  const role = profile?.role ?? null;

  const { data: activeClients = [], isLoading: activeLoading } = useQuery({
    queryKey: ["clients", "actif", role],
    queryFn: () => fetchClients("actif", { role }),
    enabled: profileLoaded,
  });

  const { data: archivedClients = [], isLoading: archiveLoading } = useQuery({
    queryKey: ["clients", "archive", role],
    queryFn: () => fetchClients("archive", { role }),
    enabled: profileLoaded,
  });

  const loading = !profileLoaded || activeLoading || archiveLoading;

  // Fetch network map whenever the client lists change
  useEffect(() => {
    const allIds = [...activeClients, ...archivedClients].map((c) => c.id);
    if (allIds.length === 0) { setNetworkMap({}); return; }
    supabase
      .from("client_networks")
      .select("client_id, reseau")
      .in("client_id", allIds)
      .then(({ data: nets }) => {
        const map: Record<string, string[]> = {};
        (nets ?? []).forEach((n: { client_id: string; reseau: string }) => {
          if (!map[n.client_id]) map[n.client_id] = [];
          map[n.client_id].push(n.reseau);
        });
        setNetworkMap(map);
      });
  }, [activeClients, archivedClients]);

  const { isFreemium } = getAccountAccess(profile);
  const maxClients = isFreemium ? FREEMIUM_CLIENT_LIMIT : Infinity;

  const filteredActive = searchQuery
    ? activeClients.filter((c) => c.nom.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeClients;
  const filteredArchived = searchQuery
    ? archivedClients.filter((c) => c.nom.toLowerCase().includes(searchQuery.toLowerCase()))
    : archivedClients;

  const handleAddClick = () => {
    const isConfirmedFreemium = profile?.role === "freemium" && !profile?.plan;
    if (isConfirmedFreemium && activeClients.length >= maxClients) {
      setLimitModalOpen(true);
    } else {
      setModalOpen(true);
    }
  };

  return (
    <DashboardLayout pageTitle="Clients">
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground font-sans mt-1">
              {activeClients.length} client{activeClients.length !== 1 ? "s" : ""} actif{activeClients.length !== 1 ? "s" : ""}
              {profile && isFreemium && ` · ${maxClients} max`}
            </p>
          </div>
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4" />
            Ajouter un client
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="actifs">
          <TabsList>
            <TabsTrigger value="actifs" className="font-sans">
              Actifs
              <Badge variant="secondary" className="ml-2 text-[10px]">{activeClients.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="archives" className="font-sans">
              Archivés
              <Badge variant="outline" className="ml-2 text-[10px]">{archivedClients.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="actifs" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredActive.length === 0 && searchQuery ? (
              <div className="flex flex-col items-center justify-center h-60 gap-3">
                <Search className="w-12 h-12 text-muted-foreground/40" />
                <p className="text-muted-foreground font-sans">Aucun résultat pour &ldquo;{searchQuery}&rdquo;</p>
              </div>
            ) : activeClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 gap-3">
                <Briefcase className="w-12 h-12 text-muted-foreground/40" />
                <p className="text-muted-foreground font-sans">Aucun client pour le moment.</p>
                <Button onClick={handleAddClick}>
                  <Plus className="h-4 w-4" />
                  Ajouter votre premier client
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredActive.map((c) => (
                  <ClientCard key={c.id} client={c} networks={networkMap[c.id] ?? []} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archives" className="mt-4">
            {archiveLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredArchived.length === 0 && searchQuery ? (
              <div className="flex flex-col items-center justify-center h-60 gap-3">
                <Search className="w-12 h-12 text-muted-foreground/40" />
                <p className="text-muted-foreground font-sans">Aucun résultat pour &ldquo;{searchQuery}&rdquo;</p>
              </div>
            ) : archivedClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 gap-3">
                <Briefcase className="w-12 h-12 text-muted-foreground/40" />
                <p className="text-muted-foreground font-sans">Aucun client archivé.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredArchived.map((c) => (
                  <ClientCard key={c.id} client={c} networks={networkMap[c.id] ?? []} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AddClientModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["clients"] })}
      />

      <FreemiumLimitModal
        open={limitModalOpen}
        onOpenChange={setLimitModalOpen}
        description={`Les comptes Découverte sont limités à ${FREEMIUM_CLIENT_LIMIT} clients actifs. Activez une licence pour gérer des clients illimités.`}
      />
    </DashboardLayout>
  );
};

export default ClientsPage;
