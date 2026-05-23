// Moon Journal PDF generator.
//
// 28-day journal mapped to the lunar cycle (synodic month ≈ 29.53 days, we
// round to 28 for clean weekly layout — accuracy to the day is what the
// astro engine handles separately). One spread per day: the moon phase
// glyph on the left, prompt on the right, a single rule for the user to
// answer underneath.
//
// To keep the PDF light (~200KB) we don't embed bitmap moon glyphs —
// each phase is drawn as a vector circle with a shaded crescent in jsPDF.

import type jsPDF from 'jspdf';
import {
  newDoc,
  drawHeader,
  drawTitle,
  drawSubtitle,
  drawBody,
  drawSection,
  ensureSpace,
  finaliseFooters,
  toBuffer,
  MARGIN,
  COLOR,
  A4,
} from './generate';

type Phase =
  | 'new'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent';

const PHASE_LABEL: Record<Phase, string> = {
  'new': 'New Moon',
  'waxing-crescent': 'Waxing Crescent',
  'first-quarter': 'First Quarter',
  'waxing-gibbous': 'Waxing Gibbous',
  'full': 'Full Moon',
  'waning-gibbous': 'Waning Gibbous',
  'last-quarter': 'Last Quarter',
  'waning-crescent': 'Waning Crescent',
};

// Day → phase. Day 1 is the New Moon, day 15 is the Full, day 28 cycles
// back to the dark.
function phaseForDay(day: number): Phase {
  const i = ((day - 1) % 28) + 1;
  if (i === 1) return 'new';
  if (i <= 6) return 'waxing-crescent';
  if (i === 7) return 'first-quarter';
  if (i <= 13) return 'waxing-gibbous';
  if (i === 15) return 'full';
  if (i <= 21) return 'waning-gibbous';
  if (i === 22) return 'last-quarter';
  return 'waning-crescent';
}

// Prompt library — one per phase. Each is intentionally short enough to
// fit on one line + leave space for two ruled writing lines.
const PROMPT_BANK: Record<Phase, string[]> = {
  'new': [
    'What is asking to begin?',
    'What seed are you planting this cycle?',
    'Where do you want to be when the moon is full?',
  ],
  'waxing-crescent': [
    'What is showing the first sign of growth?',
    'What small action moves the intention forward today?',
    'Who do you want to tell about what you are starting?',
    'What support do you need that you have not asked for yet?',
    'What is the next right thing — small, doable today?',
    'Where is the resistance, and what is it pointing at?',
  ],
  'first-quarter': [
    'Where do you need to push past hesitation?',
    'What obstacle is here to be moved, not avoided?',
  ],
  'waxing-gibbous': [
    'What is almost complete that needs your full attention?',
    'Where are you tempted to abandon the thing right before it works?',
    'What edit, removal, or refinement does the work need now?',
    'Whose feedback do you trust — and have you asked for it?',
    'What are you protecting that does not need protecting?',
    'How are you celebrating the progress already made?',
  ],
  'full': [
    'What is illuminated tonight that has been hiding?',
    'What is asking to be witnessed, named, or completed?',
  ],
  'waning-gibbous': [
    'What did you learn that you want to keep?',
    'What did you discover does not actually belong to you?',
    'Who do you owe thanks to — and have you said it?',
    'Where can you release control without releasing care?',
    'What does the body need now that the peak is past?',
    'What is the version of this story you want to remember?',
  ],
  'last-quarter': [
    'What is finishing that you have been pretending is not?',
    'Where are you grieving and calling it something else?',
  ],
  'waning-crescent': [
    'What is asking for rest before the next cycle?',
    'What is the gift this cycle is leaving you with?',
    'Where do you need silence more than you need movement?',
    'What pattern are you carrying that does not need to come into the next moon?',
    'Who would you forgive if forgiveness were free?',
    'What does sleep want to tell you this week?',
  ],
};

function promptForDay(day: number, seed: number): string {
  const phase = phaseForDay(day);
  const bank = PROMPT_BANK[phase];
  const idx = (day + seed) % bank.length;
  return bank[idx];
}

