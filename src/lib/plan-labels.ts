export const PLAN_LABELS: Record<string, string> = {
  freemium: "Découverte",
  solo: "CM Pro",
  solo_standard: "CM Pro",
  agence_standard: "Studio",
  agence_pro: "Elite",
  owner: "Owner",
  dm: "Digital Manager",
  cm: "Community Manager",
  createur: "Créateur",
};

export const getPlanLabel = (slug: string): string => {
  return PLAN_LABELS[slug] ?? slug;
};
