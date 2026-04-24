import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Document, fetchDocuments } from "@/lib/facturation";
import { CreateDocumentModal } from "@/components/facturation/CreateDocumentModal";
import { DocumentList } from "@/components/facturation/DocumentList";
import { FreemiumLimitModal } from "@/components/FreemiumLimitModal";
import { getAccountAccess } from "@/lib/account-access";

export default function Facturation() {
  const { user } = useAuth();
  const location = useLocation();
  const [tab, setTab] = useState("devis");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [createType, setCreateType] = useState<"devis" | "facture" | null>(null);
  const [preselectedClientId, setPreselectedClientId] = useState<string | undefined>(undefined);
  const [profile, setProfile] = useState<{ role?: string | null; plan?: string | null } | null>(null);
  const [factureLimitOpen, setFactureLimitOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("users")
      .select("role, plan")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) setProfile(data);
      });
  }, [user]);

  const { isFreemium } = getAccountAccess(profile);

  // Auto-open create modal when navigated from client detail page
  useEffect(() => {
    const state = location.state as { clientId?: string; openCreate?: boolean } | null;
    if (state?.openCreate && state.clientId) {
      setPreselectedClientId(state.clientId);
      setCreateType("facture");
      setTab("factures");
    }
  }, [location.state]);

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

  if (isFreemium) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <h1 className="text-2xl font-serif font-bold">Facturation</h1>
          <Card>
            <CardContent className="py-16 flex flex-col items-center gap-4">
              <Lock className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground font-sans text-center">
                La facturation est disponible à partir du plan CM Pro.
              </p>
              <Button onClick={() => setFactureLimitOpen(true)}>Activer une licence</Button>
            </CardContent>
          </Card>
          <FreemiumLimitModal
            open={factureLimitOpen}
            onOpenChange={setFactureLimitOpen}
            title="Fonctionnalité CM Pro & Studio & Elite"
            description="La facturation est disponible à partir du plan CM Pro."
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold">Facturation</h1>
            <p className="text-muted-foreground text-sm font-sans">Gérez vos devis et factures clients.</p>
          </div>
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
          </TabsList>

          <TabsContent value="devis">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <DocumentList documents={devis} type="devis" onRefresh={load} />
            )}
          </TabsContent>

          <TabsContent value="factures">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <DocumentList documents={factures} type="facture" onRefresh={load} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {createType && (
        <CreateDocumentModal
          open={!!createType}
          onOpenChange={(open) => { if (!open) { setCreateType(null); setPreselectedClientId(undefined); } }}
          type={createType}
          preselectedClientId={preselectedClientId}
          onCreated={load}
        />
      )}
    </DashboardLayout>
  );
}
