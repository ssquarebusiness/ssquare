import { getLocale, getTranslations } from "next-intl/server";
import { ExternalLink, Star } from "lucide-react";
import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { buttonClass } from "@/components/ui/button";
import { Section } from "@/components/public/section";
import { getGoogleReviews } from "@/lib/google-reviews";

function Stars({ value, className = "size-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${className} ${i < Math.round(value) ? "fill-gold text-gold" : "text-zinc-300"}`} aria-hidden />
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
    <Section id="reviews" tone="soft" kicker={t("kicker")} title={t("title")}>
      {data && data.count > 0 ? (
        <>
          <div className="mb-5 flex items-center gap-4">
            <span className="text-[40px] leading-none font-extrabold tracking-tight text-ink">{data.rating.toFixed(1)}</span>
            <div>
              <Stars value={data.rating} />
              <p className="text-sm text-zinc-500">{t("basedOn", { count: data.count })}</p>
            </div>
          </div>
          <ul className="grid gap-3.5 md:grid-cols-3">
            {data.reviews.slice(0, 3).map((r, i) => (
              <li key={i} className="flex flex-col rounded-[18px] border border-line bg-white p-5">
                <Stars value={r.rating} className="size-3.5" />
                <p className="mt-2.5 mb-4 line-clamp-5 flex-1 text-ink-2">{r.text}</p>
                <div className="flex items-center gap-2.5 text-sm">
                  {r.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.photo} alt="" width={32} height={32} loading="lazy" referrerPolicy="no-referrer" className="size-8 rounded-full" />
                  ) : (
                    <span className="grid size-8 place-items-center rounded-full bg-[#efe7d6] text-[13px] font-bold">{r.author.charAt(0)}</span>
                  )}
                  <div>
                    <p className="font-bold text-ink">
                      {r.authorUrl ? <a href={r.authorUrl} target="_blank" rel="noopener noreferrer nofollow">{r.author}</a> : r.author}
                    </p>
                    <p className="text-zinc-500">{r.when}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-500">{t("fromGoogle")}</p>
        </>
      ) : (
        <p className="text-lg text-ink-2">{t("fallback")}</p>
      )}
      <div className="mt-6 flex flex-wrap gap-2.5">
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
