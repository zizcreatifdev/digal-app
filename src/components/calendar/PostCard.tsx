import { useState } from "react";
import { Post, POST_STATUTS, RESEAU_LABELS, POST_STATUT_HEX, getMissingFieldsForSubmission, updatePostStatus } from "@/lib/posts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, SendHorizonal, Link2, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface PostCardProps {
  post: Post;
  compact?: boolean;
  onClick?: (post: Post) => void;
  onStatusChange?: (postId: string, newStatut: string) => void;
  onGenerateLink?: () => void;
}

export function PostCard({ post, compact = false, onClick, onStatusChange, onGenerateLink }: PostCardProps) {
  const [acting, setActing] = useState(false);
  const statut = POST_STATUTS.find((s) => s.id === post.statut);
  const borderColor = POST_STATUT_HEX[post.statut] ?? "#9ca3af";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(post);
  };

  const isPublie = post.statut === "publie";

  const missingForSubmission = post.statut === "brouillon"
    ? getMissingFieldsForSubmission(post.texte, post.media_urls ?? [], post.date_publication, post.reseau)
    : [];
  const canSubmit = missingForSubmission.length === 0;

  const handleSubmitForValidation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActing(true);
    try {
      await updatePostStatus(post.id, "en_attente_validation");
      onStatusChange?.(post.id, "en_attente_validation");
      toast.success("Post soumis pour validation");
    } catch {
      toast.error("Erreur lors de la soumission");
    } finally {
      setActing(false);
    }
  };

  const handleMarkPublished = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActing(true);
    try {
      await updatePostStatus(post.id, "publie");
      onStatusChange?.(post.id, "publie");
      toast.success("Post marqué comme publié");
    } catch {
      toast.error("Erreur lors de la publication");
    } finally {
      setActing(false);
    }
  };

  const handleGenerateLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerateLink?.();
  };

  const ephemereTooltip = isPublie ? (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-0.5 cursor-default" style={{ color: "#E8511A" }}>
            <Clock className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[200px] text-center">
          Médias supprimés dans 24h · Texte et historique conservés
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : null;

  if (compact) {
    return (
      <div
        className="border-l-[3px] rounded-r-sm px-1.5 py-1 text-[10px] font-sans bg-card hover:shadow-sm transition-shadow cursor-pointer truncate"
        style={{ borderLeftColor: borderColor }}
        onClick={handleClick}
      >
        <span className="font-medium">{post.format}</span>
        {statut && (
          <span className={`ml-1 inline-block rounded-full px-1 py-0 ${statut.color} text-[8px]`}>
            {statut.label}
          </span>
        )}
        {ephemereTooltip}
      </div>
    );
  }

  return (
    <div
      className="border-l-4 rounded-lg p-3 bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      style={{ borderLeftColor: borderColor }}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {RESEAU_LABELS[post.reseau] ?? post.reseau}
        </Badge>
        <span className="text-[10px] text-muted-foreground font-sans">{post.format}</span>
      </div>
      {post.texte && (
        <p className="text-xs font-sans text-foreground line-clamp-2 mt-1">{post.texte}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          {statut && (
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold font-sans ${statut.color}`}>
              {statut.label}
            </span>
          )}
          {ephemereTooltip}
        </div>
        <span className="text-[10px] text-muted-foreground font-sans">
          {new Date(post.date_publication).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Contextual action button */}
      {post.statut === "brouillon" && canSubmit && (
        <Button
          size="sm"
          variant="outline"
          className="w-full mt-2 h-7 text-[11px] font-sans"
          onClick={handleSubmitForValidation}
          disabled={acting}
        >
          <SendHorizonal className="h-3 w-3 mr-1" />
          Soumettre pour validation
        </Button>
      )}
      {post.statut === "en_attente_validation" && onGenerateLink && (
        <Button
          size="sm"
          variant="outline"
          className="w-full mt-2 h-7 text-[11px] font-sans border-orange-200 text-orange-700 hover:bg-orange-50"
          onClick={handleGenerateLink}
          disabled={acting}
        >
          <Link2 className="h-3 w-3 mr-1" />
          Générer le lien
        </Button>
      )}
      {post.statut === "lien_envoye" && (
        <p className="text-[10px] text-blue-600 font-sans mt-2 text-center font-medium">
          En attente du client
        </p>
      )}
      {post.statut === "programme_valide" && (
        <Button
          size="sm"
          className="w-full mt-2 h-7 text-[11px] font-sans bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={handleMarkPublished}
          disabled={acting}
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Marquer comme publié
        </Button>
      )}
    </div>
  );
}
