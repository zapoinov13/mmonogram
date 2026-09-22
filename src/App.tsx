import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import logoMmonogram from "@/assets/logo-mmonogram.webp";
import ScrollToTop from "@/components/ScrollToTop";
import { CONFIGURATOR_ENABLED } from "@/lib/features";

// Premium branded loading fallback — large softly pulsing M-Monogram logo
const PageLoader = () => (
  <div className="fixed inset-0 z-50 bg-premium-black flex items-center justify-center">
    <img
      src={logoMmonogram}
      alt="M-Monogram"
      width={900}
      height={212}
      decoding="async"
      fetchpriority="high"
      className="w-56 sm:w-72 md:w-80 lg:w-96 max-w-[70vw] h-auto object-contain opacity-95 animate-logo-pulse will-change-[opacity,transform]"
    />
  </div>
);

// Lazy load all pages for better performance
const HomePage = lazy(() => import("./pages/HomePage"));
const BrandPage = lazy(() => import("./pages/BrandPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage"));
const ModificationsPage = lazy(() => import("./pages/ModificationsPage"));
const ConfiguratorPage = lazy(() => import("./pages/ConfiguratorPage"));
const VerifyPage = lazy(() => import("./pages/VerifyPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const RepresentativeDetailPage = lazy(() => import("./pages/RepresentativeDetailPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const NewsDetailPage = lazy(() => import("./pages/NewsDetailPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OfferAgreement = lazy(() => import("./pages/OfferAgreement"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects"));
const AdminSections = lazy(() => import("./pages/admin/AdminSections"));
const AdminSectionEditor = lazy(() => import("./pages/admin/AdminSectionEditor"));
const AdminNavigation = lazy(() => import("./pages/admin/AdminNavigation"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const ProtectedRoute = lazy(() => import("./components/admin/ProtectedRoute"));

const App = () => (
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/brand" element={<BrandPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/commission" element={<ModificationsPage />} />
                <Route path="/modifications" element={<ModificationsPage />} />
                {/* Скрытый раздел не должен оставаться доступным по прямому
                    адресу: без маршрута /configurator отдаёт страницу 404. */}
                {CONFIGURATOR_ENABLED && <Route path="/configurator" element={<ConfiguratorPage />} />}
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/representatives/:id" element={<RepresentativeDetailPage />} />
                <Route path="/press" element={<NewsPage />} />
                <Route path="/press/:slug" element={<NewsDetailPage />} />
                {/* Legacy /news URLs redirect to /press */}
                <Route path="/news" element={<Navigate to="/press" replace />} />
                <Route path="/news/:slug" element={<Navigate to="/press" replace />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/offer-agreement" element={<OfferAgreement />} />
                {/* Admin CMS */}
                <Route
                  path="/admin"
                  element={<ProtectedRoute loginFallback><AdminLayout /></ProtectedRoute>}
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="projects" element={<AdminProjects />} />
                  <Route path="sections" element={<AdminSections />} />
                  <Route path="sections/:id" element={<AdminSectionEditor />} />
                  <Route path="bookings" element={<AdminBookings />} />
                  <Route path="navigation" element={<AdminNavigation />} />
                  <Route path="media" element={<AdminMedia />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route
                    path="users"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminUsers />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
);

export default App;
