import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  nom: string;
  fonction: string;
  texte: string;
  photo_url: string | null;
  est_actif: boolean;
  ordre: number;
}

/* ── Couleur unique crème ────────────────────────────────── */
const CARD = {
  bg: "#FAF7F4",
  text: "#111111",
  sub: "#777777",
  avatarBg: "rgba(232,81,26,0.12)",
  avatarText: "#E8511A",
  border: "1px solid rgba(80,30,10,0.08)",
  boxShadow: "0 2px 12px rgba(80,30,10,0.08)",
} as const;

/* ── 7 emplacements : colonne, hauteur min ───────────────── */
const SLOTS = [
  { col: "left",   minH: 280 },
  { col: "left",   minH: 180 },
  { col: "center", minH: 210 },
  { col: "center", minH: 210 },
  { col: "center", minH: 210 },
  { col: "right",  minH: 180 },
  { col: "right",  minH: 280 },
] as const;

/* délais stagger en ms */
const DELAYS = [0, 120, 60, 180, 300, 90, 210];

/* ── Carte ────────────────────────────────────────────────── */
interface CardProps {
  testimonial: Testimonial;
  slotIdx: number;
  visible: boolean;
  refCb: (el: HTMLDivElement | null) => void;
}

function TestimonialCard({ testimonial, slotIdx, visible, refCb }: CardProps) {
  const slot = SLOTS[slotIdx];

  const initials = testimonial.nom
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      ref={refCb}
      data-slot={slotIdx}
      className="rounded-2xl p-6 flex flex-col gap-4"
      style={{
        backgroundColor: CARD.bg,
        border: CARD.border,
        boxShadow: CARD.boxShadow,
        minHeight: slot.minH,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.55s ease ${DELAYS[slotIdx]}ms, transform 0.55s ease ${DELAYS[slotIdx]}ms`,
      }}
    >
      {/* Citation */}
      <p
        className="font-sans text-sm leading-relaxed italic flex-1"
        style={{ color: CARD.sub }}
      >
        &ldquo;{testimonial.texte}&rdquo;
      </p>

      {/* Auteur */}
      <div className="flex items-center gap-3">
        {testimonial.photo_url ? (
          <img
            src={testimonial.photo_url}
            alt={testimonial.nom}
            className="h-16 w-16 rounded-full object-cover shrink-0"
            style={{ border: CARD.border }}
          />
        ) : (
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: CARD.avatarBg }}
          >
            <span
              className="font-semibold font-sans text-sm"
              style={{ color: CARD.avatarText }}
            >
              {initials}
            </span>
          </div>
        )}
        <div>
          <p className="font-semibold font-sans text-sm" style={{ color: CARD.text }}>
            {testimonial.nom}
          </p>
          <p className="font-sans text-xs" style={{ color: CARD.sub }}>
            {testimonial.fonction}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Section principale ──────────────────────────────────── */
export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [visibleSlots, setVisibleSlots] = useState<Set<number>>(new Set());
  const refs = useRef<Array<HTMLDivElement | null>>(Array(SLOTS.length).fill(null));

  /* Chargement Supabase */
  useEffect(() => {
    supabase
      .from("testimonials")
      .select("id, nom, fonction, texte, photo_url, est_actif, ordre")
      .eq("est_actif", true)
      .order("ordre")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTestimonials(data as Testimonial[]);
        }
      });
  }, []);

  /* IntersectionObserver — fade-in-up au scroll */
  useEffect(() => {
    if (testimonials.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-slot"));
            setVisibleSlots((prev) => new Set([...prev, idx]));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    refs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [testimonials]);

  if (testimonials.length === 0) return null;

  /* Distribution des 7 emplacements par colonne */
  const leftSlots   = [0, 1];
  const centerSlots = [2, 3, 4];
  const rightSlots  = [5, 6];

  const renderCard = (slotIdx: number) => (
    <TestimonialCard
      key={slotIdx}
      testimonial={testimonials[slotIdx % testimonials.length]}
      slotIdx={slotIdx}
      visible={visibleSlots.has(slotIdx)}
      refCb={(el) => { refs.current[slotIdx] = el; }}
    />
  );

  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">

        {/* En-tête */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-[#111111] mb-3">
            Ce que disent nos utilisateurs
          </h2>
          <p className="font-sans text-[#777777] text-lg">
            Ils ont transformé leur workflow avec Digal
          </p>
        </div>

        {/* Grille 3 colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Colonne gauche : grande + petite */}
          <div className="flex flex-col gap-4">
            {leftSlots.map(renderCard)}
          </div>

          {/* Colonne centre : 3 cartes égales */}
          <div className="flex flex-col gap-4">
            {centerSlots.map(renderCard)}
          </div>

          {/* Colonne droite : petite + grande */}
          <div className="flex flex-col gap-4">
            {rightSlots.map(renderCard)}
          </div>

        </div>
      </div>
    </section>
  );
}
