import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Check, X, Loader2, Inbox, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { fetchDropBoxFiles, validateDropBoxFile, rejectDropBoxFile, DropBoxFile } from "@/lib/drop-box";
import { useAuth } from "@/hooks/useAuth";

interface DropBoxReviewProps {
  clientId: string;
}

const STATUT_STYLES: Record<string, string> = {
  en_attente: "bg-amber-100 text-amber-700",
  valide: "bg-emerald-100 text-emerald-700",
  rejete: "bg-red-100 text-red-700",
};

export function DropBoxReview({ clientId }: DropBoxReviewProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<DropBoxFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFile, setActionFile] = useState<DropBoxFile | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const load = () => {
    if (!user) return;
    setLoading(true);
    fetchDropBoxFiles(clientId, user.id)
      .then(setFiles)
      .catch(() => toast.error("Erreur lors du chargement"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [clientId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleValidate = async (file: DropBoxFile) => {
    setProcessing(true);
    try {
      await validateDropBoxFile(file.id, file.uploaded_by);
      toast.success("Fichier validé — disponible dans la médiathèque");
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectOpen = (file: DropBoxFile) => {
    setActionFile(file);
    setRejectComment("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!actionFile) return;
    if (!rejectComment.trim()) { toast.error("Le commentaire est obligatoire"); return; }
    setProcessing(true);
    try {
      await rejectDropBoxFile(actionFile.id, actionFile.file_url, actionFile.uploaded_by, rejectComment.trim());
      toast.success("Fichier rejeté et supprimé");
      setRejectDialogOpen(false);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur");
    } finally {
      setProcessing(false);
    }
  };

  const pending = files.filter(f => f.statut === "en_attente");
  const reviewed = files.filter(f => f.statut !== "en_attente");

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending files */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Boîte de dépôt
            {pending.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700">{pending.length} en attente</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground font-sans py-6">
              Aucun fichier en attente de validation.
            </p>
          ) : (
            <div className="space-y-3">
              {pending.map((file) => (
                <div key={file.id} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate font-sans">{file.file_name}</p>
                      {file.description && (
                        <p className="text-xs text-muted-foreground font-sans">{file.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
                        Déposé le {new Date(file.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    {file.file_url && (
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gap-1 text-xs h-7"
                      onClick={() => handleValidate(file)}
                      disabled={processing}
                    >
                      <Check className="h-3 w-3" /> Valider
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1 text-xs h-7"
                      onClick={() => handleRejectOpen(file)}
                      disabled={processing}
                    >
                      <X className="h-3 w-3" /> Rejeter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validated files (mediatheque) */}
      {reviewed.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-sans text-muted-foreground">Historique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reviewed.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate font-sans">{file.file_name}</p>
                    {file.commentaire && (
                      <p className="text-[10px] text-muted-foreground font-sans">{file.commentaire}</p>
                    )}
                  </div>
                  {file.statut === "valide" && file.file_url && (
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  )}
                  <Badge className={`text-[10px] shrink-0 ${STATUT_STYLES[file.statut] ?? ""}`}>
                    {file.statut === "valide" ? "Validé" : "Rejeté"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rejeter le fichier</DialogTitle>
          </DialogHeader>
          <div>
            <Label className="font-sans">Commentaire obligatoire</Label>
            <Textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Expliquez la raison du rejet..."
              rows={3}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={processing}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectComment.trim()}>
              {processing && <Loader2 className="h-4 w-4 animate-spin" />} Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
