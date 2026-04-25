import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  texte: string;
  nom: string;
  fonction: string;
  photo_url: string | null;
}

interface SectionConfig {
  badge: string;
  titre: string;
  sous_titre: string;
}

interface Stat {
  valeur: string;
  libelle: string;
}

const DEFAULT_SECTION: SectionConfig = {
  badge: "Témoignages",
  titre: "Ils font confiance à Digal",
  sous_titre: "Des community managers et agences au Sénégal qui ont transformé leur activité.",
};

const DEFAULT_STATS: Stat[] = [
  { valeur: "500+", libelle: "Community Managers actifs" },
  { valeur: "3h", libelle: "Économisées par jour en moyenne" },
  { valeur: "98%", libelle: "Taux de satisfaction client" },
  { valeur: "2×", libelle: "Plus de clients fidélisés" },
];

const STATIC_FALLBACK: Testimonial[] = [
  {
    id: "1",
    texte: "Digal a complètement transformé ma façon de gérer mes clients. Je gagne au moins 3h par jour sur la création de contenu et les rapports.",
    nom: "Aminata Diallo",
    fonction: "Community Manager Freelance",
    photo_url: null,
  },
  {
    id: "2",
    texte: "Enfin un outil pensé pour le marché africain. La gestion de la TVA et du BRS en automatique, c'est un gain de temps énorme pour mon agence.",
    nom: "Moussa Sow",
    fonction: "Directeur, Agence Pixel",
    photo_url: null,
  },
  {
    id: "3",
    texte: "Mes clients adorent les rapports de performance. Ça m'a permis de justifier mes tarifs et de fidéliser tout mon portefeuille.",
    nom: "Fatou Ndiaye",
    fonction: "CM & Stratège Digital",
    photo_url: null,
  },
];

