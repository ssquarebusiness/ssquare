import { cn } from "@/lib/utils";

/**
 * Page section in the Clean Sage style: small sage kicker, bold heading, calm subtitle.
 * `split` puts the heading on the left and the content on the right on larger screens.
 */
export function Section({
  id,
  kicker,
  title,
  subtitle,
  children,
  className,
  tone = "canvas",
  headingAs: Heading = "h2",
  split = false,
}: {
  id?: string;
  kicker?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  tone?: "canvas" | "soft";
  /** Use "h1" when the section is the main topic of the page. */
  headingAs?: "h1" | "h2";
  split?: boolean;
}) {
  const head = (
    <div className={cn("mb-7 max-w-2xl", split && "md:mb-0")}>
      {kicker && <p className="text-[13px] font-bold tracking-[0.1em] text-brand-700 uppercase">{kicker}</p>}
      <Heading id={id ? `${id}-title` : undefined} className="mt-2 text-[28px] leading-tight font-extrabold tracking-tight text-ink md:text-[38px]">
        {title}
      </Heading>
      {subtitle && <p className="mt-2 text-ink-2">{subtitle}</p>}
    </div>
  );
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined}
      className={cn("scroll-mt-20 py-14 md:py-20", tone === "soft" ? "bg-soft" : "bg-canvas", className)}>
      <div className={cn("mx-auto max-w-6xl px-4 md:px-8", split && "md:grid md:grid-cols-[0.75fr_1.25fr] md:items-start md:gap-12")}>
        {head}
        <div>{children}</div>
      </div>
    </section>
  );
}
