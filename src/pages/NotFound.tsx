import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 animate-fade-in">
        <h1 className="text-8xl font-bold font-serif text-primary">404</h1>
        <p className="text-xl text-muted-foreground font-sans">
          Cette page n'existe pas
        </p>
        <Button onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
