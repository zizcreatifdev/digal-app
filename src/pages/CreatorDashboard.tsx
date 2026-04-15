import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useCallback, useMemo } from "react";
import { AssignedTask, fetchAssignedTasks, submitCreatorUpload } from "@/lib/creator-workflow";
import { POST_STATUTS, RESEAU_LABELS } from "@/lib/posts";
import { Loader2, Upload, Image, Video, AlertTriangle, CheckCircle, Inbox } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DropBoxUpload } from "@/components/creator/DropBoxUpload";

const CreatorDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchAssignedTasks(user.id);
      setTasks(data);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleUpload = async (task: AssignedTask, file: File) => {
    if (!user) return;
    setUploading(task.id);
    try {
      await submitCreatorUpload(task.id, user.id, file, task.user_id);
      toast.success("Fichier soumis pour validation");
      await loadTasks();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur lors de l'upload");
    } finally {
      setUploading(null);
    }
  };

  const pendingTasks = tasks.filter((t) => t.statut === "en_production" && !t.review_comment);
  const rejectedTasks = tasks.filter((t) => t.statut === "en_production" && t.review_comment);

  // Unique clients from assigned tasks (for Mode 2)
  const clientOptions = useMemo(() => {
    const seen = new Set<string>();
    return tasks.reduce<{ clientId: string; clientName: string; ownerId: string }[]>((acc, t) => {
      if (t.client_id && !seen.has(t.client_id)) {
        seen.add(t.client_id);
        acc.push({ clientId: t.client_id, clientName: t.client_nom ?? t.client_id, ownerId: t.user_id });
      }
      return acc;
    }, []);
  }, [tasks]);

  const [dropBoxClientId, setDropBoxClientId] = useState<string>("");
  const selectedClientOption = clientOptions.find(c => c.clientId === dropBoxClientId);

  return (
    <DashboardLayout pageTitle="Mes missions">
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes missions</h1>
          <p className="text-muted-foreground font-sans mt-1">
            Tâches assignées et boîte de dépôt
          </p>
        </div>

        <Tabs defaultValue="taches">
          <TabsList>
            <TabsTrigger value="taches" className="font-sans">
              Tâches assignées
              {(pendingTasks.length + rejectedTasks.length) > 0 && (
                <span className="ml-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                  {pendingTasks.length + rejectedTasks.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="depot" className="font-sans">
              <Inbox className="h-3.5 w-3.5 mr-1" /> Boîte de dépôt
            </TabsTrigger>
          </TabsList>

          {/* Mode 1 : Assigned tasks */}
          <TabsContent value="taches" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="h-12 w-12 text-success/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-sans">Aucune tâche en cours. Bravo !</p>
              </div>
            ) : (
              <div className="space-y-6">
                {rejectedTasks.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold font-sans text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      À refaire ({rejectedTasks.length})
                    </h2>
                    {rejectedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        uploading={uploading === task.id}
                        onUpload={(file) => handleUpload(task, file)}
                        isRejected
                      />
                    ))}
                  </div>
                )}
                {pendingTasks.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold font-sans text-muted-foreground">
                      À faire ({pendingTasks.length})
                    </h2>
                    {pendingTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        uploading={uploading === task.id}
                        onUpload={(file) => handleUpload(task, file)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Mode 2 : Drop box */}
          <TabsContent value="depot" className="mt-4">
            {clientOptions.length === 0 ? (
              <div className="text-center py-16">
                <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-sans text-sm">
                  Aucun client disponible. Le CM doit d'abord vous assigner une tâche.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-w-xs">
                  <Select value={dropBoxClientId} onValueChange={setDropBoxClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientOptions.map(c => (
                        <SelectItem key={c.clientId} value={c.clientId}>{c.clientName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {dropBoxClientId && selectedClientOption ? (
                  <DropBoxUpload
                    ownerId={selectedClientOption.ownerId}
                    clientId={selectedClientOption.clientId}
                    clientName={selectedClientOption.clientName}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground font-sans">Sélectionnez un client pour déposer un fichier.</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

function TaskCard({
  task,
  uploading,
  onUpload,
  isRejected = false,
}: {
  task: AssignedTask;
  uploading: boolean;
  onUpload: (file: File) => void;
  isRejected?: boolean;
}) {
  const statut = POST_STATUTS.find((s) => s.id === task.statut);

  return (
    <Card className={isRejected ? "border-destructive/30" : ""}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {task.client_nom && (
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-5 w-5 rounded flex items-center justify-center text-white text-[9px] font-bold font-serif"
                    style={{ backgroundColor: task.client_couleur || "hsl(var(--primary))" }}
                  >
                    {task.client_nom.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold font-sans">{task.client_nom}</span>
                </div>
              )}
              <Badge variant="secondary" className="text-[10px]">
                {RESEAU_LABELS[task.reseau] ?? task.reseau}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {task.format}
              </Badge>
              {statut && (
                <span className={`text-[10px] font-semibold font-sans px-2 py-0.5 rounded-full ${statut.color}`}>
                  {statut.label}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground font-sans">
              Publication : {format(new Date(task.date_publication), "EEEE d MMMM · HH:mm", { locale: fr })}
            </p>

            {/* Brief / texte */}
            {task.texte && (
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-[10px] text-muted-foreground font-sans mb-1 uppercase tracking-wider">Brief</p>
                <p className="text-sm font-sans">{task.texte}</p>
              </div>
            )}
            {task.hashtags && (
              <p className="text-xs text-primary font-sans">{task.hashtags}</p>
            )}

            {/* Reject comment */}
            {isRejected && task.review_comment && (
              <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/20">
                <p className="text-[10px] text-destructive font-sans font-semibold mb-1">Motif du rejet</p>
                <p className="text-sm font-sans text-foreground">{task.review_comment}</p>
              </div>
            )}
          </div>

          {/* Upload zone */}
          <div className="sm:w-48 shrink-0">
            {uploading ? (
              <div className="flex items-center justify-center h-full border-2 border-dashed border-primary/30 rounded-lg p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors h-full">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-sans text-center px-2">
                  {isRejected ? "Uploader une nouvelle version" : "Uploader le fichier"}
                </span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUpload(f);
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CreatorDashboard;
