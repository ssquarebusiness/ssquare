import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SSquare Sports Arena, Nadiad — Turf & Pickleball, open 24 hours";

/** Social share image (WhatsApp / Facebook link previews). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
        background: "linear-gradient(135deg, #0b3d2e 0%, #062219 100%)", color: "white", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 88, height: 88, borderRadius: 22, background: "#123d2e", border: "4px solid #d4f53c", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 64, fontWeight: 900 }}>S²</div>
          <div style={{ fontSize: 56, fontWeight: 800 }}>SSquare</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, color: "#d4f53c", fontWeight: 700 }}>Only synthetic pickleball court in Nadiad</div>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, marginTop: 12 }}>Turf · Box Cricket · Football · Pickleball</div>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#b0eac7" }}>Nadiad, Gujarat · Open 24 hours</div>
      </div>
    ),
    size,
  );
}
