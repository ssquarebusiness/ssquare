import { notFound } from "next/navigation";

/** Unknown public URLs → localized 404 page. */
export default function CatchAll() {
  notFound();
}
