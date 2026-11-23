import { z } from "zod";

export const DaySchema = z.enum([
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
]);
export type Day = z.infer<typeof DaySchema>;

export const ClassEntrySchema = z
  .object({
    id: z.string().min(1),
    subject: z.string().trim().min(1, "Subject is required"),
    day: DaySchema,
    start: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:mm format"),
    end: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:mm format"),
    room: z.string().optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .optional(), // hex color code
  })
  .refine((entry) => entry.end > entry.start, {
    message: "End time must be after start time",
    path: ["end"],
  });
export type ClassEntry = z.infer<typeof ClassEntrySchema>;

export const ExtractionResultSchema = z.object({
  classes: z.array(ClassEntrySchema),
  warnings: z.array(z.string()),
});
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

export const DeviceIdSchema = z.enum([
  "iphone-16-pro",
  "iphone-16-pro-max",
  "iphone-16",
  "iphone-se",
]);
export type DeviceId = z.infer<typeof DeviceIdSchema>;

export const ThemeModeSchema = z.enum(["dark", "light"]);
export type ThemeMode = z.infer<typeof ThemeModeSchema>;

export const WallpaperSettingsSchema = z.object({
  device: DeviceIdSchema,
  theme: ThemeModeSchema,
  showRooms: z.boolean(),
  showWeekend: z.enum(["auto", "always", "never"]),
  timeRange: z.union([
    z.literal("auto"),
    z
      .object({
        startHour: z.number().int().min(0).max(23),
        endHour: z.number().int().min(1).max(24),
      })
      .refine(
        (range) => range.endHour > range.startHour,
        "End hour must be after start hour",
      ),
  ]),
});
export type WallpaperSettings = z.infer<typeof WallpaperSettingsSchema>;
