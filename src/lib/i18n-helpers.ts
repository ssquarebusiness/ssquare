/** "1 hr 30 min" / "2 hr" / "45 min" in the current language. `t` = translator of the "common" namespace. */
export function durationLabel(t: (key: string, values?: Record<string, number>) => string, minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? t("durationH", { h }) : "", m ? t("durationM", { m }) : ""].filter(Boolean).join(" ");
}
