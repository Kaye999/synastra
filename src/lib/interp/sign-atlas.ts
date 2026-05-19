// Sign Atlas — enrichment grid for the Western tab of Sign Atlas.
// Pairs alongside SIGN_ESSENCE in tables.ts. No prose duplication — only
// the structured fields the grid needs to render tiles and detail panes.

export type SignEnrichment = {
  glyph: string;          // Unicode zodiac glyph (e.g., '♈')
  dates: string;          // 'Mar 21 – Apr 19' (tropical, en-dash)
  modality: 'Cardinal' | 'Fixed' | 'Mutable';
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  ruler: string;          // e.g., 'Mars'
  archetype: string;      // Sharp 3-5 word epithet, brand-voice
  famousPeople: string[]; // 4-6 names
  keywords: string[];     // 3-5 short phrases
};

export const SIGN_ATLAS: Record<
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces',
  SignEnrichment
> = {
  Aries: {
    glyph: '♈',
    dates: 'Mar 21 – Apr 19',
    modality: 'Cardinal',
    element: 'Fire',
    ruler: 'Mars',
    archetype: 'The First Cut',
    famousPeople: ['Leonardo da Vinci', 'Vincent van Gogh', 'Billie Holiday', 'Aretha Franklin', 'Marlon Brando', 'Maya Angelou'],
    keywords: ['initiation', 'will', 'velocity', 'edge'],
  },
  Taurus: {
    glyph: '♉',
    dates: 'Apr 20 – May 20',
    modality: 'Fixed',
    element: 'Earth',
    ruler: 'Venus',
    archetype: 'The Slow Accumulator',
    famousPeople: ['Sigmund Freud', 'Audrey Hepburn', 'Salvador Dalí', 'Karl Marx', 'Adele', 'Orson Welles'],
    keywords: ['steadiness', 'appetite', 'value', 'permanence'],
  },
  Gemini: {
    glyph: '♊',
    dates: 'May 21 – Jun 20',
    modality: 'Mutable',
    element: 'Air',
    ruler: 'Mercury',
    archetype: 'The Live Wire',
    famousPeople: ['John F. Kennedy', 'Bob Dylan', 'Marilyn Monroe', 'Walt Whitman', 'Anne Frank', 'Miles Davis'],
    keywords: ['linkage', 'fluency', 'curiosity', 'tempo'],
  },
  Cancer: {
    glyph: '♋',
    dates: 'Jun 21 – Jul 22',
    modality: 'Cardinal',
    element: 'Water',
    ruler: 'Moon',
    archetype: 'The Inner Chamber',
    famousPeople: ['Frida Kahlo', 'Ernest Hemingway', 'Nikola Tesla', 'Meryl Streep', 'Marcel Proust', 'Diana, Princess of Wales'],
    keywords: ['memory', 'shelter', 'tide', 'tenderness'],
  },
  Leo: {
    glyph: '♌',
    dates: 'Jul 23 – Aug 22',
    modality: 'Fixed',
    element: 'Fire',
    ruler: 'Sun',
    archetype: 'The Held Centre',
    famousPeople: ['Carl Jung', 'Madonna', 'Andy Warhol', 'Coco Chanel', 'Alfred Hitchcock', 'James Baldwin'],
    keywords: ['radiance', 'sovereignty', 'craft', 'warmth'],
  },
  Virgo: {
    glyph: '♍',
    dates: 'Aug 23 – Sep 22',
    modality: 'Mutable',
    element: 'Earth',
    ruler: 'Mercury',
    archetype: 'The Quiet Edit',
    famousPeople: ['Mother Teresa', 'Leo Tolstoy', 'Sean Connery', 'Agatha Christie', 'Beyoncé', 'Freddie Mercury'],
    keywords: ['precision', 'service', 'discernment', 'craft'],
  },
  Libra: {
    glyph: '♎',
    dates: 'Sep 23 – Oct 22',
    modality: 'Cardinal',
    element: 'Air',
    ruler: 'Venus',
    archetype: 'The Held Scale',
    famousPeople: ['Mahatma Gandhi', 'Friedrich Nietzsche', 'Oscar Wilde', 'Eleanor Roosevelt', 'John Lennon', 'Brigitte Bardot'],
    keywords: ['proportion', 'pact', 'elegance', 'mirror'],
  },
  Scorpio: {
    glyph: '♏',
    dates: 'Oct 23 – Nov 21',
    modality: 'Fixed',
    element: 'Water',
    ruler: 'Mars / Pluto',
    archetype: 'The Underworld Native',
    famousPeople: ['Pablo Picasso', 'Marie Curie', 'Fyodor Dostoevsky', 'Georgia O’Keeffe', 'Bram Stoker', 'Joni Mitchell'],
    keywords: ['intensity', 'undercurrent', 'metamorphosis', 'loyalty'],
  },
  Sagittarius: {
    glyph: '♐',
    dates: 'Nov 22 – Dec 21',
    modality: 'Mutable',
    element: 'Fire',
    ruler: 'Jupiter',
    archetype: 'The Released Arrow',
    famousPeople: ['Ludwig van Beethoven', 'Mark Twain', 'Jimi Hendrix', 'Edith Piaf', 'Walt Disney', 'Jane Austen'],
    keywords: ['horizon', 'meaning', 'leap', 'aperture'],
  },
  Capricorn: {
    glyph: '♑',
    dates: 'Dec 22 – Jan 19',
    modality: 'Cardinal',
    element: 'Earth',
    ruler: 'Saturn',
    archetype: 'The Long Arc',
    famousPeople: ['Isaac Newton', 'J.R.R. Tolkien', 'Joan of Arc', 'David Bowie', 'Edgar Allan Poe', 'Marlene Dietrich'],
    keywords: ['authority', 'discipline', 'time', 'summit'],
  },
  Aquarius: {
    glyph: '♒',
    dates: 'Jan 20 – Feb 18',
    modality: 'Fixed',
    element: 'Air',
    ruler: 'Saturn / Uranus',
    archetype: 'The Cold Stream',
    famousPeople: ['Charles Darwin', 'Wolfgang Amadeus Mozart', 'Virginia Woolf', 'Galileo Galilei', 'Bob Marley', 'Toni Morrison'],
    keywords: ['system', 'dissent', 'vision', 'distance'],
  },
  Pisces: {
    glyph: '♓',
    dates: 'Feb 19 – Mar 20',
    modality: 'Mutable',
    element: 'Water',
    ruler: 'Jupiter / Neptune',
    archetype: 'The Soft Membrane',
    famousPeople: ['Albert Einstein', 'Frédéric Chopin', 'Elizabeth Taylor', 'Anaïs Nin', 'George Washington', 'Nina Simone'],
    keywords: ['absorption', 'dream', 'compassion', 'dissolve'],
  },
};
