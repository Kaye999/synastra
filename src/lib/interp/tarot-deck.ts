// tarot-deck.ts — the full Rider-Waite-Smith 78-card corpus.
//
// Each card carries:
//   - name, arcana, suit, number
//   - element + zodiacal/planetary correspondence (standard Golden Dawn
//     attributions; Minor Arcana pips follow the decan system)
//   - keywords.upright / keywords.reversed (3-4 terse words each)
//   - body — 40-60 words of editorial prose (no emoji, no hedging)
//   - shadow — ~20 words: the failure mode of the card
//   - gift — ~20 words: what the card offers when read well
//
// Voice matches Synastra's DESIGN.md — observational, concrete, restrained.
// Written to cross-reference with natal placements in readings.

import type { TarotCard } from '../engines/tarot';

/* ============================================================
 * Major Arcana (ids 0-21)
 * ============================================================ */

const MAJOR: TarotCard[] = [
  {
    id: 0,
    name: 'The Fool',
    arcana: 'major',
    element: 'air',
    zodiacal: 'Uranus',
    keywords: {
      upright: ['beginning', 'leap', 'innocence', 'spontaneity'],
      reversed: ['recklessness', 'hesitation', 'foolishness'],
    },
    body: 'The Fool stands at the cliff edge with a white rose, a knapsack, and a dog at his heels. He does not look down. Every major cycle opens with this card — not because the leap is safe, but because refusing it costs more than falling. The Fool is the first breath of a new octave.',
    shadow: 'Mistaking naivete for courage. Leaping with nothing packed and no one to meet you at the other side.',
    gift: 'The willingness to begin without a guarantee. The clean slate that makes every other card possible.',
  },
  {
    id: 1,
    name: 'The Magician',
    arcana: 'major',
    element: 'air',
    zodiacal: 'Mercury',
    keywords: {
      upright: ['will', 'manifestation', 'craft', 'focus'],
      reversed: ['manipulation', 'deceit', 'blocked power'],
    },
    body: 'One hand points up, one down — as above, so below. On the table sit the four suits: wand, cup, sword, pentacle. The Magician is the archetype of intentional craft, the moment the four elements are yoked into a single act. Nothing is summoned; everything is directed.',
    shadow: 'Charisma weaponised. Technique without ethics. Using the tools to bend other people instead of the work.',
    gift: 'Precision of will. The capacity to name what you want and assemble the means to build it.',
  },
  {
    id: 2,
    name: 'The High Priestess',
    arcana: 'major',
    element: 'water',
    zodiacal: 'Moon',
    keywords: {
      upright: ['intuition', 'mystery', 'interior knowing'],
      reversed: ['secrets', 'withdrawal', 'ignored instinct'],
    },
    body: 'She sits between two pillars — Boaz and Jachin, the black and the white — with a Torah scroll half-hidden in her lap. The veil behind her is pomegranate-heavy. The High Priestess is what you already know and will not speak. She does not teach. She waits for the question.',
    shadow: 'Gatekeeping the truth you owe someone. Mistaking silence for wisdom. Reading signs instead of asking.',
    gift: 'Interior authority. The quiet that makes the answer arrive without being chased.',
  },
  {
    id: 3,
    name: 'The Empress',
    arcana: 'major',
    element: 'earth',
    zodiacal: 'Venus',
    keywords: {
      upright: ['abundance', 'creation', 'sensuality', 'nurture'],
      reversed: ['smothering', 'creative block', 'dependency'],
    },
    body: 'The Empress reclines in a wheatfield under a Venus-sigil throne. She is pregnant with everything — not just a child, but projects, gardens, meals, pleasure. This card says the body is not a problem to transcend. It is the instrument of creation. Honour it or lose it.',
    shadow: 'Love that consumes. Fertility mistaken for identity. Giving until there is nothing left to give from.',
    gift: 'Generative ease. The capacity to host life — another person, a project, a room — without depletion.',
  },
  {
    id: 4,
    name: 'The Emperor',
    arcana: 'major',
    element: 'fire',
    zodiacal: 'Aries',
    keywords: {
      upright: ['authority', 'structure', 'sovereignty'],
      reversed: ['rigidity', 'tyranny', 'overcontrol'],
    },
    body: 'The Emperor sits on a stone throne carved with rams heads, armour under his robe. Aries fire yoked to Saturn structure. He is the part of the psyche that makes the call and takes the consequences. No soft kingdom. Every border here is defended on purpose.',
    shadow: 'Control as identity. Confusing domination with leadership. Punishing tenderness in others because you punished it in yourself.',
    gift: 'Clean authority. The spine to draw a line and mean it.',
  },
  {
    id: 5,
    name: 'The Hierophant',
    arcana: 'major',
    element: 'earth',
    zodiacal: 'Taurus',
    keywords: {
      upright: ['tradition', 'teaching', 'orthodoxy'],
      reversed: ['dogma', 'rebellion', 'free thought'],
    },
    body: 'Two acolytes kneel before the Hierophant, crossed keys at his feet — the gate is real, and he holds it. This is the card of inherited knowledge, the rituals that outlive the individual. Taurus earth makes it durable; the priestly office makes it conservative. It can teach. It can also entomb.',
    shadow: 'Piety as performance. Passing on rules you never examined. Punishing the student who asks the real question.',
    gift: 'Transmission. A lineage you can honour without losing yourself inside it.',
  },
  {
    id: 6,
    name: 'The Lovers',
    arcana: 'major',
    element: 'air',
    zodiacal: 'Gemini',
    keywords: {
      upright: ['union', 'choice', 'alignment'],
      reversed: ['misalignment', 'evasion', 'split values'],
    },
    body: 'The Lovers stand naked under an archangel — Eden before the choice and after it at once. Behind the woman, the Tree of Knowledge; behind the man, the Tree of Life. This card is never only about romance. It is the hinge where values meet and a decision can no longer be postponed.',
    shadow: 'Outsourcing the choice to the other person. Romantic distraction from the real fork. Loving the version of someone you invented.',
    gift: 'Integrity in union. Choosing on purpose, eyes open, with the consequences named.',
  },
  {
    id: 7,
    name: 'The Chariot',
    arcana: 'major',
    element: 'water',
    zodiacal: 'Cancer',
    keywords: {
      upright: ['drive', 'triumph', 'direction'],
      reversed: ['scattered', 'defeat', 'aggression'],
    },
    body: 'A figure in a starry canopy drives a chariot pulled by two sphinxes — one black, one white — with no reins. Opposing forces harnessed by will alone. The Chariot is momentum you have earned. Not swept away by circumstance; steering through it. Direction beats speed.',
    shadow: 'Forcing motion without a compass. Armour so thick it forgets the body inside it.',
    gift: 'Concentrated forward motion. The discipline to hold the line against competing impulses.',
  },
  {
    id: 8,
    name: 'Strength',
    arcana: 'major',
    element: 'fire',
    zodiacal: 'Leo',
    keywords: {
      upright: ['courage', 'gentle power', 'composure'],
      reversed: ['self-doubt', 'inner conflict', 'force'],
    },
    body: 'A woman closes the jaws of a lion with bare hands and an infinity symbol hovering over her head. Not a tamer — a companion. Strength is the quiet card of Leo: the roar of the animal and the steadiness of the hand that meets it. Fury soothed without being extinguished.',
    shadow: 'White-knuckling tenderness. Mistaking suppression for mastery. Befriending nothing, only managing it.',
    gift: 'Composure in the presence of intensity. The hand that stays open when the stakes spike.',
  },
  {
    id: 9,
    name: 'The Hermit',
    arcana: 'major',
    element: 'earth',
    zodiacal: 'Virgo',
    keywords: {
      upright: ['solitude', 'inner light', 'searching'],
      reversed: ['isolation', 'withdrawal', 'lost'],
    },
    body: 'The Hermit stands alone on a snow peak, a six-pointed star lantern in one hand, a staff in the other. He does not look down at the world he left. Virgo discernment distilled to its purest form: the willingness to take the lamp and walk away from the noise until the signal clears.',
    shadow: 'Solitude as a refusal to be known. The lamp turned inward until it burns only the self.',
    gift: 'The inner authority that silence makes audible. The lantern that lights both feet and thought.',
  },
  {
    id: 10,
    name: 'Wheel of Fortune',
    arcana: 'major',
    element: 'fire',
    zodiacal: 'Jupiter',
    keywords: {
      upright: ['turning point', 'cycles', 'fate'],
      reversed: ['bad luck', 'resistance', 'stagnation'],
    },
    body: 'A wheel spins in the sky, four fixed-sign creatures at its corners reading books. The sphinx on top holds a sword. What rises, falls; what falls, rises — Jupiter orchestrates the arc. The Wheel is the card that insists you are not the author of your circumstances, only of your response to them.',
    shadow: 'Bargaining with a pattern that is larger than you. Mistaking a rising tide for personal merit.',
    gift: 'Graceful participation in a cycle. Moving with the turn rather than against it.',
  },
  {
    id: 11,
    name: 'Justice',
    arcana: 'major',
    element: 'air',
    zodiacal: 'Libra',
    keywords: {
      upright: ['truth', 'accountability', 'fairness'],
      reversed: ['bias', 'denial', 'unfairness'],
    },
    body: 'Justice sits between two pillars, sword upright, scales held level. Libra air sharpened into judgement. Every cause holds its effect; every choice leaves a mark on the ledger. This card does not moralise. It simply weighs. Truth is not cruelty. Evasion is.',
    shadow: 'Moralising without self-examination. Using fairness rhetoric as a weapon. Scales weighted by preference.',
    gift: 'Integrity at the level of record. Willingness to face the accounting — yours, and theirs.',
  },
  {
    id: 12,
    name: 'The Hanged Man',
    arcana: 'major',
    element: 'water',
    zodiacal: 'Neptune',
    keywords: {
      upright: ['suspension', 'surrender', 'new perspective'],
      reversed: ['stalling', 'martyrdom', 'sacrifice refused'],
    },
    body: 'A man hangs upside down from a living tree, halo around his head, face serene. He is not being punished. He chose the position. The Hanged Man is the pause that reorders everything — the decision to stop resisting the gravity that was already going to win.',
    shadow: 'Suffering mistaken for spiritual currency. A pause that turns into a lifestyle.',
    gift: 'Clarity from inversion. The one view that only stillness makes visible.',
  },
  {
    id: 13,
    name: 'Death',
    arcana: 'major',
    element: 'water',
    zodiacal: 'Scorpio',
    keywords: {
      upright: ['ending', 'transformation', 'release'],
      reversed: ['clinging', 'resistance', 'stagnation'],
    },
    body: 'A skeletal rider in black armour carries a white rose banner across a field where a king lies fallen and a bishop kneels. Scorpio finality, clean as surgery. Death does not negotiate. It composts what is already over and refuses to let you pretend otherwise. Something leaves. Something makes room.',
    shadow: 'Clinging to the corpse. Refusing to bury what you already buried. Premature funerals for the living.',
    gift: 'The honesty to call the ending by its name. Soil made rich by what has decomposed.',
  },
  {
    id: 14,
    name: 'Temperance',
    arcana: 'major',
    element: 'fire',
    zodiacal: 'Sagittarius',
    keywords: {
      upright: ['balance', 'alchemy', 'patience'],
      reversed: ['excess', 'impatience', 'imbalance'],
    },
    body: 'An angel pours water between two cups, one foot on land and one in the stream, a sun-sigil on the brow. Temperance is the slow alchemy: fire and water reconciled by a third thing neither acknowledges. Sagittarius at its truest — not the arrow, but the careful mixing that makes the potion drinkable.',
    shadow: 'Moderation as avoidance. Splitting the difference when one side is right.',
    gift: 'Integration. The patience to let opposites cook into something new.',
  },
  {
    id: 15,
    name: 'The Devil',
    arcana: 'major',
    element: 'earth',
    zodiacal: 'Capricorn',
    keywords: {
      upright: ['bondage', 'shadow', 'attachment'],
      reversed: ['release', 'awareness', 'breaking chains'],
    },
    body: 'Two figures stand chained at the feet of a goat-headed Baphomet — chains loose enough to lift off at any moment. That is the whole teaching. Capricorn materialism inverted: the prison built by the prisoner. The Devil is what you keep choosing and then calling fate.',
    shadow: 'Consent mistaken for powerlessness. The ritual repetition of a loss you could have stopped.',
    gift: 'Recognition. The second you see the chain is loose, you are already free.',
  },
  {
    id: 16,
    name: 'The Tower',
    arcana: 'major',
    element: 'fire',
    zodiacal: 'Mars',
    keywords: {
      upright: ['upheaval', 'revelation', 'collapse'],
      reversed: ['avoided disaster', 'delayed fall', 'fear of change'],
    },
    body: 'Lightning cracks the crown off a stone tower; two figures fall head-first through the air. Mars without mediation. The Tower is the structure that could not stand any longer, struck by the truth it refused. The damage is not the disaster. The building was.',
    shadow: 'Rebuilding the same tower immediately. Treating the lightning as the enemy instead of the roof that rotted.',
    gift: 'Ground. Whatever remains after the Tower falls is load-bearing. Build from there.',
  },
  {
    id: 17,
    name: 'The Star',
    arcana: 'major',
    element: 'air',
    zodiacal: 'Aquarius',
    keywords: {
      upright: ['hope', 'renewal', 'clarity'],
      reversed: ['despair', 'disillusion', 'drought'],
    },
    body: 'A naked figure kneels by a pool, pouring water from two urns — one onto the earth, one into the stream. Seven smaller stars and one great one burn overhead. After the Tower, the Star. Aquarius at its best: unadorned, replenishing, patient with the long horizon.',
    shadow: 'Hope as avoidance of the present. A distant star used as an excuse not to stand on current ground.',
    gift: 'Faith that is not ornamental. The steady light that keeps you replenishing even when you cannot yet see harvest.',
  },
  {
    id: 18,
    name: 'The Moon',
    arcana: 'major',
    element: 'water',
    zodiacal: 'Pisces',
    keywords: {
      upright: ['illusion', 'dream', 'instinct'],
      reversed: ['clarity', 'confusion lifts', 'truth seen'],
    },
    body: 'A dog and a wolf howl at a moon that is also a sun; a lobster crawls from a pool toward two towers. The path winds into fog. Pisces pulled to its full depth — the ancestral river, the dream, the thing that cannot be named in daylight without losing it. Walk here by feel.',
    shadow: 'Projection as perception. Mistaking fear for intuition. The fog used as permission to stall.',
    gift: 'The symbolic faculty. The part of the mind that reads weather before it arrives.',
  },
  {
    id: 19,
    name: 'The Sun',
    arcana: 'major',
    element: 'fire',
    zodiacal: 'Sun',
    keywords: {
      upright: ['vitality', 'clarity', 'joy'],
      reversed: ['dimmed', 'ego', 'delayed success'],
    },
    body: 'A child rides a white horse under a great radiant sun, a red banner streaming behind. No guile, no armour. The Sun is not merely happiness. It is legibility — the self visible to itself, the day that lets you see what was always there. Solar fire at its most unguarded.',
    shadow: 'Performed cheerfulness. The spotlight so bright it burns out nuance.',
    gift: 'Unmistakable aliveness. The vitality that needs no translation.',
  },
  {
    id: 20,
    name: 'Judgement',
    arcana: 'major',
    element: 'fire',
    zodiacal: 'Pluto',
    keywords: {
      upright: ['awakening', 'reckoning', 'call'],
      reversed: ['self-doubt', 'refusal', 'deaf to calling'],
    },
    body: 'An angel sounds a trumpet and the dead rise from their coffins, arms up. Pluto-scale reckoning — not punishment, but recognition. The card of the call that finally becomes audible. The past is not erased; it is weighed, and the next life begins on the other side of that weighing.',
    shadow: 'Hearing the call and pretending not to. Confession used as performance instead of repair.',
    gift: 'The clarity that comes when you face your own record without flinching.',
  },
  {
    id: 21,
    name: 'The World',
    arcana: 'major',
    element: 'earth',
    zodiacal: 'Saturn',
    keywords: {
      upright: ['completion', 'integration', 'wholeness'],
      reversed: ['unfinished', 'loose ends', 'delay'],
    },
    body: 'A dancer steps through a laurel wreath, the four fixed-sign creatures at the corners — bull, lion, eagle, man. Saturn as the elder who finishes things. The World is the final card: everything that was begun in The Fool now completed, the cycle closed before the next one opens.',
    shadow: 'Mistaking arrival for the end of becoming. Resting on the laurel until it rots.',
    gift: 'Completion. The moment a long arc finally rounds into the shape it was always reaching for.',
  },
];

