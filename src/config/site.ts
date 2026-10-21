/**
 * Business & contact details for SSquare.
 * Edit this file (no code changes needed elsewhere) when any detail changes, then redeploy.
 *
 * Values marked TODO are placeholders — replace them with the real details.
 */
export const siteConfig = {
  name: "SSquare",
  legalName: "SSquare",
  tagline: "Cricket, Football Turf & Pickleball, Nadiad",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  owners: ["Shail Patel", "Shubh Patel"],

  contact: {
    // Numbers WITHOUT +91 / spaces. Used for tel: links and WhatsApp.
    phones: [
      { name: "Shail Patel", number: "8469285158" }, // TODO
      { name: "Shubh Patel", number: "8980290119" }, // TODO
    ],
    whatsapp: "8980290119", // TODO number that receives public booking enquiries
    email: "ssquarebusiness2503@gmail.com", // TODO
    countryCode: "91",
  },

  address: {
    street: "Inside Dumral Gate", // TODO
    locality: "Nadiad",
    region: "Gujarat",
    postalCode: "387710", // TODO
    country: "IN",
  },

  geo: { lat: 22.6916, lng: 72.8634 }, // TODO exact pin of the arena

  maps: {
    // Google Maps → Share → Embed a map → copy the src="" value
    embedUrl:
      "https://www.google.com/maps?q=SSquare+Sports+Arena+Nadiad&output=embed", // TODO
    directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=22.6916,72.8634", // TODO
    reviewUrl: "https://search.google.com/local/writereview?placeid=", // + GOOGLE_PLACE_ID
  },

  social: {
    instagram: "https://www.instagram.com/s_square_box_nadiad?psln=NndyNW92MGFhOWlo", // TODO e.g. https://instagram.com/ssquare.nadiad
    facebook: "",
    youtube: "",
  },

  timezone: "Asia/Kolkata",
  openAllDay: true, // 24 hours, 7 days

  /** Keywords used in <meta> and landing pages. */
  seoKeywords: [
    "pickleball court in Nadiad",
    "synthetic pickleball court Nadiad",
    "box cricket in Nadiad",
    "cricket turf Nadiad",
    "football turf Nadiad",
    "turf near me Nadiad",
    "sports arena Nadiad",
    "SSquare Nadiad",
  ],

  /**
   * Amenities shown on the website. Only keep the ones that are TRUE —
   * they are shown publicly. Keys map to translations in messages/*.json → amenities.
   */
  amenities: ["lights", "parking", "water", "washroom", "seating", "equipment", "cctv", "open24"],

  /** "Why SSquare" points — keys map to messages/*.json → why.items */
  whyPoints: ["onlyPickleball", "open24", "quality", "lights", "family", "booking"],

  /**
   * Gallery photos — put files in /public/images/gallery and list them here.
   * `alt` keys map to messages/*.json → gallery.alt
   */
  gallery: [
    { src: "/images/gallery/turf-1.svg", alt: "turfDay", width: 1200, height: 800 },
    { src: "/images/gallery/pickleball-1.svg", alt: "pickleball", width: 1200, height: 800 },
    { src: "/images/gallery/turf-night.svg", alt: "turfNight", width: 1200, height: 800 },
    { src: "/images/gallery/pickleball-2.svg", alt: "pickleballPlay", width: 1200, height: 800 },
  ],

  heroImage: "/images/gallery/turf-night.svg",

  /** Brand colour used for the installed app / browser bar. */
  themeColor: "#0b3d2e",
} as const;

export type SiteConfig = typeof siteConfig;
