import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface AdminPlaceholderProps {
  title: string;
}

const AdminPlaceholder = ({ title }: AdminPlaceholderProps) => (
  <AdminLayout>
    <div className="animate-fade-in space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Construction className="h-12 w-12 mb-4" />
          <p className="font-sans text-lg">Cette section est en cours de développement.</p>
        </CardContent>
      </Card>
    </div>
  </AdminLayout>
);

export default AdminPlaceholder;
