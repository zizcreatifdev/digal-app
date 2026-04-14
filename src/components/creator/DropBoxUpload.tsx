import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, File, Check, X, Loader2, Inbox } from "lucide-react";
import { toast } from "sonner";
import { uploadDropBoxFile, fetchMyDropBoxFiles, DropBoxFile } from "@/lib/drop-box";

interface DropBoxUploadProps {
  ownerId: string;
  clientId: string;
  clientName: string;
}

const STATUT_LABELS: Record<string, string> = {
  en_attente: "En attente",
  valide: "Validé",
  rejete: "Rejeté",
};
const STATUT_STYLES: Record<string, string> = {
  en_attente: "bg-amber-100 text-amber-700",
  valide: "bg-emerald-100 text-emerald-700",
  rejete: "bg-red-100 text-red-700",
};

export function DropBoxUpload({ ownerId, clientId, clientName }: DropBoxUploadProps) {
  const [files, setFiles] = useState<DropBoxFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    fetchMyDropBoxFiles(clientId)
      .then(setFiles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) { toast.error("Sélectionnez un fichier"); return; }

    setUploading(true);
    setUploadProgress(10);
    try {
      // Simulate progress during upload
      const timer = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 15, 85));
      }, 300);

      await uploadDropBoxFile(ownerId, clientId, selectedFile, description);

      clearInterval(timer);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 800);

      toast.success("Fichier déposé — le CM sera notifié");
      setSelectedFile(null);
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh list
      fetchMyDropBoxFiles(clientId).then(setFiles).catch(() => {});
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur lors du dépôt");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Inbox className="h-4 w-4" /> Boîte de dépôt — {clientName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="font-sans">Fichier à déposer</Label>
            <div
              className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <File className="h-4 w-4 text-primary" />
                  <span className="font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground font-sans">Cliquez ou glissez un fichier ici</p>
                  <p className="text-xs text-muted-foreground font-sans">Image, vidéo, PDF</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div>
            <Label className="font-sans">Description (optionnel)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Expliquez le contenu du fichier..."
              rows={2}
              className="mt-1"
            />
          </div>

          {uploadProgress > 0 && (
            <Progress value={uploadProgress} className="h-1.5" />
          )}

          <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="w-full">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Envoi en cours..." : "Déposer le fichier"}
          </Button>
        </CardContent>
      </Card>

      {/* My uploads */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-sans text-muted-foreground">Mes dépôts précédents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : files.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground font-sans py-4">
              Aucun fichier déposé pour ce client.
            </p>
          ) : (
            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="mt-0.5 h-8 w-8 rounded bg-background border flex items-center justify-center shrink-0">
                    {f.statut === "valide" ? <Check className="h-4 w-4 text-emerald-600" /> : <File className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate font-sans">{f.file_name}</p>
                    {f.description && <p className="text-[10px] text-muted-foreground font-sans truncate">{f.description}</p>}
                    {f.commentaire && f.statut === "rejete" && (
                      <p className="text-[10px] text-red-600 font-sans mt-0.5">Motif : {f.commentaire}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
                      {new Date(f.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Badge className={`text-[10px] shrink-0 ${STATUT_STYLES[f.statut] ?? ""}`}>
                    {STATUT_LABELS[f.statut] ?? f.statut}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
