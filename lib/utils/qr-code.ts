/**
 * Pure TypeScript QR Code Generator (Zero external dependencies)
 * Generates audit-compliant SVG QR codes for Boma campaign links.
 * Implements ISO/IEC 18004 QR Code Model 2 (Byte mode with Error Correction).
 */

// Galois Field GF(256) tables with primitive polynomial 0x11d (285)
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_EXP[i + 255] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function polyMul(p1: Uint8Array, p2: Uint8Array): Uint8Array {
  const result = new Uint8Array(p1.length + p2.length - 1);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return result;
}

function getGeneratorPoly(ecLength: number): Uint8Array {
  let g: Uint8Array = new Uint8Array([1]);
  for (let i = 0; i < ecLength; i++) {
    g = polyMul(g, new Uint8Array([1, GF_EXP[i]]));
  }
  return g;
}

function calculateErrorCorrection(data: Uint8Array, ecLength: number): Uint8Array {
  const gen = getGeneratorPoly(ecLength);
  const remainder = new Uint8Array(ecLength);
  
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < ecLength - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    remainder[ecLength - 1] = gfMul(gen[ecLength], factor);
  }
  return remainder;
}

// Version table for byte-mode capacity with Level L error correction
interface VersionConfig {
  version: number;
  size: number;
  dataCapacity: number;
  ecPerBlock: number;
  numBlocks: number;
  alignments: number[];
}

const VERSIONS: VersionConfig[] = [
  { version: 1, size: 21, dataCapacity: 17, ecPerBlock: 7, numBlocks: 1, alignments: [] },
  { version: 2, size: 25, dataCapacity: 32, ecPerBlock: 10, numBlocks: 1, alignments: [6, 18] },
  { version: 3, size: 29, dataCapacity: 53, ecPerBlock: 15, numBlocks: 1, alignments: [6, 22] },
  { version: 4, size: 33, dataCapacity: 78, ecPerBlock: 20, numBlocks: 1, alignments: [6, 26] },
  { version: 5, size: 37, dataCapacity: 106, ecPerBlock: 26, numBlocks: 1, alignments: [6, 30] },
  { version: 6, size: 41, dataCapacity: 134, ecPerBlock: 18, numBlocks: 2, alignments: [6, 34] },
  { version: 7, size: 45, dataCapacity: 154, ecPerBlock: 20, numBlocks: 2, alignments: [6, 22, 38] },
];

