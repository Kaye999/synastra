// Zodiac Season Workbook PDF generator.
//
// One workbook per zodiac season (~30 days). Reads the current sun-sign
// transit and builds a 4-page printable workbook around it:
//
//   Page 1 — Season cover (sign, dates, archetype, body)
//   Page 2 — Themes of the season (4 short sections)
//   Page 3 — Weekly prompts (4 prompts, each with writing rules)
//   Page 4 — Closing reflection (2 prompts + a wide blank space)
//
// The workbook is personalised lightly — the user's first name appears
// in the cover line and the closing prompt. Heavy personalisation
// (Sun/Moon/Rising trinity) lives in the Daily/Monthly readings, not
// the workbook.

import type jsPDF from 'jspdf';
import {
  newDoc,
  drawHeader,
  drawTitle,
  drawSubtitle,
  drawBody,
  drawSection,
  drawPrompt,
  ensureSpace,
  finaliseFooters,
  toBuffer,
  MARGIN,
  COLOR,
  A4,
} from './generate';

type ZodiacSeasonContent = {
  sign: string;            // e.g., 'Taurus'
  glyph: string;           // unicode (we draw label fallback, jsPDF can't embed astrology glyph fonts cleanly)
  dates: string;           // e.g., 'Apr 20 – May 20'
  element: string;
  modality: string;
  ruler: string;
  archetype: string;       // e.g., 'The Slow Accumulator'
  body: string;            // 2-3 paragraph essay
  themes: { label: string; body: string }[];
  weeklyPrompts: string[]; // 4 prompts
  closingPrompts: string[];
};

const SEASON_CONTENT: Record<string, ZodiacSeasonContent> = {
  Taurus: {
    sign: 'Taurus',
    glyph: '♉',
    dates: 'Apr 20 – May 20',
    element: 'Earth',
    modality: 'Fixed',
    ruler: 'Venus',
    archetype: 'The Slow Accumulator',
    body: `Taurus season is the body returning to the body. After the Aries pulse — all forward, all velocity — the year settles. The soil remembers what it is for. The senses come back online. Skin notices weather; the palate notices the difference between food and meal.

This is the season of value as a felt sense, not an argument. What is actually worth your time, your money, your presence. Taurus does not ask abstractly. It asks at the level of the next half-hour. Sit with what you put your hands on this week.`,
    themes: [
      { label: 'Steadiness', body: 'Velocity is a Spring strategy. Taurus asks for cadence — the same small action repeated until it begins to compound. The plant does not hurry the leaf.' },
      { label: 'Appetite', body: 'Hunger is data. What you keep wanting after the craving fades is closer to true desire than what flares once and dies. Track the wants that recur.' },
      { label: 'Permanence', body: 'Taurus prefers what lasts. This is not a failing — it is the season\'s gift to a world that turns over too fast. Choose the one thing this month worth committing to slowly.' },
      { label: 'Pleasure', body: 'Earth-sign pleasure is unhurried — the second cup of coffee, the warm towel, the long meal. Taurus reminds you these are not indulgences. They are receipts.' },
    ],
    weeklyPrompts: [
      'What did your body know this week that your mind needed an extra day to admit?',
      'Name three things you handled — touched, ate, wore — that genuinely returned energy.',
      'What is one commitment you can keep slowly that you have been trying to keep fast?',
      'If your worth could only be measured by what you preserve rather than what you produce, what would you list?',
    ],
    closingPrompts: [
      'Write a paragraph to the next Taurus season — what you want it to find still standing.',
      'What would it mean to belong to your own life the way a tree belongs to its season?',
    ],
  },
  Aries: {
    sign: 'Aries',
    glyph: '♈',
    dates: 'Mar 21 – Apr 19',
    element: 'Fire',
    modality: 'Cardinal',
    ruler: 'Mars',
    archetype: 'The Initiator',
    body: `Aries season is the first cut. The year breathes in. Light returns at a steeper angle and the body remembers it has work to do.

This is the season of unnegotiated beginnings — the action taken before the explanation, the door pushed open before the welcome arrives. Aries does not wait for the conditions to be right. It is the condition.`,
    themes: [
      { label: 'Initiation', body: 'Start before you are ready. The reading-up phase has no end if you let it.' },
      { label: 'Friction', body: 'Aries energy needs something to push against. Find your resistance and keep it close.' },
      { label: 'Velocity', body: 'Movement is medicine. The body that walks twenty minutes thinks differently than the body that does not.' },
      { label: 'Edge', body: 'You are allowed to be sharp. Soft is a season; this is not the season.' },
    ],
    weeklyPrompts: [
      'What did you begin this week without permission?',
      'Where in your life are you waiting for an invitation that is not coming?',
      'What does your body want to do that your calendar disagrees with?',
      'Name the one thing you have been postponing the longest. Now name the smallest version of starting it.',
    ],
    closingPrompts: [
      'Write a letter to the future-you on the last day of Taurus season — what did Aries put in motion?',
      'If courage cost you nothing, what would you do next month?',
    ],
  },
  Gemini: {
    sign: 'Gemini',
    glyph: '♊',
    dates: 'May 21 – Jun 20',
    element: 'Air',
    modality: 'Mutable',
    ruler: 'Mercury',
    archetype: 'The Messenger',
    body: `Gemini season is the year turning quick on its feet. After Taurus settles, Gemini interrupts — the new question, the new room, the new sentence forming itself as it is spoken.

This is the season of pattern, exchange, and curiosity as a discipline. Gemini does not commit. It connects. The work is to honour the linkages without losing the thread.`,
    themes: [
      { label: 'Curiosity', body: 'Follow the question further than feels reasonable. Geminis season rewards the second click.' },
      { label: 'Linkage', body: 'Two things you already know connect this month. The bridge is yours to build.' },
      { label: 'Tempo', body: 'Quick attention, lots of inputs. The risk is dispersion; the gift is breadth.' },
      { label: 'Language', body: 'Write more than usual. Voice notes, journal lines, half-sentences. Pattern lives in the residue.' },
    ],
    weeklyPrompts: [
      'What conversation this week shifted something in you?',
      'Where are you collecting information without metabolising it?',
      'Name two things you know about from different worlds that secretly belong together.',
      'If your curiosity were your job, what would you have spent the week doing?',
    ],
    closingPrompts: [
      'What did the question you were carrying at the start of this season turn into by the end?',
      'Who do you want to be in conversation with for the next 30 days?',
    ],
  },
};

