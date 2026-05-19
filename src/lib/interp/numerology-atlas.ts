// Numerology Atlas — enrichment grid for the Numerology tab of Sign Atlas.
// Pairs alongside NUM_MEANINGS. Single digits 1–9 plus the three master
// numbers 11, 22, 33. Brand-voice epithets, gift / shadow, career and
// cultural anchors. No prose duplication — only the structured fields.

export type NumberEnrichment = {
  archetype: string;      // 3-5 word epithet, brand-voice
  vibration: string;      // single-line essence, ~12 words
  gift: string;           // one sentence — the gift this number carries
  shadow: string;         // one sentence — the shadow this number falls into
  careers: string[];      // 4-6 career archetypes that resonate
  famousPeople: string[]; // 4-6 names
};

export const NUMBER_ATLAS: Record<string, NumberEnrichment> = {
  '1': {
    archetype: 'The First Mover',
    vibration: 'Singular will, the line drawn before the room has voted.',
    gift: 'You can begin alone, and your beginnings tend to organise the field around them.',
    shadow: 'Solitude calcifies into pride and you mistake company for compromise.',
    careers: ['founder', 'lead surgeon', 'pioneer researcher', 'creative director', 'soloist', 'expedition lead'],
    famousPeople: ['Walt Disney', 'Tom Hanks', 'Steve Jobs', 'Lady Gaga', 'Martin Luther King Jr.', 'Charlie Chaplin'],
  },
  '2': {
    archetype: 'The Held Pair',
    vibration: 'Sensitivity tuned to the other, peace earned through patience.',
    gift: 'You read the room before it speaks and you broker what no one else could.',
    shadow: 'You disappear into the other and resent the absence you arranged.',
    careers: ['diplomat', 'mediator', 'couples therapist', 'editor', 'composer', 'second-in-command'],
    famousPeople: ['Madonna', 'Barack Obama', 'Audrey Hepburn', 'Mahatma Gandhi', 'Claude Monet', 'Wolfgang Amadeus Mozart'],
  },
  '3': {
    archetype: 'The Bright Signal',
    vibration: 'Expression as oxygen, the message that wants a stage.',
    gift: 'You translate feeling into form and the form lands without losing the feeling.',
    shadow: 'You scatter across a dozen openings and finish none of them.',
    careers: ['novelist', 'comedian', 'broadcaster', 'performer', 'art director', 'screenwriter'],
    famousPeople: ['Alfred Hitchcock', 'Jackie Chan', 'Salma Hayek', 'David Bowie', 'Hilary Swank', 'Marlon Brando'],
  },
  '4': {
    archetype: 'The Load-Bearing Wall',
    vibration: 'Structure as devotion, the slow render of plan into stone.',
    gift: 'You make systems that hold weight long after the meeting that designed them is forgotten.',
    shadow: 'You confuse rigidity with reliability and bury imagination under procedure.',
    careers: ['engineer', 'architect', 'operations lead', 'master builder', 'accountant', 'systems analyst'],
    famousPeople: ['Bill Gates', 'Oprah Winfrey', 'Frank Sinatra', 'Maya Angelou', 'Keanu Reeves', 'Margaret Thatcher'],
  },
  '5': {
    archetype: 'The Live Current',
    vibration: 'Freedom as native element, sensation chased to its edge.',
    gift: 'You move first, you change shape mid-stride, and you carry others into rooms they would not have entered.',
    shadow: 'You burn the bridge before you have crossed it and call the smoke evidence.',
    careers: ['journalist', 'pilot', 'travel writer', 'entrepreneur', 'sales lead', 'documentarian'],
    famousPeople: ['Abraham Lincoln', 'Charlotte Brontë', 'Mick Jagger', 'Angelina Jolie', 'Vincent van Gogh', 'Beyoncé'],
  },
  '6': {
    archetype: 'The Hearth Keeper',
    vibration: 'Care made structural, beauty as a form of duty.',
    gift: 'You hold the family, the team, the room — and you make holding look effortless.',
    shadow: 'You confuse responsibility with worth and resent the people you would never refuse.',
    careers: ['teacher', 'nurse', 'family physician', 'interior designer', 'hospitality lead', 'social worker'],
    famousPeople: ['John Lennon', 'Albert Einstein', 'Meryl Streep', 'Michael Jackson', 'Stevie Wonder', 'Goldie Hawn'],
  },
  '7': {
    archetype: 'The Quiet Investigator',
    vibration: 'Solitude as discipline, the long look that wears down surface.',
    gift: 'You see the pattern others are too in-the-room to notice and you carry it back intact.',
    shadow: 'You wall off the world to protect a question and forget the world was the question.',
    careers: ['researcher', 'philosopher', 'analyst', 'monastic', 'cryptographer', 'investigative writer'],
    famousPeople: ['Marie Curie', 'Carl Jung', 'William Shakespeare', 'Princess Diana', 'Stephen Hawking', 'Eric Clapton'],
  },
  '8': {
    archetype: 'The Power Architect',
    vibration: 'Material mastery, the long view applied to capital and consequence.',
    gift: 'You build things that scale and you understand that money is a current to be steered, not chased.',
    shadow: 'You measure every relation through leverage and lose the ones leverage cannot purchase.',
    careers: ['CEO', 'investor', 'banker', 'judge', 'executive producer', 'real-estate developer'],
    famousPeople: ['J.P. Morgan', 'Pablo Picasso', 'Nelson Mandela', 'Elizabeth Taylor', 'Aretha Franklin', 'Edgar Allan Poe'],
  },
  '9': {
    archetype: 'The Wide Compassion',
    vibration: 'Endings as ground, the heart trained on the whole field at once.',
    gift: 'You close what others leave open and you carry forward what is worth carrying.',
    shadow: 'You drown in the suffering of the world and forget you are part of it, not above it.',
    careers: ['humanitarian', 'doctor', 'artist', 'minister', 'activist', 'film director'],
    famousPeople: ['Mahatma Gandhi', 'Mother Teresa', 'Jimi Hendrix', 'Elvis Presley', 'Florence Nightingale', 'Carl Sagan'],
  },
  '11': {
    archetype: 'The Lit Channel',
    vibration: 'Intuition that arrives before evidence, the visionary nerve.',
    gift: 'You receive the signal others have to derive and you can speak from a knowing the room cannot account for.',
    shadow: 'You destabilise yourself under the voltage and mistake noise inside you for the signal outside you.',
    careers: ['mystic', 'inventor', 'spiritual teacher', 'poet', 'visionary entrepreneur', 'contemplative scientist'],
    famousPeople: ['Michelle Obama', 'Edgar Cayce', 'Wassily Kandinsky', 'Tony Blair', 'Madonna', 'Tim Burton'],
  },
  '22': {
    archetype: 'The Master Builder',
    vibration: 'Vision rendered in matter, the dream walked into the world stone by stone.',
    gift: 'You take what 11 receives and translate it into institutions, buildings, codices, companies that last.',
    shadow: 'You collapse under the scale of your own assignment and refuse the smaller version that would have served.',
    careers: ['institution founder', 'civic architect', 'large-scale producer', 'reformer', 'platform builder', 'orchestra conductor'],
    famousPeople: ['Paul McCartney', 'Dalai Lama', 'Margaret Atwood', 'Bill Clinton', 'Frank Lloyd Wright', 'Oprah Winfrey'],
  },
  '33': {
    archetype: 'The Compassion Engine',
    vibration: 'Love operationalised, the heart enlisted as instrument of repair.',
    gift: 'You hold the field for whole groups of people and your presence itself rearranges what the room is capable of feeling.',
    shadow: 'You bleed into every wound around you and forget that a healer who never rests becomes the next wound.',
    careers: ['teacher of teachers', 'global humanitarian', 'sacred musician', 'pastoral leader', 'philanthropist', 'master therapist'],
    famousPeople: ['Albert Einstein', 'John Lennon', 'Meryl Streep', 'Salma Hayek', 'Francis of Assisi', 'Stephen King'],
  },
};
