import { memo, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import ProjectEditionGrid from "@/components/ProjectEditionGrid";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProjects } from "@/hooks/useProjects";
import { getLatestAdditionHubs } from "@/data/projects";

export interface LatestAdditionsCarouselProps {
  onProjectClick?: (projectId: string) => void;
  className?: string;
  /** Карусель — главное содержимое первого экрана (страница /projects). */
  priority?: boolean;
  variant?: "light" | "dark";
}

/**
 * LATEST ADDITIONS: two hubs — G-Wagen and The Fusion.
 * Opening a hub shows that model's colour/edition cards.
 */
const LatestAdditionsCarousel = memo(
  ({ onProjectClick, className, priority = false, variant = "dark" }: LatestAdditionsCarouselProps) => {
    const { t } = useLanguage();
    const { projects: dbProjects } = useProjects();
    const isDark = variant === "dark";

    const hubs = useMemo(() => getLatestAdditionHubs(dbProjects), [dbProjects]);

    const handleProjectClick = useCallback(
      (slug: string) => onProjectClick?.(slug),
      [onProjectClick]
    );

    return (
      <section id="latest-additions" className={cn(
        "relative z-10",
        isDark ? "bg-premium-black border-t border-white/10" : "section-flow-light",
        className
      )}>
        <div
          className={cn(
            "w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-10",
            priority
              ? "pt-4 pb-12 sm:pt-5 sm:pb-14 md:pt-6 md:pb-16"
              : "pt-12 pb-16 sm:pt-14 sm:pb-20 md:pt-16 md:pb-24 lg:pt-20 lg:pb-28"
          )}
        >
          <div className={cn(
            "mx-auto h-px w-16 sm:w-24",
            priority ? "mb-4 sm:mb-5" : "mb-7 sm:mb-9",
            isDark ? "bg-white/45" : "bg-black/30"
          )} aria-hidden />
          <motion.h2
            className={cn(
              "font-display font-bold uppercase tracking-[0.18em] text-center",
              priority
                ? "text-lg sm:text-2xl md:text-3xl mb-5 sm:mb-6"
                : "text-2xl sm:text-3xl md:text-5xl mb-9 sm:mb-12",
              isDark ? "text-white" : "text-black"
            )}
          >
            {t("latestCreations.latestAdditions")}
          </motion.h2>

          <ProjectEditionGrid
            columns={2}
            projects={hubs}
            priority={priority}
            variant={variant}
            onProjectClick={handleProjectClick}
          />
        </div>
      </section>
    );
  }
);

LatestAdditionsCarousel.displayName = "LatestAdditionsCarousel";

export default LatestAdditionsCarousel;
