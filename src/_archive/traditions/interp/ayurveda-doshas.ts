// ayurveda-doshas.ts — editorial interpretations for Vata, Pitta, Kapha.
//
// Voice rules (per DESIGN.md):
//   - No emoji. No wellness-marketing speak ("healing journey", "vibrations",
//     "high vibes", "embrace your truth").
//   - Observational, clinical-poetic — a botanist describing a river system,
//     not a yoga teacher selling a retreat.
//   - Concrete nouns and verbs. Real foods, real hours, real behaviours.
//   - `body` = ~150 words. `inBalance` = ~60 words. `outOfBalance` = ~60 words.

import type { Dosha } from '@/lib/engines/ayurveda';

export type DoshaInterpretation = {
  name: 'Vata' | 'Pitta' | 'Kapha';
  elements: string;
  qualities: string[];
  body: string;
  inBalance: string;
  outOfBalance: string;
  daily: {
    food: string[];
    activity: string[];
    sleep: string[];
    avoid: string[];
  };
  pairings: Record<Dosha, string>;
};

export const DOSHAS: Record<Dosha, DoshaInterpretation> = {
  vata: {
    name: 'Vata',
    elements: 'Air + Ether',
    qualities: ['cold', 'dry', 'light', 'mobile', 'subtle', 'rough'],
    body: `Vata is the principle of movement — the wind threading through the bones, the current under every thought. Its bodies are long-limbed, fine-boned, slow to put on weight and quick to lose it. The skin reads dry at the knuckles and lips in winter; the hair is fine, often with a natural wave that frizzes in damp weather. Appetite is irregular. Digestion is a moving target — a large meal at noon might pass cleanly on Tuesday and sit like a stone on Thursday. Vata minds are pattern-makers: quick, associative, prone to a dozen open tabs at once and a short night's sleep when a problem catches them. Speech runs fast and lyrical, drifts off topic, circles back. Warmth, oil, routine, and heavy roots steady the Vata body. Without them, the wind rattles the structure it lives in.`,
    inBalance: `A balanced Vata is the chart's inventor — alert, imaginative, quick with language, adaptable across terrain. Sleep comes cleanly at ten, the appetite settles around meals at the same hours each day, and the nervous system holds steady through pressure that flattens other constitutions. Enthusiasm is real and durable rather than manic.`,
    outOfBalance: `Out of balance, Vata scatters. Sleep breaks at three and cannot be reclaimed. The digestion turns erratic, the stomach cramps, the stools dry. Anxiety arrives without a clear source, joints crack and ache, the voice thins. Thoughts loop. Skin flakes at the elbows and scalp. The cure is always the same: warmth, oil, rhythm, ground.`,
    daily: {
      food: [
        'Warm, oily, cooked meals — stews, kitchari, roasted root vegetables, stewed apples with ghee',
        'Sweet, sour, salty tastes lead; avoid large raw salads, especially in cooler months',
        'Warm milk with a pinch of nutmeg an hour before bed; fennel tea after meals',
      ],
      activity: [
        'Walking at a steady pace, gentle yin or restorative yoga, swimming in warm water',
        'Oil self-massage (abhyanga) with sesame oil before the shower, especially in winter',
        'One creative practice done on a schedule — writing, drawing, music at the same hour',
      ],
      sleep: [
        'In bed by 10pm — Vata depletes fast after the ten-to-two pitta hours of the night',
        'Weighted blanket, warm feet, a wool hat in cold months; a bedtime that does not move',
      ],
      avoid: [
        'Skipping meals, late dinners, cold drinks with food, overly crunchy or dry snacks',
        'Overstimulation after dusk — loud music, intense films, doom-scrolling in bed',
        'Travel without anchoring rituals; back-to-back days with no unbroken hour alone',
      ],
    },
    pairings: {
      vata: `Two Vatas together generate velocity. Conversation catches fire, plans multiply, sleep collapses. The pairing needs a third steadying force — a shared dinner hour, a weekend ritual, a house that is warm and heavy — or it burns through its own kindling within weeks.`,
      pitta: `Vata-Pitta is a clean complement. Pitta's focus steadies Vata's scatter; Vata's curiosity unsettles Pitta's certainty. The pairing builds — books, businesses, aesthetic projects. Pitta must resist the urge to manage Vata's sleep; Vata must not take Pitta's directness as rejection.`,
      kapha: `Vata-Kapha is the ancient remedy for both. Kapha's warmth, heaviness, and slowness are the literal medicine Vata's physiology wants. Vata, in turn, brings Kapha movement and lightness. Arguments land softly. Neither races the other. The risk is stagnation eventually; an annual change of scene is enough.`,
    },
  },

  pitta: {
    name: 'Pitta',
    elements: 'Fire + Water',
    qualities: ['hot', 'sharp', 'oily', 'light', 'liquid', 'spreading'],
    body: `Pitta is the metabolic fire — the heat that cooks food, ambition, and argument into useful form. Its bodies are medium-framed, well-proportioned, freckled or ruddy, warm to the touch. The hair is fine and often fair or reddish, with early grey or early thinning common on the crown. The digestion is sharp; hunger arrives on schedule and demands to be met, irritability follows within the hour if it is not. The mind is organised, incisive, impatient with vagueness, drawn to mastery. Speech is direct, precise, occasionally surgical. Pitta runs hot — the bedroom window open in winter, the palms warm year-round. Intensity is not performative; it is the default state. Cooling, slowness, sweetness, and play keep the fire useful. Without them the fire turns on its owner.`,
    inBalance: `A balanced Pitta is the chart's leader — sharp, courageous, articulate, fair. Projects finish. Commitments hold. The body runs warm and strong, the stomach reliable, the sleep deep for a clean seven hours. Criticism lands as information rather than injury. Ambition is in service of something larger than the self.`,
    outOfBalance: `Out of balance, Pitta scorches. The skin breaks into heat rashes, the eyes redden, the stomach burns, acidity wakes them before dawn. Perfectionism hardens into cruelty — toward colleagues, toward the body, toward the self. Competitive thoughts overtake generous ones. Coffee stops helping. Alcohol stops helping. The fire needs to be banked, not fed.`,
    daily: {
      food: [
        'Cooling, sweet, bitter, astringent — cucumber, coriander, coconut, leafy greens, barley, basmati rice',
        'Ripe sweet fruits (mango, pear, sweet berries); avoid sour citrus and underripe tomatoes on an empty stomach',
        'Room-temperature water with a squeeze of lime through the day; mint and fennel tea after dinner',
      ],
      activity: [
        'Swimming, moonlit walks, cycling in shade; avoid midday sun training in summer',
        'Cooling pranayama (shitali, sheetkari) for ten minutes on hot afternoons',
        'A non-competitive creative practice — pottery, gardening, cooking for others without timing it',
      ],
      sleep: [
        'Lights down by 9.30pm; a cool, dark room below 19C is non-negotiable in summer',
        'No work screens within the last hour of the evening; sandalwood or rose on the pulse points',
      ],
      avoid: [
        'Hot spices, fried food, fermented alcohol, strong coffee on an empty stomach',
        'Afternoon meetings scheduled through lunch; arguments had while hungry',
        'Self-optimisation as competition — tracking that turns the body into a scoreboard',
      ],
    },
    pairings: {
      vata: `See Vata-Pitta above. Read from Pitta's angle: Vata is the muse Pitta did not know it needed. Do not attempt to rescue Vata from its enthusiasms. Ask questions at the rate Vata asks them back.`,
      pitta: `Two Pittas run hot together — brilliant and combustible. Shared ambition accelerates both, but the first serious disagreement reveals whether the pairing has learned to cool. Scheduled time apart, a cold pool, and an agreement that neither wins every argument is the difference between a dynasty and a scorched earth.`,
      kapha: `Pitta-Kapha is the classical power pairing. Kapha's steadiness gives Pitta's fire something to build on; Pitta's drive saves Kapha from inertia. The friction is pace — Pitta reads Kapha's stillness as stalling, Kapha reads Pitta's urgency as aggression. Both are correct. Both are partial.`,
    },
  },

  kapha: {
    name: 'Kapha',
    elements: 'Earth + Water',
    qualities: ['heavy', 'slow', 'cool', 'oily', 'smooth', 'stable'],
    body: `Kapha is the structural principle — the soft flesh on the bones, the mucosa that lines the gut, the patience that outlasts a crisis. Its bodies are solid, broad-shouldered or broad-hipped, with thick dark hair and large, calm eyes. Weight settles easily and leaves reluctantly. The skin is cool, smooth, slow to wrinkle. Digestion is steady but unhurried; a heavy meal lingers. Hunger is more emotional than bodily — Kapha can skip breakfast without noticing and will also eat a full meal without urgency. The mind is long-memoried, methodical, loyal; when it makes up its mind it does not revise lightly. Speech is low, slow, warm. Kapha's medicine is heat, stimulation, variety, and the kind of challenge that cannot be met by staying in bed.`,
    inBalance: `A balanced Kapha is the chart's keel — calm, loyal, strong, generous, physically enduring. Sleep is deep and restorative. Relationships are long. The immune system shrugs off what downs others. Emotion is steady enough to hold other people's without sinking. Work is meticulous; anything built lasts. The world is better when Kapha is in the room.`,
    outOfBalance: `Out of balance, Kapha thickens. Weight gathers at the belly, the nose runs chronically, the chest rattles, the morning begins at ten. Attachment hardens into possessiveness; nostalgia turns into a refusal to move. Depression sets in not as acute storm but as a grey fog that outlasts the season. The cure is motion — heat, dance, fasting, a bold decision taken before the mind finishes weighing it.`,
    daily: {
      food: [
        'Light, warm, dry, spiced — millet, barley, mung dal, roasted vegetables, ginger tea',
        'Pungent, bitter, astringent tastes lead; small meals, no snacking between them',
        'Honey (raw, uncooked) is the one sweet that reduces Kapha; avoid dairy, wheat, fried foods',
      ],
      activity: [
        'Vigorous daily movement before 10am — running, vinyasa, weights, cycling uphill',
        'Dry-brushing before the shower to stimulate the lymph; cold finish to the shower',
        'A regular creative challenge that forces a new skill — language, instrument, physical sport',
      ],
      sleep: [
        'Rise by 6am — Kapha hours are 6am to 10am; sleeping past them deepens the heaviness',
        'No afternoon nap; if the afternoon drags, walk outdoors instead',
      ],
      avoid: [
        'Heavy dairy, cold drinks, fried food, leftovers, late-night eating',
        'Over-sleeping, binge-watching, long periods on the couch',
        'Relationships or commitments kept only out of inertia or loyalty to who you used to be',
      ],
    },
    pairings: {
      vata: `See Vata-Kapha above. Read from Kapha's angle: Vata's velocity is not a threat, it is a tonic. Resist the urge to slow Vata down; instead, lend weight. Do not eat Vata's late dinners.`,
      pitta: `See Pitta-Kapha above. Read from Kapha's angle: Pitta's intensity is real information about what matters. Do not mistake its sharpness for hostility. Move before Pitta asks you to; you will feel better and the pairing will thrive.`,
      kapha: `Two Kaphas together build a warm, loyal, beautifully furnished house that neither wants to leave. Comfort compounds, then calcifies. One agreed-upon weekly discomfort — a new route, a cold plunge, a difficult conversation — keeps the pairing alive rather than merely stable.`,
    },
  },
};

/** Convenience accessor used by the profile UI. */
export function getDoshaInterp(d: Dosha): DoshaInterpretation {
  return DOSHAS[d];
}
