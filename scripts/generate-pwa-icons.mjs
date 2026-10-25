import zlib from "zlib";
import fs from "fs";
import path from "path";

function createSciFiIconPNG(size, isMaskable = false) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crcVal = zlib.crc32(Buffer.concat([typeBuf, data]));
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crcVal >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk("IHDR", ihdr);

  const rowLen = 1 + size * 4;
  const rawData = Buffer.alloc(size * rowLen);
  const cx = size / 2;
  const cy = size / 2;
  const scale = isMaskable ? size * 0.38 : size * 0.44;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < size; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = (x - cx) / scale;
      const dy = (y - cy) / scale;
      const r = Math.sqrt(dx * dx + dy * dy);

      // Deep cosmic dark background (#020617 with subtle radial glow)
      let red = 2 + Math.floor(Math.max(0, 1 - r * 0.5) * 12);
      let green = 6 + Math.floor(Math.max(0, 1 - r * 0.5) * 16);
      let blue = 23 + Math.floor(Math.max(0, 1 - r * 0.5) * 35);
      let alpha = 255;

      // 4-pointed diamond star calculation: |dx|^0.5 + |dy|^0.5 <= 1.05
      const starMetric = Math.pow(Math.abs(dx), 0.55) + Math.pow(Math.abs(dy), 0.55);

      if (starMetric <= 1.08) {
        // Star body: blend cyan (#22d3ee) to electric violet (#818cf8)
        const gradientT = (dx + dy + 2) / 4;
        const starR = Math.floor(34 * (1 - gradientT) + 129 * gradientT);
        const starG = Math.floor(211 * (1 - gradientT) + 140 * gradientT);
        const starB = Math.floor(238 * (1 - gradientT) + 248 * gradientT);

        // Core highlight near center
        if (r < 0.28) {
          const coreFactor = 1 - r / 0.28;
          red = Math.floor(starR * (1 - coreFactor) + 255 * coreFactor);
          green = Math.floor(starG * (1 - coreFactor) + 255 * coreFactor);
          blue = Math.floor(starB * (1 - coreFactor) + 255 * coreFactor);
        } else {
          red = starR;
          green = starG;
          blue = starB;
        }
      } else if (starMetric <= 1.35) {
        // Soft aura / glow around the star
        const glowFactor = (1.35 - starMetric) / 0.27;
        red = Math.floor(red * (1 - glowFactor * 0.4) + 56 * glowFactor * 0.4);
        green = Math.floor(green * (1 - glowFactor * 0.4) + 189 * glowFactor * 0.4);
        blue = Math.floor(blue * (1 - glowFactor * 0.4) + 248 * glowFactor * 0.4);
      }

      rawData[pxOffset] = red;
      rawData[pxOffset + 1] = green;
      rawData[pxOffset + 2] = blue;
      rawData[pxOffset + 3] = alpha;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk("IDAT", compressed);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));
  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(process.cwd(), "public");
fs.writeFileSync(path.join(publicDir, "pwa-192x192.png"), createSciFiIconPNG(192));
fs.writeFileSync(path.join(publicDir, "pwa-512x512.png"), createSciFiIconPNG(512));
fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), createSciFiIconPNG(180));
fs.writeFileSync(path.join(publicDir, "pwa-maskable-512x512.png"), createSciFiIconPNG(512, true));

console.log("PWA icon assets generated successfully in public/ directory.");
