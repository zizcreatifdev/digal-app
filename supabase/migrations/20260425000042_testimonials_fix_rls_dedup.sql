-- Fix 1 : ajouter WITH CHECK (true) pour autoriser les INSERT/UPDATE via RLS
DROP POLICY IF EXISTS "Owner can manage testimonials" ON public.testimonials;
CREATE POLICY "Owner can manage testimonials"
  ON public.testimonials FOR ALL
  USING (true)
  WITH CHECK (true);

-- Fix 2 : supprimer les doublons, garder le plus récent par nom
DELETE FROM public.testimonials
WHERE id NOT IN (
  SELECT DISTINCT ON (nom) id
  FROM public.testimonials
  ORDER BY nom, created_at DESC
);
