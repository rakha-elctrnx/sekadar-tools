import { writeFileSync } from "fs";
import { deflateSync } from "zlib";

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPNG(size, bgR, bgG, bgB, fgR, fgG, fgB, maskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(2, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const ihdrChunk = makeChunk("IHDR", ihdr);

  const rawData = [];
  const padding = maskable ? Math.floor(size * 0.1) : 0;
  const cx = size / 2;
  const cy = size / 2;
  const letterStart = Math.floor(size * 0.25);
  const letterEnd = Math.floor(size * 0.75);
  const letterTop = Math.floor(size * 0.15);
  const letterBottom = Math.floor(size * 0.75);

  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      const inBounds = x >= padding && x < size - padding && y >= padding && y < size - padding;
      const relX = (x - letterStart) / (letterEnd - letterStart);
      const relY = (y - letterTop) / (letterBottom - letterTop);

      let isForeground = false;
      if (inBounds && relX >= 0 && relX <= 1 && relY >= 0 && relY <= 1) {
        // Top bar of S
        if (relY >= 0 && relY < 0.18 && relX >= 0.15 && relX <= 0.85) isForeground = true;
        // Left side upper
        if (relY >= 0 && relY < 0.5 && relX >= 0.15 && relX < 0.35) isForeground = true;
        // Middle bar
        if (relY >= 0.41 && relY < 0.59 && relX >= 0.15 && relX <= 0.85) isForeground = true;
        // Right side lower
        if (relY >= 0.5 && relY <= 1.0 && relX > 0.65 && relX <= 0.85) isForeground = true;
        // Bottom bar
        if (relY > 0.82 && relY <= 1.0 && relX >= 0.15 && relX <= 0.85) isForeground = true;
      }

      if (isForeground) {
        rawData.push(fgR, fgG, fgB);
      } else {
        rawData.push(bgR, bgG, bgB);
      }
    }
  }

  const compressed = deflateSync(Buffer.from(rawData));
  const idatChunk = makeChunk("IDAT", compressed);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate icons: dark bg (#0a0a0a) with red "S" (#c5030c)
const icon192 = createPNG(192, 10, 10, 10, 197, 3, 12, false);
const icon512 = createPNG(512, 10, 10, 10, 197, 3, 12, false);
const iconMask192 = createPNG(192, 10, 10, 10, 197, 3, 12, true);
const iconMask512 = createPNG(512, 10, 10, 10, 197, 3, 12, true);

writeFileSync("public/icons/icon-192x192.png", icon192);
writeFileSync("public/icons/icon-512x512.png", icon512);
writeFileSync("public/icons/icon-maskable-192x192.png", iconMask192);
writeFileSync("public/icons/icon-maskable-512x512.png", iconMask512);

console.log("✓ Generated PWA icons:");
console.log("  - public/icons/icon-192x192.png");
console.log("  - public/icons/icon-512x512.png");
console.log("  - public/icons/icon-maskable-192x192.png");
console.log("  - public/icons/icon-maskable-512x512.png");
