/**
 * Generates PWA / favicon PNGs from the SSquare logo.
 * Replace scripts/assets/logo.svg with the real logo and run: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";

const logo = readFileSync(new URL("./assets/logo.svg", import.meta.url));
mkdirSync("public/icons", { recursive: true });

const plain = (size, out) => sharp(logo, { density: 512 }).resize(size, size).png().toFile(out);

// Maskable: logo at 80% on brand background so Android can crop it into any shape.
async function maskable(size, out) {
  const inner = await sharp(logo, { density: 512 }).resize(Math.round(size * 0.8)).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#0b3d2e" } })
    .composite([{ input: inner, gravity: "center" }]).png().toFile(out);
}

// Monochrome badge for the Android status bar.
async function badge(size, out) {
  await sharp(logo, { density: 512 }).resize(size, size).greyscale().threshold(128).negate({ alpha: false }).png().toFile(out);
}

await Promise.all([
  plain(192, "public/icons/icon-192.png"),
  plain(512, "public/icons/icon-512.png"),
  maskable(512, "public/icons/maskable-512.png"),
  maskable(180, "src/app/apple-icon.png"),
  plain(64, "src/app/icon.png"),
  badge(96, "public/icons/badge-96.png"),
]);
console.log("Icons generated");