/* ============================================================
 * Minor Arcana helpers
 * ============================================================ */

type Suit = 'wands' | 'cups' | 'swords' | 'pentacles';
type Element = 'fire' | 'water' | 'air' | 'earth';

const SUIT_ELEMENT: Record<Suit, Element> = {
  wands: 'fire',
  cups: 'water',
  swords: 'air',
  pentacles: 'earth',
};

// Decan attributions for pip cards 2-10 of each suit (Golden Dawn).
// Key: suit + pip index (2..10). Value: zodiacal sign.
const DECAN: Record<string, string> = {
  'wands-2': 'Aries',       'wands-3': 'Aries',       'wands-4': 'Aries',
  'wands-5': 'Leo',         'wands-6': 'Leo',         'wands-7': 'Leo',
  'wands-8': 'Sagittarius', 'wands-9': 'Sagittarius', 'wands-10': 'Sagittarius',
  'cups-2': 'Cancer',       'cups-3': 'Cancer',       'cups-4': 'Cancer',
  'cups-5': 'Scorpio',      'cups-6': 'Scorpio',      'cups-7': 'Scorpio',
  'cups-8': 'Pisces',       'cups-9': 'Pisces',       'cups-10': 'Pisces',
  'swords-2': 'Libra',      'swords-3': 'Libra',      'swords-4': 'Libra',
  'swords-5': 'Aquarius',   'swords-6': 'Aquarius',   'swords-7': 'Aquarius',
  'swords-8': 'Gemini',     'swords-9': 'Gemini',     'swords-10': 'Gemini',
  'pentacles-2': 'Capricorn',  'pentacles-3': 'Capricorn',  'pentacles-4': 'Capricorn',
  'pentacles-5': 'Taurus',     'pentacles-6': 'Taurus',     'pentacles-7': 'Taurus',
  'pentacles-8': 'Virgo',      'pentacles-9': 'Virgo',      'pentacles-10': 'Virgo',
};

