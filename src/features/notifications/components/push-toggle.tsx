"use client";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { sendTestPushAction } from "../actions";
import { currentSubscription, disablePush, enablePush, isPushSupported } from "../push-client";

/** Turn push notifications on/off for this phone + send a test. */
export function PushToggle() {
  const t = useTranslations("staff.push");
  const toast = useToast();
  const [state, setState] = useState<"loading" | "on" | "off" | "unsupported">("loading");
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!isPushSupported()) return setState("unsupported");
    currentSubscription().then((s) => setState(s ? "on" : "off"));
  }, []);

  if (state === "loading") return null;
  if (state === "unsupported") return <p className="text-sm text-zinc-500">{t("unsupported")}</p>;

  return (
    <div className="space-y-2">
      {state === "off" ? (
        <Button block loading={pending} onClick={() => start(async () => {
          const r = await enablePush();
          if (r === "ok") { setState("on"); toast(t("enabled")); }
          else toast(t(r === "denied" ? "denied" : "failed"), "error");
        })}>
          <BellRing className="size-5" /> {t("enable")}
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" loading={pending} onClick={() => start(async () => { await sendTestPushAction(); toast(t("testSent")); })}>
            <BellRing className="size-5" /> {t("test")}
          </Button>
          <Button variant="outline" onClick={() => start(async () => { await disablePush(); setState("off"); })}>
            <BellOff className="size-5" /> {t("disable")}
          </Button>
        </div>
      )}
    </div>
  );
}
