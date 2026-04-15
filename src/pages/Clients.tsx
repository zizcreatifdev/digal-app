import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { fetchClients, Client } from "@/lib/clients";
import { supabase } from "@/integrations/supabase/client";
import { ClientCard } from "@/components/clients/ClientCard";
import { AddClientModal } from "@/components/clients/AddClientModal";
import { FreemiumLimitModal } from "@/components/FreemiumLimitModal";
import { useAuth } from "@/hooks/useAuth";
import { getAccountAccess } from "@/lib/account-access";

const FREEMIUM_CLIENT_LIMIT = 2;

const ClientsPage = () => {
  const { user } = useAuth();
  const [activeClients, setActiveClients] = useState<Client[]>([]);
  const [archivedClients, setArchivedClients] = useState<Client[]>([]);
  const [networkMap, setNetworkMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [profile, setProfile] = useState<{ role?: string | null; plan?: string | null } | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    supabase
      .from("users")
      .select("role, plan")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
      if (!error) setProfile(data ?? null);
      setProfileLoaded(true);
    });
  }, [user]);

  const { isFreemium } = getAccountAccess(profile);
  const maxClients = isFreemium ? FREEMIUM_CLIENT_LIMIT : Infinity;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const role = profile?.role;
      const [active, archived] = await Promise.all([
        fetchClients("actif", { role }),
        fetchClients("archive", { role }),
      ]);
      setActiveClients(active);
      setArchivedClients(archived);

      const allIds = [...active, ...archived].map((c) => c.id);
      if (allIds.length > 0) {
        const { data: nets } = await supabase
          .from("client_networks")
          .select("client_id, reseau")
          .in("client_id", allIds);
        const map: Record<string, string[]> = {};
        (nets ?? []).forEach((n: { client_id: string; reseau: string }) => {
          if (!map[n.client_id]) map[n.client_id] = [];
          map[n.client_id].push(n.reseau);
        });
        setNetworkMap(map);
      }
    } catch {
      // silently fail, empty state shown
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddClick = () => {
    // Only block if the profile has finished loading AND user is confirmed freemium
    if (profileLoaded && isFreemium && activeClients.length >= maxClients) {
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
              {isFreemium && ` · ${maxClients} max`}
            </p>
          </div>
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4" />
            Ajouter un client
          </Button>
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
            ) : activeClients.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-sans">Aucun client pour le moment.</p>
                <Button className="mt-4" onClick={handleAddClick}>
                  <Plus className="h-4 w-4" />
                  Ajouter votre premier client
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeClients.map((c) => (
                  <ClientCard key={c.id} client={c} networks={networkMap[c.id] ?? []} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archives" className="mt-4">
            {archivedClients.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-sans">Aucun client archivé.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {archivedClients.map((c) => (
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
        onSuccess={loadData}
      />

      <FreemiumLimitModal
        open={limitModalOpen}
        onOpenChange={setLimitModalOpen}
        description={`Les comptes Freemium sont limités à ${FREEMIUM_CLIENT_LIMIT} clients actifs. Activez une licence pour gérer des clients illimités.`}
      />
    </DashboardLayout>
  );
};

export default ClientsPage;
