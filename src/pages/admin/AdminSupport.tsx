import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle, HelpCircle, Lightbulb, Send, Headphones,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface SupportMessage {
  id: string;
  user_id: string;
  type: "bug" | "question" | "suggestion";
  sujet: string;
  message: string;
  statut: "nouveau" | "lu" | "resolu";
  reponse: string | null;
  repondu_at: string | null;
  created_at: string;
}

interface UserInfo {
  user_id: string;
  prenom: string;
  nom: string;
  email: string;
  plan: string | null;
  role: string;
}

interface MessageWithUser extends SupportMessage {
  user?: UserInfo;
}

/* ─── Constants ──────────────────────────────────────────────────────── */

const TYPE_CONFIG = {
  bug: { label: "Bug", icon: AlertCircle, badge: "bg-destructive/10 text-destructive border-destructive/20" },
  question: { label: "Question", icon: HelpCircle, badge: "bg-primary/10 text-primary border-primary/20" },
  suggestion: { label: "Suggestion", icon: Lightbulb, badge: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400" },
} as const;

const STATUT_CONFIG = {
  nouveau: { label: "Nouveau", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
  lu: { label: "Lu", badge: "bg-muted text-muted-foreground" },
  resolu: { label: "Résolu", badge: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
} as const;

const TABS = [
  { value: "tous", label: "Tous" },
  { value: "bug", label: "Bugs" },
  { value: "question", label: "Questions" },
  { value: "suggestion", label: "Suggestions" },
] as const;

type TabValue = typeof TABS[number]["value"];

/* ─── Data fetcher ───────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

async function fetchMessages(): Promise<MessageWithUser[]> {
  const { data: messages, error } = await db
    .from("support_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!messages || messages.length === 0) return [];

  const userIds = [...new Set((messages as SupportMessage[]).map((m) => m.user_id))];

  const { data: users } = await supabase
    .from("users")
    .select("user_id, prenom, nom, email, plan, role")
    .in("user_id", userIds as string[]);

  const userMap = new Map<string, UserInfo>();
  for (const u of (users ?? []) as UserInfo[]) {
    userMap.set(u.user_id, u);
  }

  return (messages as SupportMessage[]).map((m) => ({
    ...m,
    user: userMap.get(m.user_id),
  }));
}

/* ─── Page ───────────────────────────────────────────────────────────── */

const AdminSupport = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabValue>("tous");
  const [statutFilter, setStatutFilter] = useState<string>("tous");
  const [replyTarget, setReplyTarget] = useState<MessageWithUser | null>(null);
  const [reponse, setReponse] = useState("");
  const [sending, setSending] = useState(false);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin-support-messages"],
    queryFn: fetchMessages,
    refetchInterval: 60_000,
  });

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await db
        .from("support_messages")
        .update({ statut })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-support-messages"] }),
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const handleReply = async () => {
    if (!replyTarget || !reponse.trim()) return;
    setSending(true);

    try {
      await db
        .from("support_messages")
        .update({
          reponse: reponse.trim(),
          statut: "resolu",
          repondu_at: new Date().toISOString(),
        })
        .eq("id", replyTarget.id);

      if (replyTarget.user?.email) {
        await supabase.functions.invoke("send-email", {
          body: {
            type: "marketing",
            to: replyTarget.user.email,
            subject: `Réponse à votre message : ${replyTarget.sujet}`,
            html: [
              `Bonjour ${replyTarget.user.prenom ?? ""},`,
              "",
              `Voici la réponse à votre message "${replyTarget.sujet}" :`,
              "",
              reponse.trim(),
              "",
              "L'équipe Digal",
            ].join("\n"),
          },
        });
      }

      toast.success("Réponse envoyée");
      queryClient.invalidateQueries({ queryKey: ["admin-support-messages"] });
      setReplyTarget(null);
      setReponse("");
    } catch {
      toast.error("Erreur lors de l'envoi de la réponse");
    } finally {
      setSending(false);
    }
  };

  const filtered = messages.filter((m) => {
    if (tab !== "tous" && m.type !== tab) return false;
    if (statutFilter !== "tous" && m.statut !== statutFilter) return false;
    return true;
  });

  const newCount = messages.filter((m) => m.statut === "nouveau").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
              <Headphones className="h-6 w-6 text-primary" />
              Support
            </h1>
            <p className="text-sm text-muted-foreground font-sans mt-1">
              Messages et demandes des utilisateurs
            </p>
          </div>
          {newCount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground font-sans">
              {newCount} nouveau{newCount > 1 ? "x" : ""}
            </Badge>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-sans transition-colors",
                  tab === t.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="w-36 h-9 font-sans text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous statuts</SelectItem>
              <SelectItem value="nouveau">Nouveau</SelectItem>
              <SelectItem value="lu">Lu</SelectItem>
              <SelectItem value="resolu">Résolu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Messages list */}
        <div className="space-y-3">
          {isLoading ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground font-sans">Chargement...</CardContent></Card>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Headphones className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground font-sans text-sm">Aucun message</p>
              </CardContent>
            </Card>
          ) : filtered.map((msg) => {
            const typeCfg = TYPE_CONFIG[msg.type];
            const statutCfg = STATUT_CONFIG[msg.statut];
            const TypeIcon = typeCfg.icon;

            return (
              <Card key={msg.id} className={cn(msg.statut === "nouveau" && "border-primary/30")}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    {/* User avatar */}
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-bold font-sans text-muted-foreground">
                      {msg.user
                        ? (msg.user.prenom[0] + msg.user.nom[0]).toUpperCase()
                        : "?"}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold font-sans text-sm">
                          {msg.user ? `${msg.user.prenom} ${msg.user.nom}` : "Utilisateur inconnu"}
                        </span>
                        {msg.user?.plan && (
                          <Badge variant="outline" className="text-[10px] font-sans">{msg.user.plan}</Badge>
                        )}
                        <Badge className={cn("text-[10px] font-sans border", typeCfg.badge)}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeCfg.label}
                        </Badge>
                        <Badge className={cn("text-[10px] font-sans", statutCfg.badge)}>
                          {statutCfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-sans ml-auto">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                        </span>
                      </div>

                      <p className="font-semibold text-sm mb-1">{msg.sujet}</p>
                      <p className="text-sm text-muted-foreground font-sans line-clamp-2">{msg.message}</p>

                      {msg.reponse && (
                        <div className="mt-2 pl-3 border-l-2 border-primary/40">
                          <p className="text-xs text-muted-foreground font-sans">
                            Répondu le {format(new Date(msg.repondu_at!), "dd MMM yyyy à HH:mm", { locale: fr })}
                          </p>
                          <p className="text-sm font-sans mt-0.5 line-clamp-2">{msg.reponse}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        {msg.statut === "nouveau" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs font-sans"
                            onClick={() => updateStatut.mutate({ id: msg.id, statut: "lu" })}
                          >
                            Marquer lu
                          </Button>
                        )}
                        {msg.statut !== "resolu" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs font-sans"
                            onClick={() => updateStatut.mutate({ id: msg.id, statut: "resolu" })}
                          >
                            Résoudre
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="h-7 text-xs font-sans gap-1"
                          onClick={() => { setReplyTarget(msg); setReponse(""); }}
                        >
                          <Send className="h-3 w-3" />
                          Répondre
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Reply modal */}
      <Dialog open={replyTarget !== null} onOpenChange={(open) => { if (!open) setReplyTarget(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Répondre à {replyTarget?.user?.prenom ?? "l'utilisateur"}
            </DialogTitle>
          </DialogHeader>

          {replyTarget && (
            <div className="space-y-4">
              {/* Original message */}
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground font-sans mb-1 uppercase tracking-wide">Message original</p>
                <p className="font-semibold text-sm">{replyTarget.sujet}</p>
                <p className="text-sm text-muted-foreground font-sans mt-1">{replyTarget.message}</p>
              </div>

              <div className="space-y-2">
                <Label className="font-sans text-sm">Votre réponse</Label>
                <Textarea
                  value={reponse}
                  onChange={(e) => setReponse(e.target.value)}
                  placeholder="Rédigez votre réponse..."
                  rows={5}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setReplyTarget(null)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleReply}
                  disabled={sending || !reponse.trim()}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {sending ? "Envoi..." : "Envoyer la réponse"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSupport;
