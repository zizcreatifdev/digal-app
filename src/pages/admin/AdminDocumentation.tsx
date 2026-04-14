import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, Users, Building2, Shield, FileText, Zap } from "lucide-react";

const sections = [
  {
    titre: "Guides utilisateurs",
    description: "Les guides accessibles aux utilisateurs de la plateforme",
    icon: BookOpen,
    links: [
      { label: "Guide Solo", href: "/docs/solo", description: "Pour les CM indépendants" },
      { label: "Guide Agence", href: "/docs/agence", description: "Pour les agences et DM" },
    ],
  },
  {
    titre: "Gestion des comptes",
    description: "Comment les comptes sont structurés",
    icon: Users,
    items: [
      "4 types de rôles : Owner (admin), DM (Digital Manager agence), Solo (CM indépendant), Freemium",
      "Inscription par invitation uniquement via token",
      "Chaque compte est isolé : les clients/posts ne sont pas partagés entre comptes",
      "Le DM est le fondateur d'un compte agence et ne peut pas être retiré",
    ],
  },
  {
    titre: "Système de facturation",
    description: "Comment la facturation fonctionne",
    icon: FileText,
    items: [
      "Les documents (devis/factures) portent le logo et les infos du prestataire, pas de Digal",
      "BRS (1%) et TVA (18%) sont calculés automatiquement",
      "Conversion devis → facture en un clic",
      "Export PDF professionnel avec numérotation automatique",
    ],
  },
  {
    titre: "Formules & Tarifs",
    description: "Gestion des plans depuis l'admin",
    icon: Zap,
    items: [
      "Les plans sont gérés dans Admin > Formules & Tarifs",
      "Les modifications s'appliquent immédiatement sur toute la plateforme (landing, pricing, facturation owner)",
      "Possibilité d'activer des promotions avec prix réduit et badge promo",
      "4 formules : Freemium, Solo Standard, Agence Standard, Agence Pro",
    ],
  },
  {
    titre: "Sécurité",
    description: "Mesures de sécurité en place",
    icon: Shield,
    items: [
      "Authentification JWT avec Supabase Auth",
      "Row Level Security (RLS) sur toutes les tables",
      "Accès admin protégé par TOTP (code temporaire)",
      "Isolation des données entre comptes",
      "Logs de sécurité pour toutes les actions sensibles",
    ],
  },
  {
    titre: "Architecture agence",
    description: "Comment fonctionne le modèle agence",
    icon: Building2,
    items: [
      "Le DM crée le compte agence et invite ses CM",
      "Les CM voient uniquement les clients qui leur sont assignés",
      "La masse salariale permet de gérer les salaires de l'équipe",
      "Le DM a une vision globale de tous les clients et posts",
    ],
  },
];

export default function AdminDocumentation() {
  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-serif">Documentation</h1>
          <p className="text-muted-foreground font-sans mt-1">
            Documentation technique et fonctionnelle de la plateforme Digal
          </p>
        </div>

        <div className="grid gap-6">
          {sections.map((section) => (
            <Card key={section.titre}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <section.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-serif">{section.titre}</CardTitle>
                    <p className="text-sm text-muted-foreground font-sans">{section.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {section.links && (
                  <div className="flex flex-wrap gap-2">
                    {section.links.map((link) => (
                      <Button
                        key={link.href}
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(link.href, "_blank")}
                      >
                        {link.label}
                        <ExternalLink className="h-3 w-3 ml-1.5" />
                      </Button>
                    ))}
                  </div>
                )}
                {section.items && (
                  <ul className="space-y-2">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-sans text-foreground/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
