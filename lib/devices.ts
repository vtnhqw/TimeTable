import { DeviceId } from "./schema";

export interface DeviceConfig {
  id: DeviceId;
  name: string;
  width: number;
  height: number;
  topOffsetPercent: number; // Space reserved for status bar, clock digits, and lock screen widgets
  bottomOffsetPercent: number; // Space reserved for flashlight/camera buttons and home bar
}

export const DEVICES: Record<DeviceId, DeviceConfig> = {
  "iphone-16-pro": {
    id: "iphone-16-pro",
    name: "iPhone 16 Pro",
    width: 1206,
    height: 2622,
    topOffsetPercent: 0.27, // Grid starts below clock & date area
    bottomOffsetPercent: 0.08,
  },
  "iphone-16-pro-max": {
    id: "iphone-16-pro-max",
    name: "iPhone 16 Pro Max",
    width: 1320,
    height: 2868,
    topOffsetPercent: 0.27,
    bottomOffsetPercent: 0.08,
  },
  "iphone-16": {
    id: "iphone-16",
    name: "iPhone 16 / 15",
    width: 1179,
    height: 2556,
    topOffsetPercent: 0.27,
    bottomOffsetPercent: 0.08,
  },
  "iphone-se": {
    id: "iphone-se",
    name: "iPhone SE (3rd gen)",
    width: 750,
    height: 1334,
    topOffsetPercent: 0.25,
    bottomOffsetPercent: 0.07,
  },
};

export const DEFAULT_DEVICE: DeviceId = "iphone-16-pro";
