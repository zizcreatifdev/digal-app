-- Migration: système de support et boîte à idées
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bug', 'question', 'suggestion')),
  sujet TEXT NOT NULL,
  message TEXT NOT NULL,
  statut TEXT DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'lu', 'resolu')),
  reponse TEXT,
  repondu_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own messages"
ON public.support_messages FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own messages"
ON public.support_messages FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Owner can manage all messages"
ON public.support_messages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
