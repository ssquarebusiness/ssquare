import { Noto_Sans, Noto_Sans_Gujarati, Noto_Sans_Devanagari, Outfit } from "next/font/google";

export const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-noto", display: "swap" });
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
export const outfit = Outfit({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const fontVariables = [notoSans, notoGujarati, notoDevanagari, outfit].map((f) => f.variable).join(" ");
