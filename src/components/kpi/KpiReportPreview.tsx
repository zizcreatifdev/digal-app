import { NETWORK_METRICS_CONFIG, getFilledMetrics, type KpiMetriques, type KpiReport } from "@/lib/kpi-reports";
import { Instagram, Facebook, Linkedin, Twitter, Music2, TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KpiReportPreviewData {
  report: KpiReport;
  clientName: string;
  clientLogoUrl: string | null;
  cmName: string;
  cmLogoUrl?: string | null;
  previousReport?: KpiReport | null;
}

const NETWORK_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  x: Twitter,
  tiktok: Music2,
};

const NETWORK_COLORS: Record<string, string> = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  x: "#1DA1F2",
  tiktok: "#000000",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function getMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1);
  return d.toLocaleString("fr-FR", { month: "long", year: "numeric" });
}

export function KpiReportPreview({ data }: { data: KpiReportPreviewData }) {
  const { report, clientName, clientLogoUrl, cmName, cmLogoUrl, previousReport } = data;
  const metriques = report.metriques as KpiMetriques;
  const prevMetriques = previousReport?.metriques as KpiMetriques | undefined;

  return (
    <div className="bg-white rounded-lg shadow-sm border" style={{ fontFamily: "'Inter', sans-serif", color: "#1A1A1A" }}>
      {/* Header */}
      <div className="relative overflow-hidden rounded-t-lg" style={{ background: "linear-gradient(135deg, #C4522A 0%, #D4714A 100%)" }}>
        <div className="px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {clientLogoUrl ? (
              <img src={clientLogoUrl} alt={clientName} className="h-12 w-12 rounded-lg object-cover bg-white/20 p-1" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-xl">
                {clientName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{clientName}</h1>
              <p className="text-white/80 text-sm">Rapport de performance</p>
            </div>
          </div>
          <div className="text-right text-white">
            <p className="text-sm font-medium">{cmName}</p>
            <p className="text-xs text-white/70 capitalize">{getMonthLabel(report.mois)}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6 space-y-8">
        {/* Per-network metrics */}
        {Object.entries(NETWORK_METRICS_CONFIG).map(([netKey, config]) => {
          const netData = metriques[netKey as keyof KpiMetriques];
          const filled = getFilledMetrics(netData);
          if (filled.length === 0) return null;

          const Icon = NETWORK_ICONS[netKey] || Instagram;
          const color = NETWORK_COLORS[netKey] || "#C4522A";
          const prevNet = prevMetriques?.[netKey as keyof KpiMetriques];

          return (
            <div key={netKey}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                  <Icon className="h-4.5 w-4.5" style={{ color }} />
                </div>
                <h2 className="text-base font-bold" style={{ color }}>{config.label}</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filled.map((m) => {
                  const prevVal = prevNet?.[m.key] as number | undefined;
                  const diff = prevVal ? m.value - prevVal : undefined;
                  const pct = prevVal && prevVal !== 0 ? Math.round((diff! / prevVal) * 100) : undefined;

                  return (
                    <div key={m.key} className="rounded-xl border p-4" style={{ borderColor: `${color}20` }}>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{m.label}</p>
                      <p className="text-xl font-bold" style={{ color: "#1A1A1A" }}>{formatNumber(m.value)}</p>
                      {pct !== undefined && (
                        <div className="flex items-center gap-1 mt-1 text-xs">
                          {pct > 0 ? (
                            <TrendingUp className="h-3 w-3 text-emerald-600" />
                          ) : pct < 0 ? (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          ) : (
                            <Minus className="h-3 w-3 text-gray-400" />
                          )}
                          <span className={pct > 0 ? "text-emerald-600" : pct < 0 ? "text-red-500" : "text-gray-400"}>
                            {pct > 0 ? "+" : ""}{pct}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Text sections */}
        {[
          { title: "Points forts du mois", content: report.points_forts, emoji: "🏆" },
          { title: "Axes d'amélioration", content: report.axes_amelioration, emoji: "🎯" },
          { title: "Objectifs mois prochain", content: report.objectifs, emoji: "🚀" },
        ].map((section) => {
          if (!section.content?.trim()) return null;
          return (
            <div key={section.title}>
              <h3 className="text-sm font-bold text-[#C4522A] mb-2">{section.title}</h3>
              <div className="bg-[#FDF8F5] rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-8 py-4 border-t flex items-center justify-between">
        <p className="text-[10px] text-gray-400">
          Rapport généré par {cmName} via Digal
        </p>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-[#C4522A] flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">D</span>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">digal.sn</span>
        </div>
      </div>
    </div>
  );
}
