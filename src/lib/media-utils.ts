import imageCompression from "browser-image-compression";

const MAX_IMAGE_SIZE_MB = 2;
const MAX_MP4_SIZE_MB = 500;
const MAX_PDF_SIZE_MB = 50;
const MAX_FILES = 10;

export interface MediaFile {
  file: File;
  preview: string; // object URL
  id: string;      // random key for React list
}

export function createMediaFile(file: File): MediaFile {
  return {
    file,
    preview: URL.createObjectURL(file),
    id: `${Date.now()}-${Math.random()}`,
  };
}

export function revokeMediaFile(mf: MediaFile) {
  URL.revokeObjectURL(mf.preview);
}

export const ACCEPT_BY_NETWORK: Record<string, string> = {
  instagram: "image/jpeg,image/png,video/mp4",
  facebook:  "image/jpeg,image/png,video/mp4",
  linkedin:  "image/jpeg,image/png,video/mp4,application/pdf",
  x:         "image/jpeg,image/png,video/mp4",
  tiktok:    "video/mp4",
};

export function validateMediaFile(
  file: File,
  reseau: string
): string | null {
  const sizeMB = file.size / (1024 * 1024);

  if (file.type === "video/mp4" && sizeMB > MAX_MP4_SIZE_MB) {
    return `Vidéo trop lourde (${sizeMB.toFixed(0)} Mo, max ${MAX_MP4_SIZE_MB} Mo)`;
  }
  if (file.type === "application/pdf" && sizeMB > MAX_PDF_SIZE_MB) {
    return `PDF trop lourd (${sizeMB.toFixed(0)} Mo, max ${MAX_PDF_SIZE_MB} Mo)`;
  }
  if ((file.type === "image/jpeg" || file.type === "image/png") && sizeMB > 10) {
    return `Image trop lourde (${sizeMB.toFixed(0)} Mo, max 10 Mo avant compression)`;
  }

  // TikTok: only MP4
  if (reseau === "tiktok" && file.type !== "video/mp4") {
    return "TikTok accepte uniquement les fichiers MP4";
  }

  return null;
}

export { MAX_FILES, MAX_IMAGE_SIZE_MB };

export async function compressImageFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> {
  if (!file.type.startsWith("image/")) return file; // only compress images

  const compressed = await imageCompression(file, {
    maxSizeMB: MAX_IMAGE_SIZE_MB,
    maxWidthOrHeight: 2400,
    useWebWorker: true,
    onProgress,
  });

  // Preserve original file name
  return new File([compressed], file.name, { type: compressed.type });
}
