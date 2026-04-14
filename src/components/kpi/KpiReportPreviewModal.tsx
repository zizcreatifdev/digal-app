import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { KpiReportPreview, type KpiReportPreviewData } from "./KpiReportPreview";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: KpiReportPreviewData;
  onDownload: () => void;
}

export function KpiReportPreviewModal({ open, onOpenChange, data, onDownload }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white border-b">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Aperçu du rapport KPI</h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={onDownload}>
              <Download className="h-3.5 w-3.5 mr-1" /> Télécharger PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-6">
          <KpiReportPreview data={data} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
