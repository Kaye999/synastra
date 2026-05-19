/**
 * Human Anatomy interpretation tables.
 *
 * Maps organs and chakras to their somatic, energetic, and Human Design
 * correspondences. Used by Synastra's body-reading and health interpretations.
 *
 * Brand voice: declarative, observational, somatic, no hedging.
 */

export type OrganEntry = {
  /** Canonical organ name. */
  name: string;
  /** Anatomical region in plain English. */
  region: string;
  /** Anatomical function — what the organ does in the body. */
  function: string;
  /** Energetic / felt property in somatic, chakra, and HD frames. */
  consciousness: string;
  /** Human Design centre powered by this organ. */
  hdCenter:
    | 'Head'
    | 'Ajna'
    | 'Throat'
    | 'G'
    | 'Heart'
    | 'Solar Plexus'
    | 'Spleen'
    | 'Sacral'
    | 'Root';
  /** Traditional chakra alignment. */
  chakra:
    | 'Crown'
    | 'Third Eye'
    | 'Throat'
    | 'Heart'
    | 'Solar Plexus'
    | 'Sacral'
    | 'Root';
};

export const ORGANS: Record<string, OrganEntry> = {
  brain: {
    name: 'Brain',
    region: 'Inside the skull, above the brow line',
    function:
      'Cortex, cognition, and the coordination of every signal the body sends. The brain runs pattern-recognition, language, memory, and the conscious sense of being someone in particular.',
    consciousness:
      'Where thought lives before it becomes speech. The brain holds the abstract — the model of the world the mind builds and updates every second — and it is the organ that mistakes its own model for the world itself.',
    hdCenter: 'Ajna',
    chakra: 'Third Eye',
  },
  pituitary: {
    name: 'Pituitary',
    region: 'Deep centre of the skull, behind the bridge of the nose',
    function:
      'The master gland. Regulates growth, thyroid output, adrenal response, reproductive hormones, and the chemical timing of the entire endocrine system.',
    consciousness:
      'The inner eye made of flesh. The pituitary is intuition with a blood supply — the seat that converts unspoken knowing into the hormones that move the body before the mind catches up.',
    hdCenter: 'Ajna',
    chakra: 'Third Eye',
  },
  pineal: {
    name: 'Pineal',
    region: 'Centre of the skull, just behind the third ventricle',
    function:
      'Secretes melatonin and governs circadian rhythm. The pineal reads light through the eyes and decides when the body sleeps, wakes, and ages.',
    consciousness:
      'The crown gateway. Ancient traditions called this the third eye gland because it sits at the meeting point of biology and what lies above it — the organ that times not just the day but the lifespan.',
    hdCenter: 'Head',
    chakra: 'Crown',
  },
  thyroid: {
    name: 'Thyroid',
    region: 'Front of the neck, wrapped around the windpipe',
    function:
      'Sets metabolic rate, body temperature, and the speed of cellular growth. The thyroid decides how fast the body burns and how quickly it rebuilds.',
    consciousness:
      'The seat of expression. The thyroid is the throat that knows when to speak and when to wait — and when it goes wrong, the body either races ahead of itself or grinds to a halt under words that were never said.',
    hdCenter: 'Throat',
    chakra: 'Throat',
  },
  heart: {
    name: 'Heart',
    region: 'Centre-left of the chest, behind the breastbone',
    function:
      'The cardiovascular muscle. Pumps roughly seven thousand litres of blood a day, sets the body\'s baseline rhythm, and generates an electromagnetic field detectable several feet away.',
    consciousness:
      'The seat of identity and love. The G-centre runs through here — the felt sense of who one is and the direction the life is moving. The heart does not lie; it only beats faster when the truth is near.',
    hdCenter: 'G',
    chakra: 'Heart',
  },
  lungs: {
    name: 'Lungs',
    region: 'Either side of the chest, wrapping the heart',
    function:
      'Gas exchange. The lungs pull oxygen across a surface the size of a tennis court and release carbon dioxide on every exhale, regulating blood pH in the process.',
    consciousness:
      'Grief and capacity. The body stores unspoken sorrow in the chest wall, and the shallow breath of a held loss is the most accurate diagnostic a healer has. Expansion of the lungs is expansion of the life.',
    hdCenter: 'G',
    chakra: 'Heart',
  },
  liver: {
    name: 'Liver',
    region: 'Right upper abdomen, beneath the ribs',
    function:
      'Detoxification, protein synthesis, bile production, and the regulation of blood sugar. The liver processes every substance the body ingests and decides what stays and what leaves.',
    consciousness:
      'Anger and the felt sense of right versus wrong. The liver is the moral organ — which is why anger flares hot on the right side of the ribs, and why the body that cannot metabolise injustice eventually cannot metabolise its food.',
    hdCenter: 'Heart',
    chakra: 'Solar Plexus',
  },
  stomach: {
    name: 'Stomach',
    region: 'Upper centre of the abdomen, beneath the breastbone',
    function:
      'Mechanical and chemical breakdown of food. The stomach acidifies what is eaten, kills most of what should not be there, and passes the rest to the small intestine.',
    consciousness:
      'The gut sense that knows before the mind does. The stomach is the second brain — five hundred million neurons firing without supervision — and a decision the gut rejects rarely survives long enough to be made.',
    hdCenter: 'Solar Plexus',
    chakra: 'Solar Plexus',
  },
  pancreas: {
    name: 'Pancreas',
    region: 'Behind the stomach, crossing the upper abdomen',
    function:
      'Releases insulin and glucagon to hold blood sugar in range, and secretes the digestive enzymes that break down fat, protein, and carbohydrate.',
    consciousness:
      'Sweetness and the capacity to receive. The pancreas is the organ that converts the world into usable energy — and when it falters, the question is rarely just chemical. Something has gone unreceived for a long time.',
    hdCenter: 'Solar Plexus',
    chakra: 'Solar Plexus',
  },
  spleen: {
    name: 'Spleen',
    region: 'Left side under the ribs, behind the stomach',
    function:
      'Filters the lymphatic system, recycles old red blood cells, and houses the immune reserves that respond to infection.',
    consciousness:
      'In Human Design, the body\'s intuitive now. The spleen is the survival voice that speaks once and does not repeat itself — the soft, single-instance whisper that the body either heeds in the moment or loses entirely.',
    hdCenter: 'Spleen',
    chakra: 'Solar Plexus',
  },
  kidneys: {
    name: 'Kidneys',
    region: 'Either side of the lower back, behind the ribs',
    function:
      'Filter the blood, regulate blood pressure and electrolyte balance, and produce the hormones that govern red blood cell production and bone density.',
    consciousness:
      'Deep reserves of fear and willpower. Chinese medicine places the ancestral essence here — the inherited fuel that runs the life — and the kidneys are where chronic fear leaves the body cold, salty, and slow to recover.',
    hdCenter: 'Solar Plexus',
    chakra: 'Sacral',
  },
  adrenals: {
    name: 'Adrenals',
    region: 'On top of each kidney, low in the back',
    function:
      'Produce cortisol, adrenaline, and aldosterone — the hormones of stress, blood pressure, and the fight-or-flight response.',
    consciousness:
      'The pressure pump beneath the root. The adrenals fire when survival is on the line, and the modern body that fires them daily for things that are not survival eventually loses the ability to feel safe at all.',
    hdCenter: 'Root',
    chakra: 'Root',
  },
  gonads: {
    name: 'Gonads',
    region: 'Low pelvis — ovaries internally, testes externally',
    function:
      'Produce sex hormones — oestrogen, progesterone, testosterone — and the cells that make reproduction possible. The gonads also drive libido, mood, and long-term tissue maintenance.',
    consciousness:
      'The life-force engine. The creative urge and the sexual urge are the same current here — the Sacral\'s biological power source — and the body that has cut itself off from this current is a body that has stopped making things.',
    hdCenter: 'Sacral',
    chakra: 'Sacral',
  },
};

