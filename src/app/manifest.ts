import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** Makes the staff app installable on Android & iPhone ("Add to Home Screen"). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/staff",
    name: "SSquare Arena",
    short_name: "SSquare",
    description: "SSquare Sports Arena, Nadiad — bookings, payments and expenses.",
    start_url: "/staff",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: siteConfig.themeColor,
    categories: ["sports", "business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Today's bookings", url: "/staff", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "New booking", url: "/staff/bookings/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
