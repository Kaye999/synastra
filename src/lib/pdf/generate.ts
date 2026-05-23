// PDF generation helpers built on jsPDF.
//
// Two design rules:
//   1. Brand-consistent — Synastra's editorial brass-on-ink aesthetic
//      translated to print (dark ink/cream on white, with brass accents).
//   2. Printable — A4 portrait, generous margins, body text 11pt for
//      readability when actually printed.
//
// Every PDF function returns a jsPDF instance which the API route then
// converts to a Buffer for the HTTP response.

import jsPDF from 'jspdf';

// Brand colour tokens, RGB. Hex to RGB done once at module load.
export const COLOR = {
  ink: [42, 36, 26] as const,       // dark warm ink (printable)
  inkDim: [120, 108, 86] as const,  // dim body
  brass: [200, 160, 82] as const,
  rule: [220, 210, 192] as const,
  cream: [250, 247, 240] as const,
};

export const A4 = { width: 210, height: 297 } as const; // mm
export const MARGIN = { x: 22, y: 26 } as const;

export function newDoc(): jsPDF {
  return new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
}

/** Draws the Synastra page header — small brass eyebrow + thin rule. */
export function drawHeader(doc: jsPDF, eyebrow: string): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR.brass);
  doc.setCharSpace(0.5);
  doc.text(eyebrow.toUpperCase(), MARGIN.x, MARGIN.y - 8);
  doc.setCharSpace(0);
  doc.setDrawColor(...COLOR.brass);
  doc.setLineWidth(0.3);
  doc.line(MARGIN.x, MARGIN.y - 4, MARGIN.x + 14, MARGIN.y - 4);
}

/** Draws a small footer with Synastra mark + page number. */
export function drawFooter(doc: jsPDF, pageNum: number, total: number): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLOR.inkDim);
  doc.setCharSpace(0.4);
  doc.text('SYNASTRA · A LIVING ATLAS', MARGIN.x, A4.height - 12);
  doc.text(`${pageNum} / ${total}`, A4.width - MARGIN.x, A4.height - 12, { align: 'right' });
  doc.setCharSpace(0);
}

/** Sets the serif title style and draws a wrapped multi-line title. */
export function drawTitle(doc: jsPDF, text: string, y: number, size = 28): number {
  doc.setFont('times', 'normal');
  doc.setFontSize(size);
  doc.setTextColor(...COLOR.ink);
  const maxWidth = A4.width - MARGIN.x * 2;
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  lines.forEach((line, i) => doc.text(line, MARGIN.x, y + i * size * 0.45));
  return y + lines.length * size * 0.45;
}

/** Draws an italic editorial subtitle. */
export function drawSubtitle(doc: jsPDF, text: string, y: number): number {
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(...COLOR.inkDim);
  const maxWidth = A4.width - MARGIN.x * 2;
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  lines.forEach((line, i) => doc.text(line, MARGIN.x, y + i * 6));
  return y + lines.length * 6;
}

/** Body paragraph at 11pt with generous leading. Returns the y after the
 *  paragraph, including a paragraph break. */
export function drawBody(doc: jsPDF, text: string, y: number, opts?: { size?: number }): number {
  const size = opts?.size ?? 11;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(size);
  doc.setTextColor(...COLOR.ink);
  const maxWidth = A4.width - MARGIN.x * 2;
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  const lineHeight = size * 0.6;
  lines.forEach((line, i) => doc.text(line, MARGIN.x, y + i * lineHeight));
  return y + lines.length * lineHeight + 4;
}

/** Small uppercase section heading with brass micro-rule above. */
export function drawSection(doc: jsPDF, label: string, y: number): number {
  doc.setDrawColor(...COLOR.brass);
  doc.setLineWidth(0.4);
  doc.line(MARGIN.x, y, MARGIN.x + 10, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.brass);
  doc.setCharSpace(0.5);
  doc.text(label.toUpperCase(), MARGIN.x, y + 5);
  doc.setCharSpace(0);
  return y + 12;
}

/** Writing prompt with a brass numeral + space below for the user to write. */
export function drawPrompt(doc: jsPDF, n: number, prompt: string, y: number, linesBelow = 5): number {
  const numberSize = 22;
  doc.setFont('times', 'italic');
  doc.setFontSize(numberSize);
  doc.setTextColor(...COLOR.brass);
  doc.text(String(n).padStart(2, '0'), MARGIN.x, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR.ink);
  const maxWidth = A4.width - MARGIN.x * 2 - 14;
  const lines = doc.splitTextToSize(prompt, maxWidth) as string[];
  lines.forEach((line, i) => doc.text(line, MARGIN.x + 14, y + i * 6 - 4));

  let nextY = y + Math.max(lines.length * 6, 10);

  // Draw writing rules
  doc.setDrawColor(...COLOR.rule);
  doc.setLineWidth(0.25);
  for (let i = 0; i < linesBelow; i++) {
    nextY += 9;
    doc.line(MARGIN.x + 14, nextY, A4.width - MARGIN.x, nextY);
  }
  return nextY + 8;
}

/** Check if there's enough vertical room for `needed` mm; if not, add a
 *  new page (with header + footer) and return the new y cursor. */
export function ensureSpace(doc: jsPDF, y: number, needed: number, eyebrow: string): number {
  if (y + needed <= A4.height - MARGIN.y) return y;
  doc.addPage();
  drawHeader(doc, eyebrow);
  return MARGIN.y;
}

/** Finalise: add footers to every page. Call right before output. */
export function finaliseFooters(doc: jsPDF): void {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }
}

/** jsPDF -> Node Buffer for an HTTP response body. */
export function toBuffer(doc: jsPDF): Buffer {
  const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
  return Buffer.from(arrayBuffer);
}
