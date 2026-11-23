"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  Camera,
  Flashlight,
  Signal,
  Wifi,
  BatteryFull,
  LockKeyhole,
} from "lucide-react";
import type { ThemeMode } from "@/lib/schema";
export function PhonePreview({
  children,
  theme = "light",
  overlay = true,
  legacy = false,
}: {
  children: ReactNode;
  theme?: ThemeMode;
  overlay?: boolean;
  legacy?: boolean;
}) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);
  const time =
    now?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) ??
    "9:41";
  const date =
    now?.toLocaleDateString("en-GB", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }) ?? "Your weekly schedule";
  return (
    <div className={`phone-device ${legacy ? "phone-legacy" : ""}`}>
      <span className="phone-side phone-silent" />
      <span className="phone-side phone-volume" />
      <span className="phone-side phone-power" />
      <div className={`phone-display phone-${theme}`}>
        {children}
        {overlay && (
          <div className="phone-ui" aria-hidden="true">
            {!legacy && (
              <span className="dynamic-island">
                <i />
              </span>
            )}
            <div className="phone-status">
              <span>
                <LockKeyhole size={12} />
              </span>
              <span>
                <Signal />
                <Wifi />
                <BatteryFull />
              </span>
            </div>
            <div className="lock-clock">
              <span>{date}</span>
              <strong>{time}</strong>
            </div>
            <div className="phone-shortcuts">
              <span>
                <Flashlight />
              </span>
              <span>
                <Camera />
              </span>
            </div>
            {!legacy && <span className="phone-home" />}
          </div>
        )}
      </div>
      {legacy && <span className="legacy-home" />}
    </div>
  );
}
