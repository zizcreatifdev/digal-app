import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { ImageCropModal, LOGO_ACCEPT, LOGO_MAX_BYTES } from "@/components/ui/ImageCropModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { updateClient, type Client } from "@/lib/clients";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface ClientLogoButtonProps {
  client: Client;
  size?: "sm" | "lg";
  onLogoChange: (newUrl: string) => void;
  className?: string;
}

export function ClientLogoButton({ client, size = "sm", onLogoChange, className }: ClientLogoButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const dim = size === "lg" ? "h-14 w-14 text-xl" : "h-10 w-10 text-sm";
  const iconDim = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > LOGO_MAX_BYTES) {
      toast.error("Fichier trop lourd (max 5 Mo)");
      e.target.value = "";
      return;
    }
    setPendingFile(file);
    e.target.value = "";
  };

  const handleCropConfirm = async (blob: Blob) => {
    setPendingFile(null);
    if (!user) return;
    setUploading(true);
    try {
      const path = `${user.id}/client-logos/${Date.now()}.png`;
      const { error } = await supabase.storage
        .from("user-uploads")
        .upload(path, blob, { contentType: "image/png", upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("user-uploads").getPublicUrl(path);
      await updateClient(client.id, { logo_url: publicUrl });
      onLogoChange(publicUrl);
      queryClient.invalidateQueries({ queryKey: ["client", client.id] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Logo mis à jour partout ✅");
    } catch {
      toast.error("Erreur lors de la mise à jour du logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div
        role="button"
        aria-label="Modifier le logo"
        title="Modifier le logo"
        className={cn("relative group cursor-pointer shrink-0", className)}
        onClick={handleClick}
      >
        {/* Logo or initial */}
        <div
          className={cn("rounded-xl flex items-center justify-center overflow-hidden font-bold font-serif text-white", dim)}
          style={{ backgroundColor: client.logo_url ? "transparent" : (client.couleur_marque || "hsl(var(--primary))") }}
        >
          {client.logo_url ? (
            <img src={client.logo_url} alt={client.nom} className="h-full w-full object-cover" />
          ) : (
            <span>{client.nom.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {/* Hover overlay with camera icon */}
        <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          {uploading
            ? <Loader2 className={cn(iconDim, "text-white animate-spin")} />
            : <Camera className={cn(iconDim, "text-white")} />
          }
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={LOGO_ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />

      <ImageCropModal
        file={pendingFile}
        onConfirm={handleCropConfirm}
        onCancel={() => setPendingFile(null)}
      />
    </>
  );
}
