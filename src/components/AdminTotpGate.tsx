import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Copy } from "lucide-react";
import { toast } from "sonner";

interface AdminTotpGateProps {
  children: React.ReactNode;
}

type GateState = "loading" | "needs-enroll" | "needs-verify" | "verified";

export function AdminTotpGate({ children }: AdminTotpGateProps) {
  const { user } = useAuth();
  const [state, setState] = useState<GateState>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkMfaStatus();
  }, [user]);

  useEffect(() => {
    if (!qrUri) return;
    QRCode.toDataURL(qrUri, { width: 200, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [qrUri]);

  async function checkMfaStatus() {
    setState("loading");
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) {
      setState("needs-enroll");
      return;
    }

    if (data.currentLevel === "aal2") {
      setState("verified");
      return;
    }

    // Check if user has any TOTP factors
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const totpFactors = factorsData?.totp ?? [];

    if (totpFactors.length === 0) {
      setState("needs-enroll");
    } else {
      setFactorId(totpFactors[0].id);
      setState("needs-verify");
    }
  }

  async function handleEnroll() {
    setSubmitting(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Digal Admin TOTP",
    });
    setSubmitting(false);

    if (error) {
      toast.error("Erreur lors de l'activation 2FA : " + error.message);
      return;
    }

    setFactorId(data.id);
    setQrUri(data.totp.uri);
    setSecret(data.totp.secret);
    setState("needs-verify");
  }

  async function handleVerify() {
    if (!factorId || code.length < 6) return;
    setSubmitting(true);

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError) {
      toast.error("Erreur de challenge : " + challengeError.message);
      setSubmitting(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    setSubmitting(false);

    if (verifyError) {
      toast.error("Code invalide. Réessayez.");
      setCode("");
      return;
    }

    toast.success("Vérification 2FA réussie !");
    setState("verified");
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state === "verified") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>
            {state === "needs-enroll" ? "Activer la double authentification" : "Vérification 2FA"}
          </CardTitle>
          <CardDescription className="font-sans">
            {state === "needs-enroll"
              ? "L'accès admin nécessite l'activation de la double authentification (TOTP)."
              : "Entrez le code à 6 chiffres de votre application d'authentification."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "needs-enroll" && !qrUri && (
            <Button onClick={handleEnroll} disabled={submitting} className="w-full">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Configurer l'application TOTP
            </Button>
          )}

          {qrUri && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code TOTP"
                    className="rounded-lg border"
                    width={200}
                    height={200}
                  />
                ) : (
                  <div className="h-[200px] w-[200px] flex items-center justify-center rounded-lg border bg-muted">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              {secret && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-sans">Clé secrète (copier manuellement)</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">{secret}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(secret);
                        toast.success("Clé copiée !");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground font-sans text-center">
                Scannez ce QR code avec Google Authenticator, Authy ou 1Password.
              </p>
            </div>
          )}

          {(state === "needs-verify" || qrUri) && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="totp-code" className="font-sans">Code à 6 chiffres</Label>
                <Input
                  id="totp-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-lg tracking-widest font-mono"
                  maxLength={6}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
              </div>
              <Button
                onClick={handleVerify}
                disabled={submitting || code.length < 6}
                className="w-full"
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Vérifier
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
