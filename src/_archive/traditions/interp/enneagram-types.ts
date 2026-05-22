// enneagram-types.ts — editorial descriptions for the nine Enneagram types.
//
// Each entry is written in the Synastra voice: observational, concrete,
// unhedged. No emoji. No self-help register. Wings, integration, and
// disintegration arrows use the canonical Riso-Hudson mapping.
//
// Keep each `body` paragraph between 100-150 words so the profile card
// renders cleanly. `shadow` and `gift` stay around 50 words each — they
// earn their place as counterweights, not essays.

import type { EnneagramType } from '@/lib/engines/enneagram';

export type Center = 'head' | 'heart' | 'gut';

export type WingDescription = {
  nickname: string;
  body: string;
};

export type EnneagramTypeProfile = {
  number: EnneagramType;
  name: string;
  core: {
    fear: string;
    desire: string;
    motivation: string;
  };
  body: string;
  shadow: string;
  gift: string;
  // Keyed as numeric strings because JSON-safe maps are more portable.
  // The two keys of this object are always the primary type's two neighbours.
  wings: Record<string, WingDescription>;
  integration: { toType: EnneagramType; dynamic: string };
  disintegration: { toType: EnneagramType; dynamic: string };
  center: Center;
  relationships: string;
};

export const ENNEAGRAM_TYPES: Record<EnneagramType, EnneagramTypeProfile> = {
  1: {
    number: 1,
    name: 'The Reformer',
    core: {
      fear: 'Of being corrupt, defective, or irredeemably wrong.',
      desire: 'To be good, balanced, and integral — to have integrity.',
      motivation: 'To live in line with an inner standard no one else set.',
    },
    body:
      'The Reformer carries an internal ruler and measures everything against it — their own work, other people, the shape of a sentence, the way a drawer closes. The result is a life of quiet correction. They build institutions, fix what is broken, and refuse the easier compromise. The cost is a chronic sense that nothing, including themselves, is ever finished. Anger sits close to the surface but gets filed as frustration or fatigue. Beneath the reforming instinct is a child who learned that love was conditional on being good, and who has been trying to earn the conditional ever since. When healthy, the Reformer becomes the wise teacher who has forgiven themselves first.',
    shadow:
      'Rigidity masquerading as principle. Resentment toward anyone who seems to enjoy the latitude they refused themselves. The inner critic turns outward and starts correcting people who did not ask.',
    gift:
      'A conscience that will not be purchased. In a room of conveniences, the Reformer is the one who names the thing everyone else agreed to ignore. Integrity without performance.',
    wings: {
      '9': {
        nickname: 'The Idealist',
        body: 'The Reformer tempered by the Peacemaker — quieter, more philosophical, less overtly corrective. Holds standards as serenely as a monk, dispenses judgment as principle rather than outburst.',
      },
      '2': {
        nickname: 'The Advocate',
        body: 'The Reformer with the Helper\'s pull toward people — more relational, more moved by injustice against others than by internal code alone. Campaigns, organises, mentors, and burns out doing it.',
      },
    },
    integration: {
      toType: 7,
      dynamic:
        'In health, the Reformer loosens toward the Enthusiast — permits play, follows a whim without having to justify it, and finds that the work improves when it is no longer punishment.',
    },
    disintegration: {
      toType: 4,
      dynamic:
        'Under stress, the Reformer collapses into the Individualist — becomes moody, self-pitying, convinced they are uniquely misunderstood, and uses melancholy as a new form of moral superiority.',
    },
    center: 'gut',
    relationships:
      'Loyal, dependable, and exacting. The Reformer loves through steadiness, through showing up, through quietly raising the standard. Partners feel safe and, occasionally, inadequate.',
  },

  2: {
    number: 2,
    name: 'The Helper',
    core: {
      fear: 'Of being unwanted, unworthy of love unless useful.',
      desire: 'To be loved for who they are, not only for what they give.',
      motivation: 'To meet needs, make warmth, earn belonging through care.',
    },
    body:
      'The Helper walks into a room already sensing the temperature — who needs a drink, who is being ignored, who is about to cry in the bathroom. Attention flows outward with almost embarrassing fluency. Their own needs get deferred, then denied, then presented as resentment when the account finally overdraws. The Helper confuses giving with loving and loving with being indispensable, which means they are chronically exhausted by the very people they chose. Beneath the warmth is a quiet bargain: I will earn the love that was never free. When healthy, the Helper stops performing generosity and begins receiving it — which is, for them, the harder discipline.',
    shadow:
      'Manipulation dressed as care. Flattery, jealousy, and the martyr posture that collects grievances. The Helper who counts what they gave is the Helper who lost the plot.',
    gift:
      'A kind of attention most people have never experienced — intuitive, specific, un-asked-for. The Helper who gives from overflow rather than deficit creates the rare safe room.',
    wings: {
      '1': {
        nickname: 'The Servant',
        body: 'The Helper anchored by the Reformer — more principled, more restrained, gives with moral backbone. Often the volunteer coordinator, the unpaid organiser, the one who gets the community fed.',
      },
      '3': {
        nickname: 'The Host',
        body: 'The Helper with the Achiever\'s visibility — warmer in public, more image-aware, wants both to care and to be seen caring. The magnetic networker, the welcoming charmer, the socialite with a mission.',
      },
    },
    integration: {
      toType: 4,
      dynamic:
        'In health, the Helper moves toward the Individualist — gets honest about their own interior life, admits their needs, and stops mistaking self-knowledge for selfishness.',
    },
    disintegration: {
      toType: 8,
      dynamic:
        'Under stress, the Helper breaks toward the Challenger — becomes controlling, punitive, and openly aggressive to anyone they feel has taken them for granted.',
    },
    center: 'heart',
    relationships:
      'Attentive, warm, and occasionally suffocating. The Helper loves by anticipating and providing, and struggles most when a partner says, gently, that they did not need to be anticipated.',
  },

  3: {
    number: 3,
    name: 'The Achiever',
    core: {
      fear: 'Of being worthless outside of accomplishment.',
      desire: 'To be valuable, affirmed, and seen as successful.',
      motivation: 'To produce, to win, to be the person the room turns toward.',
    },
    body:
      'The Achiever is metabolism-as-identity. They wake with a to-do list running, they adjust their register for each audience, they finish what they start because finishing is the signature. Success comes early and often, and then one day the success feels like someone else\'s. The Achiever\'s danger is not laziness; it is the slow disappearance of the inner self under the weight of its own promotion. Feelings get deferred to "after the quarter" and never arrive. Beneath the performance is a child who learned that love followed achievement and nothing else. When healthy, the Achiever stops selling and starts showing — and finds, to their surprise, that people prefer the unpolished version.',
    shadow:
      'Image-management that hardens into self-deception. Chronic busyness as avoidance. Shame repurposed as ambition. The Achiever who cannot rest is the Achiever who does not know who they are without motion.',
    gift:
      'Efficacy with grace. The Achiever who has reconnected to their own interior becomes the rare figure who can both lead and mean it — credentials and soul in the same body.',
    wings: {
      '2': {
        nickname: 'The Charmer',
        body: 'The Achiever warmed by the Helper — more relational, more attuned to the affective field, built for sales, stages, and seducing a room. Needs applause and gives it back.',
      },
      '4': {
        nickname: 'The Professional',
        body: 'The Achiever inflected by the Individualist — quieter, more craft-oriented, prefers the work to speak. The artist-executive who disappears into their project and returns with a masterpiece.',
      },
    },
    integration: {
      toType: 6,
      dynamic:
        'In health, the Achiever moves toward the Loyalist — grounds themselves in real community, takes commitments personally, and finds their worth in belonging rather than performance.',
    },
    disintegration: {
      toType: 9,
      dynamic:
        'Under stress, the Achiever slides toward the Peacemaker — goes numb, disengages, postpones, and disappears into low-grade distraction while telling themselves it is a strategic pause.',
    },
    center: 'heart',
    relationships:
      'Devoted, present, and easy to be proud of. The Achiever loves by excelling at the role, and stumbles when a partner asks them to be bad at it for a while.',
  },

  4: {
    number: 4,
    name: 'The Individualist',
    core: {
      fear: 'Of having no identity, no significance, no authentic self.',
      desire: 'To be themselves — irreducibly, unmistakably, truly.',
      motivation: 'To find meaning through depth, art, and honest feeling.',
    },
    body:
      'The Individualist lives in the gap between who they are and who they sense they should have been. That gap is furnished exquisitely. They curate taste, mood, apartment, outfit, playlist — all of it reaching toward the elusive authentic self. Longing is the native climate. What is present feels thin; what is absent, luminous. The Individualist can mistake suffering for identity and so quietly resist the things that would actually fix them. Beneath the aesthetics is a child who felt fundamentally different from the people raising them and learned to turn the difference into a self. When healthy, the Individualist finds that ordinary life is not the enemy of depth — it is where depth finally happens.',
    shadow:
      'Envy, self-absorption, and the romanticising of pain. The Individualist who performs their own interior for an imagined audience has lost the interior they were trying to protect.',
    gift:
      'A refusal to flatten. The Individualist insists that feelings are real, that beauty matters, that the unspoken thing deserves to be said. Culture owes them the rooms it cannot quite name.',
    wings: {
      '3': {
        nickname: 'The Aristocrat',
        body: 'The Individualist with the Achiever\'s polish — more public, more ambitious, translates private depth into visible craft. The artist with a career, the poet who can pitch.',
      },
      '5': {
        nickname: 'The Bohemian',
        body: 'The Individualist tilted toward the Investigator — more withdrawn, more cerebral, quieter and stranger. The novelist who disappears for years and returns with the book only they could write.',
      },
    },
    integration: {
      toType: 1,
      dynamic:
        'In health, the Individualist moves toward the Reformer — commits to discipline, craft, and the daily unromantic labour that turns feeling into finished work.',
    },
    disintegration: {
      toType: 2,
      dynamic:
        'Under stress, the Individualist falls toward the Helper — becomes dependent, clinging, and extracts emotional reassurance from whichever relationship is closest, often punishing it afterwards.',
    },
    center: 'heart',
    relationships:
      'Intense, imaginative, and often unreachable. The Individualist loves with enormous specificity and withdraws the moment love becomes ordinary, then grieves what they themselves stepped away from.',
  },

  5: {
    number: 5,
    name: 'The Investigator',
    core: {
      fear: 'Of being overwhelmed, depleted, or exposed as incompetent.',
      desire: 'To be capable, self-sufficient, and in possession of understanding.',
      motivation: 'To observe, analyse, and master before engaging.',
    },
    body:
      'The Investigator lives in a small, well-defended room of the mind. They read, research, and stockpile — knowledge, time, energy, solitude — as though the world were rationing supplies. They join slowly and leave quickly. What looks like coldness is, usually, a fragile interior protecting itself. The Investigator trades presence for safety: they would rather watch the party from the balcony than arrive inside it. Beneath the remove is a child who learned early that the world asked for more than they had to give. When healthy, the Investigator discovers that they have far more to offer than they had conserved, and that engagement does not bankrupt them — it replenishes.',
    shadow:
      'Avoidance dressed as intellectual superiority. Contempt for anyone who engages before they understand. The miser of their own life — hoarding books, time, and affection in equal measure.',
    gift:
      'Clarity no one else will take the time to earn. The Investigator who steps into the room brings the rare, patient attention that sees the system others miss and names the pattern no one wanted to hear.',
    wings: {
      '4': {
        nickname: 'The Iconoclast',
        body: 'The Investigator with the Individualist\'s interior weather — more melancholic, more creative, more willing to write the strange book. The outsider-thinker, part philosopher, part poet.',
      },
      '6': {
        nickname: 'The Problem Solver',
        body: 'The Investigator steadied by the Loyalist — more practical, more team-willing, applies the same depth to systems and institutions. The engineer, the deep-in-the-weeds analyst, the specialist.',
      },
    },
    integration: {
      toType: 8,
      dynamic:
        'In health, the Investigator moves toward the Challenger — takes up space, commits to action, and lets their intellect arrive in the world rather than observing it.',
    },
    disintegration: {
      toType: 7,
      dynamic:
        'Under stress, the Investigator flips toward the Enthusiast — becomes scattered, impulsive, chasing distraction and stimulation to avoid the thing they were actually asked to feel.',
    },
    center: 'head',
    relationships:
      'Devoted, thoughtful, and hard to reach. The Investigator loves through the small careful gift, through the email sent at 2 a.m., through the long pause that is, for them, presence.',
  },

  6: {
    number: 6,
    name: 'The Loyalist',
    core: {
      fear: 'Of being without support, guidance, or safety.',
      desire: 'To be secure, grounded, and part of a trustworthy whole.',
      motivation: 'To anticipate risk, and to commit with care once trust is earned.',
    },
    body:
      'The Loyalist scans. Every room, every plan, every promise — scanned for the hole, the hazard, the person whose assurances do not add up. Once they commit, they commit for decades; before they commit, they doubt for years. Their mind runs worst-case scenarios in the background and calls it responsibility. The Loyalist can be counterphobic — leaning into the feared thing to prove it wrong — or phobic, hanging back and checking. Beneath the vigilance is a child who learned the ground beneath them was not reliable. When healthy, the Loyalist finds that courage was never the absence of fear; it was acting well inside of it.',
    shadow:
      'Chronic suspicion, authority-testing that becomes authority-attacking, and anxiety dressed as prudence. The Loyalist who cannot choose has usually already chosen paralysis.',
    gift:
      'The most trustworthy person in any institution. The Loyalist who has befriended their fear becomes the steady figure every team secretly relies on — loyal without being blind, brave without being reckless.',
    wings: {
      '5': {
        nickname: 'The Defender',
        body: 'The Loyalist sharpened by the Investigator — more analytical, more private, more likely to vet the data before acting. The reliable specialist, the cautious strategist, the careful archivist.',
      },
      '7': {
        nickname: 'The Buddy',
        body: 'The Loyalist warmed by the Enthusiast — more sociable, more humorous, more willing to laugh off the anxiety. The reliable friend with a quick joke and a soft belly of worry underneath.',
      },
    },
    integration: {
      toType: 9,
      dynamic:
        'In health, the Loyalist moves toward the Peacemaker — settles into their own body, trusts the present moment, and stops running catastrophe simulations in every quiet room.',
    },
    disintegration: {
      toType: 3,
      dynamic:
        'Under stress, the Loyalist jumps toward the Achiever — works compulsively, curates the image, and tries to outrun the anxiety by demonstrating its opposite.',
    },
    center: 'head',
    relationships:
      'Deeply loyal and slow to trust. The Loyalist loves by staying, by testing, by standing between their people and whatever they fear is coming for them next.',
  },

  7: {
    number: 7,
    name: 'The Enthusiast',
    core: {
      fear: 'Of being trapped in pain, limitation, or boredom.',
      desire: 'To be satisfied, free, and fully alive.',
      motivation: 'To pursue stimulation, variety, and the bright edge of experience.',
    },
    body:
      'The Enthusiast is in motion. Plans stack, ideas multiply, and the calendar fills with possibilities that may never be kept. Their gift is an almost childlike openness; their wound is the avoidance of anything that threatens to pin them down. The Enthusiast reframes sadness into adventure before the sadness lands, and then wonders why nothing quite satisfies. They are often the charismatic centre of a group and privately the most internally restless person in the room. Beneath the momentum is a child who decided the remedy for pain was flight. When healthy, the Enthusiast learns that depth is the thing they were actually chasing all along, and that depth requires staying.',
    shadow:
      'Escapism mistaken for freedom. The inability to finish, to feel, or to sit through discomfort. A life that looks abundant and tastes thin.',
    gift:
      'Genuine wonder. The Enthusiast who stays is the one who can still see the first snow, the first page, the first good idea — and bring everyone else into the brightness with them.',
    wings: {
      '6': {
        nickname: 'The Entertainer',
        body: 'The Enthusiast steadied by the Loyalist — more responsible, more team-minded, the charismatic friend who also shows up early and brings the spare charger.',
      },
      '8': {
        nickname: 'The Realist',
        body: 'The Enthusiast with the Challenger\'s edge — more assertive, more willing to spend money, more willing to burn a bridge. The bold builder, the entrepreneurial risk-taker, the person who moves cities on a hunch.',
      },
    },
    integration: {
      toType: 5,
      dynamic:
        'In health, the Enthusiast moves toward the Investigator — commits to depth, finishes the book, masters the craft, and discovers that constraint is a form of pleasure they had never allowed themselves.',
    },
    disintegration: {
      toType: 1,
      dynamic:
        'Under stress, the Enthusiast drops toward the Reformer — becomes critical, perfectionistic, and turns the easy charm into a scolding voice aimed at everyone including themselves.',
    },
    center: 'head',
    relationships:
      'Generous, fun, and allergic to heaviness. The Enthusiast loves by lighting rooms; their partner\'s job, over time, is to convince them that the dim rooms are worth staying in too.',
  },

  8: {
    number: 8,
    name: 'The Challenger',
    core: {
      fear: 'Of being controlled, violated, or rendered powerless.',
      desire: 'To be self-determined, strong, and in control of their own fate.',
      motivation: 'To protect, to lead, and to refuse the smallness imposed on them.',
    },
    body:
      'The Challenger arrives at full volume. They take up space, state their position, and decline to apologise for either. Power is not something they want; it is the only currency they trust. Beneath the bravado is a tender interior the Challenger would die before admitting to, and which only the very few ever see. They pick fights so no one ever gets to pick one with them first. Their lust is not only sexual — it is appetite for life at maximum amplitude. Beneath the armour is a child who was told, implicitly or explicitly, that weakness would be exploited, and who decided never to be weak again. When healthy, the Challenger discovers that vulnerability is not the opposite of strength — it is the rarest form of it.',
    shadow:
      'Domination as identity. Intimidation in place of conversation. The Challenger who cannot be soft has traded love for territory and will eventually look around at an empty one.',
    gift:
      'Protection for those who have none. The Challenger at their best is the one who walks between vulnerable people and whatever threatens them, and asks for nothing in return except not to be pitied.',
    wings: {
      '7': {
        nickname: 'The Maverick',
        body: 'The Challenger lit by the Enthusiast — more charismatic, more adventurous, the big-energy entrepreneur or performer who leads from the front and parties after.',
      },
      '9': {
        nickname: 'The Bear',
        body: 'The Challenger calmed by the Peacemaker — more measured, more patient, quietly immovable. The stoic protector, the elder statesman, the person whose force is obvious and rarely deployed.',
      },
    },
    integration: {
      toType: 2,
      dynamic:
        'In health, the Challenger moves toward the Helper — lowers the armour, lets care travel outward, and learns that the strongest thing they have ever done is to soften deliberately.',
    },
    disintegration: {
      toType: 5,
      dynamic:
        'Under stress, the Challenger withdraws toward the Investigator — becomes isolated, paranoid, and defends a shrinking inner fortress with calculated cruelty.',
    },
    center: 'gut',
    relationships:
      'Fierce, direct, and deeply loyal once trust is given. The Challenger loves by standing between their people and the world; the mistake is standing between themselves and their people.',
  },

  9: {
    number: 9,
    name: 'The Peacemaker',
    core: {
      fear: 'Of loss, separation, and the rupture of their inner peace.',
      desire: 'To be at peace — inwardly, outwardly, in every direction at once.',
      motivation: 'To preserve harmony, to merge, to avoid the friction that disturbs the quiet.',
    },
    body:
      'The Peacemaker is the person everyone is comfortable around and whose own interior is the quietest mystery. They see every side of an argument and can advocate for each in turn, which is a gift in mediation and a curse in self-knowledge. They merge with the people they love, adopt their preferences, and lose themselves in slow, steady degrees. Anger goes underground and emerges as stubbornness, forgetting, or years of drift. Beneath the calm is a child who learned their needs were a disturbance. When healthy, the Peacemaker wakes up into their own life — keeps their own preferences, says the uncomfortable thing, and finds that peace earned through presence is a different substance entirely from peace kept through absence.',
    shadow:
      'Sloth in the soul rather than the body. The low, steady avoidance of the things that would require them to want something. Numbness defended as temperament.',
    gift:
      'Presence without condition. The Peacemaker who has shown up to themselves becomes the rare steady figure who can hold contradiction in a room without needing it resolved.',
    wings: {
      '8': {
        nickname: 'The Referee',
        body: 'The Peacemaker strengthened by the Challenger — more grounded, more willing to confront when it matters. The quiet heavyweight, the reluctant leader, the steady force in a crisis.',
      },
      '1': {
        nickname: 'The Dreamer',
        body: 'The Peacemaker sharpened by the Reformer — more principled, more idealistic, the gentle visionary. The quietly moral teacher, the patient reformer, the person whose convictions surface slowly but hold.',
      },
    },
    integration: {
      toType: 3,
      dynamic:
        'In health, the Peacemaker moves toward the Achiever — chooses direction, commits to a project, and discovers the satisfaction of wanting something and going to get it.',
    },
    disintegration: {
      toType: 6,
      dynamic:
        'Under stress, the Peacemaker collapses toward the Loyalist — becomes anxious, suspicious, and clings to reassurance while refusing the action that would actually change the situation.',
    },
    center: 'gut',
    relationships:
      'Warm, patient, and steadily present. The Peacemaker loves through accommodation; the work, slowly, is to love through presence instead — to stay in the room as themselves, not as a mirror.',
  },
};

// Pretty label helpers — used by the profile UI and the reading prompt.

export function formatWingLabel(
  primary: EnneagramType,
  wing: EnneagramType | null,
): string {
  if (!wing) return `${primary}`;
  return `${primary}w${wing}`;
}

export function wingNickname(
  primary: EnneagramType,
  wing: EnneagramType | null,
): string | null {
  if (!wing) return null;
  const profile = ENNEAGRAM_TYPES[primary];
  return profile.wings[String(wing)]?.nickname ?? null;
}

export function centerLabel(center: Center): string {
  if (center === 'head') return 'Head · Thinking';
  if (center === 'heart') return 'Heart · Feeling';
  return 'Gut · Instinct';
}

export function levelBand(level: number): 'healthy' | 'average' | 'unhealthy' {
  if (level <= 3) return 'healthy';
  if (level <= 6) return 'average';
  return 'unhealthy';
}
