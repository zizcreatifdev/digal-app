import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Facebook, Instagram, Linkedin, Music2, Twitter } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";

interface HeatmapViewProps {
  clientId: string;
  activeNetworks: string[];
}

interface LegendItem {
  label: string;
  className: string;
  style?: React.CSSProperties;
}

const NETWORK_CFG: Record<string, { label: string; Icon: LucideIcon }> = {
  instagram: { label: "Instagram", Icon: Instagram },
  facebook: { label: "Facebook", Icon: Facebook },
  linkedin: { label: "LinkedIn", Icon: Linkedin },
  x: { label: "X", Icon: Twitter },
  tiktok: { label: "TikTok", Icon: Music2 },
};

const LEGEND: LegendItem[] = [
  { label: "Low", className: "heatmap-cell-0 border border-border/60" },
  { label: "Medium", className: "", style: { background: "#FDBA74" } },
  { label: "High", className: "", style: { background: "#F97316" } },
  { label: "Saturé", className: "", style: { background: "#EA580C" } },
];

function toClass(nb: number): string {
  if (nb >= 3) return "heatmap-cell heatmap-cell-3";
  if (nb === 2) return "heatmap-cell heatmap-cell-2";
  if (nb === 1) return "heatmap-cell heatmap-cell-1";
  return "heatmap-cell heatmap-cell-0";
}

function buildDays(): string[] {
  const arr: string[] = [];
  for (let i = 29; i >= 0; i--) {
    arr.push(format(subDays(new Date(), i), "yyyy-MM-dd"));
  }
  return arr;
}

export function HeatmapView({ clientId, activeNetworks }: HeatmapViewProps) {
  const [heat, setHeat] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  const days = buildDays();
  const networks = activeNetworks.filter((n) => n in NETWORK_CFG);

  useEffect(() => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from("posts")
      .select("date_publication, reseau")
      .eq("client_id", clientId)
      .neq("statut", "archive")
      .gte("date_publication", subDays(new Date(), 29).toISOString())
      .then(({ data }) => {
        const map = new Map<string, number>();
        for (const p of data ?? []) {
          const day = p.date_publication?.slice(0, 10);
          if (!day || !p.reseau) continue;
          const key = `${p.reseau}::${day}`;
          map.set(key, (map.get(key) ?? 0) + 1);
        }
        setHeat(map);
        setLoading(false);
      });
  }, [clientId]);

  if (loading || networks.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-serif">Charge éditoriale</CardTitle>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {LEGEND.map(({ label, className, style }) => (
              <span key={label} className="flex items-center gap-1 text-xs text-muted-foreground font-sans">
                <span className={`inline-block w-3 h-3 rounded ${className}`} style={style} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Date column headers */}
            <div className="flex items-center mb-1">
              <div className="w-24 shrink-0" />
              <div className="flex gap-[3px]">
                {days.map((d) => (
                  <div key={d} className="w-8 text-center text-[9px] text-muted-foreground font-sans">
                    {format(new Date(d + "T12:00:00"), "d")}
                  </div>
                ))}
              </div>
            </div>

            {/* Network rows */}
            {networks.map((reseau) => {
              const { label, Icon } = NETWORK_CFG[reseau];
              return (
                <div key={reseau} className="flex items-center mb-[3px]">
                  <div className="w-24 shrink-0 flex items-center gap-1.5 pr-2">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-foreground/60" />
                    <span className="text-xs font-sans text-foreground/70 truncate">{label}</span>
                  </div>
                  <div className="flex gap-[3px]">
                    {days.map((d, colIdx) => {
                      const nb = heat.get(`${reseau}::${d}`) ?? 0;
                      const dateLabel = format(new Date(d + "T12:00:00"), "d MMMM yyyy", { locale: fr });
                      return (
                        <div
                          key={d}
                          className={toClass(nb)}
                          title={`${nb} post${nb !== 1 ? "s" : ""} · ${label} · ${dateLabel}`}
                          style={{ animationDelay: `${colIdx * 20}ms` }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
