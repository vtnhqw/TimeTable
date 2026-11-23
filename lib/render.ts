import { ClassEntry, WallpaperSettings, Day } from "./schema";
import { DeviceConfig } from "./devices";
import { ThemeConfig } from "./themes";
import { DAYS_ORDER, WEEKDAYS, timeToMinutes, formatHourLabel } from "./time";
import { getSubjectColor, getContrastingTextColor, hexToRgba } from "./colors";

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
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

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

  const timeGutterWidth = width * 0.09; // ~108px for "09:00" labels
  const headerHeight = height * 0.024; // ~62px for Mon, Tue etc.
  const headerGap = height * 0.008; // gap between header and grid

  const scheduleTop = topSafeY + headerHeight + headerGap;
  const scheduleHeight = totalGridHeight - headerHeight - headerGap;
  const hourRowHeight = scheduleHeight / totalHours;

  const colGap = width * 0.008; // ~10px between day columns
  const dayColumnsWidth = gridWidth - timeGutterWidth;
  const colWidth = (dayColumnsWidth - (days.length - 1) * colGap) / days.length;

  // 5. Draw Card Backdrop for the Timetable Grid (Apple glassmorphism card style)
  const cardRadius = width * 0.032; // ~38px
  const cardPaddingTop = height * 0.012;
  const cardPaddingBottom = height * 0.012;
  const cardPaddingSide = width * 0.012;

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
  const dayFontScale = Math.round(width * 0.024); // ~29px
  ctx.font = `600 ${dayFontScale}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, sans-serif`;
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
      headerPillH * 0.3,
    );
    ctx.fillStyle = theme.dayHeaderBg;
    ctx.fill();

    // Day text
    ctx.fillStyle = theme.dayHeaderTextColor;
    ctx.fillText(day, colX + headerPillW / 2, topSafeY + headerPillH / 2);
    ctx.restore();
  });

  // 7. Draw Horizontal Hour Grid Lines & Time Labels
  const timeFontScale = Math.round(width * 0.021); // ~25px
  ctx.font = `500 ${timeFontScale}px -apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, monospace`;
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

    // Grid horizontal line across columns
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = theme.gridLineColor;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]); // subtle dotted/dashed hour line
    ctx.moveTo(sideMargin + timeGutterWidth, y);
    ctx.lineTo(sideMargin + gridWidth, y);
    ctx.stroke();
    ctx.restore();
  }

  // 8. Draw Vertical Column Dividers (Very subtle)
  ctx.save();
  ctx.strokeStyle = theme.gridLineColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  for (let i = 0; i <= days.length; i++) {
    const x =
      sideMargin + timeGutterWidth + i * (colWidth + colGap) - colGap / 2;
    ctx.beginPath();
    ctx.moveTo(x, scheduleTop);
    ctx.lineTo(x, scheduleTop + scheduleHeight);
    ctx.stroke();
  }
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
  const classCornerRadius = width * 0.018; // ~22px rounded corners
  const startTotalMinutes = startHour * 60;

  classes.forEach((entry) => {
    const dayIndex = days.indexOf(entry.day);
    if (dayIndex === -1) return; // not in visible days

    const classStartMin = timeToMinutes(entry.start);
    const classEndMin = timeToMinutes(entry.end);
    if (classEndMin <= classStartMin) return;

    // Clamp into visible hours
    const clampedStart = Math.max(startTotalMinutes, classStartMin);
    const clampedEnd = Math.min(endHour * 60, classEndMin);
    if (clampedEnd <= clampedStart) return;

    const blockX =
      sideMargin + timeGutterWidth + dayIndex * (colWidth + colGap);
    const blockY =
      scheduleTop +
      ((clampedStart - startTotalMinutes) / 60) * hourRowHeight +
      2;
    const blockH = Math.max(
      1,
      ((clampedEnd - clampedStart) / 60) * hourRowHeight - 4,
    );
    const blockW = colWidth;

    // Class fill color
    const fillColor =
      entry.color ||
      subjectColorMap.get(entry.subject.trim()) ||
      theme.subjectColors[0];
    const textColor = getContrastingTextColor(fillColor);

    // Draw class card with shadow
    ctx.save();
    ctx.shadowColor = hexToRgba(fillColor, 0.35);
    ctx.shadowBlur = width * 0.012;
    ctx.shadowOffsetY = width * 0.005;

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

    const paddingX = blockW * 0.08;
    const paddingY = Math.min(blockH * 0.15, height * 0.008);

    // Subject font
    let titleFontSize = Math.round(width * 0.023); // ~28px
    if (blockH < hourRowHeight * 0.7) {
      titleFontSize = Math.round(width * 0.019);
    }
    ctx.font = `700 ${titleFontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Text wrapping / truncation
    const maxTextWidth = blockW - paddingX * 2;
    const lines = wrapText(ctx, entry.subject, maxTextWidth, 2);

    let curY = blockY + paddingY;
    lines.forEach((line) => {
      ctx.fillText(line, blockX + paddingX, curY);
      curY += titleFontSize * 1.15;
    });

    // Room name (if enabled and space permits)
    if (
      settings.showRooms &&
      entry.room &&
      curY + titleFontSize * 0.8 < blockY + blockH - 4
    ) {
      const roomFontSize = Math.max(12, Math.round(titleFontSize * 0.78));
      ctx.font = `500 ${roomFontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif`;
      ctx.fillStyle =
        textColor === "black" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.85)";
      ctx.fillText(entry.room, blockX + paddingX, curY + 2);
    }

    ctx.restore();
  });
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

/**
 * Helper to wrap text into lines or truncate with ellipsis.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (lines.length + 1 >= maxLines) {
        // Last line: truncate with ellipsis
        let truncated = currentLine ? `${currentLine} ${word}` : word;
        while (
          truncated.length > 0 &&
          ctx.measureText(`${truncated}…`).width > maxWidth
        ) {
          truncated = truncated.slice(0, -1);
        }
        lines.push(`${truncated}…`);
        currentLine = "";
        break;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
  }

  if (currentLine && lines.length < maxLines) {
    // Check if currentLine exceeds maxWidth (single very long word)
    if (ctx.measureText(currentLine).width > maxWidth) {
      let truncated = currentLine;
      while (
        truncated.length > 0 &&
        ctx.measureText(`${truncated}…`).width > maxWidth
      ) {
        truncated = truncated.slice(0, -1);
      }
      lines.push(`${truncated}…`);
    } else {
      lines.push(currentLine);
    }
  }

  return lines.length > 0 ? lines : [text];
}
