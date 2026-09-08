import { memo } from "react";
import { motion } from "framer-motion";
import { useContent } from "@/hooks/useContent";

interface MissionStatementProps {
  onNavigateToProjects?: () => void;
  onNavigateToBrand?: () => void;
}

/**
 * Mission Statement block after Hero — brand ideology moment.
 */
const MissionStatement = memo((_props: MissionStatementProps) => {
  const { content, isVisible } = useContent("mission");

  if (!isVisible) return null;

  const heading = String(content?.heading || "WHERE AUTOMOBILES");
  const headingLine2 = String(content?.headingLine2 || "BECOME ART");
  const subtitle = String(
    content?.subtitle ||
      "Bespoke luxury car customization and prototype development in the UAE."
  );

  return (
    <section className="relative flex items-center justify-center bg-premium-black overflow-hidden py-20 sm:py-24 md:py-28 lg:py-32">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-black via-black/60 to-transparent pointer-events-none" />

      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)
            `,
            backgroundSize: "40px 40px",
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
        <motion.div
        >
          {/* h1, а не h2: на главной это единственный заголовок, и до правки
              страница уходила в индекс вообще без h1. */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl tracking-widest text-white/90 uppercase mb-4 sm:mb-6 md:mb-8 leading-tight">
            {heading}
            <br className="hidden sm:block" /> {headingLine2}
          </h1>

          <motion.p
            className="font-body text-sm sm:text-base md:text-lg text-white/70 mb-6 sm:mb-8 md:mb-10 leading-relaxed max-w-2xl mx-auto px-4 break-words"
            style={{ wordBreak: "normal", overflowWrap: "break-word" }}
          >
            {subtitle}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
});

MissionStatement.displayName = "MissionStatement";
export default MissionStatement;
