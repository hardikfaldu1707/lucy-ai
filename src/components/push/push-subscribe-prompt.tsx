"use client";

import { useEffect } from "react";
import { toast } from "sonner";

// Registers web push when the user has granted permission (requires VAPID in prod).
export function PushSubscribePrompt() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapid) return;

    async function subscribe() {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapid,
        });
        const json = sub.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: json.endpoint,
            p256dh: json.keys?.p256dh,
            auth: json.keys?.auth,
          }),
        });
      } catch {
        // User denied or unsupported — silent
      }
    }

    const schedule = (fn: () => void) => {
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(fn, { timeout: 5000 });
      } else {
        setTimeout(fn, 3000);
      }
    };

    if (Notification.permission === "granted") {
      schedule(() => void subscribe());
    } else if (Notification.permission === "default") {
      schedule(() => {
        Notification.requestPermission().then((p) => {
          if (p === "granted") void subscribe();
          else toast.message("Enable notifications to get check-ins from your companions.");
        });
      });
    }
  }, []);

  return null;
}
