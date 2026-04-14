import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Sparkles, Zap, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ChangelogEntry {
  id: string;
  version: string;
  titre: string;
  description: string;
  type_version: string;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof Sparkles }> = {
  major: { label: "Majeure", color: "bg-primary text-primary-foreground", icon: Sparkles },
  minor: { label: "Mineure", color: "bg-amber-100 text-amber-800", icon: Zap },
  patch: { label: "Correctif", color: "bg-muted text-muted-foreground", icon: Bug },
};

export default function Changelog() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("changelog")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setEntries(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-bold">Changelog</h1>
            <p className="text-muted-foreground text-sm">Historique des mises à jour de Digal</p>
          </div>
          <Badge className="ml-auto bg-primary text-primary-foreground text-xs">v1.0.0</Badge>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Chargement...</p>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Sparkles className="h-10 w-10 mx-auto text-primary mb-4" />
              <h2 className="text-lg font-serif font-bold mb-2">v1.0.0 — Lancement MVP</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Première version de Digal : gestion de clients, calendrier éditorial, lien de prévisualisation,
                facturation FCFA, comptabilité, rapports KPI, journal d'activité, et notifications in-app.
              </p>
              <p className="text-xs text-muted-foreground mt-4">1er avril 2026</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const config = TYPE_CONFIG[entry.type_version] ?? TYPE_CONFIG.patch;
              const Icon = config.icon;
              return (
                <Card key={entry.id}>
                  <CardContent className="py-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-bold">{entry.version}</span>
                          <Badge className={config.color + " text-xs"}>{config.label}</Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(entry.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-sm mb-1">{entry.titre}</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{entry.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
