import { cn } from "@/lib/utils";

export function Section({ id, title, subtitle, children, className, tone = "white", headingAs: Heading = "h2" }: {
  id?: string; title: React.ReactNode; subtitle?: React.ReactNode; children: React.ReactNode; className?: string; tone?: "white" | "soft";
  /** Use "h1" when the section is the main topic of the page. */
  headingAs?: "h1" | "h2";
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined}
      className={cn("scroll-mt-20 py-14 md:py-20", tone === "soft" ? "bg-brand-50/60" : "bg-white", className)}>
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 max-w-2xl">
          <Heading id={id ? `${id}-title` : undefined} className="font-display text-3xl font-bold text-brand-950 md:text-4xl">{title}</Heading>
          {subtitle && <p className="mt-2 text-lg text-zinc-600">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