/* ── Fan card (portrait, photo en haut) ─────────────────── */
function FanCard({
  testimonial,
  fanIndex,   // 0 = devant, 1 = milieu, 2 = derrière
  total,
  onSwipedAway,
}: {
  testimonial: Testimonial;
  fanIndex: number;
  total: number;
  onSwipedAway: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-22, 22]);
  const cardOpacity = useTransform(x, [-200, -80, 0, 80, 200], [0, 1, 1, 1, 0]);

  // Positions statiques pour l'éventail
  const fanRotations = [0, -10, 8];
  const fanScales   = [1, 0.92, 0.84];
  const fanYOffset  = [0, 14, 28];
  const fanOpacity  = [1, 0.75, 0.5];
  const fanBlur     = [0, 3, 6];

  const isFront = fanIndex === 0;

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipe = Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 400;
    if (swipe) onSwipedAway();
  };

  const initials = testimonial.nom
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      key={testimonial.id}
      className="absolute"
      style={{
        width: 280,
        height: 380,
        left: "50%",
        top: "50%",
        marginLeft: -140,
        marginTop: -190,
        zIndex: total - fanIndex,
        rotate: fanRotations[fanIndex] ?? 0,
        scale: fanScales[fanIndex] ?? 1,
        y: fanYOffset[fanIndex] ?? 0,
        opacity: fanOpacity[fanIndex] ?? 1,
        filter: fanBlur[fanIndex] ? `blur(${fanBlur[fanIndex]}px)` : undefined,
        ...(isFront ? { x, rotate, opacity: cardOpacity } : {}),
      }}
      drag={isFront ? "x" : false}
      dragElastic={0.15}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.04 }}
      style={
        isFront
          ? { x, rotate, opacity: cardOpacity, width: 280, height: 380, left: "50%", top: "50%", marginLeft: -140, marginTop: -190, position: "absolute", zIndex: total }
          : { width: 280, height: 380, left: "50%", top: "50%", marginLeft: -140, marginTop: -190, position: "absolute", zIndex: total - fanIndex, rotate: fanRotations[fanIndex] ?? 0, scale: fanScales[fanIndex] ?? 1, y: fanYOffset[fanIndex] ?? 0, opacity: fanOpacity[fanIndex] ?? 1, filter: fanBlur[fanIndex] ? `blur(${fanBlur[fanIndex]}px)` : undefined }
      }
    >
      {/* Glass card */}
      <div
        className="w-full h-full rounded-3xl flex flex-col items-center p-6 select-none"
        style={{
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px) saturate(150%)",
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
          cursor: isFront ? "grab" : "default",
        }}
      >
        {/* Photo en haut */}
        <div className="mt-2 mb-5">
          {testimonial.photo_url ? (
            <img
              src={testimonial.photo_url}
              alt={testimonial.nom}
              className="h-20 w-20 rounded-full object-cover"
              style={{ border: "3px solid rgba(232,81,26,0.6)", boxShadow: "0 0 0 3px rgba(232,81,26,0.15)" }}
            />
          ) : (
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center"
              style={{ background: "rgba(232,81,26,0.20)", border: "3px solid rgba(232,81,26,0.50)" }}
            >
              <span className="text-xl font-bold font-sans" style={{ color: "rgba(232,81,26,0.9)" }}>
                {initials}
              </span>
            </div>
          )}
        </div>

        {/* Quote */}
        <p
          className="font-sans text-sm leading-relaxed text-center italic flex-1"
          style={{ color: "rgba(255,255,255,0.82)" }}
        >
          &ldquo;{testimonial.texte}&rdquo;
        </p>

        {/* Nom / Fonction */}
        <div className="mt-4 text-center">
          <p className="font-semibold font-sans text-sm" style={{ color: "rgba(255,255,255,0.95)" }}>
            {testimonial.nom}
          </p>
          {testimonial.fonction && (
            <p className="font-sans text-xs mt-0.5" style={{ color: "rgba(232,81,26,0.80)" }}>
              {testimonial.fonction}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Section principale ──────────────────────────────────── */
export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(STATIC_FALLBACK);
  const [section, setSection] = useState<SectionConfig>(DEFAULT_SECTION);
  const [stats, setStats] = useState<Stat[]>(DEFAULT_STATS);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Témoignages
    supabase
      .from("testimonials")
      .select("id, texte, nom, fonction, photo_url")
      .eq("actif", true)
      .order("ordre", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setTestimonials(data as Testimonial[]);
      });

    // Config section
    supabase
      .from("testimonials_config")
      .select("id, data")
      .in("id", ["section", "stats"])
      .then(({ data }) => {
        data?.forEach((row) => {
          if (row.id === "section") setSection(row.data as SectionConfig);
          if (row.id === "stats") setStats(row.data as Stat[]);
        });
      });
  }, []);

  const handleSwipe = () => {
    setCurrentIndex((i) => (i + 1) % testimonials.length);
  };

  // Les 3 cartes visibles dans l'éventail (0=devant, 1=milieu, 2=derrière)
  const fanCards = [0, 1, 2].map((offset) => ({
    testimonial: testimonials[(currentIndex + offset) % testimonials.length],
    fanIndex: offset,
  }));

  return (
    <section
      className="py-28 px-4 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0B0F1C 0%, #141824 60%, #0E1118 100%)" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-20">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold font-sans mb-5"
            style={{ background: "rgba(232,81,26,0.15)", color: "rgba(232,81,26,0.90)" }}
          >
            {section.badge}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4" style={{ color: "rgba(255,255,255,0.95)" }}>
            {section.titre}
          </h2>
          <p className="font-sans text-base max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.50)" }}>
            {section.sous_titre}
          </p>
        </div>

        {/* Fan stack centré */}
        <div className="relative mx-auto mb-24" style={{ height: 420, maxWidth: 320 }}>
          {/* Cartes affichées de derrière vers devant */}
          {[...fanCards].reverse().map(({ testimonial, fanIndex }) => (
            <FanCard
              key={`${testimonial.id}-${fanIndex}`}
              testimonial={testimonial}
              fanIndex={fanIndex}
              total={3}
              onSwipedAway={handleSwipe}
            />
          ))}
        </div>

        {/* Instruction glisser */}
        <p className="text-center font-sans text-xs mb-16" style={{ color: "rgba(255,255,255,0.30)" }}>
          ← Faites glisser pour voir d&rsquo;autres avis →
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.libelle}
              className="rounded-2xl p-5 text-center"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="text-3xl font-bold font-serif mb-1" style={{ color: "rgba(232,81,26,0.90)" }}>
                {stat.valeur}
              </p>
              <p className="font-sans text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>
                {stat.libelle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
