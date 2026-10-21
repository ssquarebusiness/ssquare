/**
 * Generates every logo / icon file from the official SSquare logo.
 *   Source: scripts/assets/logo-full.webp (square artwork on black)
 *   Run:    node scripts/generate-icons.mjs
 *
 * - Website logo (full artwork)                → public/images/logo.webp
 * - Emblem (shield, balls, "S" — no small text) → public/images/logo-emblem.webp
 *   used for favicon, app icons and the header, where the full logo would be too small to read.
 * - Android status-bar badge (white silhouette) → from scripts/assets/badge.svg
 */
import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";

const SRC = "scripts/assets/logo-full.webp";
// Part of the artwork above the "SQUARE" wordmark. Adjust if the logo artwork changes.
const EMBLEM = { left: 95, top: 35, width: 1070, height: 590 };
const BLACK = { r: 0, g: 0, b: 0, alpha: 1 };

/** 1200×630 share image: full logo on the left, tagline on the right. */
async function shareImage() {
  const logo = await sharp(SRC).resize(540).toBuffer();
  const text = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="630">
    <style>text { font-family: 'Helvetica Neue', Arial, sans-serif; }</style>
    <text x="0" y="230" font-size="30" font-weight="700" fill="#d4f53c">Only synthetic pickleball</text>
    <text x="0" y="268" font-size="30" font-weight="700" fill="#d4f53c">court in Nadiad</text>
    <text x="0" y="340" font-size="54" font-weight="800" fill="#ffffff">Cricket Box</text>
    <text x="0" y="404" font-size="54" font-weight="800" fill="#ffffff">Pickleball</text>
    <text x="0" y="468" font-size="54" font-weight="800" fill="#ffffff">Football Turf</text>
    <text x="0" y="530" font-size="28" fill="#b0eac7">Nadiad, Gujarat · Open 24 hours</text>
  </svg>`;
  return sharp({ create: { width: 1200, height: 630, channels: 3, background: "#000000" } })
    .composite([
      { input: logo, left: 45, top: 45 },
      { input: Buffer.from(text), left: 620, top: 0 },
    ])
    .jpeg({ quality: 80, mozjpeg: true });
}

mkdirSync("public/icons", { recursive: true });
mkdirSync("public/images", { recursive: true });

const emblem = await sharp(SRC).extract(EMBLEM).toBuffer();

/** Emblem centred on a black square; `fill` = share of the width the emblem takes. */
async function emblemSquare(size, fill = 0.96) {
  const inner = await sharp(emblem).resize(Math.round(size * fill)).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: BLACK } })
    .composite([{ input: inner, gravity: "center" }])
    .png();
}

await Promise.all([
  // Website
  sharp(SRC).resize(900).webp({ quality: 86 }).toFile("public/images/logo.webp"),
  // Social share image (WhatsApp / Facebook previews). JPEG keeps it well under WhatsApp's ~300 KB limit.
  shareImage().then((img) => img.toFile("public/images/og.jpg")),
  (await emblemSquare(512)).webp({ quality: 88 }).toFile("public/images/logo-emblem.webp"),
  // Favicon + Apple touch icon (Next.js file conventions)
  (await emblemSquare(64)).toFile("src/app/icon.png"),
  (await emblemSquare(180, 0.9)).toFile("src/app/apple-icon.png"),
  // Installable app (manifest)
  (await emblemSquare(192)).toFile("public/icons/icon-192.png"),
  (await emblemSquare(512)).toFile("public/icons/icon-512.png"),
  // Maskable: Android may crop to a circle, so keep the emblem inside the 80% safe zone.
  (await emblemSquare(512, 0.76)).toFile("public/icons/maskable-512.png"),
  // Status-bar badge must be a simple silhouette.
  sharp(readFileSync("scripts/assets/badge.svg"), { density: 512 })
    .resize(96, 96).greyscale().threshold(128).negate({ alpha: false }).png().toFile("public/icons/badge-96.png"),
]);
console.log("Icons generated from", SRC);
