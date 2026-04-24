import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Check, X } from "lucide-react";

const CROP_SIZE = 280;
const OUTPUT_SIZE = 400;

interface LogoCropModalProps {
  file: File | null;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

export function LogoCropModal({ file, onConfirm, onCancel }: LogoCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const [imgSrc, setImgSrc] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natW, setNatW] = useState(0);
  const [natH, setNatH] = useState(0);
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    if (!file) { setImgSrc(""); setNatW(0); setNatH(0); return; }
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setFitScale(1);
    setNatW(0);
    setNatH(0);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNatW(img.naturalWidth);
    setNatH(img.naturalHeight);
    setFitScale(CROP_SIZE / Math.min(img.naturalWidth, img.naturalHeight));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const stopDrag = () => { dragging.current = false; };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(3, Math.max(1, z - e.deltaY * 0.002)));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragging.current = true;
      dragStart.current = { x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && dragging.current) {
      setOffset({ x: e.touches[0].clientX - dragStart.current.x, y: e.touches[0].clientY - dragStart.current.y });
    }
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || natW === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d")!;

    // Map the visible crop area (0,0)→(CROP_SIZE,CROP_SIZE) back to natural image coords.
    // Image center sits at (CROP_SIZE/2 + offset.x, CROP_SIZE/2 + offset.y) in the container.
    // totalScale converts natural → display pixels.
    const totalScale = fitScale * zoom;
    const sx = (-CROP_SIZE / 2 - offset.x) / totalScale + natW / 2;
    const sy = (-CROP_SIZE / 2 - offset.y) / totalScale + natH / 2;
    const sSize = CROP_SIZE / totalScale;

    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    canvas.toBlob((blob) => { if (blob) onConfirm(blob); }, "image/png", 0.92);
  };

  const dispW = natW * fitScale * zoom;
  const dispH = natH * fitScale * zoom;

  return (
    <Dialog open={!!file} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif">Recadrer le logo</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground font-sans -mt-2">
          Déplacez et zoomez pour choisir la zone à conserver (1:1).
        </p>

        {/* Crop viewport — square frame with overflow hidden */}
        <div
          className="relative mx-auto overflow-hidden rounded-2xl border-2 border-primary bg-muted cursor-grab active:cursor-grabbing select-none"
          style={{ width: CROP_SIZE, height: CROP_SIZE }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={stopDrag}
        >
          {imgSrc && dispW > 0 && (
            <img
              ref={imgRef}
              src={imgSrc}
              alt=""
              onLoad={handleImgLoad}
              draggable={false}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: dispW,
                height: dispH,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                maxWidth: "none",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          )}
          {/* Hidden img for initial load (triggers onLoad before dispW > 0) */}
          {imgSrc && dispW === 0 && (
            <img
              ref={imgRef}
              src={imgSrc}
              alt=""
              onLoad={handleImgLoad}
              style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
            />
          )}
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline" size="icon" className="h-8 w-8 shrink-0"
            onClick={() => setZoom(z => Math.max(1, +(z - 0.1).toFixed(2)))}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <input
            type="range" min={1} max={3} step={0.01}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-primary h-1.5"
          />
          <Button
            variant="outline" size="icon" className="h-8 w-8 shrink-0"
            onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(2)))}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4" />
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={natW === 0}>
            <Check className="h-4 w-4" />
            Confirmer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
