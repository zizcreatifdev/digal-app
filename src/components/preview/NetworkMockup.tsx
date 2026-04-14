import { Post, RESEAU_LABELS } from "@/lib/posts";
import { Heart, MessageCircle, Send, Bookmark, Share2, ThumbsUp, Repeat2, MoreHorizontal, Music, Globe, ImageIcon, Briefcase, BookOpen } from "lucide-react";

interface NetworkMockupProps {
  post: Post;
  clientName: string;
  clientColor?: string | null;
  clientLogo?: string | null;
}

const Avatar = ({ name, color, size = "sm", logo }: { name: string; color: string; size?: "sm" | "md"; logo?: string | null }) => {
  const sizeClass = size === "md" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
  if (logo) {
    return <img src={logo} alt={name} className={`${sizeClass} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
      style={{ backgroundColor: color }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

function InstagramMockup({ post, clientName, clientColor, clientLogo }: NetworkMockupProps) {
  const color = clientColor || "#E1306C";
  const handle = clientName.toLowerCase().replace(/\s+/g, "_");
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.08)] border border-gray-100">
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <div className="p-[2px] rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600">
          <div className="bg-white rounded-full p-[1.5px]">
            <Avatar name={clientName} color={color} logo={clientLogo} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-900 truncate">{handle}</p>
          <p className="text-[10px] text-gray-400">{post.format}</p>
        </div>
        <MoreHorizontal className="h-4 w-4 text-gray-400" />
      </div>

      <div className="aspect-square bg-gray-50 relative">
        {post.media_url ? (
          post.media_url.match(/\.(mp4|webm|mov)$/i) ? (
            <video src={post.media_url} className="w-full h-full object-cover" muted />
          ) : (
            <img src={post.media_url} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 gap-2">
            <ImageIcon className="h-10 w-10 text-pink-300/60" />
            <p className="text-[10px] text-gray-300 font-medium">Aperçu Instagram</p>
          </div>
        )}
      </div>

      <div className="px-3.5 py-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart className="h-[22px] w-[22px] text-gray-800 hover:text-red-500 transition-colors cursor-pointer" />
            <MessageCircle className="h-[22px] w-[22px] text-gray-800" />
            <Send className="h-[22px] w-[22px] text-gray-800 -rotate-12" />
          </div>
          <Bookmark className="h-[22px] w-[22px] text-gray-800" />
        </div>
        <p className="text-[11px] font-semibold text-gray-900">42 J'aime</p>
        {post.texte && (
          <p className="text-[12px] text-gray-800 leading-relaxed">
            <span className="font-semibold">{handle}</span>{" "}
            {post.texte.length > 120 ? post.texte.substring(0, 120) + "..." : post.texte}
          </p>
        )}
        {post.hashtags && (
          <p className="text-[11px] text-[#00376B] leading-relaxed">{post.hashtags}</p>
        )}
      </div>
    </div>
  );
}

function FacebookMockup({ post, clientName, clientColor, clientLogo }: NetworkMockupProps) {
  const color = clientColor || "#1877F2";
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.08)] border border-gray-100">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <Avatar name={clientName} color={color} size="md" logo={clientLogo} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-900">{clientName}</p>
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <span>1 j</span>
            <span>·</span>
            <Globe className="h-3 w-3 text-gray-400" />
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-gray-400" />
      </div>

      {post.texte && (
        <div className="px-4 pb-2.5">
          <p className="text-[13px] text-gray-900 leading-relaxed">{post.texte}</p>
          {post.hashtags && <p className="text-[13px] text-[#385898] mt-1">{post.hashtags}</p>}
        </div>
      )}

      <div className="aspect-[4/3] bg-gray-50 relative">
        {post.media_url ? (
          post.media_url.match(/\.(mp4|webm|mov)$/i) ? (
            <video src={post.media_url} className="w-full h-full object-cover" muted />
          ) : (
            <img src={post.media_url} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 gap-2">
            <BookOpen className="h-10 w-10 text-blue-300/60" />
            <p className="text-[10px] text-gray-300 font-medium">Aperçu Facebook</p>
          </div>
        )}
      </div>

      <div className="px-4 py-1.5 flex items-center justify-between text-[11px] text-gray-500 border-b border-gray-100">
        <div className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> <Heart className="h-3 w-3 text-red-400" /> 12</div>
        <span>3 commentaires</span>
      </div>
      <div className="px-2 py-1">
        <div className="flex items-center justify-around text-gray-600 text-[12px] font-medium">
          <button className="flex items-center gap-1.5 py-2 px-3 rounded-md hover:bg-gray-50 transition-colors">
            <ThumbsUp className="h-4 w-4" /> J'aime
          </button>
          <button className="flex items-center gap-1.5 py-2 px-3 rounded-md hover:bg-gray-50 transition-colors">
            <MessageCircle className="h-4 w-4" /> Commenter
          </button>
          <button className="flex items-center gap-1.5 py-2 px-3 rounded-md hover:bg-gray-50 transition-colors">
            <Share2 className="h-4 w-4" /> Partager
          </button>
        </div>
      </div>
    </div>
  );
}

function LinkedInMockup({ post, clientName, clientColor, clientLogo }: NetworkMockupProps) {
  const color = clientColor || "#0A66C2";
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.08)] border border-gray-100">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <Avatar name={clientName} color={color} size="md" logo={clientLogo} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-900">{clientName}</p>
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <span>Community Manager · 1 j ·</span>
            <Globe className="h-3 w-3 text-gray-400" />
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-gray-400" />
      </div>

      {post.texte && (
        <div className="px-4 pb-2.5">
          <p className="text-[13px] text-gray-900 leading-relaxed">{post.texte}</p>
          {post.hashtags && <p className="text-[13px] text-[#0A66C2] mt-1">{post.hashtags}</p>}
        </div>
      )}

      <div className="aspect-[4/3] bg-gray-50 relative">
        {post.media_url ? (
          post.media_url.match(/\.(mp4|webm|mov)$/i) ? (
            <video src={post.media_url} className="w-full h-full object-cover" muted />
          ) : (
            <img src={post.media_url} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-sky-50 gap-2">
            <Briefcase className="h-10 w-10 text-blue-300/60" />
            <p className="text-[10px] text-gray-300 font-medium">Aperçu LinkedIn</p>
          </div>
        )}
      </div>

      <div className="px-4 py-1.5 flex items-center justify-between text-[11px] text-gray-500 border-b border-gray-100">
        <div className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> 8 · <Heart className="h-3 w-3 text-red-400" /> 2</div>
        <span>1 commentaire · 2 reposts</span>
      </div>
      <div className="px-2 py-1">
        <div className="flex items-center justify-between text-gray-600 text-[12px] font-medium">
          <button className="flex items-center gap-1 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors">
            <ThumbsUp className="h-4 w-4" /> J'aime
          </button>
          <button className="flex items-center gap-1 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors">
            <MessageCircle className="h-4 w-4" /> Commenter
          </button>
          <button className="flex items-center gap-1 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors">
            <Repeat2 className="h-4 w-4" /> Republier
          </button>
          <button className="flex items-center gap-1 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors">
            <Send className="h-4 w-4" /> Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

function XMockup({ post, clientName, clientColor, clientLogo }: NetworkMockupProps) {
  const color = clientColor || "#000000";
  const handle = clientName.toLowerCase().replace(/\s+/g, "");
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.08)] border border-gray-100">
      <div className="px-4 py-3 flex gap-3">
        <Avatar name={clientName} color={color} size="md" logo={clientLogo} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-gray-900 truncate">{clientName}</span>
            <svg className="h-4 w-4 text-[#1D9BF0] shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/></svg>
          </div>
          <span className="text-[11px] text-gray-400">@{handle} · 1h</span>
          {post.texte && <p className="text-[13px] text-gray-900 mt-2 leading-relaxed">{post.texte}</p>}
          {post.hashtags && <p className="text-[13px] text-[#1D9BF0] mt-0.5">{post.hashtags}</p>}

          {post.media_url ? (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200">
              {post.media_url.match(/\.(mp4|webm|mov)$/i) ? (
                <video src={post.media_url} className="w-full aspect-[16/9] object-cover" muted />
              ) : (
                <img src={post.media_url} alt="" className="w-full aspect-[16/9] object-cover" />
              )}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 aspect-[16/9] bg-gray-50 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-200">𝕏</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 text-gray-400 max-w-[280px]">
            <button className="flex items-center gap-1 text-[11px] hover:text-[#1D9BF0] transition-colors"><MessageCircle className="h-4 w-4" /> 2</button>
            <button className="flex items-center gap-1 text-[11px] hover:text-green-500 transition-colors"><Repeat2 className="h-4 w-4" /> 5</button>
            <button className="flex items-center gap-1 text-[11px] hover:text-red-500 transition-colors"><Heart className="h-4 w-4" /> 18</button>
            <button className="hover:text-[#1D9BF0] transition-colors"><Share2 className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TikTokMockup({ post, clientName, clientColor, clientLogo }: NetworkMockupProps) {
  const color = clientColor || "#FE2C55";
  const handle = clientName.toLowerCase().replace(/\s+/g, "");
  return (
    <div className="bg-black rounded-2xl overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.3)] aspect-[9/16] relative max-w-[280px] mx-auto">
      {post.media_url ? (
        post.media_url.match(/\.(mp4|webm|mov)$/i) ? (
          <video src={post.media_url} className="w-full h-full object-cover absolute inset-0" muted />
        ) : (
          <img src={post.media_url} alt="" className="w-full h-full object-cover absolute inset-0" />
        )
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
          <span className="text-4xl font-bold text-white/10">TikTok</span>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-center gap-6 text-white text-[13px] font-semibold">
        <span className="opacity-50">Abonnements</span>
        <span className="border-b-2 border-white pb-0.5">Pour toi</span>
      </div>

      {/* Side actions */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
        <div className="relative">
          {clientLogo ? (
            <img src={clientLogo} alt={clientName} className="h-10 w-10 rounded-full border-2 border-white object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color }}>
              {clientName.charAt(0)}
            </div>
          )}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#FE2C55] rounded-full w-5 h-5 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">+</span>
          </div>
        </div>
        <div className="text-center text-white">
          <Heart className="h-7 w-7 mx-auto" />
          <span className="text-[10px]">1.2K</span>
        </div>
        <div className="text-center text-white">
          <MessageCircle className="h-7 w-7 mx-auto" />
          <span className="text-[10px]">89</span>
        </div>
        <div className="text-center text-white">
          <Bookmark className="h-7 w-7 mx-auto" />
          <span className="text-[10px]">34</span>
        </div>
        <div className="text-center text-white">
          <Share2 className="h-7 w-7 mx-auto" />
          <span className="text-[10px]">12</span>
        </div>
      </div>

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-14 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-16">
        <p className="text-white text-[13px] font-semibold mb-1">@{handle}</p>
        {post.texte && <p className="text-white/90 text-[12px] line-clamp-2 leading-relaxed">{post.texte}</p>}
        {post.hashtags && <p className="text-white/70 text-[11px] mt-1">{post.hashtags}</p>}
        <div className="flex items-center gap-2 mt-2 text-white/80">
          <Music className="h-3 w-3" />
          <p className="text-[10px] truncate">Son original · {handle}</p>
        </div>
      </div>
    </div>
  );
}

export function NetworkMockup({ post, clientName, clientColor, clientLogo }: NetworkMockupProps) {
  switch (post.reseau) {
    case "instagram":
      return <InstagramMockup post={post} clientName={clientName} clientColor={clientColor} clientLogo={clientLogo} />;
    case "facebook":
      return <FacebookMockup post={post} clientName={clientName} clientColor={clientColor} clientLogo={clientLogo} />;
    case "linkedin":
      return <LinkedInMockup post={post} clientName={clientName} clientColor={clientColor} clientLogo={clientLogo} />;
    case "x":
      return <XMockup post={post} clientName={clientName} clientColor={clientColor} clientLogo={clientLogo} />;
    case "tiktok":
      return <TikTokMockup post={post} clientName={clientName} clientColor={clientColor} clientLogo={clientLogo} />;
    default:
      return <FacebookMockup post={post} clientName={clientName} clientColor={clientColor} clientLogo={clientLogo} />;
  }
}