// Court card zodiacal anchors (Golden Dawn): each court spans a three-sign band.
const COURT_ZODIAC: Record<string, string> = {
  'wands-page': 'Fire signs',
  'wands-knight': 'Scorpio-Sagittarius',
  'wands-queen': 'Pisces-Aries',
  'wands-king': 'Cancer-Leo',
  'cups-page': 'Water signs',
  'cups-knight': 'Aquarius-Pisces',
  'cups-queen': 'Gemini-Cancer',
  'cups-king': 'Libra-Scorpio',
  'swords-page': 'Air signs',
  'swords-knight': 'Taurus-Gemini',
  'swords-queen': 'Virgo-Libra',
  'swords-king': 'Capricorn-Aquarius',
  'pentacles-page': 'Earth signs',
  'pentacles-knight': 'Leo-Virgo',
  'pentacles-queen': 'Sagittarius-Capricorn',
  'pentacles-king': 'Aries-Taurus',
};

/* ============================================================
 * Minor Arcana (ids 22-77)
 * ============================================================ */

type MinorSpec = {
  suit: Suit;
  slot: 'ace' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
      | 'page' | 'knight' | 'queen' | 'king';
  name: string;
  upright: string[];
  reversed: string[];
  body: string;
  shadow: string;
  gift: string;
};

