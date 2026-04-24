import { Client, RESEAUX } from "@/lib/clients";
import { CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface ClientCardProps {
  client: Client;
  networks: string[];
}

export function ClientCard({ client, networks }: ClientCardProps) {
  const navigate = useNavigate();

  return (
    <GlassCard
      className="cursor-pointer"
      onClick={() => navigate(`/dashboard/clients/${client.id}`)}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div
            className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: client.logo_url ? "transparent" : (client.couleur_marque || "hsl(var(--primary))") }}
          >
            {client.logo_url ? (
              <img src={client.logo_url} alt={client.nom} className="h-full w-full object-cover" />
            ) : (
              <span className="text-white font-bold font-serif text-sm">{client.nom.charAt(0).toUpperCase()}</span>
            )}
          </div>
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
