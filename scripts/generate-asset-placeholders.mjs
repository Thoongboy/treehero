import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { deflateSync } from "node:zlib";

const root = process.cwd();
const imagePathsPath = path.join(root, "src/assets/IMAGE_PATHS.md");
const placeholdersPath = path.join(root, "placeholders.js");
const force = process.argv.includes("--force");

const customSpecs = new Map([
  ["splash.main", { width: 1600, height: 1000 }],
  ["character.hero", { width: 256, height: 384 }],
  ["character.inventory", { width: 512, height: 768 }],
  ["tree.trunk", { width: 256, height: 512 }],
  ["tree.crown", { width: 512, height: 384 }],
  ["hud.hp", { width: 256, height: 96 }],
  ["hud.xp", { width: 256, height: 96 }],
  ["hud.tree", { width: 256, height: 96 }],
  ["effect.slash", { width: 512, height: 256 }],
  ["ground.grove", { width: 256, height: 128 }],
  ["ground.dungeon", { width: 256, height: 128 }],
  ["ground.wall", { width: 256, height: 128 }],
  ["campfire", { width: 384, height: 384 }],
  ["shop", { width: 512, height: 512 }],
  ["portal.grove", { width: 384, height: 512 }],
  ["portal.floor", { width: 384, height: 512 }],
  ["portal.return", { width: 384, height: 512 }],
  ["obstacle.pillar", { width: 256, height: 384 }],
  ["obstacle.roots", { width: 384, height: 256 }],
  ["obstacle.rubble", { width: 384, height: 256 }],
  ["craft.table", { width: 512, height: 384 }]
]);

const defaultSpecsByCategory = new Map([
  ["map", { width: 128, height: 128 }],
  ["hud", { width: 256, height: 96 }]
]);

const FONT = {
  "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  "G": ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  "J": ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  "W": ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["10010", "10010", "10010", "11111", "00010", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"]
};

function parseHex(hex, alpha = 255) {
  const normalized = String(hex || "#ffffff").replace("#", "");
  const full = normalized.length === 3
    ? normalized.split("").map((part) => part + part).join("")
    : normalized.padEnd(6, "0").slice(0, 6);
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
    a: alpha
  };
}

function withAlpha(color, alpha) {
  return { ...color, a: alpha };
}

function parseImagePathRows(markdown) {
  return [...markdown.matchAll(/\| `([^`]+)` \| `([^`]+)` \|/g)]
    .map((match) => ({ id: match[1], filePath: match[2] }));
}

function parseAssetMetadata(source) {
  const metadata = new Map();
  const pattern = /^\s*(?:"([^"]+)"|([a-zA-Z0-9_.-]+)):\s*\{\s*label:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*shape:\s*"([^"]+)",\s*fill:\s*"([^"]+)",\s*stroke:\s*"([^"]+)",\s*glyph:\s*"([^"]*)"/gm;
  for (const match of source.matchAll(pattern)) {
    metadata.set(match[1] || match[2], {
      label: match[3],
      category: match[4],
      shape: match[5],
      fill: match[6],
      stroke: match[7],
      glyph: match[8]
    });
  }
  return metadata;
}

function specFor(asset) {
  return customSpecs.get(asset.id) || defaultSpecsByCategory.get(asset.category) || { width: 256, height: 256 };
}