const MINOR_SPECS: MinorSpec[] = [
  /* ───────── Wands ───────── */
  {
    suit: 'wands', slot: 'ace', name: 'Ace of Wands',
    upright: ['spark', 'ignition', 'new desire'],
    reversed: ['false start', 'stalled drive', 'burnout'],
    body: 'A hand thrusts a flowering branch from a cloud. The Ace of Wands is the first spark — appetite before plan, desire before infrastructure. It is the fire that decides to exist. Every new project, romance, or creative surge enters through this door.',
    shadow: 'Sparks that never touch ground. Enthusiasm without commitment.',
    gift: 'Primary fire. The first yes that makes everything else possible.',
  },
  {
    suit: 'wands', slot: '2', name: 'Two of Wands',
    upright: ['planning', 'ambition', 'horizon'],
    reversed: ['indecision', 'hesitation', 'lost vision'],
    body: 'A figure holds a globe, looking out from a castle wall. The spark has become a question: where to aim it. Two of Wands is the pause between idea and launch — the moment of surveying the world and choosing a direction worth the fire.',
    shadow: 'Surveying forever. Maps instead of movement.',
    gift: 'Scope. The capacity to hold a long horizon without losing the near ground.',
  },
  {
    suit: 'wands', slot: '3', name: 'Three of Wands',
    upright: ['expansion', 'foresight', 'ships out'],
    reversed: ['delays', 'obstacles', 'short-sightedness'],
    body: 'A figure watches three ships on the sea, back turned, cloak red. The plan has launched; now comes the waiting. Three of Wands is the patience of the sent ship — trust in momentum already set in motion.',
    shadow: 'Confusing waiting with working. A horizon scanned instead of walked.',
    gift: 'Enterprise. The willingness to dispatch the ship and trust the ocean.',
  },
  {
    suit: 'wands', slot: '4', name: 'Four of Wands',
    upright: ['celebration', 'threshold', 'home'],
    reversed: ['delayed celebration', 'instability', 'transition'],
    body: 'Four staves crowned with flowers form a canopy; figures celebrate beneath. A milestone has been reached — graduation, wedding, threshold crossed. Four of Wands is the card of the arrival that deserves to be marked, not skipped.',
    shadow: 'Performing happiness you have not yet built. Skipping the ritual and losing the anchor.',
    gift: 'Rooted joy. A crossing honoured, not merely survived.',
  },
  {
    suit: 'wands', slot: '5', name: 'Five of Wands',
    upright: ['conflict', 'competition', 'friction'],
    reversed: ['avoided conflict', 'resolution', 'strategy'],
    body: 'Five figures brandish staves in what looks like a brawl and might be a rehearsal. Five of Wands is the heat of competing wills — Leo fire uncoordinated. Not yet war; not yet teamwork. The scrap that clarifies who wants what.',
    shadow: 'Fighting for the sake of fighting. Ego arguments dressed as principle.',
    gift: 'Useful friction. The contest that sharpens each player.',
  },
  {
    suit: 'wands', slot: '6', name: 'Six of Wands',
    upright: ['victory', 'recognition', 'return'],
    reversed: ['falling short', 'private win', 'pride'],
    body: 'A rider on a white horse returns laureled, crowd raising staves in salute. Six of Wands is the public win — the effort acknowledged, the parade earned. Leo solar light at its cleanest. Not the end of the road. The checkpoint.',
    shadow: 'Performing victory to an audience that has not seen the work. Acclaim mistaken for truth.',
    gift: 'Earned recognition. The satisfaction of a return that was not guaranteed.',
  },
  {
    suit: 'wands', slot: '7', name: 'Seven of Wands',
    upright: ['defence', 'holding ground', 'courage'],
    reversed: ['overwhelmed', 'giving up ground', 'exhaustion'],
    body: 'A figure on a cliff edge holds off six rising staves with a seventh. The ground is his and will be contested. Seven of Wands is the defence of something already built — conviction under pressure, the refusal to cede what cost you to win.',
    shadow: 'Defending what no longer deserves the labour. Pride mistaken for principle.',
    gift: 'Spine. The willingness to be unpopular in the service of what you know.',
  },
  {
    suit: 'wands', slot: '8', name: 'Eight of Wands',
    upright: ['swift action', 'flow', 'messages'],
    reversed: ['delays', 'chaos', 'miscommunication'],
    body: 'Eight staves fly through open sky, parallel and unstopped. Sagittarius arrows released. Eight of Wands is the moment the gridlock breaks — news, messages, movement, a situation that was stuck now suddenly in motion. Do not over-aim. Let it fly.',
    shadow: 'Speed mistaken for progress. Firing without a target.',
    gift: 'Flow. The clean arc of what has been waiting to release.',
  },
  {
    suit: 'wands', slot: '9', name: 'Nine of Wands',
    upright: ['resilience', 'persistence', 'last stand'],
    reversed: ['stubbornness', 'exhaustion', 'paranoia'],
    body: 'A bandaged figure leans on a staff, eight more planted behind him like a palisade. He has been through it and is still standing. Nine of Wands is the card of the second-to-last round — tired, wary, and still holding the line.',
    shadow: 'Paranoia as posture. Guarding gates that no one is attacking anymore.',
    gift: 'Endurance. The proof that the work continues even when the will is nearly spent.',
  },
  {
    suit: 'wands', slot: '10', name: 'Ten of Wands',
    upright: ['burden', 'overcommitment', 'duty'],
    reversed: ['releasing burden', 'delegation', 'breakdown'],
    body: 'A figure bent double carries ten staves toward a distant house. He is almost home and almost broken. Ten of Wands is the card of the load you agreed to and never renegotiated — the duties that multiplied while you were not paying attention.',
    shadow: 'Carrying what was never yours. Refusing help as a form of identity.',
    gift: 'Honest accounting. The moment you put the bundle down and count what is actually yours.',
  },
  {
    suit: 'wands', slot: 'page', name: 'Page of Wands',
    upright: ['curiosity', 'beginner fire', 'discovery'],
    reversed: ['restlessness', 'immaturity', 'scattered'],
    body: 'A young figure in a salamander-patterned tunic gazes up at a flowering staff, desert behind. The Page of Wands is early-career enthusiasm — the first project, the first idea you think is yours, the spark that has not yet met resistance. Protect it. Feed it.',
    shadow: 'Novice fire mistaken for mastery. Projects abandoned the minute they get hard.',
    gift: 'Beginner curiosity. The willingness to pick up the flame without apology.',
  },
  {
    suit: 'wands', slot: 'knight', name: 'Knight of Wands',
    upright: ['adventure', 'momentum', 'bold action'],
    reversed: ['recklessness', 'arrogance', 'burnout'],
    body: 'A knight in salamander mail charges on a rearing horse, staff in hand. The Knight of Wands is conviction in motion — impulsive, charismatic, allergic to committees. He will arrive at places no planner reaches. He will also leave debris behind him.',
    shadow: 'Action addiction. Leaving jobs unfinished when the next thing gets interesting.',
    gift: 'Momentum. The charge that makes risk averseness feel like sleepwalking.',
  },
  {
    suit: 'wands', slot: 'queen', name: 'Queen of Wands',
    upright: ['confidence', 'radiance', 'magnetism'],
    reversed: ['jealousy', 'burnout', 'volatility'],
    body: 'A queen sits throne-forward, sunflower in hand, black cat at her feet. The Queen of Wands is sovereign fire — warm but unbought, magnetic without needing to chase. She runs the room she walks into. The cat is the tell: she can be loving and still untamed.',
    shadow: 'Charisma used to avoid intimacy. Jealousy mistaken for passion.',
    gift: 'Radiance. The rare capacity to lead with warmth and still hold your edge.',
  },
  {
    suit: 'wands', slot: 'king', name: 'King of Wands',
    upright: ['vision', 'leadership', 'entrepreneurship'],
    reversed: ['domineering', 'impulsive', 'ego'],
    body: 'A king grips a flowering staff on a salamander-crowned throne, cloak a furnace of orange. The King of Wands is vision hardened into leadership — the founder, the director, the one who holds the wide view and still makes the call. Fire given structure.',
    shadow: 'The monologue dressed as strategy. Visionaries who cannot be disagreed with.',
    gift: 'Mature fire. The kind of leadership that draws people toward something worth building.',
  },

  /* ───────── Cups ───────── */
  {
    suit: 'cups', slot: 'ace', name: 'Ace of Cups',
    upright: ['new feeling', 'opening', 'emotional source'],
    reversed: ['closed heart', 'emotional blockage', 'spillage'],
    body: 'A hand from a cloud holds a chalice overflowing, a dove descending. The Ace of Cups is the source — the moment a feeling arrives that was not there before. New love, new grief, new capacity to feel anything at all. Do not hurry to name it.',
    shadow: 'Overflow that soaks everyone nearby. Feelings treated as proof rather than information.',
    gift: 'Pure feeling. The spring that, when unblocked, waters everything downstream.',
  },
  {
    suit: 'cups', slot: '2', name: 'Two of Cups',
    upright: ['union', 'mutual regard', 'partnership'],
    reversed: ['imbalance', 'disconnect', 'tension'],
    body: 'Two figures face each other and exchange cups under the winged caduceus of Hermes. Not romance specifically — any true meeting between equals. Two of Cups is the moment of recognition when the feeling is mutual and acted on.',
    shadow: 'Mistaking chemistry for alignment. Toasting a bond that only one person is actually drinking from.',
    gift: 'Reciprocity. A bond that balances on its own axis without needing to be propped up.',
  },
  {
    suit: 'cups', slot: '3', name: 'Three of Cups',
    upright: ['celebration', 'friendship', 'community'],
    reversed: ['overindulgence', 'gossip', 'isolation'],
    body: 'Three figures raise cups in a circle of fruit and flowers. Three of Cups is the joy of shared belonging — the wedding, the reunion, the dinner that goes too long because no one wants to leave. Water element at its most social.',
    shadow: 'Partying as avoidance. Groups that close ranks against anyone who is struggling.',
    gift: 'Communion. The specific joy of being inside a circle that sees you.',
  },
  {
    suit: 'cups', slot: '4', name: 'Four of Cups',
    upright: ['discontent', 'withdrawal', 'reflection'],
    reversed: ['new interest', 'acceptance', 'engagement'],
    body: 'A figure sits under a tree, three cups in front, a fourth offered from a cloud and not yet taken. Four of Cups is the moment of emotional boredom — already-full yet not satisfied. The offered cup is real. Whether to reach is the question.',
    shadow: 'Aesthetic melancholy mistaken for depth. Refusing what is offered because accepting would cost.',
    gift: 'The honesty to notice dissatisfaction. The turn inward that precedes the real yes.',
  },
  {
    suit: 'cups', slot: '5', name: 'Five of Cups',
    upright: ['grief', 'loss', 'regret'],
    reversed: ['acceptance', 'moving on', 'forgiveness'],
    body: 'A cloaked figure looks down at three spilled cups; two upright cups stand behind, unnoticed. Five of Cups is grief in its fair shape — real loss, rightly mourned. The two cups behind are not a rebuke. They are a reminder: when you are ready, there is still something to drink.',
    shadow: 'Grief as identity. Facing only what was lost and never what remains.',
    gift: 'True mourning. The kind that makes room for the next feeling.',
  },
  {
    suit: 'cups', slot: '6', name: 'Six of Cups',
    upright: ['memory', 'nostalgia', 'childhood'],
    reversed: ['stuck in past', 'sentimentality', 'release'],
    body: 'A child hands another child a cup of flowers in a sunlit courtyard. Six of Cups is the return of innocence — not childishness, but the recovered capacity to give without calculation. Also the ambush of old memory. The past breaking gently through.',
    shadow: 'Nostalgia as a hiding place. A past curated to avoid the present.',
    gift: 'Tenderness without armour. Access to the version of yourself that still knew how to give a flower.',
  },
  {
    suit: 'cups', slot: '7', name: 'Seven of Cups',
    upright: ['options', 'illusion', 'daydream'],
    reversed: ['clarity', 'choice made', 'focus'],
    body: 'Seven cups float in cloud before a silhouetted figure — castle, snake, dragon, wreath, jewels, a veiled figure, a skull. Seven of Cups is the cloud of possibility without commitment. Every option is real and none are yours until chosen. Pick one. Put the others down.',
    shadow: 'Fantasy as a way of avoiding the actual. Choice-deferral dressed as open-mindedness.',
    gift: 'Imagination. A menu wide enough to choose from with real attention.',
  },
  {
    suit: 'cups', slot: '8', name: 'Eight of Cups',
    upright: ['walking away', 'leaving', 'seeking more'],
    reversed: ['returning', 'fear of leaving', 'stuck'],
    body: 'A cloaked figure walks away from eight carefully stacked cups toward mountains under a waning moon. Nothing is broken. Eight of Cups is the quiet departure from what was good but is no longer enough. The courage to leave when nothing is wrong.',
    shadow: 'Walking away as chronic pattern. Never staying long enough to be known.',
    gift: 'Honesty about what no longer feeds you. The willingness to leave before resentment builds.',
  },
  {
    suit: 'cups', slot: '9', name: 'Nine of Cups',
    upright: ['contentment', 'satisfaction', 'wish'],
    reversed: ['smugness', 'unmet wish', 'shallow pleasure'],
    body: 'A figure sits arms crossed, nine cups arrayed behind in a perfect arc. The "wish card." Nine of Cups is material and emotional satisfaction — the meal well cooked, the life that, for today, feels enough. Brief. Worth marking.',
    shadow: 'Complacency disguised as happiness. Hoarding the satisfaction instead of sharing it.',
    gift: 'Enough. The rare moment of actually registering that you have arrived somewhere good.',
  },
  {
    suit: 'cups', slot: '10', name: 'Ten of Cups',
    upright: ['family', 'harmony', 'fulfilment'],
    reversed: ['disconnect', 'family tension', 'broken harmony'],
    body: 'A couple and two children stand before a cottage and a rainbow of ten cups. Ten of Cups is the picture of lasting domestic peace — the chosen family, the home that works, the happy ending that is actually a stable plateau. Rare. Real.',
    shadow: 'Postcard happiness performed over real fissure.',
    gift: 'Durable joy. A life shared well enough to hold the weather.',
  },
  {
    suit: 'cups', slot: 'page', name: 'Page of Cups',
    upright: ['sensitivity', 'invitation', 'creative message'],
    reversed: ['moodiness', 'blocked feeling', 'escapism'],
    body: 'A young figure in a blue tunic holds a cup from which a fish emerges. The Page of Cups is the beginner sensitivity — the first draft poem, the early dream, the surprise of a feeling arriving with its own small image. Fragile. Worth listening to.',
    shadow: 'Feeling mistaken for fact. Sulking as a substitute for clarity.',
    gift: 'Receptivity. The openness the unconscious needs in order to speak at all.',
  },
  {
    suit: 'cups', slot: 'knight', name: 'Knight of Cups',
    upright: ['romance', 'grace', 'devotion'],
    reversed: ['moody', 'disappointment', 'unrealistic'],
    body: 'A knight advances slowly on a white horse, cup held forward like an offering. The Knight of Cups is feeling in motion — the message-bearer of the heart, the one who arrives with a proposal, a poem, or a confession. Watery knighthood: the charge is emotional, not martial.',
    shadow: 'Romantic idealism unsupported by practice. Devotion to the idea of devotion.',
    gift: 'Grace. The quality that makes the gesture land rather than cloy.',
  },
  {
    suit: 'cups', slot: 'queen', name: 'Queen of Cups',
    upright: ['empathy', 'intuition', 'emotional depth'],
    reversed: ['emotional overwhelm', 'enmeshment', 'withdrawal'],
    body: 'A queen gazes at a closed ornate cup on a seashell throne, water at her feet. The Queen of Cups is fully-owned feeling — the capacity to sit with grief, joy, and mystery without needing to fix any of them. Psychic in the oldest sense: permeable and unafraid.',
    shadow: 'Empathy as erasure of self. Taking on what was not hers to carry.',
    gift: 'Containment. A heart wide enough to hold what arrives without drowning in it.',
  },
  {
    suit: 'cups', slot: 'king', name: 'King of Cups',
    upright: ['emotional mastery', 'compassion', 'diplomacy'],
    reversed: ['manipulation', 'repression', 'stormy feelings'],
    body: 'A king sits on a throne in a stormy sea, cup in one hand, sceptre in the other. The King of Cups is emotional sovereignty — feelings acknowledged, metabolised, made useful. The crown does not keep the storm out; it makes the king capable of governing through it.',
    shadow: 'Calm performed over suppressed fury. Emotional manipulation dressed as maturity.',
    gift: 'Emotional command. The rare leadership that can hold both the feeling and the decision.',
  },

  /* ───────── Swords ───────── */
  {
    suit: 'swords', slot: 'ace', name: 'Ace of Swords',
    upright: ['clarity', 'truth', 'breakthrough'],
    reversed: ['confusion', 'miscommunication', 'misuse of power'],
    body: 'A hand from a cloud holds a single upright sword crowned with laurel. The Ace of Swords is the cutting thought — the idea that parts the fog, the sentence that cannot be unsaid once spoken. New mental clarity. Use it with care. Swords always have two edges.',
    shadow: 'Cruelty dressed as honesty. Cutting what should have been tended.',
    gift: 'Clean thought. The one sentence that clears the room.',
  },
  {
    suit: 'swords', slot: '2', name: 'Two of Swords',
    upright: ['stalemate', 'impasse', 'balanced decision'],
    reversed: ['indecision', 'avoidance', 'confusion'],
    body: 'A blindfolded figure holds two crossed swords in front of the heart, water behind, moon above. Two of Swords is the refusal to choose — a decision held in suspension because both options cost. The blindfold is not imposed. It was put on.',
    shadow: 'Stalemate as safety. Neutrality used to avoid accountability.',
    gift: 'Considered choice. The willingness to remove the blindfold when delay is no longer honest.',
  },
  {
    suit: 'swords', slot: '3', name: 'Three of Swords',
    upright: ['heartbreak', 'grief', 'painful truth'],
    reversed: ['healing', 'release', 'forgiveness'],
    body: 'Three swords pierce a red heart under a storm. No figure, no decoration. Three of Swords is grief at its most honest — the wound you cannot style around. The rain is the truth that finally fell. Nothing to do with it but sit in it until it passes.',
    shadow: 'Heartbreak nursed as identity. A wound kept open to keep the attention.',
    gift: 'Grief properly felt. The pain that actually moves through and does not ossify.',
  },
  {
    suit: 'swords', slot: '4', name: 'Four of Swords',
    upright: ['rest', 'recovery', 'retreat'],
    reversed: ['restlessness', 'burnout', 'return to action'],
    body: 'A knight lies in effigy on a tomb, hands in prayer, three swords on the wall. Four of Swords is chosen stillness — not defeat, but strategic withdrawal. The body on the tomb is alive. The rest is part of the work.',
    shadow: 'Avoidance disguised as self-care. Retreat that never ends.',
    gift: 'Restorative stillness. The silence that returns you to functional.',
  },
  {
    suit: 'swords', slot: '5', name: 'Five of Swords',
    upright: ['hollow victory', 'conflict', 'betrayal'],
    reversed: ['reconciliation', 'moving on', 'loss accepted'],
    body: 'A smirking figure gathers fallen swords; two defeated figures walk away. Five of Swords is the win that costs the relationship. Sometimes necessary. More often a tell that the hill was not worth dying on.',
    shadow: 'Winning arguments and losing people. Ego mistaken for integrity.',
    gift: 'Discernment about battles. Knowing which fights are worth the shape they leave.',
  },
  {
    suit: 'swords', slot: '6', name: 'Six of Swords',
    upright: ['transition', 'passage', 'moving on'],
    reversed: ['stuck', 'unfinished passage', 'resistance'],
    body: 'A ferryman poles a small boat across still water, a cloaked figure and child seated with six swords stuck in the hull. Six of Swords is the quiet crossing away from what was too rough. Taking the weapons with you; they are not yet safe to leave behind.',
    shadow: 'Moving on without processing. Relocating the problem.',
    gift: 'Passage. Leaving without drama; arriving without fanfare.',
  },
  {
    suit: 'swords', slot: '7', name: 'Seven of Swords',
    upright: ['strategy', 'stealth', 'evasion'],
    reversed: ['confession', 'return of what was taken', 'caught'],
    body: 'A figure tiptoes from a camp with five swords; two stand behind, untaken. Seven of Swords is cunning — not automatically dishonest, but always operating in the margin. The question is whether the secrecy serves strategy or cover.',
    shadow: 'Self-deception. Taking what was not asked for and calling it clever.',
    gift: 'Intelligent discretion. Knowing which cards to play and which to keep in hand.',
  },
  {
    suit: 'swords', slot: '8', name: 'Eight of Swords',
    upright: ['self-imposed limits', 'mental trap', 'paralysis'],
    reversed: ['freedom', 'clarity', 'release'],
    body: 'A blindfolded, bound figure stands in mud, eight swords around her. The bindings are loose. The path out is behind her, unseen. Eight of Swords is the mental prison whose door was never locked. The trap is real. It is also undoable.',
    shadow: 'Story of powerlessness defended against evidence to the contrary.',
    gift: 'Recognition. The second the blindfold lifts, the way out is already clear.',
  },
  {
    suit: 'swords', slot: '9', name: 'Nine of Swords',
    upright: ['anxiety', 'nightmares', 'dread'],
    reversed: ['relief', 'processing', 'sleep returns'],
    body: 'A figure sits upright in bed, head in hands, nine swords on the wall behind. Classic 3 am card. Nine of Swords is dread — the mind eating itself in the dark. Most of what it projects will not happen. That does not make the suffering unreal.',
    shadow: 'Rumination used as substitute for action.',
    gift: 'Permission to name the fear in daylight. The anxiety, once spoken, loses half its voltage.',
  },
  {
    suit: 'swords', slot: '10', name: 'Ten of Swords',
    upright: ['rock bottom', 'collapse', 'ending'],
    reversed: ['recovery', 'dawn', 'survival'],
    body: 'A figure lies face-down with ten swords in his back; the sun begins to rise at the horizon. Ten of Swords is the absolute worst of the suit and almost its best card — because it can get no more painful. The sun is rising. The floor is real. You are still here.',
    shadow: 'Melodrama as identity. Refusing to stand up after the worst is over.',
    gift: 'The floor. The absolute bottom that lets you, at last, start climbing.',
  },
  {
    suit: 'swords', slot: 'page', name: 'Page of Swords',
    upright: ['curiosity', 'mental agility', 'news'],
    reversed: ['gossip', 'cynicism', 'scattered thought'],
    body: 'A young figure stands on a windy hill, sword raised, clouds scudding. The Page of Swords is early intellect — the quick student, the watchful newcomer, the one who has just discovered what words can do. Sharp. Occasionally reckless. Still learning where the edges cut.',
    shadow: 'Intellect used for sparring, not thinking. Gossip mistaken for insight.',
    gift: 'Curiosity with teeth. The willingness to ask the question no one else will.',
  },
  {
    suit: 'swords', slot: 'knight', name: 'Knight of Swords',
    upright: ['decisive action', 'ambition', 'directness'],
    reversed: ['haste', 'aggression', 'tunnel vision'],
    body: 'A knight charges on a grey horse, sword thrust forward, cloak streaming. The Knight of Swords is relentless forward motion driven by idea — the lawyer, the campaigner, the editor. He is right often and tender rarely. He will get there. Whether he brings anyone with him is another matter.',
    shadow: 'Rightness weaponised. Winning the argument and losing the team.',
    gift: 'Directness. The capacity to cut through delay and name what needs naming.',
  },
  {
    suit: 'swords', slot: 'queen', name: 'Queen of Swords',
    upright: ['clarity', 'independence', 'sharp honesty'],
    reversed: ['bitterness', 'coldness', 'cruelty'],
    body: 'A queen sits crowned in clouds, one hand raised, sword upright. The Queen of Swords has been through it and kept her mind. She does not soften the truth. She also does not use it to wound. Air element at its most mature: perception without sentimentality.',
    shadow: 'Cynicism mistaken for wisdom. A sword used to keep tenderness at bay.',
    gift: 'The clean sentence. The rare person who can say the hard thing without contempt.',
  },
  {
    suit: 'swords', slot: 'king', name: 'King of Swords',
    upright: ['authority', 'principle', 'clear thought'],
    reversed: ['rigid thinking', 'tyranny', 'abuse of intellect'],
    body: 'A king sits upright on a stone throne, sword vertical. The King of Swords is principled intellect in authority — the judge, the chief of staff, the thinker whose word sets policy. His gift and his trap are the same: the capacity to reduce a situation to its logic.',
    shadow: 'Logic that overrides people. Ethics theorised while the room bleeds.',
    gift: 'Principled authority. Judgement that holds up under cross-examination.',
  },

  /* ───────── Pentacles ───────── */
  {
    suit: 'pentacles', slot: 'ace', name: 'Ace of Pentacles',
    upright: ['opportunity', 'seed', 'material beginning'],
    reversed: ['missed chance', 'scarcity', 'delay'],
    body: 'A hand from a cloud offers a gold pentacle over a garden path. The Ace of Pentacles is the material seed — a job offer, an inheritance, a new discipline, a body you can finally hear. Earth at its most generative. Take it, and it roots.',
    shadow: 'Missed offer. Security mistaken for worth.',
    gift: 'The seed. The real-world opening that, tended, becomes a life.',
  },
  {
    suit: 'pentacles', slot: '2', name: 'Two of Pentacles',
    upright: ['juggling', 'adaptability', 'flexibility'],
    reversed: ['overwhelm', 'dropped ball', 'imbalance'],
    body: 'A figure juggles two pentacles in a lemniscate, ships rolling on the sea behind. Two of Pentacles is the dance of competing commitments — career and home, income and craft. Done well, it is flow. Done badly, it is all drop.',
    shadow: 'Juggling as avoidance of commitment. Motion mistaken for progress.',
    gift: 'Agility. The capacity to hold multiple weights without one becoming resentment.',
  },
  {
    suit: 'pentacles', slot: '3', name: 'Three of Pentacles',
    upright: ['craft', 'collaboration', 'skilled work'],
    reversed: ['poor teamwork', 'mediocre work', 'disharmony'],
    body: 'A stonemason works on a cathedral while two others consult the plans. Three of Pentacles is skilled collaboration — the point where individual craft becomes collective construction. Reputation earned not by self-promotion but by the durability of what is built.',
    shadow: 'Mediocre effort on a big project. Craft performed instead of practiced.',
    gift: 'Mastery in concert. Work that only exists because several competent people made the same commitment.',
  },
  {
    suit: 'pentacles', slot: '4', name: 'Four of Pentacles',
    upright: ['holding', 'security', 'control'],
    reversed: ['release', 'generosity', 'loss'],
    body: 'A figure sits clutching one pentacle to the chest, one on the crown, two underfoot. Four of Pentacles is security-seeking — the grip that, past a point, squeezes the life out. Earth element at its most defensive. What you hold cannot come in.',
    shadow: 'Miserliness. Safety bought by closing every door.',
    gift: 'Stewardship. The capacity to steady the resource rather than hoard it.',
  },
  {
    suit: 'pentacles', slot: '5', name: 'Five of Pentacles',
    upright: ['hardship', 'lack', 'exclusion'],
    reversed: ['recovery', 'spiritual support', 'return'],
    body: 'Two figures limp through snow past a lit stained-glass window they do not see. Five of Pentacles is material hardship compounded by the isolation it breeds. The church is right there. Sometimes the wound is the one that cannot look up.',
    shadow: 'Self-exclusion. Assuming the door is closed without knocking.',
    gift: 'Humility. The crossing that teaches you who the real help is.',
  },
  {
    suit: 'pentacles', slot: '6', name: 'Six of Pentacles',
    upright: ['generosity', 'giving', 'receiving'],
    reversed: ['imbalanced giving', 'debt', 'strings attached'],
    body: 'A robed figure with scales distributes coins to two kneeling beggars. Six of Pentacles is the dynamic of generosity — what flows between those who have and those who need. The scales matter. True giving is not power; it is circulation.',
    shadow: 'Generosity wielded as leverage. Giving to stay in the role of giver.',
    gift: 'Circulation. The understanding that wealth kept still stops being wealth.',
  },
  {
    suit: 'pentacles', slot: '7', name: 'Seven of Pentacles',
    upright: ['patience', 'long view', 'assessment'],
    reversed: ['impatience', 'wasted effort', 'short-sighted'],
    body: 'A figure leans on a hoe, looking at seven pentacles ripening on a vine. Seven of Pentacles is the pause of the patient gardener — mid-season, before harvest. The work that has been done needs time, not more interference. Whether the crop is worth the season is an honest question.',
    shadow: 'Patience confused with resignation. Watching things you should have already pulled.',
    gift: 'Appraisal. Clear-eyed evaluation of what is actually growing.',
  },
  {
    suit: 'pentacles', slot: '8', name: 'Eight of Pentacles',
    upright: ['craft', 'practice', 'diligence'],
    reversed: ['perfectionism', 'half-hearted work', 'boredom'],
    body: 'A craftsman chisels a pentacle at his bench, seven finished, one in progress. Eight of Pentacles is deliberate practice — the unglamorous middle of mastery. Virgo earth at its best. The tenth thousand repetition, not the first. No audience. No applause. Just the work.',
    shadow: 'Craft performed without real quality. Perfectionism used to avoid shipping.',
    gift: 'Practice. The quiet accumulation of skill that cannot be faked.',
  },
  {
    suit: 'pentacles', slot: '9', name: 'Nine of Pentacles',
    upright: ['self-sufficiency', 'refined solitude', 'earned ease'],
    reversed: ['dependence', 'overspending', 'loneliness'],
    body: 'A figure in a yellow gown stands in a grape-laden vineyard, a hooded falcon on her wrist. Nine of Pentacles is earned solitude — the garden one built oneself, walked at the pace one chose. The falcon tells the story: unbrushed instinct, under elegant control.',
    shadow: 'Self-sufficiency as defence. A garden beautifully kept and never shared.',
    gift: 'Earned ease. Autonomy that rests on actual competence, not performance.',
  },
  {
    suit: 'pentacles', slot: '10', name: 'Ten of Pentacles',
    upright: ['legacy', 'family wealth', 'dynasty'],
    reversed: ['family disputes', 'lost legacy', 'short-term thinking'],
    body: 'An elder, a family, a dog, and children in an archway hung with ten pentacles. Ten of Pentacles is generational wealth in its broadest sense — not just money, but knowledge, home, lineage. What was built well enough to outlive the builder.',
    shadow: 'Legacy worship. Family names defended at the cost of the living.',
    gift: 'Continuity. What you build that your descendants will not have to build again.',
  },
  {
    suit: 'pentacles', slot: 'page', name: 'Page of Pentacles',
    upright: ['study', 'new skill', 'apprenticeship'],
    reversed: ['laziness', 'distraction', 'missed opportunity'],
    body: 'A young figure stands in a field holding a pentacle aloft like a study text. The Page of Pentacles is the earnest apprentice — the student whose work has not yet earned results, but is already serious. Beginnings that take themselves seriously enough to last.',
    shadow: 'Study without application. Beginner earnestness performed rather than practiced.',
    gift: 'Seriousness. The willingness to treat the new skill as worth the long apprenticeship.',
  },
  {
    suit: 'pentacles', slot: 'knight', name: 'Knight of Pentacles',
    upright: ['diligence', 'patience', 'routine'],
    reversed: ['stagnation', 'workaholism', 'stuck'],
    body: 'A knight sits on a stopped black horse, pentacle held forward, field behind. The Knight of Pentacles is reliability embodied — he shows up, delivers, and does it again tomorrow. Slow. Unspectacular. The opposite of the glamour knights. The one you want if something has to actually get built.',
    shadow: 'Routine mistaken for purpose. Reliability without direction.',
    gift: 'Follow-through. The rarest quality in any field.',
  },
  {
    suit: 'pentacles', slot: 'queen', name: 'Queen of Pentacles',
    upright: ['nurture', 'abundance', 'grounded care'],
    reversed: ['self-neglect', 'smothering', 'materialism'],
    body: 'A queen sits crowned with roses in a garden, pentacle in her lap, rabbit at her feet. The Queen of Pentacles is nurture made material — she feeds her household, grows the garden, keeps the accounts. Venus in earth: love expressed as provision, comfort, attention to what is actually needed.',
    shadow: 'Care that smothers. Provision used to avoid conversation.',
    gift: 'Grounded love. Nurture that never forgets the practical.',
  },
  {
    suit: 'pentacles', slot: 'king', name: 'King of Pentacles',
    upright: ['prosperity', 'stability', 'mastery'],
    reversed: ['greed', 'stubbornness', 'materialism'],
    body: 'A king sits on a vine-covered throne, pentacle in one hand, sceptre in the other, castle in the distance. The King of Pentacles is mastery made prosperous — the founder whose company endures, the householder whose estate is self-sustaining. Earth at its most sovereign. Wealth without anxiety.',
    shadow: 'Wealth worshipped. Stability mistaken for worth.',
    gift: 'Mature abundance. The capacity to hold prosperity without grasping.',
  },
];

