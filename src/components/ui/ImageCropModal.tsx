import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import imageCompression from "browser-image-compression";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2, X } from "lucide-react";

const OUTPUT_SIZE = 400;
const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const MAX_BYTES = 5 * 1024 * 1024;
const COMPRESS_THRESHOLD = 200 * 1024; // 200 KB

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.2,
  maxWidthOrHeight: 400,
  useWebWorker: true,
  fileType: "image/png" as const,
};

function cropToBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d")!;

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
  aspect?: number;
}

export function ImageCropModal({ file, onConfirm, onCancel, aspect = 1 }: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);

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

    setCompressing(true);
    setProgress(0);
    try {
      const rawBlob = await cropToBlob(imgRef.current, completedCrop);

      let finalBlob: Blob = rawBlob;
      if (rawBlob.size > COMPRESS_THRESHOLD) {
        const rawFile = new File([rawBlob], "logo.png", { type: "image/png" });
        const compressed = await imageCompression(rawFile, {
          ...COMPRESSION_OPTIONS,
          onProgress: setProgress,
        });
        finalBlob = compressed;
      }

      onConfirm(finalBlob);
    } finally {
      setCompressing(false);
      setProgress(0);
    }
  };

  const ready = !!completedCrop?.width && !compressing;

  return (
    <Dialog open={!!file} onOpenChange={(v) => { if (!v && !compressing) onCancel(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Recadrer le logo</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground font-sans -mt-2">
          Déplacez et redimensionnez le cadre pour choisir la zone à conserver.
        </p>

        {imgSrc && (
          <div className="flex justify-center overflow-auto max-h-[420px]">
            <ReactCrop
              crop={crop}
              onChange={(_, pct) => setCrop(pct)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
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

        {/* Compression progress bar — only visible while compressing */}
        {compressing && (
          <div className="space-y-1.5 px-0.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-sans">
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Compression…
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" onClick={onCancel} disabled={compressing}>
            <X className="h-4 w-4" />
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={!ready}>
            {compressing
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Check className="h-4 w-4" />
            }
            Confirmer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-export helpers consumers may need
export { ACCEPT as LOGO_ACCEPT, MAX_BYTES as LOGO_MAX_BYTES };
