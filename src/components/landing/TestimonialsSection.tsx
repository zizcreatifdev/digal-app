import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Quote } from "lucide-react";

interface Testimonial {
  id: string;
  texte: string;
  nom: string;
  fonction: string;
  photo_url: string | null;
}

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

function TestimonialCard({
  testimonial,
  onSwipe,
  isTop,
}: {
  testimonial: Testimonial;
  onSwipe: (dir: "left" | "right") => void;
  isTop: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) > 100) {
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  };

  const initials = testimonial.nom
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={isTop ? "x" : false}
      dragElastic={0.2}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      whileDrag={{ scale: 1.03 }}
    >
      <div className="glass-card h-full p-8 flex flex-col justify-between select-none">
        <div className="space-y-4">
          <Quote className="h-8 w-8 text-primary/40" />
          <p className="text-foreground/80 font-sans text-base leading-relaxed italic">
            &ldquo;{testimonial.texte}&rdquo;
          </p>
        </div>
        <div className="flex items-center gap-4 mt-6">
          {testimonial.photo_url ? (
            <img
              src={testimonial.photo_url}
              alt={testimonial.nom}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center">
              <span className="text-primary font-semibold font-sans text-sm">{initials}</span>
            </div>
          )}
          <div>
            <p className="font-semibold font-sans text-foreground text-sm">{testimonial.nom}</p>
            <p className="text-muted-foreground font-sans text-xs">{testimonial.fonction}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(STATIC_FALLBACK);
  const [stack, setStack] = useState<Testimonial[]>([]);

  useEffect(() => {
    supabase
      .from("testimonials")
      .select("id, texte, nom, fonction, photo_url")
      .eq("actif", true)
      .order("ordre", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTestimonials(data as Testimonial[]);
        }
      });
  }, []);

  useEffect(() => {
    setStack([...testimonials].reverse());
  }, [testimonials]);

  const handleSwipe = () => {
    setStack((prev) => {
      if (prev.length === 0) return prev;
      const [, ...rest] = [...prev].reverse();
      if (rest.length === 0) {
        return [...testimonials].reverse();
      }
      return rest.reverse();
    });
  };

  const visible = [...stack].reverse().slice(0, 3);

  return (
    <section className="py-24 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold font-sans mb-4">
            Témoignages
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground mb-4">
            Ils font confiance à Digal
          </h2>
          <p className="text-muted-foreground font-sans text-lg max-w-xl mx-auto">
            Des community managers et agences au Sénégal qui ont transformé leur activité.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Card stack */}
          <div className="relative w-full max-w-sm mx-auto lg:mx-0 flex-shrink-0" style={{ height: 320 }}>
            <AnimatePresence>
              {visible.map((t, i) => {
                const isTop = i === visible.length - 1;
                const offset = (visible.length - 1 - i) * 8;
                const scale = 1 - (visible.length - 1 - i) * 0.04;
                return (
                  <motion.div
                    key={t.id}
                    className="absolute inset-0"
                    style={{
                      y: offset,
                      scale,
                      zIndex: i,
                    }}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale }}
                    exit={{ opacity: 0, x: 300, rotate: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TestimonialCard
                      testimonial={t}
                      onSwipe={handleSwipe}
                      isTop={isTop}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Stats / copy */}
          <div className="flex-1 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              {[
                { value: "500+", label: "Community Managers actifs" },
                { value: "3h", label: "Économisées par jour en moyenne" },
                { value: "98%", label: "Taux de satisfaction client" },
                { value: "2×", label: "Plus de clients fidélisés" },
              ].map((stat) => (
                <div key={stat.label} className="glass-card p-5">
                  <p className="text-3xl font-bold font-serif text-primary">{stat.value}</p>
                  <p className="text-muted-foreground font-sans text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground font-sans text-sm">
              Faites glisser les cartes pour découvrir d&rsquo;autres avis.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
