import { Noto_Sans_Devanagari, Noto_Sans_Gujarati, Plus_Jakarta_Sans } from "next/font/google";

/** Clean Sage theme type: Plus Jakarta Sans (Latin), Noto for Gujarati / Hindi script. */
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});
export const notoGujarati = Noto_Sans_Gujarati({
  subsets: ["gujarati"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-gu",
  display: "swap",
  preload: false,
});
export const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-hi",
  display: "swap",
  preload: false,
});

export const fontVariables = [jakarta, notoGujarati, notoDevanagari].map((f) => f.variable).join(" ");
