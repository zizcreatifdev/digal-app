import { useState } from "react";
import { Client, RESEAUX } from "@/lib/clients";
import { CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { ClientLogoButton } from "@/components/clients/ClientLogoButton";
import { useNavigate } from "react-router-dom";

interface ClientCardProps {
  client: Client;
  networks: string[];
}

export function ClientCard({ client, networks }: ClientCardProps) {
  const navigate = useNavigate();
  // Local override so the avatar updates immediately after crop without waiting for a parent refetch
  const [logoUrl, setLogoUrl] = useState(client.logo_url);

  return (
    <GlassCard
      className="cursor-pointer animate-fade-in-up"
      onClick={() => navigate(`/dashboard/clients/${client.id}`)}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <ClientLogoButton
            client={{ ...client, logo_url: logoUrl }}
            size="sm"
            onLogoChange={setLogoUrl}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold font-serif truncate">{client.nom}</h3>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {networks.map((r) => {
                const info = RESEAUX.find((x) => x.id === r);
                return (
                  <Badge key={r} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {info?.label ?? r}
                  </Badge>
                );
              })}
              {networks.length === 0 && (
                <span className="text-xs text-muted-foreground font-sans">Aucun réseau</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground font-sans">
            {client.contact_nom || "Pas d'interlocuteur"}
          </span>
          <Badge
            variant={client.statut === "actif" ? "success" : "outline"}
            className="text-[10px]"
          >
            {client.statut === "actif" ? "Actif" : "Archivé"}
          </Badge>
        </div>
      </CardContent>
    </GlassCard>
  );
}
