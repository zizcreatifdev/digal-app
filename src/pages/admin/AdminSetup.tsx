import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminSetup = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "owner_setup_done")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value === "true") setAlreadyDone(true);
        setChecking(false);
      });
  }, []);

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("setup-owner");
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setSuccess(true);
    } catch (err: unknown) {
      setError((err as Error).message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-serif">Configuration Digal</CardTitle>
          <CardDescription>
            Initialisation du compte Owner de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {alreadyDone ? (
            <div className="text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Le compte Owner a déjà été créé. Connectez-vous sur{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">/login</Link>.
              </p>
            </div>
          ) : success ? (
            <div className="text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
              <p className="font-medium text-green-700">Compte Owner créé avec succès</p>
              <p className="text-sm text-muted-foreground">
                Rendez-vous sur{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">/login</Link>{" "}
                pour vous connecter avec <strong>ziza@digal.sn</strong>
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  <XCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <Button
                onClick={handleSetup}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Créer le compte Owner Digal"
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Cette action ne peut être effectuée qu'une seule fois.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;
