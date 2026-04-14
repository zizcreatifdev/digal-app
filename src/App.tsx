import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { AdminTotpGate } from "@/components/AdminTotpGate";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ClientsPage from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import PreviewPage from "./pages/PreviewPage";
import CreatorDashboard from "./pages/CreatorDashboard";
import CalendarPage from "./pages/CalendarPage";
import KpiReportsPage from "./pages/KpiReportsPage";
import TeamJournal from "./pages/TeamJournal";
import Facturation from "./pages/Facturation";
import Comptabilite from "./pages/Comptabilite";
import Journal from "./pages/Journal";
import Settings from "./pages/Settings";
import Changelog from "./pages/Changelog";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Waitlist from "./pages/Waitlist";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminWaitlist from "./pages/admin/AdminWaitlist";
import AdminComptes from "./pages/admin/AdminComptes";
import AdminLicences from "./pages/admin/AdminLicences";
import AdminSecurity from "./pages/admin/AdminSecurity";
import AdminEmails from "./pages/admin/AdminEmails";
import AdminFacturation from "./pages/admin/AdminFacturation";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";
import AdminSetup from "./pages/admin/AdminSetup";
import AdminGuides from "./pages/admin/AdminGuides";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminDocumentation from "./pages/admin/AdminDocumentation";
import AdminContrats from "./pages/admin/AdminContrats";
import AdminProfil from "./pages/admin/AdminProfil";
import DocsPage from "./pages/DocsPage";
import Privacy from "./pages/Privacy";
import CGU from "./pages/CGU";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/waitlist" element={<Waitlist />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/admin/setup" element={<AdminSetup />} />
            <Route path="/preview/:slug" element={<PreviewPage />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/cgu" element={<CGU />} />
            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/clients"
              element={
                <AuthGuard allowedProfileRoles={["owner", "admin", "dm", "solo", "agence_standard", "agence_pro", "freemium", "cm"]}>
                  <ClientsPage />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/clients/:id"
              element={
                <AuthGuard allowedProfileRoles={["owner", "admin", "dm", "solo", "agence_standard", "agence_pro", "freemium", "cm"]}>
                  <ClientDetail />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/calendrier"
              element={
                <AuthGuard>
                  <CalendarPage />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/rapports"
              element={
                <AuthGuard allowedProfileRoles={["owner", "admin", "dm", "solo", "agence_standard", "agence_pro"]}>
                  <KpiReportsPage />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/createur"
              element={
                <AuthGuard allowedProfileRoles={["createur"]}>
                  <CreatorDashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/facturation"
              element={
                <AuthGuard allowedProfileRoles={["owner", "admin", "dm", "solo", "agence_standard", "agence_pro"]}>
                  <Facturation />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/comptabilite"
              element={
                <AuthGuard allowedProfileRoles={["owner", "admin", "dm", "solo", "agence_standard", "agence_pro"]}>
                  <Comptabilite />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/equipe"
              element={
                <AuthGuard>
                  <TeamJournal />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/journal"
              element={
                <AuthGuard allowedProfileRoles={["owner", "admin", "dm", "solo", "agence_standard", "agence_pro"]}>
                  <Journal />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/parametres"
              element={
                <AuthGuard>
                  <Settings />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/*"
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/admin"
              element={
                <AuthGuard requiredRole="admin">
                  <AdminTotpGate>
                    <AdminDashboard />
                  </AdminTotpGate>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/waitlist"
              element={
                <AuthGuard requiredRole="admin">
                   <AdminTotpGate>
                    <AdminWaitlist />
                  </AdminTotpGate>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/comptes"
              element={
                <AuthGuard requiredRole="admin">
                   <AdminTotpGate>
                    <AdminComptes />
                  </AdminTotpGate>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/licences"
              element={
                <AuthGuard requiredRole="admin">
                   <AdminTotpGate>
                    <AdminLicences />
                  </AdminTotpGate>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/securite"
              element={
                <AuthGuard requiredRole="admin">
                  <AdminTotpGate>
                    <AdminSecurity />
                  </AdminTotpGate>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/emails"
              element={
                <AuthGuard requiredRole="admin">
                  <AdminTotpGate>
                    <AdminEmails />
                  </AdminTotpGate>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/facturation"
              element={
                <AuthGuard requiredRole="admin">
                  <AdminTotpGate>
                    <AdminFacturation />
                  </AdminTotpGate>
                </AuthGuard>
              }
            />
            <Route
              element={
                <AuthGuard requiredRole="admin">
                  <AdminTotpGate>
                    <AdminPlaceholder title="Section admin" />
                  </AdminTotpGate>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/guides"
              element={
                <AuthGuard requiredRole="admin">
                  <AdminTotpGate>
                    <AdminGuides />
                  </AdminTotpGate>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/plans"
              element={
                <AuthGuard requiredRole="admin">
                  <AdminTotpGate>
                    <AdminPlans />
                  </AdminTotpGate>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/documentation"
              element={
                <AuthGuard requiredRole="admin">
                  <AdminTotpGate>
                    <AdminDocumentation />
                  </AdminTotpGate>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/contrats"
              element={
                <AuthGuard requiredRole="admin">
                  <AdminTotpGate>
                    <AdminContrats />
                  </AdminTotpGate>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/profil"
              element={
                <AuthGuard requiredRole="admin">
                  <AdminTotpGate>
                    <AdminProfil />
                  </AdminTotpGate>
                </AuthGuard>
              }
            />
            <Route path="/docs/:type" element={<DocsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
