import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { fetchPreviewLinkBySlug, fetchPreviewActions, submitPreviewAction, PreviewLink, PreviewAction } from "@/lib/preview-links";
import { Post, POST_STATUTS, RESEAU_LABELS } from "@/lib/posts";
import { Client } from "@/lib/clients";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle, Send, PartyPopper, ChevronDown, Instagram, Facebook, Linkedin, Twitter, Music, LayoutGrid, Inbox } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { NetworkMockup } from "@/components/preview/NetworkMockup";
import { motion, AnimatePresence } from "framer-motion";
import digalLogo from "@/assets/digal-logo.png";

const NETWORK_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-3.5 w-3.5" />,
  facebook: <Facebook className="h-3.5 w-3.5" />,
  linkedin: <Linkedin className="h-3.5 w-3.5" />,
  x: <Twitter className="h-3.5 w-3.5" />,
  tiktok: <Music className="h-3.5 w-3.5" />,
};

const PreviewPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [link, setLink] = useState<PreviewLink | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [cmUser, setCmUser] = useState<{ nom: string; prenom: string; agence_nom: string | null; logo_url: string | null } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [actions, setActions] = useState<PreviewAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refuseComment, setRefuseComment] = useState("");
  const [refusePostId, setRefusePostId] = useState<string | null>(null);
  const [showRefuseAll, setShowRefuseAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterReseau, setFilterReseau] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number } | null>(null);

  const isFreemium = true;

  // Countdown to link expiry
  useEffect(() => {
    if (!link?.expires_at) return;
    const tick = () => {
      const diff = new Date(link.expires_at).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ hours: 0, minutes: 0 }); return; }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      });
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [link?.expires_at]);

  const availableNetworks = useMemo(() => {
    const nets = [...new Set(posts.map(p => p.reseau))];
    return nets.sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!filterReseau) return posts;
    return posts.filter(p => p.reseau === filterReseau);
  }, [posts, filterReseau]);

  const progress = useMemo(() => {
    if (posts.length === 0) return 0;
    const reviewed = posts.filter(p => actions.some(a => a.post_id === p.id)).length;
    return Math.round((reviewed / posts.length) * 100);
  }, [posts, actions]);

  const loadData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);

    // Timeout: if any Supabase query hangs more than 15s, bail out
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 15000)
    );

    try {
      const linkData = await Promise.race([fetchPreviewLinkBySlug(slug), timeout]);
      setLink(linkData);

      if (linkData.statut === "termine") {
        setSubmitted(true);
        return;
      }

      if (linkData.statut !== "actif" || new Date(linkData.expires_at) < new Date()) {
        setExpired(true);
        return;
      }

      const [clientResult, cmResult, postsResult, actionsData] = await Promise.race([
        Promise.all([
          supabase.from("clients").select("*").eq("id", linkData.client_id).single(),
          supabase.from("users").select("nom, prenom, agence_nom, logo_url").eq("user_id", linkData.user_id).maybeSingle(),
          supabase.from("posts").select("*").eq("client_id", linkData.client_id).in("statut", ["en_attente_validation", "lien_envoye"]).gte("date_publication", linkData.periode_debut).lte("date_publication", linkData.periode_fin).order("date_publication", { ascending: true }),
          fetchPreviewActions(linkData.id).catch(() => [] as PreviewAction[]),
        ]),
        timeout,
      ]);

      setClient(clientResult.data as Client);
      setCmUser(cmResult.data);
      setPosts((postsResult.data ?? []) as Post[]);
      setActions(actionsData);
    } catch {
      setExpired(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getPostAction = useCallback((postId: string) =>
    actions.find((a) => a.post_id === postId), [actions]);

  const addActionLocally = (postId: string | null, decision: "valide" | "refuse", commentaire?: string) => {
    const newAction: PreviewAction = {
      id: crypto.randomUUID(),
      preview_link_id: link!.id,
      post_id: postId,
      decision,
      commentaire: commentaire || null,
      created_at: new Date().toISOString(),
    };
    setActions(prev => [newAction, ...prev]);
  };

  const handleValidatePost = async (postId: string) => {
    if (!link) return;
    setSubmitting(true);
    try {
      await submitPreviewAction(link.id, postId, "valide");
      await supabase.from("posts").update({ statut: "programme_valide" }).eq("id", postId);
      addActionLocally(postId, "valide");
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, statut: "programme_valide" } : p));
      toast.success("Post validé !");
    } catch {
      toast.error("Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefusePost = async (postId: string, comment: string) => {
    if (!link) return;
    setSubmitting(true);
    try {
      await submitPreviewAction(link.id, postId, "refuse", comment);
      await supabase.from("posts").update({ statut: "brouillon" }).eq("id", postId);
      addActionLocally(postId, "refuse", comment);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, statut: "brouillon" } : p));
      // Règle 5 : notifier le CM avec le commentaire du client
      await supabase.from("notifications").insert({
        user_id: link.user_id,
        titre: `${client?.nom ?? "Client"} a refusé un post`,
        message: comment || "Aucun commentaire.",
        type: "warning",
        lien: `/dashboard/clients/${link.client_id}/calendrier`,
      });
      toast.success("Post refusé");
      setRefusePostId(null);
      setRefuseComment("");
    } catch {
      toast.error("Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidateAll = async () => {
    if (!link) return;
    setSubmitting(true);
    try {
      const pending = posts.filter((p) => !getPostAction(p.id));
      for (const post of pending) {
        await submitPreviewAction(link.id, post.id, "valide");
        await supabase.from("posts").update({ statut: "programme_valide" }).eq("id", post.id);
        addActionLocally(post.id, "valide");
      }
      setPosts(prev => prev.map(p => ({ ...p, statut: pending.some(pp => pp.id === p.id) ? "programme_valide" : p.statut })));
      toast.success("Tous les posts validés !");
    } catch {
      toast.error("Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefuseAll = async (comment: string) => {
    if (!link) return;
    setSubmitting(true);
    try {
      const pending = posts.filter((p) => !getPostAction(p.id));
      for (const post of pending) {
        await submitPreviewAction(link.id, post.id, "refuse", comment);
        await supabase.from("posts").update({ statut: "brouillon" }).eq("id", post.id);
        addActionLocally(post.id, "refuse", comment);
      }
      setPosts(prev => prev.map(p => ({ ...p, statut: pending.some(pp => pp.id === p.id) ? "brouillon" : p.statut })));
      // Règle 5 : notifier le CM avec le commentaire global du client
      await supabase.from("notifications").insert({
        user_id: link.user_id,
        titre: `${client?.nom ?? "Client"} a refusé ${pending.length} post(s)`,
        message: comment || "Aucun commentaire.",
        type: "warning",
        lien: `/dashboard/clients/${link.client_id}/calendrier`,
      });
      toast.success("Tous les posts refusés");
      setShowRefuseAll(false);
      setRefuseComment("");
    } catch {
      toast.error("Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendToCM = async () => {
    if (!link) return;
    setSubmitting(true);
    try {
      await supabase.from("preview_links").update({ statut: "termine" }).eq("id", link.id);
      const validatedCount = actions.filter(a => a.decision === "valide").length;
      const refusedCount = actions.filter(a => a.decision === "refuse").length;
      await supabase.from("notifications").insert({
        user_id: link.user_id,
        titre: `${client?.nom ?? "Client"} a terminé sa revue`,
        message: `${validatedCount} post(s) validé(s), ${refusedCount} post(s) refusé(s). Consultez le calendrier pour voir les retours.`,
        type: "preview_review",
        lien: `/dashboard/clients/${link.client_id}`,
      });
      setSubmitted(true);
      toast.success("Retours envoyés !");
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render states ---

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF8] gap-3">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-[3px] border-gray-200" />
          <div className="h-12 w-12 rounded-full border-[3px] border-t-[#C4522A] animate-spin absolute inset-0" />
        </div>
        <p className="text-sm text-gray-400 font-sans">Chargement de votre calendrier...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-md space-y-6"
        >
          <div className="h-20 w-20 mx-auto bg-green-50 rounded-full flex items-center justify-center">
            <PartyPopper className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold font-serif text-gray-900">Merci pour vos retours !</h1>
          <p className="text-gray-500 font-sans leading-relaxed">
            Vos commentaires ont été envoyés à votre Community Manager.
            Il reviendra vers vous avec les modifications nécessaires.
          </p>
          <div className="pt-2">
            <p className="text-xs text-gray-300 font-sans">
              Vous pouvez fermer cette page en toute sécurité.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md space-y-5"
        >
          <div className="h-16 w-16 mx-auto bg-amber-50 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold font-serif text-gray-900">Ce lien a expiré</h1>
          {link?.expires_at && (
            <p className="text-sm text-amber-700 font-sans bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
              Expiré le {format(new Date(link.expires_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
          )}
          <p className="text-gray-500 font-sans">
            Contactez votre Community Manager pour obtenir un nouveau lien de validation.
          </p>
          <img src={digalLogo} alt="Digal" className="h-6 w-6 mx-auto opacity-30" loading="lazy" width={24} height={24} />
        </motion.div>
      </div>
    );
  }

  const periodLabel = link
    ? `${format(new Date(link.periode_debut), "d MMMM", { locale: fr })} au ${format(new Date(link.periode_fin), "d MMMM yyyy", { locale: fr })}`
    : "";

  const pendingPosts = posts.filter((p) => !getPostAction(p.id));
  const allReviewed = pendingPosts.length === 0 && posts.length > 0;
  const validatedCount = actions.filter(a => a.decision === "valide").length;
  const refusedCount = actions.filter(a => a.decision === "refuse").length;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* === STICKY HEADER === */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <motion.div
            className="h-full bg-gradient-to-r from-[#C4522A] to-[#E8875A] rounded-r-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: CM/Agence × Client */}
            <div className="flex items-center gap-2.5">
              {/* CM / Agence logo */}
              {cmUser?.logo_url ? (
                <img src={cmUser.logo_url} alt={cmUser.agence_nom || cmUser.prenom} className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
                  {(cmUser?.agence_nom || cmUser?.prenom || "CM").charAt(0)}
                </div>
              )}
              <span className="text-[10px] text-gray-300 font-sans">×</span>
              {/* Client logo */}
              {client?.logo_url ? (
                <img src={client.logo_url} alt={client.nom} className="h-8 w-8 rounded-lg object-cover" />
              ) : client && (
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm"
                  style={{ backgroundColor: client.couleur_marque || "#C4522A" }}
                >
                  {client.nom.charAt(0)}
                </div>
              )}
              <div className="ml-1">
                <h1 className="text-sm font-bold font-serif text-gray-900">{client?.nom}</h1>
                <p className="text-[10px] text-gray-400 font-sans">{cmUser?.agence_nom || `${cmUser?.prenom ?? ""} ${cmUser?.nom ?? ""}`.trim()} · {periodLabel}</p>
              </div>
            </div>
            {/* Right: Digal branding */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-400 font-sans">{progress}%</span>
              <div className="h-6 w-px bg-gray-200" />
              <img src={digalLogo} alt="Digal" className="h-6 w-6" loading="lazy" width={24} height={24} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-44 space-y-6">

        {/* === WELCOME MESSAGE + COUNTDOWN === */}
        {(link?.welcome_message || timeLeft !== null) && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-2">
            {link?.welcome_message && (
              <p className="text-sm font-sans text-gray-700 leading-relaxed">{link.welcome_message}</p>
            )}
            {timeLeft !== null && (
              <div className="flex items-center gap-1.5 text-xs font-sans text-amber-600">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {timeLeft.hours > 0
                  ? `Ce lien expire dans ${timeLeft.hours}h${timeLeft.minutes > 0 ? ` ${timeLeft.minutes}min` : ""}`
                  : timeLeft.minutes > 0
                    ? `Ce lien expire dans ${timeLeft.minutes} minute${timeLeft.minutes > 1 ? "s" : ""}`
                    : "Ce lien expire très bientôt"}
              </div>
            )}
          </div>
        )}

        {/* === STATS CARDS === */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total", value: posts.length, icon: <LayoutGrid className="h-5 w-5 text-gray-500" />, bg: "bg-gray-50" },
            { label: "Validés", value: validatedCount, icon: <CheckCircle className="h-5 w-5 text-green-500" />, bg: "bg-green-50" },
            { label: "Refusés", value: refusedCount, icon: <XCircle className="h-5 w-5 text-red-500" />, bg: "bg-red-50" },
            { label: "En attente", value: pendingPosts.length, icon: <Clock className="h-5 w-5 text-amber-500" />, bg: "bg-amber-50" },
          ].map(stat => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${stat.bg} rounded-2xl p-3 text-center flex flex-col items-center`}
            >
              {stat.icon}
              <p className="text-xl font-bold font-serif text-gray-900 mt-1">{stat.value}</p>
              <p className="text-[10px] text-gray-500 font-sans">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* === NETWORK FILTER === */}
        {availableNetworks.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFilterReseau(null)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-sans font-medium transition-all ${
                !filterReseau
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Tous ({posts.length})
            </button>
            {availableNetworks.map((net) => {
              const count = posts.filter(p => p.reseau === net).length;
              return (
                <button
                  key={net}
                  onClick={() => setFilterReseau(net === filterReseau ? null : net)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-sans font-medium transition-all flex items-center gap-1.5 ${
                    filterReseau === net
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <span>{NETWORK_ICONS[net] ?? "📱"}</span>
                  {RESEAU_LABELS[net] ?? net} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* === POSTS GRID === */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <Inbox className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-sans text-sm">
              {posts.length === 0 ? "Aucun post pour cette période." : "Aucun post pour ce réseau."}
            </p>
          </div>
        ) : (
          <div className={`grid gap-8 ${
            filterReseau === "tiktok"
              ? "sm:grid-cols-2 lg:grid-cols-3"
              : filterReseau === "instagram"
                ? "sm:grid-cols-2 lg:grid-cols-3"
                : "sm:grid-cols-1 lg:grid-cols-2"
          }`}>
            <AnimatePresence mode="popLayout">
              {filteredPosts.map((post, index) => {
                const action = getPostAction(post.id);
                const isExpanded = expandedPost === post.id;

                return (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="space-y-3"
                  >
                    {/* Post date label */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] text-gray-400 font-sans font-medium">
                        {format(new Date(post.date_publication), "EEEE d MMM · HH:mm", { locale: fr })}
                      </span>
                      <span className="text-[10px] font-medium text-gray-300 bg-gray-100 px-2 py-0.5 rounded-full">
                        {RESEAU_LABELS[post.reseau] ?? post.reseau}
                      </span>
                    </div>

                    {/* Network Mockup */}
                    <NetworkMockup
                      post={post}
                      clientName={client?.nom ?? "Client"}
                      clientColor={client?.couleur_marque}
                      clientLogo={client?.logo_url}
                    />

                    {/* Validation result badge */}
                    <AnimatePresence>
                      {action && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`text-xs font-sans p-3 rounded-xl text-center ${
                            action.decision === "valide"
                              ? "bg-green-50 text-green-700 border border-green-100"
                              : "bg-red-50 text-red-700 border border-red-100"
                          }`}
                        >
                          <span className="font-semibold">
                            {action.decision === "valide" ? (
                              <span className="flex items-center justify-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Validé</span>
                            ) : (
                              <span className="flex items-center justify-center gap-1"><XCircle className="h-3.5 w-3.5" /> Refusé</span>
                            )}
                          </span>
                          {action.commentaire && (
                            <p className="mt-1 text-gray-600 italic">« {action.commentaire} »</p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">
                            {format(new Date(action.created_at), "d MMM à HH:mm", { locale: fr })}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action buttons */}
                    {!action && (
                      <div className="space-y-2 px-1">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-10 text-[13px] font-medium shadow-sm"
                            onClick={() => handleValidatePost(post.id)}
                            disabled={submitting}
                          >
                            <CheckCircle className="h-4 w-4" /> Valider
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl h-10 text-[13px] font-medium"
                            onClick={() => setRefusePostId(isExpanded ? null : post.id)}
                            disabled={submitting}
                          >
                            <XCircle className="h-4 w-4" /> Refuser
                          </Button>
                        </div>

                        {/* Inline refuse form */}
                        <AnimatePresence>
                          {refusePostId === post.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-white rounded-xl border border-red-100 p-3 space-y-2.5 shadow-sm">
                                <Textarea
                                  value={refuseComment}
                                  onChange={(e) => setRefuseComment(e.target.value)}
                                  placeholder="Expliquez ce qui doit être modifié..."
                                  rows={3}
                                  className="text-xs rounded-lg border-gray-200 focus:border-red-300 focus:ring-red-200 resize-none"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs"
                                    onClick={() => handleRefusePost(post.id, refuseComment)}
                                    disabled={submitting || !refuseComment.trim()}
                                  >
                                    {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Envoyer le commentaire"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs text-gray-400 rounded-lg"
                                    onClick={() => { setRefusePostId(null); setRefuseComment(""); }}
                                  >
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* === BOTTOM BAR === */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        {/* Gradient fade */}
        <div className="h-8 bg-gradient-to-t from-[#FAFAF8] to-transparent pointer-events-none" />
        <div className="bg-white/90 backdrop-blur-xl border-t border-gray-100 py-4 shadow-[0_-4px_30px_-10px_rgba(0,0,0,0.08)]">
          <div className="max-w-4xl mx-auto px-4">
            {allReviewed ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-3"
              >
                <p className="text-sm font-sans text-gray-500">
                  Vous avez passé en revue <span className="font-semibold text-gray-900">{posts.length} posts</span>. Envoyez vos retours !
                </p>
                <Button
                  size="lg"
                  className="bg-[#C4522A] hover:bg-[#A8421F] text-white rounded-xl px-8 h-12 text-sm font-semibold shadow-lg shadow-[#C4522A]/20"
                  onClick={handleSendToCM}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Envoyer mes retours au CM
                </Button>
              </motion.div>
            ) : pendingPosts.length > 0 ? (
              showRefuseAll ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-md mx-auto space-y-3"
                >
                  <Textarea
                    value={refuseComment}
                    onChange={(e) => setRefuseComment(e.target.value)}
                    placeholder="Commentaire global pour le refus..."
                    rows={3}
                    className="rounded-xl border-gray-200 resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                      onClick={() => handleRefuseAll(refuseComment)}
                      disabled={submitting || !refuseComment.trim()}
                    >
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      Confirmer le refus ({pendingPosts.length})
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => { setShowRefuseAll(false); setRefuseComment(""); }}
                    >
                      Annuler
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex justify-center gap-3">
                  <Button
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 h-11 text-sm font-semibold shadow-sm"
                    onClick={handleValidateAll}
                    disabled={submitting}
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <CheckCircle className="h-4 w-4" />
                    Tout valider ({pendingPosts.length})
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl px-6 h-11 text-sm font-semibold"
                    onClick={() => setShowRefuseAll(true)}
                    disabled={submitting}
                  >
                    <XCircle className="h-4 w-4" />
                    Tout refuser
                  </Button>
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>

      {/* Freemium watermark */}
      {isFreemium && (
        <div className="fixed bottom-20 right-4 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-[10px] font-sans font-medium shadow-xl z-10 flex items-center gap-1.5">
          Créé avec <img src={digalLogo} alt="Digal" className="h-4 w-4 inline-block" loading="lazy" width={16} height={16} /> <span className="font-serif font-bold">Digal</span>
        </div>
      )}
    </div>
  );
};

export default PreviewPage;
