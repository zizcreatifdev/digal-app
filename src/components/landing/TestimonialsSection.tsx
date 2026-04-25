import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

/* ── Types ─────────────────────────────────────────────── */
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

type Position = "front" | "middle" | "back";

/* ── Defaults ───────────────────────────────────────────── */
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

/* ── Carte individuelle ─────────────────────────────────── */
function TestimonialCard({
  testimonial,
  position,
  handleShuffle,
}: {
  testimonial: Testimonial;
  position: Position;
  handleShuffle: () => void;
}) {
  const dragStartX = useRef(0);
  const isFront = position === "front";

  const initials = testimonial.nom
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      style={{
        zIndex: position === "front" ? 2 : position === "middle" ? 1 : 0,
      }}
      animate={{
        rotate:
          position === "front" ? "-6deg" : position === "middle" ? "0deg" : "6deg",
        x:
          position === "front" ? "0%" : position === "middle" ? "33%" : "66%",
      }}
      drag={isFront ? "x" : false}
      dragElastic={0.35}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onDragStart={(e) => {
        dragStartX.current = (e as PointerEvent).clientX;
      }}
      onDragEnd={(e) => {
        if (dragStartX.current - (e as PointerEvent).clientX > 150) {
          handleShuffle();
        }
        dragStartX.current = 0;
      }}
      transition={{ duration: 0.35 }}
      className={`absolute left-0 top-0 h-[450px] w-[350px] select-none glass-card p-6 flex flex-col items-center gap-5 ${
        isFront ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      {/* Photo en haut */}
      {testimonial.photo_url ? (
        <img
          src={testimonial.photo_url}
          alt={testimonial.nom}
          className="pointer-events-none h-28 w-28 rounded-full object-cover ring-4 ring-primary/20 mt-2"
        />
      ) : (
        <div className="pointer-events-none mt-2 h-28 w-28 rounded-full bg-primary/10 ring-4 ring-primary/20 flex items-center justify-center">
          <span className="text-3xl font-bold text-primary font-sans">{initials}</span>
        </div>
      )}

      {/* Citation */}
      <p className="pointer-events-none text-center text-muted-foreground font-sans text-sm leading-relaxed italic flex-1">
        &ldquo;{testimonial.texte}&rdquo;
      </p>

      {/* Auteur */}
      <div className="pointer-events-none text-center">
        <p className="font-semibold font-sans text-foreground">{testimonial.nom}</p>
        {testimonial.fonction && (
          <p className="text-primary font-sans text-sm mt-0.5">{testimonial.fonction}</p>
        )}
      </div>
    </motion.div>
  );
}

/* ── Section ────────────────────────────────────────────── */
export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(STATIC_FALLBACK);
  const [section, setSection] = useState<SectionConfig>(DEFAULT_SECTION);
  const [stats, setStats] = useState<Stat[]>(DEFAULT_STATS);
  const [positions, setPositions] = useState<Position[]>(["front", "middle", "back"]);

  useEffect(() => {
    supabase
      .from("testimonials")
      .select("id, texte, nom, fonction, photo_url")
      .eq("actif", true)
      .order("ordre", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setTestimonials(data as Testimonial[]);
      });

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

  const handleShuffle = () => {
    setPositions((prev) => {
      const next = [...prev] as Position[];
      next.unshift(next.pop()!);
      return next;
    });
  };

  const displayed = testimonials.slice(0, 3);

  return (
    <section className="py-24 px-4 bg-background overflow-hidden">
      <div className="max-w-6xl mx-auto">

        {/* En-tête */}
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold font-sans mb-4">
            {section.badge}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground mb-4">
            {section.titre}
          </h2>
          <p className="text-muted-foreground font-sans text-lg max-w-xl mx-auto">
            {section.sous_titre}
          </p>
        </div>

        {/* Stack de cartes — même conteneur que la référence */}
        <div className="grid place-content-center mb-6">
          <div className="relative -ml-[100px] h-[450px] w-[350px] md:-ml-[175px]">
            {displayed.map((t, i) => (
              <TestimonialCard
                key={t.id}
                testimonial={t}
                position={positions[i] ?? "back"}
                handleShuffle={handleShuffle}
              />
            ))}
          </div>
        </div>

        {/* Indication glisser */}
        <p className="text-center text-muted-foreground font-sans text-xs mb-16">
          ← Glissez la carte vers la gauche pour voir le suivant
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.libelle} className="glass-card p-5 text-center">
              <p className="text-3xl font-bold font-serif text-primary">{stat.valeur}</p>
              <p className="text-muted-foreground font-sans text-sm mt-1">{stat.libelle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
