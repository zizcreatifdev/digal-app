import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { fetchClients, Client } from "@/lib/clients";
import { supabase } from "@/integrations/supabase/client";
import { ClientCard } from "@/components/clients/ClientCard";
import { AddClientModal } from "@/components/clients/AddClientModal";
import { useAuth } from "@/hooks/useAuth";
import { getAccountAccess } from "@/lib/account-access";

const ClientsPage = () => {
  const { user } = useAuth();
  const [activeClients, setActiveClients] = useState<Client[]>([]);
  const [archivedClients, setArchivedClients] = useState<Client[]>([]);
  const [networkMap, setNetworkMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [profile, setProfile] = useState<{ role?: string | null; plan?: string | null } | null>(null);

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
      .then(({ data }) => setProfile(data ?? null));
  }, [user]);

  const { isFreemium } = getAccountAccess(profile);
  const maxClients = isFreemium ? 2 : Infinity;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [active, archived] = await Promise.all([
        fetchClients("actif"),
        fetchClients("archive"),
      ]);
      setActiveClients(active);
      setArchivedClients(archived);

      // Fetch networks for all clients
      const allIds = [...active, ...archived].map((c) => c.id);
      if (allIds.length > 0) {
        const { data: nets } = await supabase
          .from("client_networks")
          .select("client_id, reseau")
          .in("client_id", allIds);
        const map: Record<string, string[]> = {};
        (nets ?? []).forEach((n: any) => {
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
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const canAddClient = !isFreemium || activeClients.length < maxClients;

  return (
    <DashboardLayout pageTitle="Clients">
      <div className="animate-fade-in space-y-6">
        {/* Freemium banner */}
        {isFreemium && activeClients.length >= maxClients && (
          <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold font-sans">Limite atteinte — {maxClients}/{maxClients} clients actifs</p>
              <p className="text-xs text-muted-foreground font-sans">Passez en Solo Standard pour gérer des clients illimités.</p>
            </div>
            <Button size="sm">Passer en Solo</Button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground font-sans mt-1">
              {activeClients.length} client{activeClients.length !== 1 ? "s" : ""} actif{activeClients.length !== 1 ? "s" : ""}
              {isFreemium && ` · ${maxClients} max`}
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} disabled={!canAddClient}>
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
                <Button className="mt-4" onClick={() => setModalOpen(true)}>
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
    </DashboardLayout>
  );
};

export default ClientsPage;
