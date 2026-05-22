// enneagram-questions.ts — the 36-statement assessment.
//
// Four questions per type, 9 × 4 = 36 total. Each is scored on a 1-5 Likert
// scale (1 = strongly disagree, 5 = strongly agree). Questions are written
// to be observational and behavioural rather than abstractly psychological,
// so a self-aware reader can recognise themselves without having to study
// the system first.
//
// Order is interleaved rather than grouped by type, so the reader doesn't
// spot the pattern and anchor on a preferred identity.

import type { EnneagramType } from '@/lib/engines/enneagram';

export type EnneagramQuestion = {
  id: string;
  typeScored: EnneagramType;
  text: string;
};

export const LIKERT_LABELS: ReadonlyArray<{ value: 1 | 2 | 3 | 4 | 5; label: string }> = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

export const ENNEAGRAM_QUESTIONS: ReadonlyArray<EnneagramQuestion> = [
  // 1 — interleaved
  { id: 'q01', typeScored: 1, text: 'I notice small errors others miss, and I find it hard to stop correcting them.' },
  { id: 'q02', typeScored: 2, text: 'I track what the people around me need before they ask, and I adjust to meet it.' },
  { id: 'q03', typeScored: 3, text: 'I calibrate how I present myself to each audience to hit the result I want.' },
  { id: 'q04', typeScored: 4, text: 'I feel an undercurrent of loss or longing that most people seem not to carry.' },
  { id: 'q05', typeScored: 5, text: 'I withdraw to think before I act, and I guard my time and energy carefully.' },
  { id: 'q06', typeScored: 6, text: 'I scan for what could go wrong and prepare for the worst, even when things are fine.' },
  { id: 'q07', typeScored: 7, text: 'When a situation turns heavy or restrictive, I look for the exit or the next bright thing.' },
  { id: 'q08', typeScored: 8, text: 'I push back hard against anyone who tries to control me or push me around.' },
  { id: 'q09', typeScored: 9, text: 'I avoid conflict by going along with what others want, even when I quietly disagree.' },

  // 2 — interleaved
  { id: 'q10', typeScored: 1, text: 'I feel a steady pressure to do things the right way, even in small, invisible tasks.' },
  { id: 'q11', typeScored: 2, text: 'I give generously and feel hurt when the gesture goes unnoticed or unreturned.' },
  { id: 'q12', typeScored: 3, text: 'I measure my days by output and visible progress; stillness makes me restless.' },
  { id: 'q13', typeScored: 4, text: 'I am drawn to what is missing — absent people, past versions of myself, unreachable places.' },
  { id: 'q14', typeScored: 5, text: 'I would rather observe a situation for a long time than step into it before I understand it.' },
  { id: 'q15', typeScored: 6, text: 'I look for a reliable authority or system I can trust, then test whether it holds up.' },
  { id: 'q16', typeScored: 7, text: 'I keep my calendar full of options so I never have to sit with a flat, empty stretch.' },
  { id: 'q17', typeScored: 8, text: 'I speak directly, even bluntly, and I think softening the message is often dishonest.' },
  { id: 'q18', typeScored: 9, text: 'I lose track of my own preferences when I am around strong personalities.' },

  // 3 — interleaved
  { id: 'q19', typeScored: 1, text: 'I carry an inner critic that narrates my mistakes back to me long after they happen.' },
  { id: 'q20', typeScored: 2, text: 'I struggle to ask for help, because needing something feels more exposing than giving it.' },
  { id: 'q21', typeScored: 3, text: 'I shift between roles easily and lose touch with which version of me is the real one.' },
  { id: 'q22', typeScored: 4, text: 'I would rather be misunderstood and singular than blend in with people who do not feel things as I do.' },
  { id: 'q23', typeScored: 5, text: 'I become competent in a domain first, then I let myself engage with it socially.' },
  { id: 'q24', typeScored: 6, text: 'I oscillate between trusting a decision and immediately doubting whether I got it wrong.' },
  { id: 'q25', typeScored: 7, text: 'I reframe painful events quickly — even before I have really registered them — as something useful or interesting.' },
  { id: 'q26', typeScored: 8, text: 'I notice injustice physically, in my chest and jaw, and I step in even when it costs me.' },
  { id: 'q27', typeScored: 9, text: 'I dissolve into routines, comfort, or small distractions rather than face what I actually want to change.' },

  // 4 — interleaved
  { id: 'q28', typeScored: 1, text: 'I frequently feel angry when others cut corners or settle for work that is only half-right.' },
  { id: 'q29', typeScored: 2, text: 'I notice I perform warmth to win closeness, and I feel lonely even inside the warmth.' },
  { id: 'q30', typeScored: 3, text: 'I avoid situations where I cannot be competent or impressive; failure in public feels unbearable.' },
  { id: 'q31', typeScored: 4, text: 'I resist quick solutions to my pain; the feeling is also the identity.' },
  { id: 'q32', typeScored: 5, text: 'I feel drained by social demands and need long stretches of solitude to refill.' },
  { id: 'q33', typeScored: 6, text: 'I am loyal once I commit, and I take a long time to decide whom to commit to.' },
  { id: 'q34', typeScored: 7, text: 'I have more plans and ideas than I could ever execute, and I defend the right to keep starting.' },
  { id: 'q35', typeScored: 8, text: 'I protect the people I love by confronting what they are too afraid to confront themselves.' },
  { id: 'q36', typeScored: 9, text: 'I make myself smaller in my own life so the people around me can be larger.' },
] as const;

// Sanity-check the invariant at module load. Saves a debugging round-trip
// if someone edits the list and the counts drift.
if (process.env.NODE_ENV !== 'production') {
  const counts: Record<number, number> = {};
  for (const q of ENNEAGRAM_QUESTIONS) {
    counts[q.typeScored] = (counts[q.typeScored] ?? 0) + 1;
  }
  for (let t = 1; t <= 9; t++) {
    if (counts[t] !== 4) {
      // eslint-disable-next-line no-console
      console.warn(`[enneagram-questions] type ${t} has ${counts[t] ?? 0} questions, expected 4`);
    }
  }
}
