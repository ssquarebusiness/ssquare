import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site";
import { Section } from "@/components/public/section";
import { cn } from "@/lib/utils";

/** Photo mosaic: one large photo, the rest in a grid. */
export async function Gallery() {
  const t = await getTranslations("public.gallery");
  return (
    <Section id="gallery" kicker={t("kicker")} title={t("title")}>
      <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-[2fr_1fr_1fr] md:grid-rows-2">
        {siteConfig.gallery.map((img, i, all) => {
          // An odd number of small photos leaves a gap on desktop — let the last one fill the row.
          const fillLast = i === all.length - 1 && i > 0 && (all.length - 1) % 2 === 1;
          return (
          <li key={img.src} className={cn("relative overflow-hidden rounded-2xl bg-soft",
            i === 0 ? "col-span-2 aspect-video md:col-span-1 md:row-span-2 md:aspect-auto" : "aspect-square",
            fillLast && "col-span-2 aspect-video md:aspect-auto")}>
            <Image src={img.src} alt={t(`alt.${img.alt}`)} fill loading="lazy"
              sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
              className="object-cover" unoptimized={img.src.endsWith(".svg")} />
          </li>
          );
        })}
      </ul>
    </Section>
  );
}