function createCanvas(width, height) {
  const pixels = new Uint8ClampedArray(width * height * 4);

  function blendPixel(x, y, color) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= width || y >= height || color.a <= 0) return;
    const index = (y * width + x) * 4;
    const srcA = color.a / 255;
    const dstA = pixels[index + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA <= 0) return;
    pixels[index] = Math.round((color.r * srcA + pixels[index] * dstA * (1 - srcA)) / outA);
    pixels[index + 1] = Math.round((color.g * srcA + pixels[index + 1] * dstA * (1 - srcA)) / outA);
    pixels[index + 2] = Math.round((color.b * srcA + pixels[index + 2] * dstA * (1 - srcA)) / outA);
    pixels[index + 3] = Math.round(outA * 255);
  }

  function fillRect(x, y, w, h, color) {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(width, Math.ceil(x + w));
    const y1 = Math.min(height, Math.ceil(y + h));
    for (let py = y0; py < y1; py += 1) {
      for (let px = x0; px < x1; px += 1) blendPixel(px, py, color);
    }
  }

  function strokeRect(x, y, w, h, color, thickness = 2) {
    fillRect(x, y, w, thickness, color);
    fillRect(x, y + h - thickness, w, thickness, color);
    fillRect(x, y, thickness, h, color);
    fillRect(x + w - thickness, y, thickness, h, color);
  }

  function fillEllipse(cx, cy, rx, ry, color) {
    const x0 = Math.floor(cx - rx);
    const x1 = Math.ceil(cx + rx);
    const y0 = Math.floor(cy - ry);
    const y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) blendPixel(x, y, color);
      }
    }
  }

  function strokeEllipse(cx, cy, rx, ry, color, thickness = 3) {
    const x0 = Math.floor(cx - rx - thickness);
    const x1 = Math.ceil(cx + rx + thickness);
    const y0 = Math.floor(cy - ry - thickness);
    const y1 = Math.ceil(cy + ry + thickness);
    const edge = Math.max(thickness / Math.max(rx, ry), 0.015);
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        const d = dx * dx + dy * dy;
        if (d <= 1 + edge && d >= 1 - edge * 2.5) blendPixel(x, y, color);
      }
    }
  }

  function fillPolygon(points, color) {
    const minX = Math.floor(Math.min(...points.map((point) => point[0])));
    const maxX = Math.ceil(Math.max(...points.map((point) => point[0])));
    const minY = Math.floor(Math.min(...points.map((point) => point[1])));
    const maxY = Math.ceil(Math.max(...points.map((point) => point[1])));
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        if (pointInPolygon(x + 0.5, y + 0.5, points)) blendPixel(x, y, color);
      }
    }
  }

  function drawLine(x0, y0, x1, y1, color, thickness = 2) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      fillEllipse(x0 + dx * t, y0 + dy * t, thickness / 2, thickness / 2, color);
    }
  }

  function drawArc(cx, cy, rx, ry, start, end, color, thickness = 4) {
    const steps = Math.max(24, Math.ceil(Math.abs(end - start) * Math.max(rx, ry) / 6));
    let previous = null;
    for (let i = 0; i <= steps; i += 1) {
      const angle = start + (end - start) * (i / steps);
      const point = [cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry];
      if (previous) drawLine(previous[0], previous[1], point[0], point[1], color, thickness);
      previous = point;
    }
  }

  return { width, height, pixels, blendPixel, fillRect, strokeRect, fillEllipse, strokeEllipse, fillPolygon, drawLine, drawArc };
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];
    const intersects = ((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function starPoints(cx, cy, outer, inner, count = 8) {
  const points = [];
  for (let i = 0; i < count * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (Math.PI * i) / count;
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  return points;
}

function drawPixelText(canvas, text, cx, cy, maxWidth, maxHeight, color) {
  const lines = wrapText(String(text || "").toUpperCase(), maxWidth > 360 ? 14 : 8).slice(0, 2);
  const maxLineWidth = Math.max(...lines.map((line) => measureText(line, 1)));
  const scale = Math.max(1, Math.floor(Math.min(maxWidth / Math.max(maxLineWidth, 1), maxHeight / (lines.length * 8))));
  const lineHeight = 8 * scale;
  const startY = cy - (lines.length * lineHeight) / 2;
  lines.forEach((line, lineIndex) => {
    const lineWidth = measureText(line, scale);
    let x = cx - lineWidth / 2;
    const y = startY + lineIndex * lineHeight;
    for (const char of line) {
      const glyph = FONT[char] || FONT[" "];
      for (let row = 0; row < glyph.length; row += 1) {
        for (let col = 0; col < glyph[row].length; col += 1) {
          if (glyph[row][col] === "1") canvas.fillRect(x + col * scale, y + row * scale, scale, scale, color);
        }
      }
      x += 6 * scale;
    }
  });
}

function wrapText(text, maxChars) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [text];
}

function measureText(text, scale) {
  return String(text || "").length * 6 * scale;
}

function drawPlaceholder(asset) {
  const spec = specFor(asset);
  const canvas = createCanvas(spec.width, spec.height);
  const fill = parseHex(asset.fill, 230);
  const stroke = parseHex(asset.stroke, 255);
  const ink = parseHex("#24150c", 235);
  const light = parseHex("#fff2c5", 230);
  const guide = parseHex("#ffffff", 28);
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const s = Math.min(w, h);
  const thick = Math.max(2, Math.round(s * 0.025));

  if (asset.id === "splash.main") {
    drawSplash(canvas, fill, stroke);
  } else {
    canvas.strokeRect(1, 1, w - 2, h - 2, guide, Math.max(1, Math.round(s * 0.008)));
    drawShape(canvas, asset.shape, fill, stroke, ink, light, cx, cy, w, h, s, thick);
  }

  if (asset.glyph) {
    drawPixelText(canvas, asset.glyph, cx + Math.max(1, thick / 2), cy + Math.max(1, thick / 2), w * 0.62, h * 0.22, parseHex("#000000", 125));
    drawPixelText(canvas, asset.glyph, cx, cy, w * 0.62, h * 0.22, light);
  }

  return pngEncode(canvas);
}

function drawShape(canvas, shape, fill, stroke, ink, light, cx, cy, w, h, s, thick) {
  if (shape === "diamond") {
    canvas.fillPolygon([[cx, h * 0.12], [w * 0.88, cy], [cx, h * 0.88], [w * 0.12, cy]], fill);
    canvas.drawLine(cx, h * 0.12, w * 0.88, cy, stroke, thick);
    canvas.drawLine(w * 0.88, cy, cx, h * 0.88, stroke, thick);
    canvas.drawLine(cx, h * 0.88, w * 0.12, cy, stroke, thick);
    canvas.drawLine(w * 0.12, cy, cx, h * 0.12, stroke, thick);
    return;
  }
  if (shape === "hero" || shape === "paperHero") {
    canvas.fillEllipse(cx, h * 0.82, w * 0.28, h * 0.06, withAlpha(ink, 70));
    canvas.fillRect(cx - w * 0.18, h * 0.38, w * 0.36, h * 0.34, fill);
    canvas.strokeRect(cx - w * 0.18, h * 0.38, w * 0.36, h * 0.34, stroke, thick);
    canvas.fillEllipse(cx, h * 0.28, w * 0.14, h * 0.12, parseHex("#e8c990", 255));
    canvas.strokeEllipse(cx, h * 0.28, w * 0.14, h * 0.12, stroke, thick);
    canvas.drawLine(cx - w * 0.28, h * 0.48, cx + w * 0.28, h * 0.48, stroke, thick);
    return;
  }
  if (shape === "monster") {
    canvas.fillEllipse(cx, h * 0.74, w * 0.33, h * 0.08, withAlpha(ink, 70));
    canvas.fillEllipse(cx, h * 0.45, w * 0.31, h * 0.28, fill);
    canvas.strokeEllipse(cx, h * 0.45, w * 0.31, h * 0.28, stroke, thick);
    canvas.fillEllipse(cx - w * 0.11, h * 0.38, s * 0.025, s * 0.025, ink);
    canvas.fillEllipse(cx + w * 0.11, h * 0.38, s * 0.025, s * 0.025, ink);
    return;
  }
  if (shape === "portal") {
    canvas.strokeEllipse(cx, h * 0.52, w * 0.28, h * 0.34, stroke, thick * 2);
    canvas.strokeEllipse(cx, h * 0.52, w * 0.2, h * 0.26, withAlpha(fill, 170), thick);
    canvas.fillEllipse(cx, h * 0.52, w * 0.15, h * 0.22, withAlpha(fill, 70));
    return;
  }
  if (shape === "fire") {
    canvas.fillPolygon([[cx, h * 0.16], [w * 0.68, h * 0.58], [cx, h * 0.84], [w * 0.32, h * 0.58]], fill);
    canvas.fillPolygon([[cx, h * 0.34], [w * 0.6, h * 0.62], [cx, h * 0.76], [w * 0.4, h * 0.62]], light);
    canvas.drawLine(w * 0.28, h * 0.85, w * 0.72, h * 0.85, stroke, thick);
    return;
  }
  if (shape === "shop") {
    canvas.fillRect(w * 0.22, h * 0.42, w * 0.56, h * 0.36, fill);
    canvas.strokeRect(w * 0.22, h * 0.42, w * 0.56, h * 0.36, stroke, thick);
    canvas.fillPolygon([[w * 0.14, h * 0.42], [cx, h * 0.2], [w * 0.86, h * 0.42]], parseHex("#d8b56d", 245));
    canvas.drawLine(w * 0.14, h * 0.42, cx, h * 0.2, stroke, thick);
    canvas.drawLine(cx, h * 0.2, w * 0.86, h * 0.42, stroke, thick);
    canvas.drawLine(w * 0.14, h * 0.42, w * 0.86, h * 0.42, stroke, thick);
    return;
  }
  if (shape === "table") {
    canvas.fillRect(w * 0.18, h * 0.38, w * 0.64, h * 0.2, fill);
    canvas.strokeRect(w * 0.18, h * 0.38, w * 0.64, h * 0.2, stroke, thick);
    canvas.drawLine(w * 0.3, h * 0.58, w * 0.24, h * 0.84, stroke, thick * 1.5);
    canvas.drawLine(w * 0.7, h * 0.58, w * 0.76, h * 0.84, stroke, thick * 1.5);
    return;
  }
  if (shape === "pillar") {
    canvas.fillRect(w * 0.35, h * 0.18, w * 0.3, h * 0.64, fill);
    canvas.strokeRect(w * 0.35, h * 0.18, w * 0.3, h * 0.64, stroke, thick);
    canvas.fillRect(w * 0.27, h * 0.12, w * 0.46, h * 0.1, withAlpha(fill, 245));
    canvas.fillRect(w * 0.25, h * 0.78, w * 0.5, h * 0.1, withAlpha(fill, 245));
    return;
  }
  if (shape === "roots") {
    for (let i = 0; i < 5; i += 1) {
      const startX = w * (0.18 + i * 0.16);
      canvas.drawLine(startX, h * 0.32, cx, h * 0.62, stroke, thick * 1.2);
      canvas.drawLine(cx, h * 0.62, w * (0.12 + i * 0.18), h * 0.82, fill, thick);
    }
    return;
  }
  if (shape === "blade") {
    canvas.drawLine(w * 0.28, h * 0.76, w * 0.7, h * 0.24, fill, thick * 2.6);
    canvas.drawLine(w * 0.28, h * 0.76, w * 0.7, h * 0.24, stroke, thick);
    canvas.drawLine(w * 0.22, h * 0.66, w * 0.38, h * 0.82, stroke, thick * 1.8);
    return;
  }
  if (shape === "axe") {
    canvas.drawLine(w * 0.32, h * 0.78, w * 0.62, h * 0.24, stroke, thick * 1.6);
    canvas.fillEllipse(w * 0.64, h * 0.3, w * 0.16, h * 0.12, fill);
    canvas.strokeEllipse(w * 0.64, h * 0.3, w * 0.16, h * 0.12, stroke, thick);
    return;
  }
  if (shape === "spear" || shape === "staff" || shape === "wand") {
    canvas.drawLine(w * 0.3, h * 0.78, w * 0.68, h * 0.22, stroke, thick * 1.4);
    canvas.fillEllipse(w * 0.68, h * 0.22, s * 0.07, s * 0.07, fill);
    canvas.strokeEllipse(w * 0.68, h * 0.22, s * 0.07, s * 0.07, stroke, thick);
    return;
  }
  if (shape === "bow" || shape === "crossbow") {
    canvas.drawArc(cx, cy, w * 0.26, h * 0.32, -Math.PI / 2, Math.PI / 2, stroke, thick * 1.4);
    canvas.drawLine(cx, h * 0.18, cx, h * 0.82, light, Math.max(1, thick * 0.7));
    if (shape === "crossbow") canvas.drawLine(w * 0.28, cy, w * 0.72, cy, stroke, thick * 1.2);
    return;
  }
  if (shape === "shield") {
    canvas.fillPolygon([[cx, h * 0.16], [w * 0.76, h * 0.3], [w * 0.68, h * 0.68], [cx, h * 0.86], [w * 0.32, h * 0.68], [w * 0.24, h * 0.3]], fill);
    canvas.drawLine(cx, h * 0.16, w * 0.76, h * 0.3, stroke, thick);
    canvas.drawLine(w * 0.76, h * 0.3, w * 0.68, h * 0.68, stroke, thick);
    canvas.drawLine(w * 0.68, h * 0.68, cx, h * 0.86, stroke, thick);
    canvas.drawLine(cx, h * 0.86, w * 0.32, h * 0.68, stroke, thick);
    canvas.drawLine(w * 0.32, h * 0.68, w * 0.24, h * 0.3, stroke, thick);
    canvas.drawLine(w * 0.24, h * 0.3, cx, h * 0.16, stroke, thick);
    return;
  }
  if (shape === "ring") {
    canvas.strokeEllipse(cx, cy, w * 0.25, h * 0.25, fill, thick * 2);
    canvas.fillEllipse(cx, h * 0.28, s * 0.08, s * 0.08, light);
    canvas.strokeEllipse(cx, h * 0.28, s * 0.08, s * 0.08, stroke, thick);
    return;
  }
  if (shape === "potion") {
    canvas.fillRect(w * 0.42, h * 0.18, w * 0.16, h * 0.16, stroke);
    canvas.fillEllipse(cx, h * 0.58, w * 0.22, h * 0.28, fill);
    canvas.strokeEllipse(cx, h * 0.58, w * 0.22, h * 0.28, stroke, thick);
    return;
  }
  if (shape === "leaf" || shape === "crown") {
    canvas.fillEllipse(cx - w * 0.11, cy, w * 0.2, h * 0.26, fill);
    canvas.fillEllipse(cx + w * 0.11, cy, w * 0.2, h * 0.26, withAlpha(fill, 210));
    canvas.strokeEllipse(cx - w * 0.11, cy, w * 0.2, h * 0.26, stroke, thick);
    canvas.strokeEllipse(cx + w * 0.11, cy, w * 0.2, h * 0.26, stroke, thick);
    return;
  }
  if (shape === "sapling") {
    canvas.drawLine(cx, h * 0.82, cx, h * 0.3, stroke, thick * 1.2);
    canvas.fillEllipse(cx - w * 0.12, h * 0.4, w * 0.13, h * 0.09, fill);
    canvas.fillEllipse(cx + w * 0.12, h * 0.32, w * 0.13, h * 0.09, fill);
    return;
  }
  if (shape === "trunk") {
    canvas.fillRect(w * 0.36, h * 0.16, w * 0.28, h * 0.7, fill);
    canvas.strokeRect(w * 0.36, h * 0.16, w * 0.28, h * 0.7, stroke, thick);
    return;
  }
  if (shape === "rock") {
    canvas.fillPolygon([[w * 0.2, h * 0.66], [w * 0.34, h * 0.36], [w * 0.56, h * 0.28], [w * 0.8, h * 0.56], [w * 0.68, h * 0.78], [w * 0.32, h * 0.78]], fill);
    canvas.strokeEllipse(cx, h * 0.57, w * 0.31, h * 0.24, stroke, thick);
    return;
  }
  if (shape === "rune" || shape === "mapNode") {
    canvas.fillEllipse(cx, cy, w * 0.28, h * 0.28, fill);
    canvas.strokeEllipse(cx, cy, w * 0.28, h * 0.28, stroke, thick);
    canvas.drawLine(cx, h * 0.26, cx, h * 0.74, light, thick);
    canvas.drawLine(w * 0.28, cy, w * 0.72, cy, light, thick);
    return;
  }
  if (shape === "bar") {
    canvas.fillRect(w * 0.12, h * 0.32, w * 0.76, h * 0.36, fill);
    canvas.strokeRect(w * 0.12, h * 0.32, w * 0.76, h * 0.36, stroke, thick);
    canvas.fillRect(w * 0.16, h * 0.4, w * 0.46, h * 0.2, withAlpha(light, 140));
    return;
  }
  if (shape === "arc") {
    canvas.drawArc(cx, cy, w * 0.34, h * 0.24, -Math.PI * 0.78, Math.PI * 0.18, fill, thick * 4);
    canvas.drawArc(cx, cy, w * 0.34, h * 0.24, -Math.PI * 0.78, Math.PI * 0.18, light, thick * 1.5);
    return;
  }
  if (shape === "burst") {
    canvas.fillPolygon(starPoints(cx, cy, s * 0.34, s * 0.13, 9), fill);
    canvas.strokeEllipse(cx, cy, s * 0.24, s * 0.24, light, thick);
    return;
  }
  if (shape === "bolt") {
    canvas.fillPolygon([[w * 0.56, h * 0.1], [w * 0.28, h * 0.52], [w * 0.48, h * 0.52], [w * 0.38, h * 0.9], [w * 0.74, h * 0.42], [w * 0.54, h * 0.42]], fill);
    return;
  }
  canvas.fillRect(w * 0.22, h * 0.22, w * 0.56, h * 0.56, fill);
  canvas.strokeRect(w * 0.22, h * 0.22, w * 0.56, h * 0.56, stroke, thick);
}

function drawSplash(canvas) {
  const w = canvas.width;
  const h = canvas.height;
  canvas.fillRect(0, 0, w, h, parseHex("#17100b", 255));
  canvas.fillRect(0, h * 0.62, w, h * 0.38, parseHex("#19331f", 255));
  canvas.fillEllipse(w * 0.36, h * 0.38, w * 0.2, h * 0.2, parseHex("#4faf58", 245));
  canvas.fillRect(w * 0.32, h * 0.38, w * 0.08, h * 0.38, parseHex("#8a562c", 255));
  canvas.strokeEllipse(w * 0.76, h * 0.56, w * 0.11, h * 0.22, parseHex("#7fc1ee", 230), Math.round(w * 0.012));
  canvas.fillRect(w * 0.47, h * 0.63, w * 0.04, h * 0.09, parseHex("#80a9c8", 255));
  canvas.fillEllipse(w * 0.49, h * 0.6, w * 0.018, h * 0.025, parseHex("#e8c990", 255));
}

function pngEncode(canvas) {
  const raw = Buffer.alloc((canvas.width * 4 + 1) * canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    const rawOffset = y * (canvas.width * 4 + 1);
    raw[rawOffset] = 0;
    Buffer.from(canvas.pixels.buffer, y * canvas.width * 4, canvas.width * 4).copy(raw, rawOffset + 1);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr(canvas.width, canvas.height)),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function ihdr(width, height) {
  const buffer = Buffer.alloc(13);
  buffer.writeUInt32BE(width, 0);
  buffer.writeUInt32BE(height, 4);
  buffer[8] = 8;
  buffer[9] = 6;
  buffer[10] = 0;
  buffer[11] = 0;
  buffer[12] = 0;
  return buffer;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

const crcTable = new Uint32Array(256).map((_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

const [imagePathsMarkdown, placeholdersSource] = await Promise.all([
  readFile(imagePathsPath, "utf8"),
  readFile(placeholdersPath, "utf8")
]);

const metadata = parseAssetMetadata(placeholdersSource);
const assets = parseImagePathRows(imagePathsMarkdown).map((row) => ({
  ...row,
  ...(metadata.get(row.id) || {
    label: row.id,
    category: "debug",
    shape: "square",
    fill: "#ff4f4f",
    stroke: "#24150c",
    glyph: "MISS"
  })
}));

let written = 0;
let skipped = 0;
for (const asset of assets) {
  const destination = path.join(root, asset.filePath);
  if (!force && await exists(destination)) {
    skipped += 1;
    continue;
  }
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, drawPlaceholder(asset));
  written += 1;
}

console.log(`${written} PNG placeholder template(s) written.`);
console.log(`${skipped} existing file(s) skipped${force ? " (force was enabled)." : ". Use --force to overwrite."}`);
