import "server-only";
import type { Locale } from "@/i18n/routing";

export type GoogleReview = {
  author: string;
  authorUrl?: string;
  photo?: string;
  rating: number;
  text: string;
  when: string;
};

export type GoogleReviews = { rating: number; count: number; mapsUrl?: string; reviews: GoogleReview[] };

type PlaceResponse = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: {
    rating: number;
    relativePublishTimeDescription?: string;
    text?: { text: string };
    originalText?: { text: string };
    authorAttribution?: { displayName: string; uri?: string; photoUri?: string };
  }[];
};

/**
 * Live Google rating + latest reviews via Places API (New).
 * Cached for 24 hours → about 30 calls a month, inside Google's free monthly usage.
 */
export async function getGoogleReviews(locale: Locale): Promise<GoogleReviews | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return null;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=${locale}`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
      },
      next: { revalidate: 60 * 60 * 24, tags: ["google-reviews"] },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as PlaceResponse;
    return {
      rating: data.rating ?? 0,
      count: data.userRatingCount ?? 0,
      mapsUrl: data.googleMapsUri,
      reviews: (data.reviews ?? [])
        .filter((r) => (r.text?.text ?? r.originalText?.text ?? "").trim().length > 0)
        .map((r) => ({
          author: r.authorAttribution?.displayName ?? "Google user",
          authorUrl: r.authorAttribution?.uri,
          photo: r.authorAttribution?.photoUri,
          rating: r.rating,
          text: r.text?.text ?? r.originalText?.text ?? "",
          when: r.relativePublishTimeDescription ?? "",
        })),
    };
  } catch {
    return null;
  }
}
