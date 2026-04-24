import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const OUTPUT_SIZE = 400;
const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const MAX_BYTES = 5 * 1024 * 1024;

function cropToBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d")!;

  // Scale from rendered size → natural size
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0, 0, OUTPUT_SIZE, OUTPUT_SIZE,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("canvas empty"))),
      "image/png",
      0.92,
    );
  });
}

interface ImageCropModalProps {
  file: File | null;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropModal({ file, onConfirm, onCancel }: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  useEffect(() => {
    if (!file) { setImgSrc(""); return; }
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    setCrop(undefined);
    setCompletedCrop(undefined);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    setCrop(centerCrop(makeAspectCrop({ unit: "%", width: 90 }, 1, w, h), w, h));
  }, []);

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop?.width) return;
    const blob = await cropToBlob(imgRef.current, completedCrop);
    onConfirm(blob);
  };

  const ready = !!completedCrop?.width;

  return (
    <Dialog open={!!file} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Recadrer le logo</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground font-sans -mt-2">
          Déplacez et redimensionnez le cadre carré pour choisir la zone à conserver.
        </p>

        {imgSrc && (
          <div className="flex justify-center overflow-auto max-h-[420px]">
            <ReactCrop
              crop={crop}
              onChange={(_, pct) => setCrop(pct)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              minWidth={40}
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt=""
                onLoad={onImageLoad}
                style={{ maxHeight: 400, maxWidth: "100%", display: "block" }}
              />
            </ReactCrop>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4" />
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={!ready}>
            <Check className="h-4 w-4" />
            Confirmer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-export helpers consumers may need
export { ACCEPT as LOGO_ACCEPT, MAX_BYTES as LOGO_MAX_BYTES };