/* ============================================================
 * Build the full deck
 * ============================================================ */

const SLOT_ORDER: MinorSpec['slot'][] = [
  'ace', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  'page', 'knight', 'queen', 'king',
];
const SLOT_NUMBER: Record<MinorSpec['slot'], number> = {
  ace: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  page: 11, knight: 12, queen: 13, king: 14,
};

function minorToCard(spec: MinorSpec, idx: number): TarotCard {
  const key =
    spec.slot === 'ace'
      ? `${spec.suit}-ace`
      : SLOT_NUMBER[spec.slot] <= 10
      ? `${spec.suit}-${SLOT_NUMBER[spec.slot]}`
      : `${spec.suit}-${spec.slot}`;
  const zodiacal =
    DECAN[key] ??
    COURT_ZODIAC[`${spec.suit}-${spec.slot}`] ??
    undefined;
  return {
    id: 22 + idx,
    name: spec.name,
    arcana: 'minor',
    suit: spec.suit,
    number: SLOT_NUMBER[spec.slot],
    element: SUIT_ELEMENT[spec.suit],
    zodiacal,
    keywords: { upright: spec.upright, reversed: spec.reversed },
    body: spec.body,
    shadow: spec.shadow,
    gift: spec.gift,
  };
}

// Order the minors suit-by-suit, slot-by-slot, for stable ids.
const MINOR_SORTED: MinorSpec[] = (['wands', 'cups', 'swords', 'pentacles'] as Suit[])
  .flatMap((suit) =>
    SLOT_ORDER.map((slot) =>
      MINOR_SPECS.find((m) => m.suit === suit && m.slot === slot)!,
    ),
  );

const MINOR: TarotCard[] = MINOR_SORTED.map(minorToCard);

export const TAROT_DECK: readonly TarotCard[] = [...MAJOR, ...MINOR];

export function cardById(id: number): TarotCard | undefined {
  return TAROT_DECK[id];
}

export function cardByName(name: string): TarotCard | undefined {
  return TAROT_DECK.find((c) => c.name === name);
}