function getSeasonForDate(d: Date): ZodiacSeasonContent {
  // Crude tropical sun-sign month/day map. Aligned with the dates strings.
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return SEASON_CONTENT.Aries;
  if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return SEASON_CONTENT.Taurus;
  if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return SEASON_CONTENT.Gemini;
  // Fallback to Taurus if we haven't authored content for the current sign
  // yet. Better to ship a workbook than a 404 — over time all 12 get
  // proper content.
  return SEASON_CONTENT.Taurus;
}

export type ZodiacWorkbookOpts = {
  firstName: string;
  /** Defaults to today. */
  when?: Date;
};

export function buildZodiacSeasonWorkbook(opts: ZodiacWorkbookOpts): jsPDF {
  const when = opts.when ?? new Date();
  const season = getSeasonForDate(when);
  const eyebrow = `§ Synastra · ${season.sign} Season Workbook · ${season.dates}`;

  const doc = newDoc();

  // ── Page 1 — Cover ───────────────────────────────────────────────────
  drawHeader(doc, eyebrow);
  let y = MARGIN.y + 10;

  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR.inkDim);
  doc.text(`Prepared for ${opts.firstName}`, MARGIN.x, y);
  y += 18;

  y = drawTitle(doc, `${season.sign} Season`, y, 40);
  y += 4;
  y = drawSubtitle(doc, `${season.archetype} · ${season.element} ${season.modality} · ruled by ${season.ruler}`, y);
  y += 14;

  y = drawBody(doc, season.body, y, { size: 11 });
  y += 8;
  y = drawSection(doc, 'How to use this workbook', y);
  y = drawBody(
    doc,
    'Read the four themes on page two slowly. Move through the weekly prompts at the pace of the season — one per week is the design. The closing reflection waits for the last few days of the sign. There are no right answers. Notice what your hand wants to write before your mind decides what is appropriate.',
    y,
  );

  // ── Page 2 — Themes ──────────────────────────────────────────────────
  doc.addPage();
  drawHeader(doc, eyebrow);
  y = MARGIN.y + 10;
  y = drawTitle(doc, 'Themes of the season', y, 26);
  y += 8;

  for (const t of season.themes) {
    y = ensureSpace(doc, y, 40, eyebrow);
    y = drawSection(doc, t.label, y);
    y = drawBody(doc, t.body, y);
    y += 4;
  }

  // ── Page 3 — Weekly prompts ──────────────────────────────────────────
  doc.addPage();
  drawHeader(doc, eyebrow);
  y = MARGIN.y + 10;
  y = drawTitle(doc, 'Weekly prompts', y, 26);
  y = drawSubtitle(doc, 'One a week. Write by hand if you can — the body remembers what the keyboard does not.', y);
  y += 10;

  for (let i = 0; i < season.weeklyPrompts.length; i++) {
    y = ensureSpace(doc, y, 70, eyebrow);
    y = drawPrompt(doc, i + 1, season.weeklyPrompts[i], y, 5);
    y += 4;
  }

  // ── Page 4 — Closing ─────────────────────────────────────────────────
  doc.addPage();
  drawHeader(doc, eyebrow);
  y = MARGIN.y + 10;
  y = drawTitle(doc, 'Closing reflection', y, 26);
  y = drawSubtitle(doc, `${opts.firstName}, before ${season.sign} hands the year to the next sign — these two.`, y);
  y += 10;

  for (let i = 0; i < season.closingPrompts.length; i++) {
    y = ensureSpace(doc, y, 90, eyebrow);
    y = drawPrompt(doc, i + 1, season.closingPrompts[i], y, 8);
    y += 4;
  }

  // Small mark line at the bottom of page 4
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...COLOR.brass);
  doc.text(
    `End of ${season.sign} Season Workbook — Synastra · A Living Atlas`,
    A4.width / 2,
    A4.height - MARGIN.y,
    { align: 'center' },
  );

  finaliseFooters(doc);
  return doc;
}

export function buildZodiacSeasonWorkbookBuffer(opts: ZodiacWorkbookOpts): Buffer {
  return toBuffer(buildZodiacSeasonWorkbook(opts));
}

export function workbookFilename(when?: Date): string {
  const season = getSeasonForDate(when ?? new Date());
  const y = (when ?? new Date()).getUTCFullYear();
  return `synastra-${season.sign.toLowerCase()}-season-workbook-${y}.pdf`;
}
