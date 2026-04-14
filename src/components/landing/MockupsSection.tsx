import { motion } from "framer-motion";
import { CheckCircle, BarChart3, FileText, Calendar, Users } from "lucide-react";

const FEATURES = [
  {
    title: "Calendrier éditorial",
    description: "Planifiez et visualisez tous vos posts par client sur une interface claire et intuitive.",
    icon: Calendar,
    color: "bg-blue-50 border-blue-100",
    iconColor: "text-blue-500",
    mockup: (
      <div className="space-y-1.5 p-3">
        {["Lun", "Mar", "Mer", "Jeu", "Ven"].map((day, i) => (
          <div key={day} className="flex items-center gap-2">
            <span className="text-[9px] text-gray-400 w-6 font-sans">{day}</span>
            {[0, 1, 2].map((j) => (
              <div
                key={j}
                className="h-5 rounded flex-1 text-[8px] flex items-center px-1.5 font-sans font-medium"
                style={{
                  backgroundColor: [(i + j) % 3 === 0 ? "#C4522A20" : (i + j) % 3 === 1 ? "#3b82f620" : "#10b98120"][(i + j) % 3],
                  color: [(i + j) % 3 === 0 ? "#C4522A" : (i + j) % 3 === 1 ? "#3b82f6" : "#10b981"][(i + j) % 3],
                  opacity: j === 2 && i > 2 ? 0 : 1,
                }}
              >
                {j === 2 && i > 2 ? "" : ["IG", "FB", "TK"][j]}
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Validation client",
    description: "Le client valide ou refuse chaque post depuis un lien sécurisé, sans créer de compte.",
    icon: CheckCircle,
    color: "bg-emerald-50 border-emerald-100",
    iconColor: "text-emerald-500",
    mockup: (
      <div className="p-3 space-y-2">
        {[
          { label: "Post Instagram — Lundi 14 avr.", status: "✅ Validé", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          { label: "Post Facebook — Mardi 15 avr.", status: "❌ Refusé", cls: "bg-red-50 text-red-700 border-red-100" },
          { label: "Post TikTok — Mercredi 16 avr.", status: "⏳ En attente", cls: "bg-amber-50 text-amber-700 border-amber-100" },
        ].map((row) => (
          <div key={row.label} className={`rounded-lg border px-2 py-1.5 ${row.cls}`}>
            <p className="text-[9px] font-sans font-medium">{row.label}</p>
            <p className="text-[8px] font-sans mt-0.5">{row.status}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Rapports KPI",
    description: "Générez des rapports de performance professionnels en PDF pour chaque client.",
    icon: BarChart3,
    color: "bg-purple-50 border-purple-100",
    iconColor: "text-purple-500",
    mockup: (
      <div className="p-3 space-y-2">
        <div className="flex items-end gap-1 h-16">
          {[35, 60, 45, 80, 55, 70, 90].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{ height: `${h}%`, backgroundColor: i === 6 ? "#C4522A" : "#C4522A40" }}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1">
          {[{ l: "Portée", v: "12.4K" }, { l: "Engagement", v: "4.8%" }].map((kpi) => (
            <div key={kpi.l} className="bg-white rounded border border-gray-100 px-2 py-1 text-center">
              <p className="text-[10px] font-bold font-serif text-gray-900">{kpi.v}</p>
              <p className="text-[8px] text-gray-400 font-sans">{kpi.l}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Facturation FCFA",
    description: "Devis et factures professionnels avec BRS, TVA, Wave et Orange Money intégrés.",
    icon: FileText,
    color: "bg-orange-50 border-orange-100",
    iconColor: "text-orange-500",
    mockup: (
      <div className="p-3 space-y-1.5 font-sans">
        <div className="flex justify-between text-[9px] text-gray-500 border-b border-gray-100 pb-1">
          <span>Prestation</span><span>Montant</span>
        </div>
        {[
          ["Community management", "150 000"],
          ["Boost publicitaire", "25 000"],
          ["BRS (5%)", "8 750"],
        ].map(([label, amount]) => (
          <div key={label} className="flex justify-between text-[9px]">
            <span className="text-gray-600">{label}</span>
            <span className="font-medium text-gray-900">{amount} F</span>
          </div>
        ))}
        <div className="flex justify-between text-[10px] font-bold text-[#C4522A] border-t border-gray-100 pt-1">
          <span>Total</span><span>183 750 FCFA</span>
        </div>
      </div>
    ),
  },
];

export function MockupsSection() {
  return (
    <section id="fonctionnalites" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4">
            Tout ce dont vous avez besoin,{" "}
            <span className="text-primary">au même endroit</span>
          </h2>
          <p className="text-muted-foreground font-sans max-w-xl mx-auto">
            De la planification à la facturation — Digal couvre l'intégralité de votre workflow éditorial.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`rounded-2xl border ${feat.color} overflow-hidden`}
            >
              {/* Mockup preview */}
              <div className="bg-white/70 border-b border-inherit">
                {feat.mockup}
              </div>
              {/* Feature info */}
              <div className="p-4">
                <div className={`inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white mb-3`}>
                  <feat.icon className={`h-4 w-4 ${feat.iconColor}`} />
                </div>
                <h3 className="font-bold font-serif text-sm text-foreground mb-1">{feat.title}</h3>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">{feat.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 bg-white border border-border rounded-full px-6 py-3 shadow-sm">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-sans text-foreground">
              Conçu pour les CM sénégalais — <span className="font-semibold text-primary">100% en FCFA</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
