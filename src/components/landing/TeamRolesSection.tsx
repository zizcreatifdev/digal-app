import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Palette } from "lucide-react";

const roles = [
  {
    icon: Shield,
    title: "Digital Manager",
    description:
      "Supervise tous les clients, valide les contenus, génère les factures et les rapports KPI.",
  },
  {
    icon: Users,
    title: "Community Manager",
    description:
      "Gère son portefeuille clients, crée les posts, envoie les liens de validation.",
  },
  {
    icon: Palette,
    title: "Créateur de contenu",
    description:
      "Reçoit ses missions, dépose ses fichiers, voit le statut de ses livraisons.",
  },
] as const;

export function TeamRolesSection() {
  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Toute votre équipe dans un seul outil
          </h2>
          <p className="text-muted-foreground font-sans text-lg max-w-xl mx-auto">
            Chaque membre a son espace, ses missions, ses accès. Fini les groupes WhatsApp.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-10">
          {roles.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="group border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold font-serif">{title}</h3>
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                  {description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Badge variant="outline" className="px-4 py-1.5 text-xs font-sans border-primary/30 text-primary gap-2">
            <Shield className="h-3 w-3" />
            Disponible sur Studio et Elite
          </Badge>
        </div>
      </div>
    </section>
  );
}