export function encodeData(text: string): { matrix: boolean[][]; size: number } {
  const utf8Encoder = new TextEncoder();
  const textBytes = utf8Encoder.encode(text);
  
  // Find smallest version that fits
  let cfg = VERSIONS.find((v) => v.dataCapacity >= textBytes.length + 3);
  if (!cfg) {
    cfg = VERSIONS[VERSIONS.length - 1]; // Max fallback
  }

  // Construct data stream: mode indicator (4 bits: 0100 for Byte) + count (8 bits for v1-9)
  const bitBuffer: number[] = [];
  function pushBits(val: number, length: number) {
    for (let i = length - 1; i >= 0; i--) {
      bitBuffer.push((val >> i) & 1);
    }
  }

  // Mode: Byte (0100)
  pushBits(0b0100, 4);
  // Character count
  pushBits(Math.min(textBytes.length, 255), 8);
  // Data payload
  for (let i = 0; i < textBytes.length; i++) {
    pushBits(textBytes[i], 8);
  }

  // Terminator (up to 4 zeroes)
  const maxBits = cfg.dataCapacity * 8;
  const termLen = Math.min(4, maxBits - bitBuffer.length);
  pushBits(0, termLen);

  // Align to byte boundary
  while (bitBuffer.length % 8 !== 0) {
    bitBuffer.push(0);
  }

  // Pad bytes (0xEC, 0x11) until full
  const padPatterns = [0xec, 0x11];
  let padIdx = 0;
  while (bitBuffer.length < maxBits) {
    pushBits(padPatterns[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to data bytes
  const dataBytes = new Uint8Array(cfg.dataCapacity);
  for (let i = 0; i < cfg.dataCapacity; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bitBuffer[i * 8 + j];
    }
    dataBytes[i] = b;
  }

  // Calculate EC codewords
  const bytesPerBlock = Math.floor(cfg.dataCapacity / cfg.numBlocks);
  const allBlocksData: Uint8Array[] = [];
  const allBlocksEC: Uint8Array[] = [];

  for (let b = 0; b < cfg.numBlocks; b++) {
    const start = b * bytesPerBlock;
    const end = (b === cfg.numBlocks - 1) ? cfg.dataCapacity : (b + 1) * bytesPerBlock;
    const blockData = dataBytes.slice(start, end);
    allBlocksData.push(blockData);
    allBlocksEC.push(calculateErrorCorrection(blockData, cfg.ecPerBlock));
  }

  // Interleave data and EC
  const finalCodewords: number[] = [];
  const maxBlockLen = Math.max(...allBlocksData.map(b => b.length));
  for (let i = 0; i < maxBlockLen; i++) {
    for (let b = 0; b < cfg.numBlocks; b++) {
      if (i < allBlocksData[b].length) {
        finalCodewords.push(allBlocksData[b][i]);
      }
    }
  }
  for (let i = 0; i < cfg.ecPerBlock; i++) {
    for (let b = 0; b < cfg.numBlocks; b++) {
      finalCodewords.push(allBlocksEC[b][i]);
    }
  }

  // Initialize Matrix
  const size = cfg.size;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunctionModule: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setModule(r: number, c: number, val: boolean, isFunc = true) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      if (isFunc) isFunctionModule[r][c] = true;
    }
  }

  // 1. Finder patterns (top-left, top-right, bottom-left)
  function drawFinderPattern(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        const isOuter = (r === 0 || r === 6 || c === 0 || c === 6) && (r >= 0 && r <= 6 && c >= 0 && c <= 6);
        const isInner = (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        setModule(nr, nc, isOuter || isInner);
      }
    }
  }

  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);

  // 2. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  // 3. Alignment patterns (if any)
  if (cfg.alignments.length > 0) {
    for (const r of cfg.alignments) {
      for (const c of cfg.alignments) {
        if (isFunctionModule[r][c]) continue; // Skip finders
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isCenter = dr === 0 && dc === 0;
            setModule(r + dr, c + dc, isBorder || isCenter);
          }
        }
      }
    }
  }

  // 4. Dark module & format info reservation
  setModule(size - 8, 8, true); // Dark module
  for (let i = 0; i < 9; i++) {
    if (!isFunctionModule[8][i]) isFunctionModule[8][i] = true;
    if (!isFunctionModule[i][8]) isFunctionModule[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunctionModule[8][size - 1 - i]) isFunctionModule[8][size - 1 - i] = true;
    if (!isFunctionModule[size - 1 - i][8]) isFunctionModule[size - 1 - i][8] = true;
  }

  // 5. Data placement (zigzag)
  const dataBits: number[] = [];
  for (const b of finalCodewords) {
    for (let i = 7; i >= 0; i--) {
      dataBits.push((b >> i) & 1);
    }
  }

  let bitIdx = 0;
  let dir = -1; // Going up
  let col = size - 1;
  while (col > 0) {
    if (col === 6) col--; // Skip vertical timing column
    const rStart = dir === -1 ? size - 1 : 0;
    const rEnd = dir === -1 ? -1 : size;
    const rStep = dir;

    for (let r = rStart; r !== rEnd; r += rStep) {
      for (let cOffset = 0; cOffset < 2; cOffset++) {
        const c = col - cOffset;
        if (!isFunctionModule[r][c]) {
          const bit = bitIdx < dataBits.length ? dataBits[bitIdx++] : 0;
          // Mask 0: (row + col) % 2 === 0
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = (bit === 1) !== mask;
        }
      }
    }
    dir = -dir;
    col -= 2;
  }

  // 6. Format Information (Mask 000, ECC Level L = 01) -> Format string 0x77c4 with BCH
  const formatBits = 0x77c4; // Standard precomputed BCH for Level L, Mask 0
  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >> i) & 1) === 1;
    // Top-left
    if (i <= 5) setModule(8, i, bit);
    else if (i === 6) setModule(8, 7, bit);
    else if (i <= 8) setModule(8 - (i - 7), 8, bit);
    else setModule(14 - i, 8, bit);

    // Split around other finders
    if (i < 8) setModule(size - 1 - i, 8, bit);
    else setModule(8, size - 15 + i, bit);
  }

  return { matrix, size };
}

/**
 * Generate an SVG path data string for the QR code modules
 */
export function generateQrSvgPath(matrix: boolean[][]): string {
  const size = matrix.length;
  let path = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        path += `M${c},${r}h1v1h-1z `;
      }
    }
  }
  return path;
}
