import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Save, Eye, Plus, Trash2, GripVertical } from "lucide-react";

interface GuideSection {
  id: string;
  titre: string;
  contenu: string;
}

interface GuideData {
  titre: string;
  sections: GuideSection[];
}

const emptyGuide: GuideData = { titre: "", sections: [{ id: crypto.randomUUID(), titre: "", contenu: "" }] };

function GuideEditor({ guideKey, label }: { guideKey: string; label: string }) {
  const { user } = useAuth();
  const [guide, setGuide] = useState<GuideData>(emptyGuide);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", guideKey)
        .maybeSingle();
      if (data?.value) {
        try { setGuide(JSON.parse(data.value)); } catch { /* keep empty */ }
      }
      setLoading(false);
    })();
  }, [guideKey]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const value = JSON.stringify(guide);
    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", guideKey)
      .maybeSingle();

    if (existing) {
      await supabase.from("site_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", guideKey);
    } else {
      await supabase.from("site_settings").insert({ key: guideKey, value, created_by: user.id });
    }
    setSaving(false);
    toast.success("Guide sauvegardé");
  };

  const addSection = () => {
    setGuide(g => ({ ...g, sections: [...g.sections, { id: crypto.randomUUID(), titre: "", contenu: "" }] }));
  };

  const removeSection = (id: string) => {
    setGuide(g => ({ ...g, sections: g.sections.filter(s => s.id !== id) }));
  };

  const updateSection = (id: string, field: "titre" | "contenu", value: string) => {
    setGuide(g => ({
      ...g,
      sections: g.sections.map(s => s.id === id ? { ...s, [field]: value } : s),
    }));
  };

  const previewUrl = guideKey === "guide_solo" ? "/docs/solo" : "/docs/agence";

  if (loading) return <p className="text-muted-foreground text-sm p-4">Chargement…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-serif">{label}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(previewUrl, "_blank")}>
            <Eye className="h-4 w-4 mr-1" /> Aperçu
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> {saving ? "Enregistrement…" : "Sauvegarder"}
          </Button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground">Titre du guide</label>
        <Input
          value={guide.titre}
          onChange={e => setGuide(g => ({ ...g, titre: e.target.value }))}
          placeholder="Ex : Guide de démarrage Solo"
          className="mt-1"
        />
      </div>

      <div className="space-y-4">
        {guide.sections.map((section, idx) => (
          <Card key={section.id} className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Section {idx + 1}</span>
                </div>
                {guide.sections.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSection(section.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <Input
                value={section.titre}
                onChange={e => updateSection(section.id, "titre", e.target.value)}
                placeholder="Titre de la section"
                className="font-semibold"
              />
            </CardHeader>
            <CardContent>
              <Textarea
                value={section.contenu}
                onChange={e => updateSection(section.id, "contenu", e.target.value)}
                placeholder="Contenu de la section (Markdown supporté)"
                rows={8}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addSection} className="w-full border-dashed">
        <Plus className="h-4 w-4 mr-1" /> Ajouter une section
      </Button>
    </div>
  );
}

export default function AdminGuides() {
  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold font-serif mb-6">Guides utilisateurs</h1>
        <Tabs defaultValue="solo">
          <TabsList>
            <TabsTrigger value="solo">Guide Solo</TabsTrigger>
            <TabsTrigger value="agence">Guide Agence</TabsTrigger>
          </TabsList>
          <TabsContent value="solo" className="mt-4">
            <GuideEditor guideKey="guide_solo" label="Guide Solo" />
          </TabsContent>
          <TabsContent value="agence" className="mt-4">
            <GuideEditor guideKey="guide_agence" label="Guide Agence" />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
