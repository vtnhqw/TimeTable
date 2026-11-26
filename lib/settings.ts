import { WallpaperSettingsSchema } from "./schema.ts";

export const DEFAULT_SETTINGS = WallpaperSettingsSchema.parse({
  device: "iphone-16-pro",
  theme: "dark",
  showRooms: true,
  showWeekend: "auto",
  timeRange: "auto",
});
