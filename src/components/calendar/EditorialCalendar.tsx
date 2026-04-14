import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Post, fetchPosts, RESEAU_LABELS } from "@/lib/posts";
import { PostCard } from "@/components/calendar/PostCard";
import { CreatePostModal } from "@/components/calendar/CreatePostModal";
import { EditPostModal } from "@/components/calendar/EditPostModal";
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, format, addWeeks, subWeeks, addMonths, subMonths,
  isSameDay, isToday,
} from "date-fns";
import { fr } from "date-fns/locale";

interface EditorialCalendarProps {
  clientId: string;
  clientName: string;
  clientColor: string;
  activeNetworks: string[];
}

export function EditorialCalendar({ clientId, clientName, clientColor, activeNetworks }: EditorialCalendarProps) {
  const [view, setView] = useState<"semaine" | "mois">("semaine");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [filterReseau, setFilterReseau] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date | undefined>();
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const loadPosts = () => {
    fetchPosts(clientId).then(setPosts).catch(() => {});
  };

  useEffect(() => { loadPosts(); }, [clientId]);

  const filteredPosts = useMemo(() => {
    if (!filterReseau) return posts;
    return posts.filter((p) => p.reseau === filterReseau);
  }, [posts, filterReseau]);

  const days = useMemo(() => {
    if (view === "semaine") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    // Pad to start on Monday
    const monthStart = startOfWeek(start, { weekStartsOn: 1 });
    const monthEnd = endOfWeek(end, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [view, currentDate]);

  const navigate = (dir: 1 | -1) => {
    if (view === "semaine") {
      setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
  };

  const postsForDay = (day: Date) =>
    filteredPosts.filter((p) => isSameDay(new Date(p.date_publication), day));

  const handleDayClick = (day: Date) => {
    setModalDate(day);
    setModalOpen(true);
  };

  const handlePostClick = (post: Post) => {
    setEditPost(post);
    setEditModalOpen(true);
  };

  const title = view === "semaine"
    ? `Semaine du ${format(days[0], "d MMM", { locale: fr })} — ${format(days[6], "d MMM yyyy", { locale: fr })}`
    : format(currentDate, "MMMM yyyy", { locale: fr });

  return (
    <div className="space-y-4">
      {/* Branded header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold font-serif text-xs"
          style={{ backgroundColor: clientColor }}
        >
          {clientName.charAt(0)}
        </div>
        <span className="text-xs text-muted-foreground font-sans">×</span>
        <span className="font-serif font-bold text-sm">Digal</span>
        <span className="text-xs text-muted-foreground font-sans ml-2">Calendrier éditorial</span>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold font-serif text-base capitalize min-w-[200px] text-center">
            {title}
          </h3>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="text-xs font-sans">
            Aujourd'hui
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Tabs value={view} onValueChange={(v) => setView(v as "semaine" | "mois")}>
            <TabsList className="h-8">
              <TabsTrigger value="semaine" className="text-xs font-sans px-3 h-6">Semaine</TabsTrigger>
              <TabsTrigger value="mois" className="text-xs font-sans px-3 h-6">Mois</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Network filters */}
          <div className="flex gap-1">
            <Badge
              variant={filterReseau === null ? "default" : "outline"}
              className="text-[10px] cursor-pointer"
              onClick={() => setFilterReseau(null)}
            >
              Tous
            </Badge>
            {activeNetworks.map((r) => (
              <Badge
                key={r}
                variant={filterReseau === r ? "default" : "outline"}
                className="text-[10px] cursor-pointer"
                onClick={() => setFilterReseau(filterReseau === r ? null : r)}
              >
                {RESEAU_LABELS[r] ?? r}
              </Badge>
            ))}
          </div>

          <Button size="sm" onClick={() => { setModalDate(undefined); setModalOpen(true); }}>
            <Plus className="h-3.5 w-3.5" /> Post
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      {view === "semaine" ? (
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {/* Day headers */}
          {days.map((day) => (
            <div key={day.toISOString()} className="bg-card">
              <div
                className={`px-2 py-2 text-center border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                  isToday(day) ? "bg-primary/10" : ""
                }`}
                onClick={() => handleDayClick(day)}
              >
                <p className="text-[10px] text-muted-foreground font-sans uppercase">
                  {format(day, "EEE", { locale: fr })}
                </p>
                <p className={`text-lg font-serif font-bold ${isToday(day) ? "text-primary" : ""}`}>
                  {format(day, "d")}
                </p>
              </div>
              <div className="p-1.5 space-y-1.5 min-h-[120px]">
                {postsForDay(day).map((post) => (
                  <PostCard key={post.id} post={post} onClick={handlePostClick} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-border">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 bg-muted">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d} className="text-center py-2 text-[10px] font-sans text-muted-foreground uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-border">
            {days.map((day) => {
              const dayPosts = postsForDay(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              return (
                <div
                  key={day.toISOString()}
                  className={`bg-card min-h-[80px] p-1 cursor-pointer hover:bg-muted/30 transition-colors ${
                    !isCurrentMonth ? "opacity-40" : ""
                  } ${isToday(day) ? "bg-primary/5" : ""}`}
                  onClick={() => handleDayClick(day)}
                >
                  <p className={`text-xs font-sans mb-1 ${isToday(day) ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    {format(day, "d")}
                  </p>
                  <div className="space-y-0.5">
                    {dayPosts.slice(0, 3).map((post) => (
                      <PostCard key={post.id} post={post} compact onClick={handlePostClick} />
                    ))}
                    {dayPosts.length > 3 && (
                      <p className="text-[9px] text-muted-foreground font-sans">+{dayPosts.length - 3} autres</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CreatePostModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        clientId={clientId}
        activeNetworks={activeNetworks}
        defaultDate={modalDate}
        onSuccess={loadPosts}
      />

      <EditPostModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        post={editPost}
        activeNetworks={activeNetworks}
        onSuccess={loadPosts}
      />
    </div>
  );
}
