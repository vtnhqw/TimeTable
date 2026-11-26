import { getSubjectLabel } from "./labels.ts";
import { layoutClasses } from "./layout.ts";
import type { ClassEntry, WallpaperSettings, Day } from "./schema.ts";
import type { DeviceConfig } from "./devices.ts";
import type { ThemeConfig } from "./themes.ts";
import {
  DAYS_ORDER,
  WEEKDAYS,
  timeToMinutes,
  formatHourLabel,
} from "./time.ts";
import { getSubjectColor, getContrastingTextColor } from "./colors.ts";

const SYSTEM_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif';

export interface RenderReport {
  shortenedClassIds: string[];
}

/**
 * Pure function that renders the timetable wallpaper onto an HTML5 Canvas.
 * No React dependencies.
 */
export function renderWallpaper(
  canvas: HTMLCanvasElement,
  classes: ClassEntry[],
  settings: WallpaperSettings,
  device: DeviceConfig,
  theme: ThemeConfig,
): RenderReport {
  const report: RenderReport = { shortenedClassIds: [] };
  const ctx = canvas.getContext("2d");
  if (!ctx) return report;

  const width = device.width;
  const height = device.height;

  // Set internal canvas resolution to full device pixel dimensions
  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);

  // 1. Draw Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, theme.bgGradient[0]);
  bgGrad.addColorStop(0.5, theme.bgGradient[1]);
  bgGrad.addColorStop(1, theme.bgGradient[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Optional subtle background glow effect in dark mode
  if (theme.id === "dark") {
    const radial = ctx.createRadialGradient(
      width * 0.5,
      height * 0.45,
      width * 0.1,
      width * 0.5,
      height * 0.45,
      width * 0.7,
    );
    radial.addColorStop(0, "rgba(59, 130, 246, 0.08)");
    radial.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Determine Days to display
  let days: Day[] = [...WEEKDAYS];
  const hasWeekendClasses = classes.some(
    (c) => c.day === "Sat" || c.day === "Sun",
  );

  if (
    settings.showWeekend === "always" ||
    (settings.showWeekend === "auto" && hasWeekendClasses)
  ) {
    days = [...DAYS_ORDER];
  }

  // 3. Determine Time Range (Hours)
  let startHour = 8;
  let endHour = 18;

  if (settings.timeRange !== "auto") {
    startHour = settings.timeRange.startHour;
    endHour = settings.timeRange.endHour;
  } else if (classes.length > 0) {
    let minMinutes = Infinity;
    let maxMinutes = -Infinity;

    for (const c of classes) {
      const startMin = timeToMinutes(c.start);
      const endMin = timeToMinutes(c.end);
      if (startMin < minMinutes) minMinutes = startMin;
      if (endMin > maxMinutes) maxMinutes = endMin;
    }

    if (minMinutes !== Infinity && maxMinutes !== -Infinity) {
      startHour = Math.max(0, Math.floor(minMinutes / 60));
      endHour = Math.min(24, Math.ceil(maxMinutes / 60));
    }
    // Ensure minimum span of 6 hours for nice aesthetic
    if (endHour - startHour < 6) {
      endHour = Math.min(24, startHour + 6);
    }
  }

  const totalHours = Math.max(1, endHour - startHour);

  // 4. Calculate Grid Dimensions & Safe Areas
  // The grid starts BELOW the iPhone clock area
  const topSafeY = height * device.topOffsetPercent;
  const bottomSafeY = height * (1 - device.bottomOffsetPercent);
  const totalGridHeight = bottomSafeY - topSafeY;

  const sideMargin = width * 0.038; // ~46px on iPhone 16 Pro
  const gridWidth = width - sideMargin * 2;

  const timeGutterWidth = width * 0.1; // ~108px for "09:00" labels
  const headerHeight = height * 0.024; // ~62px for Mon, Tue etc.
  const headerGap = height * 0.008; // gap between header and grid

  const scheduleTop = topSafeY + headerHeight + headerGap;
  const scheduleHeight = totalGridHeight - headerHeight - headerGap;
  const hourRowHeight = scheduleHeight / totalHours;

  const colGap = width * 0.01; // ~10px between day columns
  const dayColumnsWidth = gridWidth - timeGutterWidth;
  const colWidth = (dayColumnsWidth - (days.length - 1) * colGap) / days.length;

  // 5. Draw Card Backdrop for the Timetable Grid (Apple glassmorphism card style)
  const cardRadius = width * 0.028; // ~38px
  const cardPaddingTop = width * 0.014;
  const cardPaddingBottom = width * 0.014;
  const cardPaddingSide = width * 0.014;

  const cardX = sideMargin - cardPaddingSide;
  const cardY = topSafeY - cardPaddingTop;
  const cardW = gridWidth + cardPaddingSide * 2;
  const cardH = totalGridHeight + cardPaddingTop + cardPaddingBottom;

  ctx.save();
  ctx.beginPath();
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.fillStyle = theme.cardBg;
  ctx.fill();
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // 6. Draw Day Headers
  const dayFontScale = Math.round(width * 0.022); // Same system typeface as class labels
  ctx.font = `600 ${dayFontScale}px ${SYSTEM_FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  days.forEach((day, i) => {
    const colX = sideMargin + timeGutterWidth + i * (colWidth + colGap);
    const headerPillW = colWidth;
    const headerPillH = headerHeight;

    // Subtle header pill background
    ctx.save();
    ctx.beginPath();
    drawRoundedRect(
      ctx,
      colX,
      topSafeY,
      headerPillW,
      headerPillH,
      width * 0.014,
    );
    ctx.fillStyle = theme.dayHeaderBg;
    ctx.fill();

    // Day text
    ctx.fillStyle = theme.dayHeaderTextColor;
    ctx.fillText(day, colX + headerPillW / 2, topSafeY + headerPillH / 2);
    ctx.restore();
  });

  const gridLeft = sideMargin + timeGutterWidth - colGap / 2;
  const gridRight = sideMargin + gridWidth + colGap / 2;
  const gridRadius = width * 0.014;
  ctx.save();
  ctx.beginPath();
  drawRoundedRect(
    ctx,
    gridLeft,
    scheduleTop,
    gridRight - gridLeft,
    scheduleHeight,
    gridRadius,
  );
  ctx.clip();
  // Shade each whole grid cell, including the inset space beside class cards.
  days.forEach((_, index) => {
    if (index % 2 !== 0) return;
    ctx.fillStyle =
      theme.id === "dark" ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.025)";
    ctx.fillRect(
      gridLeft + index * (colWidth + colGap),
      scheduleTop,
      colWidth + colGap,
      scheduleHeight,
    );
  });

  ctx.restore();

  // 7. Draw Horizontal Hour Grid Lines & Time Labels
  const timeFontScale = Math.round(width * 0.019); // Secondary hierarchy for the time gutter
  ctx.font = `500 ${timeFontScale}px ${SYSTEM_FONT_STACK}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let h = 0; h <= totalHours; h++) {
    const currentHour = startHour + h;
    const y = scheduleTop + h * hourRowHeight;

    // Time string label
    ctx.fillStyle = theme.hourTextColor;
    ctx.fillText(
      formatHourLabel(currentHour),
      sideMargin + timeGutterWidth - width * 0.015,
      y,
    );

    // The outer rounded border supplies the first and last hour lines.
    if (h === 0 || h === totalHours) continue;
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = theme.gridLineColor;
    ctx.lineWidth = Math.max(1.5, width * 0.0015);
    ctx.setLineDash([]);
    ctx.moveTo(sideMargin + timeGutterWidth - colGap / 2, y);
    ctx.lineTo(sideMargin + gridWidth + colGap / 2, y);
    ctx.stroke();
    ctx.restore();
  }

  // 8. Day boundaries use the same solid grid rhythm as hour lines.
  ctx.save();
  ctx.strokeStyle = theme.gridLineColor;
  ctx.lineWidth = Math.max(1.5, width * 0.0015);
  ctx.setLineDash([]);
  for (let i = 1; i < days.length; i++) {
    const x =
      sideMargin + timeGutterWidth + i * (colWidth + colGap) - colGap / 2;
    ctx.beginPath();
    ctx.moveTo(x, scheduleTop);
    ctx.lineTo(x, scheduleTop + scheduleHeight);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  drawRoundedRect(
    ctx,
    gridLeft,
    scheduleTop,
    gridRight - gridLeft,
    scheduleHeight,
    gridRadius,
  );
  ctx.strokeStyle = theme.gridLineColor;
  ctx.lineWidth = Math.max(1.5, width * 0.0015);
  ctx.stroke();
  ctx.restore();

  // 9. Assign Subject Colors (Consistent by subject)
  const uniqueSubjects = Array.from(
    new Set(classes.map((c) => c.subject.trim())),
  );
  const subjectColorMap = new Map<string, string>();
  uniqueSubjects.forEach((subj, idx) => {
    subjectColorMap.set(subj, getSubjectColor(subj, theme.id, idx));
  });

  // 10. Draw Classes
  const classCornerRadius = width * 0.014; // ~22px rounded corners
  const startTotalMinutes = startHour * 60;

  layoutClasses(classes).forEach(({ entry, lane, lanes }) => {
    const dayIndex = days.indexOf(entry.day);
    if (dayIndex === -1) return; // not in visible days

    const classStartMin = timeToMinutes(entry.start);
    const classEndMin = timeToMinutes(entry.end);
    if (classEndMin <= classStartMin) return;

    // Clamp into visible hours
    const clampedStart = Math.max(startTotalMinutes, classStartMin);
    const clampedEnd = Math.min(endHour * 60, classEndMin);
    if (clampedEnd <= clampedStart) return;

    const laneWidth = colWidth / lanes;
    const laneGap = lanes > 1 ? Math.min(width * 0.003, laneWidth * 0.1) : 0;
    const blockX =
      sideMargin +
      timeGutterWidth +
      dayIndex * (colWidth + colGap) +
      lane * laneWidth;
    const durationHeight = ((clampedEnd - clampedStart) / 60) * hourRowHeight;
    // Match the side inset; retain a visible card for very short classes.
    const verticalInset = Math.min(
      colGap / 2,
      Math.max(0, (durationHeight - 1) / 2),
    );
    const blockY =
      scheduleTop +
      ((clampedStart - startTotalMinutes) / 60) * hourRowHeight +
      verticalInset;
    const blockH = Math.max(1, durationHeight - verticalInset * 2);
    const blockW = laneWidth - laneGap;

    // Class fill color
    const fillColor =
      entry.color ||
      subjectColorMap.get(entry.subject.trim()) ||
      theme.subjectColors[0];
    const textColor = getContrastingTextColor(fillColor);

    // A restrained neutral shadow keeps neighboring cards distinct.
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowBlur = width * 0.004;
    ctx.shadowOffsetY = width * 0.002;

    ctx.beginPath();
    drawRoundedRect(ctx, blockX, blockY, blockW, blockH, classCornerRadius);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.restore();

    // Subtle inner border for contrast
    ctx.save();
    ctx.beginPath();
    drawRoundedRect(ctx, blockX, blockY, blockW, blockH, classCornerRadius);
    ctx.strokeStyle =
      textColor === "black" ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // Text inside class card
    ctx.save();
    // Clip text to card bounds
    ctx.beginPath();
    drawRoundedRect(ctx, blockX, blockY, blockW, blockH, classCornerRadius);
    ctx.clip();

    const paddingX = Math.min(width * 0.011, blockW * 0.09);
    const paddingY = Math.min(paddingX, blockH * 0.05);
    const text = fitClassText(
      ctx,
      getSubjectLabel(entry.subject, settings),
      settings.showRooms ? (entry.room ?? "") : "",
      blockW - paddingX * 2,
      blockH - paddingY * 2,
      width,
      settings.textSize ?? "standard",
    );
    if (!text.complete) report.shortenedClassIds.push(entry.id);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = textColor;
    ctx.font = classFont(text.fontSize, 600);
    let curY = blockY + paddingY;
    for (const line of text.subjectLines) {
      ctx.fillText(line, blockX + paddingX, curY);
      curY += text.fontSize * 1.2;
    }
    if (text.roomLines.length) {
      curY += text.fontSize * 0.35;
      ctx.font = classFont(text.roomFontSize, 500);
      ctx.fillStyle = textColor;
      for (const line of text.roomLines) {
        ctx.fillText(line, blockX + paddingX, curY);
        curY += text.roomFontSize * 1.25;
      }
    }

    ctx.restore();
  });
  return report;
}

/**
 * Helper to draw rounded rectangle on canvas context.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

const classFont = (size: number, weight: number) =>
  `${weight} ${size}px ${SYSTEM_FONT_STACK}`;

// Ordinary subject words stay whole. Room identifiers may wrap at separators.
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  room = false,
): string[] {
  if (!text.trim() || width <= 0) return [];
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= width) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = "";
    if (room && ctx.measureText(word).width > width) {
      for (const part of word.split(/(?<=[/,-])/)) {
        if (line && ctx.measureText(line + part).width > width) {
          lines.push(line);
          line = "";
        }
        line += part;
      }
    } else line = word;
  }
  if (line) lines.push(line);
  return lines;
}

function limitLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  count: number,
  width: number,
): string[] {
  if (count < 1 || ctx.measureText("…").width > width) return [];
  return lines.slice(0, count).map((line, index) => {
    if (
      ctx.measureText(line).width <= width &&
      !(index === count - 1 && lines.length > count)
    )
      return line;
    const chars = Array.from(line);
    while (chars.length && ctx.measureText(chars.join("") + "…").width > width)
      chars.pop();
    return chars.join("") + "…";
  });
}

function fitClassText(
  ctx: CanvasRenderingContext2D,
  subject: string,
  room: string,
  width: number,
  height: number,
  canvasWidth: number,
  textSize: WallpaperSettings["textSize"],
) {
  const scale = { small: 0.018, standard: 0.02, large: 0.023 }[textSize];
  const fontSize = Math.max(11, Math.round(canvasWidth * scale));
  const roomFontSize = Math.max(10, Math.round(fontSize * 0.82));
  ctx.font = classFont(fontSize, 600);
  const subjectLines = wrapLines(ctx, subject, width);
  const subjectFits = subjectLines.every(
    (line) => ctx.measureText(line).width <= width,
  );
  ctx.font = classFont(roomFontSize, 500);
  const roomLines = wrapLines(ctx, room, width, true);
  const roomFits = roomLines.every(
    (line) => ctx.measureText(line).width <= width,
  );
  const gap = roomLines.length ? fontSize * 0.35 : 0;
  const totalHeight =
    subjectLines.length * fontSize * 1.2 +
    gap +
    roomLines.length * roomFontSize * 1.25;
  if (
    width > 0 &&
    subjectLines.length &&
    subjectFits &&
    roomFits &&
    totalHeight <= height
  ) {
    return { subjectLines, roomLines, fontSize, roomFontSize, complete: true };
  }
  // Keep a stable font size across the timetable; explicit shortening is reported.
  const roomCount = Math.max(
    0,
    Math.min(
      2,
      roomLines.length,
      Math.floor((height - fontSize * 1.2 - gap) / (roomFontSize * 1.25)),
    ),
  );
  const subjectCount = Math.max(
    0,
    Math.floor(
      (height - (roomCount ? gap : 0) - roomCount * roomFontSize * 1.25) /
        (fontSize * 1.2),
    ),
  );
  ctx.font = classFont(fontSize, 600);
  const shortSubject = limitLines(ctx, subjectLines, subjectCount, width);
  ctx.font = classFont(roomFontSize, 500);
  return {
    subjectLines: shortSubject,
    roomLines: limitLines(ctx, roomLines, roomCount, width),
    fontSize,
    roomFontSize,
    complete: false,
  };
}