export type ChakraEntry = {
  name: string;
  /** Sanskrit name where applicable. */
  sanskrit?: string;
  /** Plain-English location on the body. */
  location: string;
  /** Energetic, psychological, and somatic carrier. */
  consciousness: string;
  /** Felt experience when balanced. */
  whenBalanced: string;
  /** Felt experience when blocked. */
  whenBlocked: string;
  /** The HD centre that maps to this chakra. */
  hdCenter: string;
  /** Element if applicable. */
  element?: 'Earth' | 'Water' | 'Fire' | 'Air' | 'Ether' | 'Light';
  /** Traditional colour for reference. */
  traditionalColor: string;
};

export const CHAKRAS: Record<string, ChakraEntry> = {
  crown: {
    name: 'Crown',
    sanskrit: 'Sahasrara',
    location: 'Above the crown of the head',
    consciousness:
      'The opening at the top of the body. The crown is where the individual self thins out into something larger — pattern, meaning, the sense that the life is being lived for a reason it did not choose. This is the chakra of inspiration arriving from outside the system.',
    whenBalanced:
      'A quiet pressure at the top of the skull. Thoughts arrive cleanly, decisions feel sourced from somewhere wider than the brain, and the day carries a thread that holds.',
    whenBlocked:
      'The life narrows to the immediate. Meaning becomes effortful, ideas dry up, and the head feels both heavy and somehow empty — sealed off from above.',
    hdCenter: 'Head',
    element: 'Light',
    traditionalColor: 'Violet / white',
  },
  thirdEye: {
    name: 'Third Eye',
    sanskrit: 'Ajna',
    location: 'Between the eyebrows, behind the forehead',
    consciousness:
      'The seat of inner sight. The third eye holds the capacity to see what is not yet visible — patterns, futures, the architecture beneath the surface of a situation. It is the chakra that converts raw intuition into recognisable image and concept.',
    whenBalanced:
      'A clear focal point between the brows. Visualisation is easy, the mind sees both detail and whole, and decisions resolve without forcing.',
    whenBlocked:
      'A dullness behind the forehead. The world looks flat, dreams go quiet, and the inner eye that should see a step ahead can barely see the present.',
    hdCenter: 'Ajna',
    element: 'Light',
    traditionalColor: 'Indigo',
  },
  throat: {
    name: 'Throat',
    sanskrit: 'Vishuddha',
    location: 'Base of the throat, at the hollow above the collarbone',
    consciousness:
      'The bridge between what is felt and what is said. The throat carries voice, timing, and the gap between knowing something and speaking it. In Human Design this is the manifestation gate — nothing in the body becomes real in the world without passing through here.',
    whenBalanced:
      'The throat is open and the voice carries. Speaking the difficult thing requires no rehearsal, and silence, when chosen, feels deliberate rather than swallowed.',
    whenBlocked:
      'A tightness above the collarbone. Words queue and never leave, or they leave too fast and land wrong. The body coughs, clears, swallows around the thing it will not say.',
    hdCenter: 'Throat',
    element: 'Ether',
    traditionalColor: 'Sky blue',
  },
  heart: {
    name: 'Heart',
    sanskrit: 'Anahata',
    location: 'Centre of the chest, behind the breastbone',
    consciousness:
      'The meeting point of self and other. The heart holds love, grief, and the capacity to stay open while being affected. It is also the seat of identity — the felt sense of who one is when nobody is performing — and it does not negotiate that sense for comfort.',
    whenBalanced:
      'The chest is wide, the breath reaches the back. Affection moves in and out without armouring, and the self stays recognisable in close company.',
    whenBlocked:
      'A tight band across the sternum. Breath shallows, presence withdraws behind the ribs, and contact with others starts to feel like a tax rather than a current.',
    hdCenter: 'G',
    element: 'Air',
    traditionalColor: 'Green',
  },
  ego: {
    name: 'Ego (Will)',
    location: 'Right of the heart, in the will-centre of the chest',
    consciousness:
      'The seat of will, promise, and the material world. The ego centre is what makes commitments and is responsible for keeping them — the part of the body that says I will and then has to find the resource to deliver. In HD this is the Heart centre, and it carries the willpower the rest of the system can borrow from.',
    whenBalanced:
      'A steady warmth on the right side of the chest. Promises made are promises kept, rest comes easily after effort, and the worth of the work is not in question.',
    whenBlocked:
      'A burning or hollow ache to the right of the sternum. The body over-promises and under-rests, proving its worth in a contest no one else is having.',
    hdCenter: 'Heart',
    element: 'Fire',
    traditionalColor: 'Brass',
  },
  solarPlexus: {
    name: 'Solar Plexus',
    sanskrit: 'Manipura',
    location: 'Above the navel, beneath the sternum',
    consciousness:
      'The seat of emotional truth and the felt sense of personal power. The solar plexus is where the body holds anger, joy, anticipation, and dread — and in Human Design it is the wave centre that decides the emotional weather of the day, regardless of what the mind has scheduled.',
    whenBalanced:
      'A warm presence in the upper belly. Emotion is felt clearly and acted on at the right time, and the sense of one\'s own authority is steady without being loud.',
    whenBlocked:
      'A clench above the navel. Emotion arrives as either flatness or storm, and the gut that should be a compass becomes a hostage to whatever room one is in.',
    hdCenter: 'Solar Plexus',
    element: 'Fire',
    traditionalColor: 'Yellow',
  },
  spleen: {
    name: 'Spleen',
    location: 'Left side under the ribs',
    consciousness:
      'The chakra of survival intuition, immunity, and the moment-by-moment safety read. The spleen senses what is healthy — for the body, for the relationship, for the deal on the table — and it speaks softly, once, in the present tense. Miss the moment and the message does not repeat.',
    whenBalanced:
      'A quiet alertness on the left flank. The body knows what is safe and what is not before the mind reasons it out, and small adjustments happen without drama.',
    whenBlocked:
      'A vague unease beneath the left ribs. The body either misses warnings and lands in trouble it could have avoided, or it overreacts to every shadow and exhausts itself.',
    hdCenter: 'Spleen',
    element: 'Earth',
    traditionalColor: 'Brown / bronze',
  },
  sacral: {
    name: 'Sacral',
    sanskrit: 'Svadhisthana',
    location: 'Below the navel, at the centre of the pelvis',
    consciousness:
      'The seat of life-force, sexuality, and the body\'s generative engine. The sacral runs creativity, desire, and the deep yes or no to work itself. In Human Design this is the power source of two-thirds of the population — the chakra that builds the life.',
    whenBalanced:
      'A low, hummed warmth in the pelvis. Desire is felt and followed, work that feels right energises rather than drains, and the body knows what it wants to make.',
    whenBlocked:
      'A heaviness or numbness in the lower belly. Creativity goes quiet, sex feels mechanical or absent, and the work that fills the day stops giving anything back.',
    hdCenter: 'Sacral',
    element: 'Water',
    traditionalColor: 'Orange',
  },
  root: {
    name: 'Root',
    sanskrit: 'Muladhara',
    location: 'Base of the spine, at the perineum',
    consciousness:
      'The chakra of ground, pressure, and the will to be here. The root carries survival, money, the sense of having a place in the world, and the adrenal pulse that drives the body to move. It is the floor of the system — without it, every chakra above destabilises.',
    whenBalanced:
      'A weighted sense of the feet on the floor and the seat in the chair. Pressure is felt as fuel, the basic needs of the life are handled, and the body is willing to stay in the world.',
    whenBlocked:
      'A jitter or a deadness in the legs and pelvic floor. Fear leaks into ordinary tasks, the body cannot settle, and the question of whether one belongs anywhere becomes a daily background hum.',
    hdCenter: 'Root',
    element: 'Earth',
    traditionalColor: 'Red / black',
  },
};
