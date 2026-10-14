import { getLocale, getTranslations } from "next-intl/server";
import { ExternalLink, Star } from "lucide-react";
import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { buttonClass } from "@/components/ui/button";
import { Section } from "@/components/public/section";
import { getGoogleReviews } from "@/lib/google-reviews";

function Stars({ value, className = "size-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex" aria-label={`${value} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${className} ${i < Math.round(value) ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`} aria-hidden />
      ))}
    </span>
  );
}

/** Live Google reviews (refreshed daily). Shows Google attribution as Google requires. */
export async function Reviews() {
  const t = await getTranslations("public.reviews");
  const locale = (await getLocale()) as Locale;
  const data = await getGoogleReviews(locale);
  const placeId = process.env.GOOGLE_PLACE_ID;
  const writeUrl = placeId ? `${siteConfig.maps.reviewUrl}${placeId}` : siteConfig.maps.directionsUrl;

  return (
    <Section id="reviews" title={t("title")} tone="soft">
      {data && data.count > 0 ? (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <span className="font-display text-5xl font-bold text-brand-950">{data.rating.toFixed(1)}</span>
            <div>
              <Stars value={data.rating} className="size-5" />
              <p className="text-sm text-zinc-600">{t("basedOn", { count: data.count })}</p>
            </div>
          </div>
          <ul className="no-scrollbar relative -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
            {data.reviews.map((r, i) => (
              <li key={i} className="w-[85%] shrink-0 snap-center md:w-auto">
                <blockquote className="flex h-full flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
                  <div className="flex items-center gap-3">
                    {r.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.photo} alt="" width={40} height={40} loading="lazy" referrerPolicy="no-referrer" className="size-10 rounded-full" />
                    )}
                    <div>
                      <cite className="block font-semibold not-italic">
                        {r.authorUrl ? <a href={r.authorUrl} target="_blank" rel="noopener noreferrer nofollow">{r.author}</a> : r.author}
                      </cite>
                      <span className="text-xs text-zinc-500">{r.when}</span>
                    </div>
                  </div>
                  <Stars value={r.rating} className="mt-3 size-4" />
                  <p className="mt-2 line-clamp-6 text-zinc-700">{r.text}</p>
                </blockquote>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-500">{t("fromGoogle")}</p>
        </>
      ) : (
        <p className="text-lg text-zinc-600">{t("fallback")}</p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        {data?.mapsUrl && (
          <a href={data.mapsUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("outline", "md")}>
            {t("seeAll")} <ExternalLink className="size-4" />
          </a>
        )}
        <a href={writeUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "md")}>
          <Star className="size-4" /> {t("write")}
        </a>
      </div>
    </Section>
  );
}
