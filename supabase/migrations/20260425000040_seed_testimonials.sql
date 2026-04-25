-- Témoignages par défaut (visibles immédiatement)
insert into public.testimonials (texte, nom, fonction, ordre, actif) values
  ('Digal a complètement transformé ma façon de gérer mes clients. Je gagne au moins 3h par jour sur la création de contenu et les rapports.', 'Aminata Diallo', 'Community Manager Freelance', 0, true),
  ('Enfin un outil pensé pour le marché africain. La gestion de la TVA et du BRS en automatique, c''est un gain de temps énorme pour mon agence.', 'Moussa Sow', 'Directeur, Agence Pixel', 1, true),
  ('Mes clients adorent les rapports de performance. Ça m''a permis de justifier mes tarifs et de fidéliser tout mon portefeuille.', 'Fatou Ndiaye', 'CM & Stratège Digital', 2, true)
on conflict do nothing;
