import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site";
import { Section } from "@/components/public/section";

export async function Gallery() {
  const t = await getTranslations("public.gallery");
  return (
    <Section id="gallery" title={t("title")}>
      <ul className="no-scrollbar relative -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
        {siteConfig.gallery.map((img) => (
          <li key={img.src} className="w-[80%] shrink-0 snap-center md:w-auto">
            <figure className="overflow-hidden rounded-3xl bg-zinc-100">
              <Image src={img.src} alt={t(`alt.${img.alt}`)} width={img.width} height={img.height} loading="lazy"
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 80vw"
                className="aspect-[4/3] h-auto w-full object-cover" unoptimized={img.src.endsWith(".svg")} />
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
