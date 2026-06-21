/**
 * Minimal pure-JS PDF generator.
 * No external dependencies. Supports only what we need:
 *  - Multiple pages
 *  - Helvetica font, plain text
 *  - Automatic line wrapping and page breaks
 *
 * Returns a Buffer of the rendered PDF.
 */

interface Page {
  text: string[];
}

const PAGE_WIDTH = 595; // A4 @ 72 DPI
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const LINE_HEIGHT = 16;
const MAX_LINES_PER_PAGE = Math.floor((PAGE_HEIGHT - MARGIN * 2) / LINE_HEIGHT);

function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const tentative = current ? `${current} ${w}` : w;
    if (tentative.length > maxChars && current) {
      lines.push(current);
      current = w;
    } else {
      current = tentative;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function paginate(lines: string[], maxCharsPerLine: number): Page[] {
  const all: string[] = [];
  for (const line of lines) {
    all.push(...wrapText(line, maxCharsPerLine));
  }
  const pages: Page[] = [];
  for (let i = 0; i < all.length; i += MAX_LINES_PER_PAGE) {
    pages.push({ text: all.slice(i, i + MAX_LINES_PER_PAGE) });
  }
  if (pages.length === 0) pages.push({ text: [] });
  return pages;
}

function buildContentStream(page: Page): string {
  let y = PAGE_HEIGHT - MARGIN;
  let stream = "BT\n/F1 11 Tf\n";
  for (const line of page.text) {
    // Escape parentheses and backslashes for PDF strings
    const safe = line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    stream += `1 0 0 1 ${MARGIN} ${y} Tm (${safe}) Tj\n`;
    y -= LINE_HEIGHT;
  }
  stream += "ET";
  return stream;
}

function buildPdf(title: string, body: string[]): Buffer {
  const pages = paginate(body, 90);
  // Sanitize title for PDF metadata
  const safeTitle = title.replace(/[^\x20-\x7E]/g, "?").slice(0, 100);

  // We'll build objects and assemble xref
  const objects: string[] = [];
  objects[0] = ""; // placeholder, indices are 1-based in PDF

  // 1: Catalog
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  // 2: Pages (we'll fill in after we know count)
  const pageObjIds: number[] = [];
  let nextObj = 3;
  for (const _p of pages) pageObjIds.push(nextObj++);
  const pageKids = pageObjIds.map((id) => `${id} 0 R`).join(" ");
  objects[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${pageKids}] >>`;

  // Font object
  const fontObjId = nextObj++;
  objects[fontObjId] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;

  // Page + content objects
  for (let i = 0; i < pages.length; i++) {
    const pageId = pageObjIds[i];
    const contentId = nextObj++;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 ${fontObjId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    const stream = buildContentStream(pages[i]);
    const length = Buffer.byteLength(stream, "latin1");
    objects[contentId] = `<< /Length ${length} >>\nstream\n${stream}\nendstream`;
  }

  // Info dict
  const infoId = nextObj++;
  objects[infoId] = `<< /Title (${safeTitle}) /Producer (Casa Corona PDF generator) >>`;

  // Assemble
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets: number[] = [];
  for (let i = 1; i < objects.length; i++) {
    if (!objects[i]) continue;
    offsets[i] = Buffer.byteLength(pdf, "latin1");
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) {
    if (!objects[i]) {
      pdf += `0000000000 65535 f \n`;
    } else {
      pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

export function buildTextPdf(title: string, lines: string[]): Buffer {
  return buildPdf(title, lines);
}