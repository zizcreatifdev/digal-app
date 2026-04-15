import { useEffect, useRef } from "react";

const items = [
  "Calendrier éditorial brandé",
  "Validation client en 1 clic",
  "Aperçus natifs Instagram",
  "Facebook",
  "LinkedIn",
  "TikTok",
  "X",
  "Facturation FCFA intégrée",
  "Stockage éphémère intelligent",
  "3 rôles distincts · DM · CM · Créateur",
];

export function MarqueeBanner() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationId: number;
    let position = 0;

    const scroll = () => {
      position -= 0.5;
      const firstChild = el.firstElementChild as HTMLElement | null;
      if (firstChild && Math.abs(position) >= firstChild.offsetWidth + 32) {
        position = 0;
        el.appendChild(firstChild);
      }
      el.style.transform = `translateX(${position}px)`;
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Double the items for seamless loop
  const allItems = [...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden bg-foreground py-3">
      <div ref={scrollRef} className="flex items-center whitespace-nowrap gap-8 will-change-transform">
        {allItems.map((item, i) => (
          <span key={i} className="flex items-center gap-8 shrink-0">
            <span className="text-sm font-sans font-medium text-background/80">{item}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          </span>
        ))}
      </div>
    </div>
  );
}
