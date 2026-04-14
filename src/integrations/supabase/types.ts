export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          detail: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          type_action: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          detail?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          type_action?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          type_action?: string
          user_id?: string
        }
        Relationships: []
      }
      changelog: {
        Row: {
          created_at: string
          description: string
          id: string
          titre: string
          type_version: string
          version: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          titre: string
          type_version?: string
          version: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          titre?: string
          type_version?: string
          version?: string
        }
        Relationships: []
      }
      client_networks: {
        Row: {
          client_id: string
          created_at: string
          formats: string[] | null
          frequence_posts: number | null
          id: string
          notes_editoriales: string | null
          reseau: string
        }
        Insert: {
          client_id: string
          created_at?: string
          formats?: string[] | null
          frequence_posts?: number | null
          id?: string
          notes_editoriales?: string | null
          reseau: string
        }
        Update: {
          client_id?: string
          created_at?: string
          formats?: string[] | null
          frequence_posts?: number | null
          id?: string
          notes_editoriales?: string | null
          reseau?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_networks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          contact_email: string | null
          contact_nom: string | null
          contact_telephone: string | null
          couleur_marque: string | null
          couleur_secondaire: string | null
          created_at: string
          facturation_adresse: string | null
          facturation_mode: string | null
          id: string
          logo_url: string | null
          nom: string
          statut: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          couleur_marque?: string | null
          couleur_secondaire?: string | null
          created_at?: string
          facturation_adresse?: string | null
          facturation_mode?: string | null
          id?: string
          logo_url?: string | null
          nom: string
          statut?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          couleur_marque?: string | null
          couleur_secondaire?: string | null
          created_at?: string
          facturation_adresse?: string | null
          facturation_mode?: string | null
          id?: string
          logo_url?: string | null
          nom?: string
          statut?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_templates: {
        Row: {
          actif: boolean
          clauses: Json
          created_at: string
          id: string
          nom: string
          owner_cachet_url: string | null
          owner_signature_url: string | null
          plan_slug: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          clauses?: Json
          created_at?: string
          id?: string
          nom?: string
          owner_cachet_url?: string | null
          owner_signature_url?: string | null
          plan_slug: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          clauses?: Json
          created_at?: string
          id?: string
          nom?: string
          owner_cachet_url?: string | null
          owner_signature_url?: string | null
          plan_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          ancien_plan: string | null
          clauses: Json
          created_at: string
          duree_mois: number
          email: string
          id: string
          nom: string
          owner_cachet_url: string | null
          owner_signature_url: string | null
          pdf_url: string | null
          plan_nom: string
          plan_slug: string
          prenom: string
          prix_mensuel: number
          signature_url: string | null
          signed_at: string | null
          statut: string
          template_id: string | null
          type_contrat: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ancien_plan?: string | null
          clauses?: Json
          created_at?: string
          duree_mois?: number
          email: string
          id?: string
          nom: string
          owner_cachet_url?: string | null
          owner_signature_url?: string | null
          pdf_url?: string | null
          plan_nom: string
          plan_slug: string
          prenom: string
          prix_mensuel?: number
          signature_url?: string | null
          signed_at?: string | null
          statut?: string
          template_id?: string | null
          type_contrat?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ancien_plan?: string | null
          clauses?: Json
          created_at?: string
          duree_mois?: number
          email?: string
          id?: string
          nom?: string
          owner_cachet_url?: string | null
          owner_signature_url?: string | null
          pdf_url?: string | null
          plan_nom?: string
          plan_slug?: string
          prenom?: string
          prix_mensuel?: number
          signature_url?: string | null
          signed_at?: string | null
          statut?: string
          template_id?: string | null
          type_contrat?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      depenses: {
        Row: {
          categorie: string
          created_at: string
          date_depense: string
          id: string
          libelle: string
          montant: number
          piece_jointe_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          categorie?: string
          created_at?: string
          date_depense?: string
          id?: string
          libelle: string
          montant?: number
          piece_jointe_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          categorie?: string
          created_at?: string
          date_depense?: string
          id?: string
          libelle?: string
          montant?: number
          piece_jointe_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_lines: {
        Row: {
          brs_applicable: boolean
          created_at: string
          description: string
          document_id: string
          id: string
          montant: number
          ordre: number
          prix_unitaire: number
          quantite: number
        }
        Insert: {
          brs_applicable?: boolean
          created_at?: string
          description?: string
          document_id: string
          id?: string
          montant?: number
          ordre?: number
          prix_unitaire?: number
          quantite?: number
        }
        Update: {
          brs_applicable?: boolean
          created_at?: string
          description?: string
          document_id?: string
          id?: string
          montant?: number
          ordre?: number
          prix_unitaire?: number
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_lines_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string
          converted_from_id: string | null
          created_at: string
          date_echeance: string | null
          date_emission: string
          id: string
          methodes_paiement: string[] | null
          montant_brs: number
          montant_tva: number
          notes: string | null
          numero: string
          sous_total: number
          statut: string
          taux_brs: number
          taux_tva: number
          total: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          converted_from_id?: string | null
          created_at?: string
          date_echeance?: string | null
          date_emission?: string
          id?: string
          methodes_paiement?: string[] | null
          montant_brs?: number
          montant_tva?: number
          notes?: string | null
          numero: string
          sous_total?: number
          statut?: string
          taux_brs?: number
          taux_tva?: number
          total?: number
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          converted_from_id?: string | null
          created_at?: string
          date_echeance?: string | null
          date_emission?: string
          id?: string
          methodes_paiement?: string[] | null
          montant_brs?: number
          montant_tva?: number
          notes?: string | null
          numero?: string
          sous_total?: number
          statut?: string
          taux_brs?: number
          taux_tva?: number
          total?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_converted_from_id_fkey"
            columns: ["converted_from_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_reports: {
        Row: {
          axes_amelioration: string | null
          client_id: string
          created_at: string
          id: string
          metriques: Json
          mois: string
          objectifs: string | null
          pdf_url: string | null
          points_forts: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          axes_amelioration?: string | null
          client_id: string
          created_at?: string
          id?: string
          metriques?: Json
          mois: string
          objectifs?: string | null
          pdf_url?: string | null
          points_forts?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          axes_amelioration?: string | null
          client_id?: string
          created_at?: string
          id?: string
          metriques?: Json
          mois?: string
          objectifs?: string | null
          pdf_url?: string | null
          points_forts?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_emails: {
        Row: {
          corps: string
          created_at: string
          date_envoi: string | null
          destinataires: string
          id: string
          nb_destinataires: number
          objet: string
          statut: string
          updated_at: string
        }
        Insert: {
          corps?: string
          created_at?: string
          date_envoi?: string | null
          destinataires?: string
          id?: string
          nb_destinataires?: number
          objet: string
          statut?: string
          updated_at?: string
        }
        Update: {
          corps?: string
          created_at?: string
          date_envoi?: string | null
          destinataires?: string
          id?: string
          nb_destinataires?: number
          objet?: string
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          lien: string | null
          lu: boolean
          message: string | null
          titre: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lien?: string | null
          lu?: boolean
          message?: string | null
          titre: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lien?: string | null
          lu?: boolean
          message?: string | null
          titre?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      owner_payments: {
        Row: {
          compte_email: string | null
          compte_nom: string
          created_at: string
          date_paiement: string
          id: string
          methode: string
          montant: number
          plan: string
          statut: string
          user_id: string | null
        }
        Insert: {
          compte_email?: string | null
          compte_nom: string
          created_at?: string
          date_paiement?: string
          id?: string
          methode?: string
          montant?: number
          plan?: string
          statut?: string
          user_id?: string | null
        }
        Update: {
          compte_email?: string | null
          compte_nom?: string
          created_at?: string
          date_paiement?: string
          id?: string
          methode?: string
          montant?: number
          plan?: string
          statut?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          created_at: string
          date_paiement: string
          document_id: string
          id: string
          methode: string
          montant: number
          notes: string | null
        }
        Insert: {
          created_at?: string
          date_paiement?: string
          document_id: string
          id?: string
          methode?: string
          montant?: number
          notes?: string | null
        }
        Update: {
          created_at?: string
          date_paiement?: string
          document_id?: string
          id?: string
          methode?: string
          montant?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          actif: boolean
          badge: string | null
          created_at: string
          cta_text: string
          features: Json
          highlighted: boolean
          id: string
          nom: string
          ordre: number
          prix_mensuel: number
          prix_semestriel: number | null
          promo_active: boolean
          promo_label: string | null
          promo_prix_mensuel: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          badge?: string | null
          created_at?: string
          cta_text?: string
          features?: Json
          highlighted?: boolean
          id?: string
          nom: string
          ordre?: number
          prix_mensuel?: number
          prix_semestriel?: number | null
          promo_active?: boolean
          promo_label?: string | null
          promo_prix_mensuel?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          badge?: string | null
          created_at?: string
          cta_text?: string
          features?: Json
          highlighted?: boolean
          id?: string
          nom?: string
          ordre?: number
          prix_mensuel?: number
          prix_semestriel?: number | null
          promo_active?: boolean
          promo_label?: string | null
          promo_prix_mensuel?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_templates: {
        Row: {
          client_id: string | null
          created_at: string
          format: string
          id: string
          reseau: string
          texte: string | null
          titre: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          format: string
          id?: string
          reseau: string
          texte?: string | null
          titre: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          format?: string
          id?: string
          reseau?: string
          texte?: string | null
          titre?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_templates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          assigne_a: string | null
          client_id: string
          created_at: string
          date_publication: string
          format: string
          hashtags: string | null
          id: string
          media_url: string | null
          reseau: string
          review_comment: string | null
          statut: string
          texte: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigne_a?: string | null
          client_id: string
          created_at?: string
          date_publication: string
          format: string
          hashtags?: string | null
          id?: string
          media_url?: string | null
          reseau: string
          review_comment?: string | null
          statut?: string
          texte?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigne_a?: string | null
          client_id?: string
          created_at?: string
          date_publication?: string
          format?: string
          hashtags?: string | null
          id?: string
          media_url?: string | null
          reseau?: string
          review_comment?: string | null
          statut?: string
          texte?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      preview_actions: {
        Row: {
          commentaire: string | null
          created_at: string
          decision: string
          id: string
          post_id: string | null
          preview_link_id: string
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          decision: string
          id?: string
          post_id?: string | null
          preview_link_id: string
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          decision?: string
          id?: string
          post_id?: string | null
          preview_link_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preview_actions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preview_actions_preview_link_id_fkey"
            columns: ["preview_link_id"]
            isOneToOne: false
            referencedRelation: "preview_links"
            referencedColumns: ["id"]
          },
        ]
      }
      preview_links: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string
          id: string
          periode_debut: string
          periode_fin: string
          slug: string
          statut: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at?: string
          id?: string
          periode_debut: string
          periode_fin: string
          slug: string
          statut?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          periode_debut?: string
          periode_fin?: string
          slug?: string
          statut?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preview_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_templates: {
        Row: {
          actif: boolean
          created_at: string
          id: string
          layout: Json
          nom: string
          slug: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          id?: string
          layout?: Json
          nom: string
          slug: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          id?: string
          layout?: Json
          nom?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      salaires: {
        Row: {
          created_at: string
          date_paiement: string | null
          id: string
          inclure_facture: boolean
          membre_nom: string
          methode_paiement: string | null
          mois: string
          salaire_mensuel: number
          statut_paiement: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_paiement?: string | null
          id?: string
          inclure_facture?: boolean
          membre_nom: string
          methode_paiement?: string | null
          mois: string
          salaire_mensuel?: number
          statut_paiement?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_paiement?: string | null
          id?: string
          inclure_facture?: boolean
          membre_nom?: string
          methode_paiement?: string | null
          mois?: string
          salaire_mensuel?: number
          statut_paiement?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string
          detail: string | null
          email: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          detail?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          agence_id: string | null
          agence_nom: string | null
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          licence_expiration: string | null
          logo_url: string | null
          nom: string
          plan: string | null
          prenom: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agence_id?: string | null
          agence_nom?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          licence_expiration?: string | null
          logo_url?: string | null
          nom: string
          plan?: string | null
          prenom: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agence_id?: string | null
          agence_nom?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          licence_expiration?: string | null
          logo_url?: string | null
          nom?: string
          plan?: string | null
          prenom?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          nom: string | null
          prenom: string | null
          statut: string | null
          type_compte: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nom?: string | null
          prenom?: string | null
          statut?: string | null
          type_compte?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nom?: string | null
          prenom?: string | null
          statut?: string | null
          type_compte?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_preview_links: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
