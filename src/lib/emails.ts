import { supabase } from "@/integrations/supabase/client";

type EmailType = "bienvenue" | "expiration_30" | "expiration_15" | "expiration_7" | "renouvellement";

interface SendEmailOptions {
  type: EmailType;
  to: string;
  prenom?: string;
  expiration_date?: string;
  plan?: string;
}

/**
 * Sends a transactional email via the `send-email` Supabase Edge Function.
 * Errors are logged silently — email failures must never crash the app.
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("send-email", {
      body: options,
    });
    if (error) {
      console.warn("[emails] send-email error:", error.message);
    }
  } catch (err) {
    console.warn("[emails] send-email exception:", err);
  }
}

export async function sendWelcomeEmail(to: string, prenom: string): Promise<void> {
  return sendEmail({ type: "bienvenue", to, prenom });
}

export async function sendExpiryWarning(
  to: string,
  prenom: string,
  daysLeft: 30 | 15 | 7,
  expiration_date: string,
  plan: string
): Promise<void> {
  const type: EmailType =
    daysLeft === 30 ? "expiration_30"
    : daysLeft === 15 ? "expiration_15"
    : "expiration_7";
  return sendEmail({ type, to, prenom, expiration_date, plan });
}

export async function sendRenewalConfirmation(
  to: string,
  prenom: string,
  expiration_date: string,
  plan: string
): Promise<void> {
  return sendEmail({ type: "renouvellement", to, prenom, expiration_date, plan });
}
