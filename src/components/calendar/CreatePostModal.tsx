import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RESEAUX } from "@/lib/clients";
import { logPostAction } from "@/lib/activity-logs";
import { createPost, uploadPostMedia } from "@/lib/posts";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Upload, Image, Video } from "lucide-react";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  activeNetworks: string[];
  defaultDate?: Date;
  onSuccess: () => void;
}

export function CreatePostModal({
  open, onOpenChange, clientId, activeNetworks, defaultDate, onSuccess,
}: CreatePostModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reseau, setReseau] = useState(activeNetworks[0] ?? "instagram");
  const [format, setFormat] = useState("");
  const [datePublication, setDatePublication] = useState(
    defaultDate ? defaultDate.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  );
  const [texte, setTexte] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const selectedReseau = RESEAUX.find((r) => r.id === reseau);
  const formats = selectedReseau?.formats ?? [];

  const resetForm = () => {
    setReseau(activeNetworks[0] ?? "instagram");
    setFormat("");
    setDatePublication(new Date().toISOString().slice(0, 16));
    setTexte("");
    setHashtags("");
    setMediaFile(null);
  };

  const handleSubmit = async () => {
    if (!user || !reseau || !format) {
      toast.error("Réseau et format sont requis");
      return;
    }

    setLoading(true);
    try {
      let mediaUrl: string | null = null;
      if (mediaFile) {
        mediaUrl = await uploadPostMedia(user.id, mediaFile);
      }

      await createPost({
        client_id: clientId,
        user_id: user.id,
        reseau,
        format,
        date_publication: new Date(datePublication).toISOString(),
        texte: texte || null,
        hashtags: hashtags || null,
        media_url: mediaUrl,
        statut: "en_production",
        assigne_a: null,
        review_comment: null,
      });

      toast.success("Post créé");
      logPostAction(user.id, "Post créé", `${reseau} — ${format}`);
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-sans">Réseau *</Label>
              <Select value={reseau} onValueChange={(v) => { setReseau(v); setFormat(""); }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {activeNetworks.map((id) => {
                    const r = RESEAUX.find((x) => x.id === id);
                    return r ? <SelectItem key={id} value={id}>{r.label}</SelectItem> : null;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-sans">Format *</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {formats.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="font-sans">Date & heure de publication</Label>
            <Input
              type="datetime-local"
              value={datePublication}
              onChange={(e) => setDatePublication(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-sans">Texte / légende</Label>
            <Textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              placeholder="Rédigez la légende du post..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-sans">Hashtags</Label>
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#digal #socialmedia #senegal"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-sans">Média</Label>
            <div className="mt-1">
              {mediaFile ? (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/50">
                  {mediaFile.type.startsWith("video") ? (
                    <Video className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Image className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-sans flex-1 truncate">{mediaFile.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => setMediaFile(null)}>
                    Supprimer
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-sans">
                    Cliquez pour uploader une image ou vidéo
                  </span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setMediaFile(f);
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !format}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Créer le post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
