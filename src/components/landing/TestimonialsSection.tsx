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

const CARD = {
  bg: "#FAF7F4",
  text: "#111111",
  sub: "#777777",
  avatarBg: "rgba(232,81,26,0.12)",
  avatarText: "#E8511A",
  border: "1px solid rgba(80,30,10,0.08)",
  boxShadow: "0 2px 12px rgba(80,30,10,0.08)",
} as const;

/* ── Carte ────────────────────────────────────────────────── */
interface CardProps {
  testimonial: Testimonial;
  idx: number;
  visible: boolean;
  refCb: (el: HTMLDivElement | null) => void;
}

function TestimonialCard({ testimonial, idx, visible, refCb }: CardProps) {
  const delay = idx * 80;

  const initials = testimonial.nom
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      ref={refCb}
      data-idx={idx}
      className="rounded-2xl p-6 flex flex-col gap-4"
      style={{
        backgroundColor: CARD.bg,
        border: CARD.border,
        boxShadow: CARD.boxShadow,
        minHeight: 220,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
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
            className="h-12 w-12 rounded-full object-cover shrink-0"
            style={{ border: CARD.border }}
          />
        ) : (
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
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
  const [visibleSet, setVisibleSet] = useState<Set<number>>(new Set());
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    supabase
      .from("testimonials")
      .select("id, nom, fonction, texte, photo_url, est_actif, ordre")
      .eq("est_actif", true)
      .order("ordre")
      .then(({ data }) => {
        if (data && data.length > 0) {
          refs.current = Array(data.length).fill(null);
          setTestimonials(data as Testimonial[]);
        }
      });
  }, []);

  useEffect(() => {
    if (testimonials.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-idx"));
            setVisibleSet((prev) => new Set([...prev, idx]));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    refs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [testimonials]);

  if (testimonials.length === 0) return null;

  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-[#111111] mb-3">
            Ce que disent nos utilisateurs
          </h2>
          <p className="font-sans text-[#777777] text-lg">
            Ils ont transformé leur workflow avec Digal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, idx) => (
            <TestimonialCard
              key={t.id}
              testimonial={t}
              idx={idx}
              visible={visibleSet.has(idx)}
              refCb={(el) => { refs.current[idx] = el; }}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
