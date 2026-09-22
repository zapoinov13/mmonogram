import { lazy, Suspense, useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import LoadingScreen from "@/components/LoadingScreen";
import HeroSection from "@/components/HeroSection";
import MissionStatement from "@/components/MissionStatement";
import BrandStrip from "@/components/BrandStrip";
import VinBanner from "@/components/VinBanner";
import Configurator3DBanner from "@/components/Configurator3DBanner";
import { CONFIGURATOR_ENABLED } from "@/lib/features";
import NextSectionCTA from "@/components/NextSectionCTA";
import SEOHead from "@/components/SEOHead";
import LazyOnVisible from "@/components/LazyOnVisible";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { REPRESENTATIVES_SECTION_ID } from "@/lib/representativesNav";

// Lazy load below-the-fold sections for faster initial render
const ParticleBackground = lazy(() => import("@/components/ParticleBackground"));
const LatestAdditionsCarousel = lazy(() => import("@/components/sections/latest-additions-carousel"));
const AboutUsSection = lazy(() => import("@/components/AboutUsSection"));
const StatsSection = lazy(() => import("@/components/StatsSection"));
const RepresentativesMapSection = lazy(() => import("@/components/sections/RepresentativesMapSection"));
const NewsHighlightSection = lazy(() => import("@/components/sections/NewsHighlightSection"));
const Footer = lazy(() => import("@/components/Footer"));

const wantsRepresentatives = (state: unknown) =>
  !!state &&
  typeof state === "object" &&
  "scrollTo" in state &&
  (state as { scrollTo?: string }).scrollTo === REPRESENTATIVES_SECTION_ID;

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(() => {
    try {
      return !sessionStorage.getItem("hasVisited");
    } catch {
      return true;
    }
  });
  const scrollToRepresentatives = wantsRepresentatives(location.state);

  // Only show loading screen on initial page load (not on navigation)
  useEffect(() => {
    try {
      if (!sessionStorage.getItem("hasVisited")) {
        sessionStorage.setItem("hasVisited", "true");
      }
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    if (!scrollToRepresentatives || isLoading) return;

    let cancelled = false;
    let attempts = 0;
    let retry: number | undefined;

    const tryScroll = () => {
      if (cancelled) return;
      const el = document.getElementById(REPRESENTATIVES_SECTION_ID);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        navigate("/", { replace: true, state: {} });
        return;
      }
      attempts += 1;
      if (attempts < 25) retry = window.setTimeout(tryScroll, 80);
    };
    const timer = window.setTimeout(tryScroll, 40);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (retry !== undefined) window.clearTimeout(retry);
    };
  }, [isLoading, scrollToRepresentatives, navigate]);

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleProjectClick = useCallback((projectId: string) => {
    navigate(`/projects/${projectId}`);
  }, [navigate]);

  const handleSetCurrentView = useCallback((view: string) => {
    const viewToPath: Record<string, string> = {
      "home": "/",
      "brand": "/brand",
      "projects": "/projects",
      "modifications": "/modifications",
      "verify": "/verify",
      "contact": "/contact",
      "booking": "/booking",
    };
    const path = viewToPath[view] || "/";
    navigate(path);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [navigate]);

  const handleNavigateToProjects = useCallback(() => {
    handleSetCurrentView("projects");
  }, [handleSetCurrentView]);

  const handleNavigateToBrand = useCallback(() => {
    handleSetCurrentView("brand");
  }, [handleSetCurrentView]);

  return (
    <div className="min-h-screen relative">
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen onComplete={handleLoadingComplete} />
        )}
      </AnimatePresence>

      {!isLoading && (
        <>
          {/* Atmospheric Particles - lazy loaded */}
          <Suspense fallback={null}>
            <div className="fixed inset-0 z-0 pointer-events-none">
              <ParticleBackground />
            </div>
          </Suspense>

          <Header />

          <SEOHead
            title="M-Monogram | Luxury G-Class Customization, Dubai"
            description="Elite Dubai atelier crafting bespoke Maybach & Brabus modifications for the Mercedes G-Class."
            path="/"
          />

          <HeroSection />
          <MissionStatement
            onNavigateToProjects={handleNavigateToProjects}
            onNavigateToBrand={handleNavigateToBrand}
          />
          <Suspense fallback={null}>
            <LatestAdditionsCarousel
              onProjectClick={handleProjectClick}
            />
          </Suspense>
          <BrandStrip />
          <Suspense fallback={null}>
            <StatsSection />
          </Suspense>

          <div id={REPRESENTATIVES_SECTION_ID} className="scroll-mt-24 md:scroll-mt-28">
            <Suspense fallback={<div className="min-h-[720px] bg-premium-black" />}>
              <LazyOnVisible minHeight="720px" rootMargin="500px" force={scrollToRepresentatives}>
                <RepresentativesMapSection />
              </LazyOnVisible>
            </Suspense>
          </div>
          <NextSectionCTA
            label={t("homeNextCta.label")}
            nextLabel={t("homeNextCta.next")}
            onClick={() => handleSetCurrentView("brand")}
          />
          {CONFIGURATOR_ENABLED && <Configurator3DBanner />}
          <VinBanner />
          {/* Пресса больше не в меню: вход к ней — этот блок в самом низу
              главной, перед подвалом. */}
          <Suspense fallback={null}>
            <NewsHighlightSection />
          </Suspense>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </>
      )}
    </div>
  );
};

export default HomePage;
