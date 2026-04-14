import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Link, Receipt, FileBarChart, Users } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Calendrier éditorial brandé",
    description: "Planifiez vos publications avec un calendrier visuel aux couleurs de votre agence. Drag & drop, filtres par client et vues semaine/mois.",
  },
  {
    icon: Link,
    title: "Lien de validation client",
    description: "Envoyez un lien unique à votre client pour approuver les publications. Un clic suffit — plus de screenshots WhatsApp.",
  },
  {
    icon: Receipt,
    title: "Facturation FCFA",
    description: "Créez et envoyez des factures professionnelles en francs CFA. Suivi des paiements et relances automatiques intégrés.",
  },
  {
    icon: FileBarChart,
    title: "Rapports KPI PDF",
    description: "Générez des rapports de performance élégants en PDF. Métriques d'engagement, croissance et ROI pour vos clients.",
  },
  {
    icon: Users,
    title: "Gestion d'équipe agence",
    description: "Invitez vos collaborateurs, assignez des clients et suivez la charge de travail. Permissions granulaires par rôle.",
  },
];

export function SolutionSection() {
  return (
    <section className="py-20 md:py-28" id="fonctionnalites">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Un workflow sans friction
          </h2>
          <p className="text-muted-foreground font-sans text-lg max-w-xl mx-auto">
            Chaque fonctionnalité est pensée pour le quotidien des Community Managers au Sénégal et en Afrique francophone.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <Card
              key={feature.title}
              className={`group border-border/50 ${i === features.length - 1 && features.length % 3 !== 0 ? "sm:col-span-2 lg:col-span-1" : ""}`}
            >
              <CardContent className="p-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold font-serif">{feature.title}</h3>
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
