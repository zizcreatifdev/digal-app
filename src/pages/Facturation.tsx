import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Document, fetchDocuments } from "@/lib/facturation";
import { CreateDocumentModal } from "@/components/facturation/CreateDocumentModal";
import { DocumentList } from "@/components/facturation/DocumentList";

export default function Facturation() {
  const { user } = useAuth();
  const [tab, setTab] = useState("devis");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [createType, setCreateType] = useState<"devis" | "facture" | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchDocuments(user.id);
      setDocuments(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const devis = documents.filter((d) => d.type === "devis");
  const factures = documents.filter((d) => d.type === "facture");

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold">Facturation</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreateType("devis")}>
              <Plus className="h-4 w-4 mr-1" /> Nouveau devis
            </Button>
            <Button onClick={() => setCreateType("facture")}>
              <Plus className="h-4 w-4 mr-1" /> Nouvelle facture
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="devis">Devis ({devis.length})</TabsTrigger>
            <TabsTrigger value="factures">Factures ({factures.length})</TabsTrigger>
            <TabsTrigger value="recurrent">Récurrent</TabsTrigger>
          </TabsList>

          <TabsContent value="devis">
            {loading ? (
              <p className="text-muted-foreground text-center py-12">Chargement...</p>
            ) : (
              <DocumentList documents={devis} type="devis" onRefresh={load} />
            )}
          </TabsContent>

          <TabsContent value="factures">
            {loading ? (
              <p className="text-muted-foreground text-center py-12">Chargement...</p>
            ) : (
              <DocumentList documents={factures} type="facture" onRefresh={load} />
            )}
          </TabsContent>

          <TabsContent value="recurrent">
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-serif font-semibold mb-2">Facturation récurrente</p>
              <p className="text-sm">Bientôt disponible : automatisez vos factures mensuelles.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {createType && (
        <CreateDocumentModal
          open={!!createType}
          onOpenChange={(open) => !open && setCreateType(null)}
          type={createType}
          onCreated={load}
        />
      )}
    </DashboardLayout>
  );
}
