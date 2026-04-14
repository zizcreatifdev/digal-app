import { Post, POST_STATUTS, RESEAU_COLORS, RESEAU_LABELS } from "@/lib/posts";
import { Badge } from "@/components/ui/badge";

interface PostCardProps {
  post: Post;
  compact?: boolean;
  onClick?: (post: Post) => void;
}

export function PostCard({ post, compact = false, onClick }: PostCardProps) {
  const statut = POST_STATUTS.find((s) => s.id === post.statut);
  const reseauColor = RESEAU_COLORS[post.reseau] ?? "border-l-gray-400";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(post);
  };

  if (compact) {
    return (
      <div
        className={`border-l-3 ${reseauColor} rounded-r-sm px-1.5 py-1 text-[10px] font-sans bg-card hover:shadow-sm transition-shadow cursor-pointer truncate`}
        onClick={handleClick}
      >
        <span className="font-medium">{post.format}</span>
        {statut && (
          <span className={`ml-1 inline-block rounded-full px-1 py-0 ${statut.color} text-[8px]`}>
            {statut.label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`border-l-4 ${reseauColor} rounded-lg p-3 bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
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
        {statut && (
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold font-sans ${statut.color}`}>
            {statut.label}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground font-sans">
          {new Date(post.date_publication).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
