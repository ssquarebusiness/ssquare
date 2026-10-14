"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, PlusSquare, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function isIOS() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
}
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/**
 * "Install app" button.
 * Android/Chrome/Edge: native install prompt. iPhone/iPad: step-by-step "Add to Home Screen" guide.
 * Hidden when already running as an installed app.
 */
export function InstallPrompt({ variant = "light", className }: { variant?: "light" | "dark"; className?: string }) {
  const t = useTranslations("pwa");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<"ios" | "other" | "installed" | null>(null);
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    setPlatform(isStandalone() ? "installed" : isIOS() ? "ios" : "other");
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as BeforeInstallPromptEvent); };
    const onInstalled = () => setPlatform("installed");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!platform || platform === "installed") return null;

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setPlatform("installed");
      setDeferred(null);
    } else {
      setGuide(true);
    }
  };

  return (
    <div className={cn("rounded-2xl p-4", variant === "dark" ? "bg-white/10 text-white" : "border border-brand-200 bg-brand-50", className)}>
      <div className="flex items-center gap-3">
        <Smartphone className="size-8 shrink-0" aria-hidden />
        <div className="flex-1">
          <p className="font-semibold">{t("title")}</p>
          <p className={cn("text-sm", variant === "dark" ? "text-brand-200" : "text-zinc-600")}>{t("subtitle")}</p>
        </div>
      </div>
      <Button variant="accent" block className="mt-3" onClick={install}>
        <Download className="size-5" /> {t("install")}
      </Button>

      <Sheet open={guide} onClose={() => setGuide(false)} title={t("guideTitle")}>
        {platform === "ios" ? (
          <ol className="space-y-4 text-zinc-800">
            <li className="flex gap-3"><Step n={1} /><span>{t.rich("ios1", { icon: () => <Share className="inline size-5 text-sky-600" /> })}</span></li>
            <li className="flex gap-3"><Step n={2} /><span>{t.rich("ios2", { icon: () => <PlusSquare className="inline size-5" /> })}</span></li>
            <li className="flex gap-3"><Step n={3} /><span>{t("ios3")}</span></li>
            <li className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{t("iosNote")}</li>
          </ol>
        ) : (
          <ol className="space-y-4 text-zinc-800">
            <li className="flex gap-3"><Step n={1} /><span>{t("android1")}</span></li>
            <li className="flex gap-3"><Step n={2} /><span>{t("android2")}</span></li>
          </ol>
        )}
      </Sheet>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">{n}</span>;
}