// Draws a moon phase circle at (cx, cy) with the given radius. The lit
// portion is cream; the dark portion is ink. For crescents we overlay
// an ink ellipse offset to carve the dark side.
function drawMoonGlyph(doc: jsPDF, phase: Phase, cx: number, cy: number, r: number): void {
  doc.setLineWidth(0.3);

  // Outer circle outline
  doc.setDrawColor(...COLOR.brass);
  doc.circle(cx, cy, r, 'S');

  if (phase === 'new') {
    // Empty — just the outline
    return;
  }

  if (phase === 'full') {
    doc.setFillColor(...COLOR.cream);
    doc.circle(cx, cy, r - 0.4, 'F');
    return;
  }

  // Half-fill base for quarter / gibbous / crescent
  doc.setFillColor(...COLOR.cream);

  if (phase === 'first-quarter') {
    doc.circle(cx, cy, r - 0.4, 'F');
    doc.setFillColor(255, 255, 255);
    // Erase the left half by overlapping a white rectangle
    doc.rect(cx - r, cy - r, r, r * 2, 'F');
    return;
  }
  if (phase === 'last-quarter') {
    doc.circle(cx, cy, r - 0.4, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(cx, cy - r, r, r * 2, 'F');
    return;
  }

  if (phase === 'waxing-crescent') {
    doc.circle(cx, cy, r - 0.4, 'F');
    doc.setFillColor(255, 255, 255);
    // Overlay an offset white circle that carves the left chunk out
    doc.circle(cx - r * 0.55, cy, r - 0.4, 'F');
    return;
  }
  if (phase === 'waning-crescent') {
    doc.circle(cx, cy, r - 0.4, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(cx + r * 0.55, cy, r - 0.4, 'F');
    return;
  }
  if (phase === 'waxing-gibbous') {
    doc.circle(cx, cy, r - 0.4, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(cx - r * 0.95, cy, r - 0.4, 'F');
    return;
  }
  if (phase === 'waning-gibbous') {
    doc.circle(cx, cy, r - 0.4, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(cx + r * 0.95, cy, r - 0.4, 'F');
    return;
  }
}

export type MoonJournalOpts = {
  firstName: string;
  cycleNumber?: number; // optional — increments over time
};

export function buildMoonJournal(opts: MoonJournalOpts): jsPDF {
  const eyebrow = `§ Synastra · Moon Journal · Cycle ${opts.cycleNumber ?? 1}`;
  // Use a deterministic seed per cycle so prompts vary across cycles.
  const seed = (opts.cycleNumber ?? 1) * 3;

  const doc = newDoc();

  // ── Cover ────────────────────────────────────────────────────────────
  drawHeader(doc, eyebrow);
  let y = MARGIN.y + 14;

  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR.inkDim);
  doc.text(`Prepared for ${opts.firstName}`, MARGIN.x, y);
  y += 20;

  y = drawTitle(doc, 'Moon Journal', y, 44);
  y += 4;
  y = drawSubtitle(doc, 'A 28-day cycle. One prompt a day. One short answer per night.', y);
  y += 16;

  y = drawSection(doc, 'How to use', y);
  y = drawBody(
    doc,
    'Start on any new moon — the cycle does not need a calendar. Each day has a phase glyph, a single question, and two lines for your answer. Write briefly. The point is not the paragraph — it is the noticing.',
    y,
  );
  y += 4;

  // Phase legend
  y = drawSection(doc, 'The eight phases', y);
  const legendCols = 4;
  const legendCellW = (A4.width - MARGIN.x * 2) / legendCols;
  const legendStartY = y + 4;
  const phases: Phase[] = [
    'new', 'waxing-crescent', 'first-quarter', 'waxing-gibbous',
    'full', 'waning-gibbous', 'last-quarter', 'waning-crescent',
  ];
  phases.forEach((p, i) => {
    const col = i % legendCols;
    const row = Math.floor(i / legendCols);
    const cx = MARGIN.x + col * legendCellW + 8;
    const cy = legendStartY + row * 22;
    drawMoonGlyph(doc, p, cx, cy, 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR.ink);
    doc.text(PHASE_LABEL[p], cx + 10, cy + 2);
  });

  // ── 28 daily spreads — 4 days per page (~67mm each) ──────────────────
  let day = 1;
  while (day <= 28) {
    doc.addPage();
    drawHeader(doc, eyebrow);
    y = MARGIN.y + 6;

    for (let i = 0; i < 4 && day <= 28; i++, day++) {
      y = ensureSpace(doc, y, 60, eyebrow);
      drawDay(doc, day, seed, y);
      y += 64;
    }
  }

  finaliseFooters(doc);
  return doc;
}

function drawDay(doc: jsPDF, day: number, seed: number, y: number): void {
  const phase = phaseForDay(day);
  const prompt = promptForDay(day, seed);

  // Moon glyph + day label on the left
  drawMoonGlyph(doc, phase, MARGIN.x + 8, y + 12, 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.brass);
  doc.setCharSpace(0.4);
  doc.text(`DAY ${String(day).padStart(2, '0')}`, MARGIN.x + 22, y + 4);
  doc.setCharSpace(0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR.inkDim);
  doc.text(PHASE_LABEL[phase].toUpperCase(), MARGIN.x + 22, y + 9);

  // Prompt on the right column
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(...COLOR.ink);
  const promptMaxW = A4.width - MARGIN.x - (MARGIN.x + 22);
  const lines = doc.splitTextToSize(prompt, promptMaxW) as string[];
  lines.forEach((line, i) => doc.text(line, MARGIN.x + 22, y + 16 + i * 6));

  // Writing rules
  const rulesStartY = y + 16 + lines.length * 6 + 8;
  doc.setDrawColor(...COLOR.rule);
  doc.setLineWidth(0.25);
  for (let r = 0; r < 3; r++) {
    const ry = rulesStartY + r * 8;
    doc.line(MARGIN.x + 22, ry, A4.width - MARGIN.x, ry);
  }
}

export function buildMoonJournalBuffer(opts: MoonJournalOpts): Buffer {
  return toBuffer(buildMoonJournal(opts));
}

export function moonJournalFilename(cycleNumber?: number): string {
  const c = cycleNumber ?? 1;
  return `synastra-moon-journal-cycle-${String(c).padStart(2, '0')}.pdf`;
}
