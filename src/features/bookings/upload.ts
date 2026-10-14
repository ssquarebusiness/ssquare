"use client";
import imageCompression from "browser-image-compression";
import { businessConfig } from "@/config/business";
import { getSupabase } from "@/lib/supabase/client";
import { istDateStr } from "@/lib/time";

export const PROOF_BUCKET = "payment-proofs";

/** Compresses a UPI screenshot on the phone (~80 KB WebP) and uploads it. Returns the storage path. */
export async function uploadPaymentProof(file: File, bookingId: string): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: businessConfig.screenshot.maxSizeMB,
    maxWidthOrHeight: businessConfig.screenshot.maxWidthOrHeight,
    fileType: "image/webp",
    useWebWorker: true,
  });
  const [y, m] = istDateStr().split("-");
  const path = `${y}/${m}/${bookingId}-${Date.now()}.webp`;
  const { error } = await getSupabase().storage.from(PROOF_BUCKET).upload(path, compressed, {
    contentType: "image/webp",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function proofUrl(path: string) {
  const { data } = await getSupabase().storage.from(PROOF_BUCKET).createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
