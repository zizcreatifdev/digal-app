#!/usr/bin/env node
// Generate PWA PNG icons from the Digal SVG logo.
// Uses @resvg/resvg-js (WebAssembly SVG renderer) — no system deps needed.
// Output: public/icons/{icon-192x192,icon-512x512,apple-touch-icon,favicon-32x32,favicon-16x16}.png

const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const SVG_SRC = path.join(__dirname, '../public/logos/Logo Digal-icon_orange_sansbaseline.svg');
const OUT_DIR = path.join(__dirname, '../public/icons');

// Read source SVG
let svgRaw = fs.readFileSync(SVG_SRC, 'utf8');

// Convert CSS class fills to inline attributes so nested-SVG rendering is reliable.
// Original: class="cls-2" uses fill: #e94e1b  →  inline fill="#ffffff" (white on orange bg)
//           class="cls-1" uses fill-rule:evenodd + fill: #e94e1b
svgRaw = svgRaw
  .replace(/class="cls-2"/g, 'fill="#ffffff"')
  .replace(/class="cls-1"/g, 'fill="#ffffff" fill-rule="evenodd"');

// Strip XML declaration + outer <svg> wrapper to get inner markup only
const innerContent = svgRaw
  .replace(/<\?xml[^>]*\?>\s*/g, '')
  .replace(/<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  // Remove now-unused <defs> block entirely
  .replace(/<defs>[\s\S]*?<\/defs>/g, '');

// Build a square SVG: orange background (#E8511A) + centered white icon
// Original viewBox: 191.83 × 184.89 (nearly square, portrait-ish)
const ORIG_W = 191.83;
const ORIG_H = 184.89;
const BG_COLOR = '#E8511A';

function buildSquareSvg(canvasSize) {
  const padding = Math.round(canvasSize * 0.08);
  const availW = canvasSize - padding * 2;
  const availH = canvasSize - padding * 2;

  // Fit icon inside available space, preserving aspect ratio
  const scale = Math.min(availW / ORIG_W, availH / ORIG_H);
  const scaledW = ORIG_W * scale;
  const scaledH = ORIG_H * scale;
  const offsetX = (canvasSize - scaledW) / 2;
  const offsetY = (canvasSize - scaledH) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasSize} ${canvasSize}" width="${canvasSize}" height="${canvasSize}">
  <rect width="${canvasSize}" height="${canvasSize}" fill="${BG_COLOR}"/>
  <svg x="${offsetX.toFixed(2)}" y="${offsetY.toFixed(2)}" width="${scaledW.toFixed(2)}" height="${scaledH.toFixed(2)}" viewBox="0 0 ${ORIG_W} ${ORIG_H}">
    ${innerContent}
  </svg>
</svg>`;
}

const ICONS = [
  { name: 'icon-192x192.png',      size: 192 },
  { name: 'icon-512x512.png',      size: 512 },
  { name: 'apple-touch-icon.png',  size: 180 },
  { name: 'favicon-32x32.png',     size: 32  },
  { name: 'favicon-16x16.png',     size: 16  },
];

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

for (const { name, size } of ICONS) {
  const svg = buildSquareSvg(size);
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const png = resvg.render().asPng();
  fs.writeFileSync(path.join(OUT_DIR, name), png);
  console.log(`✓ ${name.padEnd(26)} ${size}×${size}px  (${png.length} bytes)`);
}

console.log('\nDone — icons written to public/icons/');
