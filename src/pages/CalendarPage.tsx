import { DashboardLayout } from "@/components/DashboardLayout";
import { EditorialCalendar } from "@/components/calendar/EditorialCalendar";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CalendarPage = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<{ id: string; nom: string; couleur_marque: string | null }[]>([]);
  const [networks, setNetworks] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileRole, setProfileRole] = useState<string | null>(null);

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
      .select("id, nom, couleur_marque")
      .eq("statut", "actif")
      .order("nom");

    if (profileRole === "cm") {
      query = query.or(`user_id.eq.${user.id},assigned_cm.eq.${user.id}`);
    } else {
      query = query.eq("user_id", user.id);
    }

    query.then(({ data }: { data: { id: string; nom: string; couleur_marque: string | null }[] | null }) => {
      const list = data ?? [];
      setClients(list);
      if (list.length > 0) setSelectedClient(list[0].id);
      setLoading(false);
    });
  }, [user, profileRole]);

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
          </div>
          {clients.length > 0 && (
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
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Chargement...</p>
        ) : clients.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Aucun client actif. Ajoutez un client pour accéder au calendrier.</p>
          </div>
        ) : selected ? (
          <EditorialCalendar
            clientId={selected.id}
            clientName={selected.nom}
            clientColor={selected.couleur_marque ?? "#C4522A"}
            activeNetworks={networks}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
