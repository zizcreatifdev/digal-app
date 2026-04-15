import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Link2, ExternalLink, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PreviewLink, fetchClientPreviewLinks, getPreviewUrl } from "@/lib/preview-links";

interface PreviewLinksHistoryProps {
  clientId: string;
}

function getLinkStatut(link: PreviewLink): "actif" | "expire" | "termine" {
  if (link.statut === "termine") return "termine";
  if (new Date(link.expires_at) < new Date()) return "expire";
  return "actif";
}

const STATUT_LABELS: Record<string, string> = {
  actif: "Actif",
  expire: "Expiré",
  termine: "Terminé",
};

const STATUT_STYLES: Record<string, string> = {
  actif: "bg-emerald-100 text-emerald-700",
  expire: "bg-gray-100 text-gray-600",
  termine: "bg-blue-100 text-blue-700",
};

export function PreviewLinksHistory({ clientId }: PreviewLinksHistoryProps) {
  const [links, setLinks] = useState<PreviewLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchClientPreviewLinks(clientId)
      .then(setLinks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Historique des liens de validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground font-sans text-center py-8">
            Aucun lien de validation généré pour ce client.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Historique des liens de validation
          <Badge variant="secondary" className="text-xs font-sans font-normal">
            {links.length} lien{links.length > 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {links.map((link) => {
            const statut = getLinkStatut(link);
            const periodDebut = format(new Date(link.periode_debut), "d MMM", { locale: fr });
            const periodFin = format(new Date(link.periode_fin), "d MMM yyyy", { locale: fr });
            const createdAt = format(new Date(link.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr });
            const expiresAt = format(new Date(link.expires_at), "d MMM yyyy 'à' HH:mm", { locale: fr });

            return (
              <div
                key={link.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium font-sans">
                      {periodDebut} → {periodFin}
                    </span>
                    <Badge className={`text-[10px] font-sans shrink-0 ${STATUT_STYLES[statut]}`}>
                      {STATUT_LABELS[statut]}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-sans">
                    Créé le {createdAt}
                  </p>
                  {statut !== "termine" && (
                    <p className="text-[11px] text-muted-foreground font-sans flex items-center gap-1">
                      <Clock className="h-3 w-3 shrink-0" />
                      {statut === "expire" ? "Expiré le" : "Expire le"} {expiresAt}
                    </p>
                  )}
                  {link.welcome_message && (
                    <p className="text-[11px] text-muted-foreground font-sans italic truncate">
                      « {link.welcome_message} »
                    </p>
                  )}
                </div>
                {statut === "actif" && (
                  <a
                    href={getPreviewUrl(link.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
