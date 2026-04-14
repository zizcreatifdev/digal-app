-- Migration: drop_box_files table
-- Mode 2 créateur — dépôt libre de fichiers par client
-- Accessible au créateur pour upload ; CM/DM valide ou rejette

CREATE TABLE IF NOT EXISTS public.drop_box_files (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- owner (DM/CM)
  client_id   uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- créateur
  file_url    text NOT NULL,
  file_name   text NOT NULL,
  file_type   text,
  description text,
  statut      text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'rejete')),
  commentaire text,
  reviewed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.drop_box_files ENABLE ROW LEVEL SECURITY;

-- Owner (DM/CM) can manage all files for their account
CREATE POLICY "Owners manage drop_box_files"
  ON public.drop_box_files FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Creators can insert files and view their own uploads
CREATE POLICY "Creators can upload drop_box_files"
  ON public.drop_box_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Creators can view their uploads"
  ON public.drop_box_files FOR SELECT
  TO authenticated
  USING (auth.uid() = uploaded_by OR auth.uid() = user_id);
