/*
 * gene-keys-codex.ts — the 64 Gene Keys × 3 frequencies.
 *
 * Names follow Richard Rudd's published canon where the author himself has
 * fixed them (e.g. 22 Dishonour → Graciousness → Grace; 1 Entropy → Freshness
 * → Beauty). The prose bodies are original Synastra editorial voice: concrete
 * verbs, no hedging, no self-help register. Shadow runs 60-80 words; Gift
 * runs 60-80 words; Siddhi runs 40-60 words.
 *
 * Hexagram names are from the Wilhelm/Baynes I Ching (standard Western
 * reference).
 */

export type GeneKeyFrequencyEntry = {
  name: string;
  body: string;
};

export type GeneKeyEntry = {
  number: number;
  name: string;       // poetic gene-key name (not the hexagram)
  hexagram: string;   // Wilhelm I Ching name
  shadow: GeneKeyFrequencyEntry;
  gift: GeneKeyFrequencyEntry;
  siddhi: GeneKeyFrequencyEntry;
};

export const GENE_KEYS_CODEX: Record<number, GeneKeyEntry> = {
  1: {
    number: 1, name: 'From Entropy to Beauty', hexagram: 'The Creative',
    shadow: {
      name: 'Entropy',
      body: 'Entropy is the fatigue that arrives when a life stops being expressed through its own rhythm. The native sleeps through the mornings meant for creation and grinds through the afternoons that belong to rest. Depression here is not illness but inversion — the creative fire banked so long it turns inward and smoulders. The cure is never willpower; it is the return of the first gesture.',
    },
    gift: {
      name: 'Freshness',
      body: 'Freshness is the willingness to begin without asking whether the beginning is allowed. The native who moves through this frequency treats each morning as uncommissioned — no continuity debt, no obligation to yesterday\'s form. Creativity returns when the gesture is original rather than owed. Work made here carries a scent the market recognises before the mind does.',
    },
    siddhi: {
      name: 'Beauty',
      body: 'Beauty at this frequency is not decorative. It is the involuntary radiance of a life that has stopped negotiating with its own source. Those who encounter it receive permission — to make, to love, to live without apology.',
    },
  },
  2: {
    number: 2, name: 'The Return to Source', hexagram: 'The Receptive',
    shadow: {
      name: 'Dislocation',
      body: 'Dislocation is the low hum of being wrong-placed — wrong city, wrong vocation, wrong company — with no clear evidence for any of it. The native drifts, overcorrecting by moving house or job, then finds the feeling waiting at the new address. The shadow is not geography; it is the refusal to trust one\'s own orientation before reasons arrive.',
    },
    gift: {
      name: 'Orientation',
      body: 'Orientation is the inner compass that turns before the mind explains why. At this frequency the native begins to act on quiet preferences — this table, not that one; this call first, that one never — and notices the day arranging itself around the small honest moves. Direction stops being a decision and becomes a description.',
    },
    siddhi: {
      name: 'Unity',
      body: 'Unity dissolves the sense of being separate from what one is moving toward. The destination and the traveller collapse into the same point. Life is no longer navigated; it is inhabited.',
    },
  },
  3: {
    number: 3, name: 'Through the Eye of the Needle', hexagram: 'Difficulty at the Beginning',
    shadow: {
      name: 'Chaos',
      body: 'Chaos is the condition of starting everything and finishing almost nothing. The native mistakes the churn for vitality — many projects, many tabs, many half-built rooms — and calls exhaustion proof of seriousness. The real pattern is a refusal to let the first green shoot have its full slow season. Every abandoned draft is a refused initiation.',
    },
    gift: {
      name: 'Innovation',
      body: 'Innovation arrives the moment one half-built thing is chosen and protected until it breathes on its own. The native learns that originality is not a spasm of ideas but the discipline of finishing one. The work that survives this frequency carries the shape of a mutation — irregular, unmistakable, alive.',
    },
    siddhi: {
      name: 'Innocence',
      body: 'Innocence is the post-chaos stillness of a being who has nothing to prove by starting and nothing to lose by finishing. Each act becomes its own reason. The world receives these gestures as gifts because the giver has forgotten they are gifts.',
    },
  },
  4: {
    number: 4, name: 'All Answers', hexagram: 'Youthful Folly',
    shadow: {
      name: 'Intolerance',
      body: 'Intolerance is the rush to answer before the question has ripened. The native arrives at conclusions early, defends them loudly, and mistakes confidence for clarity. Beneath it is the old childhood allergy to not-knowing — a rawness the intellect refuses to sit with. The shadow pattern ends friendships and starts arguments that nobody wins.',
    },
    gift: {
      name: 'Understanding',
      body: 'Understanding is the intellect that has learned to wait until the pattern completes itself. At this frequency the native holds several hypotheses lightly and watches which one earns the evidence. Conversations shift — others begin bringing half-formed thoughts because they are no longer corrected. The mind becomes a workshop, not a courtroom.',
    },
    siddhi: {
      name: 'Forgiveness',
      body: 'Forgiveness is the complete absorption of error — one\'s own and others\' — into understanding so deep it leaves no residue. There is nothing left to correct because there is nobody left to blame. The mind becomes transparent to life.',
    },
  },
  5: {
    number: 5, name: 'The End of Time', hexagram: 'Waiting',
    shadow: {
      name: 'Impatience',
      body: 'Impatience is the refusal to let a rhythm establish itself. The native jumps ahead of the body, ahead of the relationship, ahead of the harvest, and then wonders why nothing tastes right. Lateness and earliness both belong to this shadow — the common root is a disbelief that one\'s own timing is trustworthy. Life rushed is life skimmed.',
    },
    gift: {
      name: 'Patience',
      body: 'Patience is not waiting for something; it is the ability to do the right thing now without hurrying its ripening. At this frequency the native develops routines that outlive moods. Mornings hold. Phone calls land on the day they were meant to. The work compounds because it is no longer interrupted by the wish for it to already be done.',
    },
    siddhi: {
      name: 'Timelessness',
      body: 'Timelessness is the experience of being inside time without being carried by it. The clock still turns, but the native no longer flinches at its hands. Every moment is the right moment because no other moment is being compared to it.',
    },
  },
  6: {
    number: 6, name: 'The Path to Peace', hexagram: 'Conflict',
    shadow: {
      name: 'Conflict',
      body: 'Conflict is the mistaken belief that emotional truth must be delivered through friction. The native uses heat to make a point — raised voice, cold silence, pre-emptive accusation — then mistakes the other party\'s withdrawal for clarity. Underneath is a nervous system that learned love arrives fastest when the temperature is high. It does not.',
    },
    gift: {
      name: 'Diplomacy',
      body: 'Diplomacy at this frequency is the steady voice that says the hard thing without lighting the room on fire. The native discovers that emotional accuracy travels further when the volume is lower. Relationships deepen because the other person no longer has to defend themselves against the delivery — only engage with the content.',
    },
    siddhi: {
      name: 'Peace',
      body: 'Peace is not the absence of disagreement. It is the state in which disagreement no longer requires a winner. The native radiates a stillness that ends wars inside the people around them — because there is no longer a war inside themselves.',
    },
  },
  7: {
    number: 7, name: 'Virtue in Action', hexagram: 'The Army',
    shadow: {
      name: 'Division',
      body: 'Division is the habit of splitting any group into those who follow and those who must be converted. The native leads by force of personality and then wonders why the loyalty ends the moment they turn their back. Leadership here is a theatre of control. It exhausts the leader and embitters the led.',
    },
    gift: {
      name: 'Guidance',
      body: 'Guidance is leadership by orientation rather than direction. The native stops issuing instructions and starts modelling a trajectory, and the people around them begin moving of their own accord. Authority shifts from office to example. The room is no longer being managed; it is being inspired.',
    },
    siddhi: {
      name: 'Virtue',
      body: 'Virtue is the state in which right action and effortless action are indistinguishable. The native leads without leading; their presence is the instruction. Those who follow are not followers — they are witnesses.',
    },
  },
  8: {
    number: 8, name: 'Diamond of the Self', hexagram: 'Holding Together',
    shadow: {
      name: 'Mediocrity',
      body: 'Mediocrity is the self-muting done to avoid being singled out. The native has an eye for the unusual — a real one — and spends a decade rounding off their own corners so the workplace stays comfortable. Creativity survives this shadow the way a plant survives a dark hallway. Barely, and not for long.',
    },
    gift: {
      name: 'Style',
      body: 'Style is the refusal to look like anyone else in the room without announcing the refusal. At this frequency the native trusts their own aesthetic before the market agrees with it. The signature becomes legible — a way of writing, a way of dressing, a way of running meetings — and the world begins borrowing it back.',
    },
    siddhi: {
      name: 'Exquisiteness',
      body: 'Exquisiteness is presence refined to the point where everything the native touches acquires a subtle precision. There is no performance of taste; taste has become identity. Those in the native\'s orbit find their own standards quietly raised.',
    },
  },
  9: {
    number: 9, name: 'The Power of the Infinitesimal', hexagram: 'The Taming Power of the Small',
    shadow: {
      name: 'Inertia',
      body: 'Inertia is the slow, respectable version of giving up. The native sits at the desk, opens the file, does three minutes of real work, and then spends four hours in peripheral motion. Nothing dramatic fails; everything small fails to start. The shadow convinces its host that focus requires mood, and waits for a mood that never quite arrives.',
    },
    gift: {
      name: 'Determination',
      body: 'Determination is the small daily act performed without negotiating with the mood. The native learns that the work itself produces the appetite for the work, not the reverse. Sessions shorten, cadence stabilises, and long projects finish because they were never waiting on inspiration. The engine is now endogenous.',
    },
    siddhi: {
      name: 'Invincibility',
      body: 'Invincibility is the condition of a being who has stopped bargaining with resistance. Obstacles still arrive, but they no longer have purchase. Forward motion is no longer a discipline; it is a description of the native\'s standing state.',
    },
  },
  10: {
    number: 10, name: 'Being Oneself', hexagram: 'Treading',
    shadow: {
      name: 'Self-Obsession',
      body: 'Self-obsession is the exhausting inward audit — am I performing correctly, does my voice sound right, did the photo catch me at the wrong angle. The native mistakes self-reference for self-knowledge. The mirror is consulted so often that nobody else in the room gets looked at. Loneliness follows.',
    },
    gift: {
      name: 'Naturalness',
      body: 'Naturalness is the relief of dropping the audit. The native stops arranging themselves for a watcher that never shows up and begins to move in their own size. Laughter loosens. Posture lengthens. People find them easier to be around because there is finally someone actually there.',
    },
    siddhi: {
      name: 'Being',
      body: 'Being is the silent recognition that the self needing to be performed was never the self doing the performing. The native arrives in full presence. Others, without knowing why, become easier in their own skin near them.',
    },
  },
  11: {
    number: 11, name: 'The Light of Eden', hexagram: 'Peace',
    shadow: {
      name: 'Obscurity',
      body: 'Obscurity is the clouding of one\'s own insight until even the native can no longer see it clearly. Ideas arrive half-dressed, are dismissed, and return years later as someone else\'s bestseller. The shadow tells its host that visions are for other people. It is always wrong, and it is always believed.',
    },
    gift: {
      name: 'Idealism',
      body: 'Idealism is the ability to hold a vision long enough for the world to begin arranging itself around it. The native learns to write the idea down before arguing with it. Essays, prototypes, business plans — the work becomes a way of thinking in public. The vision acquires mass.',
    },
    siddhi: {
      name: 'Light',
      body: 'Light is the state in which insight no longer arrives from elsewhere; the native is the source. Ideas pass through them the way sun passes through clear water. Nothing is added, nothing is withheld, and the world brightens without knowing why.',
    },
  },
  12: {
    number: 12, name: 'The Pure Heart', hexagram: 'Standstill',
    shadow: {
      name: 'Vanity',
      body: 'Vanity is the quiet vote for the self\'s appearance over the self\'s truth. The native edits the caption, selects the angle, rehearses the aside. None of it is evil; all of it is small theft from a life that could be more direct. The shadow mistakes performance for presence.',
    },
    gift: {
      name: 'Discrimination',
      body: 'Discrimination is the fine instrument that separates the true sentence from the pleasing one. The native stops saying what sounds good and starts saying what is actually the case. Writing sharpens. Friendships concentrate. The voice becomes recognisable across any medium because the same person is doing the speaking.',
    },
    siddhi: {
      name: 'Purity',
      body: 'Purity is speech undivided from source. The native cannot be quoted out of context because there is no context underneath the words other than the words themselves. Language, at this frequency, becomes a form of service.',
    },
  },
  13: {
    number: 13, name: 'Through the Listener\'s Ear', hexagram: 'Fellowship with Men',
    shadow: {
      name: 'Discord',
      body: 'Discord is the collection of small unspoken resentments that slowly untune a life. The native rehearses conversations that never happen and carries moods from one room into the next. The shadow keeps every grievance warm in case it is needed. It is almost never needed.',
    },
    gift: {
      name: 'Discernment',
      body: 'Discernment is the ear trained to hear the one true sentence inside the long complaint. The native listens longer than is comfortable and speaks later than feels safe. What they finally say lands because it was listened-for rather than prepared. They become the person others quote.',
    },
    siddhi: {
      name: 'Empathy',
      body: 'Empathy is the complete absorption of another\'s position without losing one\'s own ground. The native becomes a place where people\'s stories can finally be finished. Entire lives shift after an hour in this frequency\'s company.',
    },
  },
  14: {
    number: 14, name: 'Radiating Prosperity', hexagram: 'Possession in Great Measure',
    shadow: {
      name: 'Compromise',
      body: 'Compromise is the slow downgrade of the original vision in the name of being reasonable. The native negotiates with themselves in small rooms and leaves each meeting with a slightly smaller life. Money comes and goes without joining up. The shadow mistakes pragmatism for wisdom.',
    },
    gift: {
      name: 'Competence',
      body: 'Competence is the craftsmanship that makes prosperity a by-product rather than a target. The native stops chasing abundance and starts executing the work with the attention it deserves. Income stabilises because clients notice. Bank accounts become less dramatic and more reliable.',
    },
    siddhi: {
      name: 'Bounteousness',
      body: 'Bounteousness is the overflow of a life no longer calibrated to scarcity. Resources move through the native rather than sticking to them. Generosity is not a virtue here; it is a consequence of the native having more than they need and knowing it.',
    },
  },
  15: {
    number: 15, name: 'Rhythm of the Meeting', hexagram: 'Modesty',
    shadow: {
      name: 'Dullness',
      body: 'Dullness is the refusal to meet the moment with the full range of one\'s aliveness. The native keeps the thermostat low — mildly interested, mildly upset, mildly engaged — and calls the flatness humility. Seasons pass without being noticed. The shadow is a slow anaesthesia.',
    },
    gift: {
      name: 'Magnetism',
      body: 'Magnetism is the natural pull of a human whose temperature is finally accurate to what they are feeling. The native stops hiding inside moderation and begins meeting events at full size. Joy lands heavier. Grief lands heavier. Others are drawn to the honesty, not the drama.',
    },
    siddhi: {
      name: 'Florescence',
      body: 'Florescence is the flowering state — a being so fully present to the moment that every moment seems to open around them. There is no performance of aliveness; there is aliveness. Rooms and seasons rearrange themselves in its wake.',
    },
  },
  16: {
    number: 16, name: 'Magical Genius', hexagram: 'Enthusiasm',
    shadow: {
      name: 'Indifference',
      body: 'Indifference is the protective shrug of someone who was once very serious about something and got burned for it. The native learns to under-promise, under-declare, under-care. Skill atrophies in plain sight. The shadow survives by refusing to be caught caring.',
    },
    gift: {
      name: 'Versatility',
      body: 'Versatility is the willingness to care again — about several things — and to develop the craft that caring demands. The native picks up skills quickly because the appetite is back. Mastery stops being threatening. The résumé becomes strangely coherent even when the items look unrelated.',
    },
    siddhi: {
      name: 'Mastery',
      body: 'Mastery at this frequency is not about technical dominance; it is about the effortless right-ness of action. The native no longer studies; they inhabit. Every craft they touch begins to look like home.',
    },
  },
  17: {
    number: 17, name: 'The Eye', hexagram: 'Following',
    shadow: {
      name: 'Opinion',
      body: 'Opinion is the low-grade fever of the intellect that prefers to be loud over being right. The native has a take for every room and a follow-up for every take. Conversations become performances. The shadow never learns; it only updates its arsenal.',
    },
    gift: {
      name: 'Far-sightedness',
      body: 'Far-sightedness is the long view that sees three moves ahead without needing to announce the plan. The native grows quieter and more accurate. Predictions land; strategies hold. Others begin consulting the native not for opinions but for bearings.',
    },
    siddhi: {
      name: 'Omniscience',
      body: 'Omniscience is not the knowledge of everything. It is the knowledge that what is required is always already present. The native acts with complete information because they have stopped asking for more than the moment provides.',
    },
  },
  18: {
    number: 18, name: 'Healing the Past', hexagram: 'Work on What Has Been Spoilt',
    shadow: {
      name: 'Judgement',
      body: 'Judgement is the compulsive repair instinct turned on everyone within reach. The native sees the cracked tile on the wall, the misspelling in the email, the flaw in the friend\'s logic, and cannot rest until each is pointed out. The shadow believes improvement is love. It is not.',
    },
    gift: {
      name: 'Integrity',
      body: 'Integrity is the repair instinct turned inward first. The native fixes the thing in their own life that they keep noticing in others, and the compulsive pointing-out quiets. Feedback, when it comes, lands differently because it arrives from someone who has done the work. Editors become allies.',
    },
    siddhi: {
      name: 'Perfection',
      body: 'Perfection is not the flawless state; it is the recognition that what is has always been what it needed to be. The native stops correcting the world and the world stops feeling corrected. Ease settles where work used to be.',
    },
  },
  19: {
    number: 19, name: 'The Future Human', hexagram: 'Approach',
    shadow: {
      name: 'Co-dependence',
      body: 'Co-dependence is the survival bargain in which the native trades selfhood for attachment. Needs get folded inside the partner\'s needs. Moods synchronise. The shadow confuses fusion with intimacy and then punishes the other person for not being separate enough to be truly met.',
    },
    gift: {
      name: 'Sensitivity',
      body: 'Sensitivity is attachment without absorption. The native learns to register another\'s state without catching it. Relationships acquire weather but not contagion. Touch becomes more precise — a hand on a shoulder actually means one thing. The native becomes trustworthy at proximity.',
    },
    siddhi: {
      name: 'Sacrifice',
      body: 'Sacrifice at this frequency is not loss; it is the offering of a life no longer held against anyone. The native gives because there is a surplus, not because there is a bargain. Love becomes structural to them rather than transactional.',
    },
  },
  20: {
    number: 20, name: 'The Sacred Om', hexagram: 'Contemplation',
    shadow: {
      name: 'Superficiality',
      body: 'Superficiality is the habit of skimming the surface of one\'s own life at top speed. The native posts, replies, attends, performs — and cannot remember what they did last Tuesday. The shadow keeps consciousness thin enough to avoid noticing the thing that actually needs attention.',
    },
    gift: {
      name: 'Self-Assurance',
      body: 'Self-assurance is presence with one\'s own depth. The native slows the pace until the day can actually be felt. Conversations deepen because the native is finally in them. Silence stops being uncomfortable. Busy is no longer a flavour of self.',
    },
    siddhi: {
      name: 'Presence',
      body: 'Presence is the saturation of attention in the immediate. Past and future fall away not because they are denied but because they are not needed. The native becomes a room in which others remember how to be here.',
    },
  },
  21: {
    number: 21, name: 'A Noble Life', hexagram: 'Biting Through',
    shadow: {
      name: 'Control',
      body: 'Control is the exhausting attempt to foreclose every surprise. The native schedules what should breathe, manages what should unfold, and calls the resulting tightness standards. Teams leave. Relationships thin. The shadow mistakes dominion for safety and then cannot understand why the kingdom is empty.',
    },
    gift: {
      name: 'Authority',
      body: 'Authority is the self-possession that no longer needs to micromanage anyone else. The native sets the standard by embodying it, and the room calibrates without being told. Decisions happen faster because the delegation is real. Time returns. Trust arrives.',
    },
    siddhi: {
      name: 'Valour',
      body: 'Valour is the state of a being who no longer flinches when life demands the hard action. There is no performance of courage; the action simply occurs. Others, witnessing it, remember what their own backbone is for.',
    },
  },
  22: {
    number: 22, name: 'Grace Under Pressure', hexagram: 'Grace',
    shadow: {
      name: 'Dishonour',
      body: 'Dishonour is the slow loss of self-respect that follows each small moment of not saying what was true. The native makes peace by making themselves smaller, and the payment is collected in silence over months. Emotional weather grows unpredictable because the honest account was never settled.',
    },
    gift: {
      name: 'Graciousness',
      body: 'Graciousness is poise under emotional weight — the ability to feel what is arriving without passing it to anyone else. The native meets hard conversations without flinching and without punishing. Others, sensing this, bring their actual selves. Gatherings change character. Difficult rooms become civilised.',
    },
    siddhi: {
      name: 'Grace',
      body: 'Grace is the radiant condition of a life through which emotion passes like weather through an open landscape. Nothing is blocked, nothing is hoarded. The native becomes a sanctuary that does not know it is one.',
    },
  },
  23: {
    number: 23, name: 'The Quantum Leap', hexagram: 'Splitting Apart',
    shadow: {
      name: 'Complexity',
      body: 'Complexity is the over-decoration of simple truths until nobody, including the native, can find them. The mind here is a house with too many rooms. Insights arrive and then drown in their own footnotes. The shadow mistakes elaboration for rigour.',
    },
    gift: {
      name: 'Simplicity',
      body: 'Simplicity is the discipline of saying the one true thing in as few words as it takes. The native trims their own sentences until only the load-bearing ones remain. Essays shorten. Pitches land. The audience leans in because the signal is finally clean.',
    },
    siddhi: {
      name: 'Quintessence',
      body: 'Quintessence is the distilled form of any message the native chooses to transmit. No flourish, no apology, no hedge. What is said becomes what is known — in the listener, instantly, without friction.',
    },
  },
  24: {
    number: 24, name: 'The Silence Within', hexagram: 'Return',
    shadow: {
      name: 'Addiction',
      body: 'Addiction is the repeating loop that the mind prefers because it is known. The native returns to the same thought, the same screen, the same person, and pretends the return is choice. The shadow runs on the thin relief of the familiar. The relief always shortens.',
    },
    gift: {
      name: 'Invention',
      body: 'Invention is the interruption of the loop with something that has never happened before. The native breaks the cycle not by resolving it but by outgrowing it. New patterns arrive as spontaneous mutations. The life reorganises around a fresh groove the old mind could not predict.',
    },
    siddhi: {
      name: 'Silence',
      body: 'Silence is the cessation of the loop itself. The native arrives at the still point between thoughts and finds it inhabitable. The inner weather quiets. Decisions rise cleanly from a source that is no longer argumentative.',
    },
  },
  25: {
    number: 25, name: 'The Myth of Love', hexagram: 'Innocence',
    shadow: {
      name: 'Constriction',
      body: 'Constriction is the protective tightening around the heart that happened so early the native mistakes it for personality. Love, when it arrives, is filtered through suspicion. The body locks before the mind agrees to it. The shadow keeps the native safe from experiences that were never going to hurt.',
    },
    gift: {
      name: 'Acceptance',
      body: 'Acceptance is the slow unclenching around what was always already welcome. The native stops auditing love for authenticity and begins receiving it as data. Friendships widen. Romance simplifies. The body learns that open is not the same as undefended.',
    },
    siddhi: {
      name: 'Universal Love',
      body: 'Universal love at this frequency is not a sentiment. It is the baseline temperature of a being who has stopped separating the worthy from the unworthy. Everything is met. Nothing is graded. The native becomes indistinguishable from welcome.',
    },
  },
  26: {
    number: 26, name: 'The Heart of the Trickster', hexagram: 'The Taming Power of the Great',
    shadow: {
      name: 'Pride',
      body: 'Pride is the thin armour of the person who cannot bear to be wrong in public. The native overclaims, over-asserts, and then quietly edits the story once everyone has left. The shadow mistakes status for safety and pays for it with eroded relationships that can never be openly audited.',
    },
    gift: {
      name: 'Artfulness',
      body: 'Artfulness is the skilled manoeuvre that gets the right result without needing to be admired for it. The native stops performing mastery and starts using it. Negotiations settle in half the time. Sales happen by precision. The cleverness becomes invisible because it is now in the right place.',
    },
    siddhi: {
      name: 'Invisibility',
      body: 'Invisibility is the state of a being whose action is perfectly matched to the moment — so matched it leaves no trace. The native moves through lives and markets without accumulating mythology. The work, not the worker, is what is remembered.',
    },
  },
  27: {
    number: 27, name: 'Food of the Gods', hexagram: 'The Corners of the Mouth',
    shadow: {
      name: 'Selfishness',
      body: 'Selfishness here is not greed; it is the defensive curling around one\'s own resources in a world misread as scarce. The native says no to requests they could easily say yes to and then feels vaguely ashamed. The shadow miscalculates the ledger every time.',
    },
    gift: {
      name: 'Altruism',
      body: 'Altruism is the recalibration that notices a surplus. The native begins giving — time, attention, money — in amounts that match what they actually have, and life responds by topping the vessel up. Community thickens. The native becomes a reliable node in other people\'s safety.',
    },
    siddhi: {
      name: 'Selflessness',
      body: 'Selflessness is the complete collapse of the accountant. The native no longer calculates giving or receiving because there is no longer a separate self keeping the ledger. Resources flow through them as naturally as breath.',
    },
  },
  28: {
    number: 28, name: 'The Game Player', hexagram: 'Preponderance of the Great',
    shadow: {
      name: 'Purposelessness',
      body: 'Purposelessness is the undercurrent of a life that looks full from the outside and feels hollow from the inside. The native keeps scoring in games they have stopped caring about. The shadow mistakes momentum for meaning and runs hard in the wrong direction.',
    },
    gift: {
      name: 'Totality',
      body: 'Totality is the willingness to put the whole self behind a single chosen thing and let the result be whatever it is. The native picks the game that is actually theirs and plays it completely. Energy returns. The scoreboard stops mattering because the game has become its own reason.',
    },
    siddhi: {
      name: 'Immortality',
      body: 'Immortality is not length of life; it is the completeness of the life being lived. The native stops fearing the ending because there is nothing being postponed. Each moment is met at full strength. Death, when it arrives, finds no unfinished business.',
    },
  },
  29: {
    number: 29, name: 'The Leap of Faith', hexagram: 'The Abysmal',
    shadow: {
      name: 'Half-heartedness',
      body: 'Half-heartedness is the yes that was never quite meant. The native agrees, shows up, contributes — and then wonders why nothing they start seems to bloom. Commitments get technically met and spiritually abandoned. The shadow believes keeping options open is the same as being free.',
    },
    gift: {
      name: 'Commitment',
      body: 'Commitment is the yes that includes tomorrow. The native stops hedging and begins to say what they will actually do, then does it. Relationships deepen because the partner can finally plan around them. Projects finish. Reliability becomes a quiet form of charisma.',
    },
    siddhi: {
      name: 'Devotion',
      body: 'Devotion is commitment without effort. The native is so fully aligned with what they serve that the distinction between serving and being disappears. Life becomes a continuous offering. Nothing is sacrificed because nothing is being held back.',
    },
  },
  30: {
    number: 30, name: 'Divine Passion', hexagram: 'The Clinging Fire',
    shadow: {
      name: 'Desire',
      body: 'Desire at this frequency is the compulsive chasing of the next anticipated pleasure — the next purchase, person, trip, milestone — none of which quite deliver when they arrive. The native confuses craving for aliveness. The shadow keeps the fire on so high that nothing can actually be tasted.',
    },
    gift: {
      name: 'Lightness',
      body: 'Lightness is the transformation of hot craving into warm appreciation. The native stops chasing the next thing and begins fully inhabiting the current one. Food tastes again. Afternoons slow. Passion becomes a sustainable temperature rather than a sequence of brief combustions.',
    },
    siddhi: {
      name: 'Rapture',
      body: 'Rapture is the steady-state aliveness of a being who no longer needs anything to happen in order to be ignited. Joy becomes a background condition. The native is, simply, lit — and those nearby catch it without being taught.',
    },
  },
  31: {
    number: 31, name: 'Sounding the Depths', hexagram: 'Influence',
    shadow: {
      name: 'Arrogance',
      body: 'Arrogance is leadership that talks over the room it is supposed to serve. The native seizes the microphone before they have listened, sets the direction without consultation, and then resents the quiet resistance that follows. The shadow confuses volume with vision.',
    },
    gift: {
      name: 'Leadership',
      body: 'Leadership at this frequency is the voice that has earned the room. The native listens first, speaks second, and means what they say. Authority comes from example, not title. Decisions carry weight because they are visibly arrived at, not performed. The group begins to trust its own direction.',
    },
    siddhi: {
      name: 'Humility',
      body: 'Humility is the ground state of a being who leads without needing to be followed. The native has become so trustworthy that authority gathers to them automatically. They never seek the room; the room arranges itself around their presence.',
    },
  },
  32: {
    number: 32, name: 'Ancestral Reverence', hexagram: 'Duration',
    shadow: {
      name: 'Failure',
      body: 'Failure here is not an event; it is a preemptive worldview. The native imagines the collapse of every venture before the venture begins and then either doesn\'t start or sabotages the midway point. The shadow calls the pattern realism. It is not. It is a thesis waiting to be disproved.',
    },
    gift: {
      name: 'Preservation',
      body: 'Preservation is the long view that protects what matters across seasons. The native becomes the person who keeps the valuable thing alive — a business, a craft, a lineage, a relationship — by refusing to panic. Others borrow steadiness from them. Legacies form quietly.',
    },
    siddhi: {
      name: 'Veneration',
      body: 'Veneration is reverence for continuity — the recognition that the self is a custodian rather than an owner. The native holds what they hold lightly and transmits it forward without loss. Lineages flow through them uninterrupted.',
    },
  },
  33: {
    number: 33, name: 'The Final Revelation', hexagram: 'Retreat',
    shadow: {
      name: 'Forgetting',
      body: 'Forgetting is the quiet forfeiture of the insight just received. The native has the realisation, knows it matters, and by the next morning has returned to the previous shape. The shadow erases inconvenient truths on a nightly basis and calls it normal life.',
    },
    gift: {
      name: 'Mindfulness',
      body: 'Mindfulness is the practice of keeping yesterday\'s insight alive through today\'s actions. The native begins writing things down, referring back, building on what has already been learned. Progress becomes cumulative. The life is finally moving in one direction.',
    },
    siddhi: {
      name: 'Revelation',
      body: 'Revelation is the continuous arrival of truth into a being who no longer forgets. Each insight becomes a permanent part of the architecture. The native accumulates depth the way a glacier accumulates ice — slowly, irreversibly, with weight.',
    },
  },
  34: {
    number: 34, name: 'The Beauty of the Beast', hexagram: 'The Power of the Great',
    shadow: {
      name: 'Force',
      body: 'Force is power used without listening — the steamroller variant of strength that gets the task done and leaves the relationships in pieces. The native overrides, overrules, overextends, and then feels alone at the top of a hill they climbed by stepping on people who would have helped.',
    },
    gift: {
      name: 'Strength',
      body: 'Strength is power that has learned when to hold and when to release. The native stops pushing through every wall and begins asking whether the wall is even in the right place. Energy lasts longer. People stay. The outcomes improve without the cost.',
    },
    siddhi: {
      name: 'Majesty',
      body: 'Majesty is strength made quiet. The native no longer needs to demonstrate power because power is so fully present it does not require display. Rooms settle around them. Events arrange themselves toward completion in their presence.',
    },
  },
  35: {
    number: 35, name: 'Eternal Novelty', hexagram: 'Progress',
    shadow: {
      name: 'Hunger',
      body: 'Hunger is the chronic itch for the next experience — the next trip, the next job, the next romance — pursued not for itself but because stillness feels unbearable. The native keeps moving and keeps arriving at the same emptiness with a different postcard. The shadow is allergic to presence.',
    },
    gift: {
      name: 'Adventure',
      body: 'Adventure is movement undertaken for its own quality rather than as escape. The native learns to travel without running away. Experiences deepen because they are being tasted rather than collected. The life stops being a résumé of places and becomes a record of encounters.',
    },
    siddhi: {
      name: 'Boundlessness',
      body: 'Boundlessness is the state of being everywhere already. The native no longer needs to go anywhere in order to feel expansive. Whatever room they are in contains the world. Travel becomes optional; presence becomes infinite.',
    },
  },
  36: {
    number: 36, name: 'Becoming Human', hexagram: 'Darkening of the Light',
    shadow: {
      name: 'Turbulence',
      body: 'Turbulence is the emotional weather that arrives without obvious cause and dominates the day. The native wakes up fine, reads the wrong message, and spends the afternoon unable to recover. The shadow treats every mood as a verdict and every verdict as permanent.',
    },
    gift: {
      name: 'Humanity',
      body: 'Humanity is the acceptance that one is a creature of weather as well as intellect. The native stops apologising for having feelings and starts working with them. Emotional literacy grows. Relationships benefit because the native is finally narrating themselves rather than being swept.',
    },
    siddhi: {
      name: 'Compassion',
      body: 'Compassion is the complete understanding of the human condition from the inside. The native has felt everything and no longer flinches at anyone else feeling it too. Presence becomes a form of medicine. The suffering near them softens without instruction.',
    },
  },
  37: {
    number: 37, name: 'Family Alchemy', hexagram: 'The Family',
    shadow: {
      name: 'Weakness',
      body: 'Weakness is the learned helplessness of the person who always lets someone else make the call. The native defers, agrees, and then seethes in private. The shadow mistakes passivity for peace and quietly bankrupts every relationship it touches.',
    },
    gift: {
      name: 'Equality',
      body: 'Equality is the arrival of one\'s own voice inside the family — the room, the marriage, the team — without that voice having to compete. The native learns to state preferences and negotiate rather than capitulate. The relationships become genuinely mutual. The resentment dissolves because it is no longer being earned.',
    },
    siddhi: {
      name: 'Tenderness',
      body: 'Tenderness is strength without edge. The native has found their footing and no longer needs to push against anyone to feel it. Touch becomes softer without becoming less accurate. Love becomes structural.',
    },
  },
  38: {
    number: 38, name: 'The Warrior of Light', hexagram: 'Opposition',
    shadow: {
      name: 'Struggle',
      body: 'Struggle is the identity built on permanent uphill. The native can only feel alive when something is being fought. Peaceful seasons feel suspicious and are quietly sabotaged. The shadow confuses resistance for meaning and cannot imagine a life without an enemy.',
    },
    gift: {
      name: 'Perseverance',
      body: 'Perseverance is struggle put to purpose. The native keeps the fighting spirit and aims it at a cause worth the wear — the work, the health, the family under threat — rather than the nearest petty frustration. Energy compounds. The life finally has a direction proportional to its engine.',
    },
    siddhi: {
      name: 'Honour',
      body: 'Honour is perseverance made noble. The native fights without becoming the fight. Every action preserves their dignity and the dignity of the opponent. Conflict resolves into something closer to courtship. The war was always about recognition.',
    },
  },
  39: {
    number: 39, name: 'The Tension of Release', hexagram: 'Obstruction',
    shadow: {
      name: 'Provocation',
      body: 'Provocation is the impulse to poke the calm just to see what happens. The native sets small emotional fires and then complains about the smoke. Relationships become volatile because the native cannot tolerate a settled room. The shadow confuses stimulation for intimacy.',
    },
    gift: {
      name: 'Dynamism',
      body: 'Dynamism is provocation harnessed — the ability to stir movement in systems that have gone still, without burning them down. The native becomes the person who asks the question nobody else will ask and gets the room unstuck. The energy finally has a job.',
    },
    siddhi: {
      name: 'Liberation',
      body: 'Liberation is the freedom that arrives when provocation is no longer needed. The native has become so present that life itself is continually novel. There is nothing left to stir because nothing has gone stale.',
    },
  },
  40: {
    number: 40, name: 'The Will to Surrender', hexagram: 'Deliverance',
    shadow: {
      name: 'Exhaustion',
      body: 'Exhaustion is the chronic depletion of the person who cannot say no. The native agrees to one more favour, one more project, one more call, and then collapses in private. The shadow treats every refusal as abandonment and punishes itself for having limits.',
    },
    gift: {
      name: 'Resolve',
      body: 'Resolve is the clean no that preserves the future yes. The native learns to refuse without apology and notices that nobody actually leaves. Energy returns. The remaining commitments get the full attention they deserve. Reliability sharpens because it is no longer spread thin.',
    },
    siddhi: {
      name: 'Divine Will',
      body: 'Divine will is the state in which the native\'s own action and what needs to happen have become the same action. There is no effort because there is no internal negotiation. Every yes and every no simply occur at the right moment.',
    },
  },
  41: {
    number: 41, name: 'The Emanation of the Source', hexagram: 'Decrease',
    shadow: {
      name: 'Fantasy',
      body: 'Fantasy is the mental theatre that substitutes for the life not yet started. The native rehearses the relationship, the business, the book — vividly, for years — and never begins. The shadow enjoys the imagined version so thoroughly that the real version feels like a disappointment before it has a chance.',
    },
    gift: {
      name: 'Anticipation',
      body: 'Anticipation is fantasy put to work. The native uses imagination to prepare rather than to avoid. Plans get made, money gets saved, the conversation gets rehearsed and then actually had. The inner rehearsal becomes a staging area for real life rather than a substitute for it.',
    },
    siddhi: {
      name: 'Emanation',
      body: 'Emanation is the creative pressure of a being who can no longer hold the inner vision inside. Work pours out — not as performance but as overflow. The native becomes a source, and the world assembles downstream.',
    },
  },
  42: {
    number: 42, name: 'Letting Go of Living', hexagram: 'Increase',
    shadow: {
      name: 'Expectation',
      body: 'Expectation is the quiet contract the native makes with people who never signed it. Relationships accumulate invisible bills. The native keeps score and cannot understand why the other person seems to think the tab is clear. The shadow punishes its host with chronic, mild betrayal.',
    },
    gift: {
      name: 'Detachment',
      body: 'Detachment is affection without a ledger. The native gives what they give and lets it land where it lands. The invisible contracts dissolve. Relationships lighten because the other party can finally relax into simply being there. Love stops being a transaction.',
    },
    siddhi: {
      name: 'Celebration',
      body: 'Celebration is the continuous yes to what is arriving. Every ending is acknowledged; every beginning is honoured. The native becomes a ceremony-maker, and life responds with events that feel designed.',
    },
  },
  43: {
    number: 43, name: 'Breakthrough', hexagram: 'Breakthrough',
    shadow: {
      name: 'Deafness',
      body: 'Deafness is the refusal to hear what the inner voice has been saying all year. The native gets the nudge — change job, leave city, start the project — and files it under later. The shadow specialises in not hearing, and charges interest on every postponement.',
    },
    gift: {
      name: 'Insight',
      body: 'Insight is the acceptance that the inner voice is usually right the first time. The native starts acting on the quiet nudges without requiring them to be re-delivered. Breakthroughs become routine rather than dramatic. The life begins moving at the speed of knowing.',
    },
    siddhi: {
      name: 'Epiphany',
      body: 'Epiphany is the permanent state of just-heard understanding. The native no longer has insights; the native is insight. Reality is continually revealing itself in present time, and nothing is filed for later.',
    },
  },
  44: {
    number: 44, name: 'Karmic Relationships', hexagram: 'Coming to Meet',
    shadow: {
      name: 'Interference',
      body: 'Interference is the urge to manage other people\'s lives using one\'s own template. The native advises without being asked, rescues before rescue is wanted, and then resents the ingratitude. The shadow cannot tell the difference between care and control.',
    },
    gift: {
      name: 'Teamwork',
      body: 'Teamwork is the capacity to contribute to another person\'s project without needing to run it. The native learns to offer skill when it is asked for and withhold it when it is not. Relationships stabilise. Collaborations produce more than the sum of their parts because nobody is being managed.',
    },
    siddhi: {
      name: 'Synarchy',
      body: 'Synarchy is collaboration so complete the individuals disappear into the work. The native no longer feels where their contribution ends and the partner\'s begins. The outcome belongs to the field, not the players.',
    },
  },
  45: {
    number: 45, name: 'Cosmic Communion', hexagram: 'Gathering Together',
    shadow: {
      name: 'Dominance',
      body: 'Dominance is leadership by entitlement — the assumption that the room belongs to the native because they are in it. The shadow demands loyalty it has not earned and calls disagreement betrayal. Teams comply and resent. Kingdoms here are always precarious.',
    },
    gift: {
      name: 'Synergy',
      body: 'Synergy is leadership that multiplies rather than extracts. The native begins to notice what each person in the room actually brings and builds the work around those strengths. The output exceeds what any individual could have produced. Loyalty arrives without being demanded.',
    },
    siddhi: {
      name: 'Communion',
      body: 'Communion is the state of being one with the community one is leading. The distinction between leader and led dissolves. Decisions emerge from the field rather than being issued. Everyone present is somehow in charge at once.',
    },
  },
  46: {
    number: 46, name: 'The Science of Luck', hexagram: 'Pushing Upward',
    shadow: {
      name: 'Seriousness',
      body: 'Seriousness is the grim conviction that life rewards grinding. The native overwork, under-enjoys, and treats fun as suspicious. The body registers the refusal and responds by withholding the very luck that lightness attracts. The shadow mistakes heaviness for depth.',
    },
    gift: {
      name: 'Delight',
      body: 'Delight is the return of pleasure to the operating system. The native begins to notice what is actually enjoyable and arrange the day toward it. Opportunities multiply because the native is now visible — the sombre version was invisible in plain sight. Luck looks like consequence.',
    },
    siddhi: {
      name: 'Ecstasy',
      body: 'Ecstasy is delight without ceiling. The native inhabits a body fully welcoming to being alive, and events rearrange to match. Good fortune is no longer a topic; it is the weather.',
    },
  },
  47: {
    number: 47, name: 'Transmutation', hexagram: 'Oppression',
    shadow: {
      name: 'Oppression',
      body: 'Oppression is the internal weight that seems to come from outside — the boss, the parents, the economy, the culture — but is actually the native\'s own absorbed verdict about themselves. The shadow externalises every limit and then wonders why freedom feels so far away.',
    },
    gift: {
      name: 'Transmutation',
      body: 'Transmutation is the alchemical work of metabolising the old verdict into new material. The native stops blaming the sources of the weight and starts converting it into voice, art, argument, structure. What was oppressive becomes generative. The prison rebuilds itself as a workshop.',
    },
    siddhi: {
      name: 'Transfiguration',
      body: 'Transfiguration is transmutation taken to completion. The native is no longer processing difficulty; difficulty now arrives already transformed. The life radiates a quality the culture did not put in it.',
    },
  },
  48: {
    number: 48, name: 'The Wondrous Well', hexagram: 'The Well',
    shadow: {
      name: 'Inadequacy',
      body: 'Inadequacy is the chronic low hum of not being ready, not being enough, not having studied quite enough yet. The native collects more training, more credentials, more evidence — and the hum continues because the problem was never evidence. The shadow will never find the certificate that quiets it.',
    },
    gift: {
      name: 'Resourcefulness',
      body: 'Resourcefulness is the discovery that one already has what the moment requires. The native stops preparing and starts acting with the current toolkit. Skill grows in public, through use, rather than in private, through study. The hum quiets because action is finally being taken.',
    },
    siddhi: {
      name: 'Wisdom',
      body: 'Wisdom is resourcefulness deepened into knowing what not to do as clearly as what to do. The native has become a well the culture draws from. Answers come out whole. Nothing is rehearsed; everything is available.',
    },
  },
  49: {
    number: 49, name: 'The Palace of Rebirth', hexagram: 'Revolution',
    shadow: {
      name: 'Reaction',
      body: 'Reaction is relationship lived at the speed of reflex. The native interprets every tone shift as a threat and responds before understanding. Partnerships accumulate small injuries that never heal because nothing is ever quite said. The shadow stays safe by staying fast.',
    },
    gift: {
      name: 'Revolution',
      body: 'Revolution is the decision to change the inherited patterns rather than repeat them. The native slows down long enough to see the reflex before acting on it. Relationships begin to feel new because the same moment is no longer being replayed. Generations of pattern break here.',
    },
    siddhi: {
      name: 'Rebirth',
      body: 'Rebirth is the life completely released from inherited pattern. The native loves without the old choreography. Every encounter is the first encounter. The past has lost its claim.',
    },
  },
  50: {
    number: 50, name: 'Cosmic Harmony', hexagram: 'The Cauldron',
    shadow: {
      name: 'Corruption',
      body: 'Corruption is the slow drift of responsibility from care to self-protection. The native takes on the role — manager, parent, custodian — and gradually begins using it to secure personal comfort rather than to serve. The shadow is invisible to its host; it always looks like competence.',
    },
    gift: {
      name: 'Equilibrium',
      body: 'Equilibrium is responsibility restored to its purpose. The native checks in with themselves about whether the role is still in service of the people or of the self, and recalibrates when the answer has drifted. The institution they steward returns to health.',
    },
    siddhi: {
      name: 'Harmony',
      body: 'Harmony is the condition of a being whose presence automatically balances the systems around them. The native becomes a stabilising force — in families, in companies, in rooms — without effort or announcement.',
    },
  },
  51: {
    number: 51, name: 'Initiative', hexagram: 'The Arousing',
    shadow: {
      name: 'Agitation',
      body: 'Agitation is the wired energy that cannot find its outlet. The native paces, interrupts, switches tasks, and snaps at nothing. The shadow mistakes tension for drive and runs the engine red waiting for a green light that never turns on.',
    },
    gift: {
      name: 'Initiative',
      body: 'Initiative is agitation channelled into clean first action. The native stops waiting for the perfect moment and starts the thing at 9am on Tuesday. Tension becomes fuel rather than noise. Other people, watching, discover their own starting points.',
    },
    siddhi: {
      name: 'Awakening',
      body: 'Awakening is initiative at the existential scale. The native has started so many real things that their whole life is moving. They become contagious at first contact — a meeting with them is often reported later as the moment something turned.',
    },
  },
  52: {
    number: 52, name: 'The Stillpoint', hexagram: 'Keeping Still, Mountain',
    shadow: {
      name: 'Stress',
      body: 'Stress is restlessness with deadlines. The native treats every task as urgent and every urgency as equal, and the nervous system runs a permanent amber alert. Rest feels wrong. Even sleep is vigilant. The shadow confuses constant motion with productivity and burns its host slowly.',
    },
    gift: {
      name: 'Restraint',
      body: 'Restraint is the discipline of stillness in a life built for motion. The native learns to pause before responding, to leave time between meetings, to stop decorating every silence with activity. Output quality rises because the nervous system is finally regulating itself. Less is genuinely more.',
    },
    siddhi: {
      name: 'Stillness',
      body: 'Stillness is the base frequency of a being who has stopped needing to prove anything through motion. Presence fills the room without announcement. Those nearby become quieter without being asked.',
    },
  },
  53: {
    number: 53, name: 'Evolving Through Time', hexagram: 'Development',
    shadow: {
      name: 'Immaturity',
      body: 'Immaturity is the avoidance of the next developmental threshold by staying busy at the current one. The native keeps starting — courses, businesses, rooms — and never finishes the initiation that would turn beginner into practitioner. The shadow keeps its host permanently promising.',
    },
    gift: {
      name: 'Expansion',
      body: 'Expansion is the willingness to cross the threshold the starting stage was keeping one from. The native completes an initiation, accepts the new identity, and begins from the new level. Growth stops feeling like novelty and starts feeling like depth.',
    },
    siddhi: {
      name: 'Superabundance',
      body: 'Superabundance is the state of a being for whom every threshold has been crossed. There is no next stage to avoid. Life arrives already fully sized. The native lives in present capacity, which is overflowing.',
    },
  },
  54: {
    number: 54, name: 'The Serpent Path', hexagram: 'The Marrying Maiden',
    shadow: {
      name: 'Greed',
      body: 'Greed is the chronic grasping after the next rung — more money, more status, more proximity to power — executed with such skill the native does not quite notice what it costs. Relationships become ladders. The shadow climbs efficiently and arrives at a summit that was never the actual mountain.',
    },
    gift: {
      name: 'Aspiration',
      body: 'Aspiration is greed purified into ambition that serves something larger than itself. The native still wants to rise and now knows what the rising is for. Rungs get earned rather than negotiated. Ascent becomes visible, legitimate, and admirable rather than efficient and hollow.',
    },
    siddhi: {
      name: 'Ascension',
      body: 'Ascension is movement upward that no longer feels like climbing. The native is simply moving to the altitude that matches their inner atmosphere. Everything arrives in its right order and without clawing.',
    },
  },
  55: {
    number: 55, name: 'The Dragonfly\'s Dream', hexagram: 'Abundance',
    shadow: {
      name: 'Victimisation',
      body: 'Victimisation is the emotional furniture of a life rearranged around blame. The native tells the same story many times, with minor casting changes, and waits for the world to change before they do. The shadow keeps itself warm on the injustice it curates.',
    },
    gift: {
      name: 'Freedom',
      body: 'Freedom is the decision to stop curating the grievance and start arranging the life around what is actually wanted. The native updates the story from the inside. The old characters may stay or go; the plot is now theirs. Energy returns to the present because it is no longer held in the past.',
    },
    siddhi: {
      name: 'Freedom',
      body: 'Freedom at this frequency is indistinguishable from presence. The native lives in real time without narrative overhead. Every moment is unburdened. The self is finally as light as it was always meant to be.',
    },
  },
  56: {
    number: 56, name: 'The Lightning Rod', hexagram: 'The Wanderer',
    shadow: {
      name: 'Distraction',
      body: 'Distraction is the intellect\'s refusal to finish what it started thinking. The native collects insights, half-reads the article, opens the tab, switches context, and ends the week impressively busy and privately hollow. The shadow feeds on novelty and starves on depth. Conversation shortens into aphorism; nothing completes.',
    },
    gift: {
      name: 'Enrichment',
      body: 'Enrichment is the discipline of staying with the idea long enough for it to become useful. The native learns to hold a thought through its middle — the un-shiny part — until it reaches the other shore. Ideas acquire weight. Stories develop. The talker becomes someone worth listening to over time, not only at moments.',
    },
    siddhi: {
      name: 'Intoxication',
      body: 'Intoxication is the state of a being whose attention has become its own reward. The ordinary is vivid. Words arrive charged. The native transmits aliveness through speech, and listeners walk away lit up without knowing why.',
    },
  },
  57: {
    number: 57, name: 'Gentle Wind', hexagram: 'The Gentle',
    shadow: {
      name: 'Unease',
      body: 'Unease is the chronic low-level anxiety of a nervous system picking up signals nobody else notices. The native overinterprets, misattributes, and lives in a weather of vague dread. The shadow treats every stray sensation as warning and exhausts its host on false alarms.',
    },
    gift: {
      name: 'Intuition',
      body: 'Intuition is the signal decoded. The native learns which of the nervous system\'s flags are real and acts on them without over-explaining. Decisions get faster and more accurate. The dread converts into guidance. The body becomes an instrument rather than an enemy.',
    },
    siddhi: {
      name: 'Clarity',
      body: 'Clarity is intuition that no longer requires interpretation. The native simply knows. There is no separation between sensing and understanding. Action follows perception in one motion.',
    },
  },
  58: {
    number: 58, name: 'The Bliss of Aliveness', hexagram: 'The Joyous',
    shadow: {
      name: 'Dissatisfaction',
      body: 'Dissatisfaction is the reflex that finds the problem in every room. The native walks into a perfect evening and names the one thing missing. The shadow mistakes criticism for standards and slowly trains the people around it to offer less, knowing the offering will be audited.',
    },
    gift: {
      name: 'Vitality',
      body: 'Vitality is satisfaction that no longer waits for conditions. The native learns to meet what is here as if it were chosen. The body\'s idle rate rises. Energy becomes abundant because it is no longer being leaked into appraisal. Enjoyment becomes a skill rather than a mood.',
    },
    siddhi: {
      name: 'Bliss',
      body: 'Bliss is vitality that has forgotten its own requirements. The native is simply lit. Joy is not a state; it is the texture of the moment. Others near them remember what aliveness feels like without being told.',
    },
  },
  59: {
    number: 59, name: 'Dragons in Paradise', hexagram: 'Dispersion',
    shadow: {
      name: 'Dishonesty',
      body: 'Dishonesty is the quiet slippage in intimacy — the half-truth in the confession, the omitted fact, the slightly flattering angle. The native preserves the relationship at the cost of its depth. The shadow mistakes diplomacy for love and leaves both parties a little lonelier each year.',
    },
    gift: {
      name: 'Intimacy',
      body: 'Intimacy is the restoration of full disclosure inside the relationships that can carry it. The native risks saying the awkward thing and watches the room deepen rather than collapse. Partnerships acquire a different weather — harder in the mornings, lighter at night. The loneliness dissolves.',
    },
    siddhi: {
      name: 'Transparency',
      body: 'Transparency is intimacy without cost. The native has nothing to hide not because they\'ve confessed everything but because nothing is being curated. Presence is the entire communication. Others feel met even when no words pass.',
    },
  },
  60: {
    number: 60, name: 'Legalism into Realism', hexagram: 'Limitation',
    shadow: {
      name: 'Limitation',
      body: 'Limitation is the acceptance of a smaller life as proof of being responsible. The native repeats the old rules of the household — money is hard, dreams are dangerous, rest must be earned — and calls the smallness realism. The shadow mistakes repetition for wisdom and inherits a ceiling by default.',
    },
    gift: {
      name: 'Realism',
      body: 'Realism is accurate seeing. The native examines the inherited rules and separates the ones that still serve from the ones that were only ever somebody else\'s fear. The real constraints become tools. The false ones evaporate. The life finally has the shape of the native rather than the ancestor.',
    },
    siddhi: {
      name: 'Justice',
      body: 'Justice is the condition of a life in correct proportion. The native takes what is theirs and declines what is not, at the scale the truth requires. There is no grievance because there is no theft in any direction.',
    },
  },
  61: {
    number: 61, name: 'The Holy Truth', hexagram: 'Inner Truth',
    shadow: {
      name: 'Psychosis',
      body: 'Psychosis here is not clinical — it is the quiet loss of contact with reality through an obsession with inner explanations nobody else can verify. The native builds a cosmology from private data and mistakes its elegance for evidence. The shadow trades the world for the model.',
    },
    gift: {
      name: 'Inspiration',
      body: 'Inspiration is the transmission of inner truth back into checkable form — writing, making, building, teaching. The native returns from the inner weather with something a reader or user can test. The private cosmology becomes a public contribution. The model gets its evidence.',
    },
    siddhi: {
      name: 'Sanctity',
      body: 'Sanctity is the condition of a being who has become a conduit for truth. The native speaks and reality agrees. Presence carries a charge that the ordinary word alone cannot explain. The listener simply knows.',
    },
  },
  62: {
    number: 62, name: 'Language of Light', hexagram: 'Preponderance of the Small',
    shadow: {
      name: 'Intellect',
      body: 'Intellect as shadow is the mind that prefers to classify the thing rather than encounter it. The native knows the term for every feeling and has therefore felt none of them fully. The shadow mistakes vocabulary for understanding and catalogues a life it has not actually lived.',
    },
    gift: {
      name: 'Precision',
      body: 'Precision is intellect put into service of reality. The native uses language to meet experience rather than to escape it. The right word arrives at the right moment and the conversation lands. The vocabulary becomes a scalpel rather than a cage. Meaning transmits.',
    },
    siddhi: {
      name: 'Impeccability',
      body: 'Impeccability is language without slippage. Every word the native uses means exactly what it says. Nothing leaks. Communication becomes a form of grace — one sentence, one listener, one transmission, complete.',
    },
  },
  63: {
    number: 63, name: 'Truth Through Questioning', hexagram: 'After Completion',
    shadow: {
      name: 'Doubt',
      body: 'Doubt is the intellect turned against its own findings. The native arrives at an answer, questions it into dust, returns to the beginning, and begins the same audit. The shadow calls this rigour. It is not. It is the inability to commit to any conclusion long enough to use it.',
    },
    gift: {
      name: 'Inquiry',
      body: 'Inquiry is doubt in the right direction — questioning the world rather than one\'s own answers. The native gets better at asking and better at trusting the result. Research acquires momentum. Decisions arrive. The mind stops eating itself.',
    },
    siddhi: {
      name: 'Truth',
      body: 'Truth is inquiry completed. The native no longer needs to ask the question because the answer lives in them as structure. They become trustworthy at first contact. Others, sensing it, stop doubting themselves too.',
    },
  },
  64: {
    number: 64, name: 'Illumination', hexagram: 'Before Completion',
    shadow: {
      name: 'Confusion',
      body: 'Confusion is the shadow of a mind holding too many fragments and refusing to choose one. The native keeps every option alive, reviews every angle, and ends the year no closer to anything. The shadow mistakes indecision for open-mindedness and calls paralysis prudence.',
    },
    gift: {
      name: 'Imagination',
      body: 'Imagination is the willingness to let the fragments re-form into a single, surprising shape. The native stops trying to finish the puzzle with the current pieces and lets the pattern re-propose itself. Clarity arrives from above rather than through effort. Decisions finally have a spine.',
    },
    siddhi: {
      name: 'Illumination',
      body: 'Illumination is imagination perfected. The whole pattern of the native\'s life is legible to them in every moment. There is nothing left to solve. Every detail is part of a picture already complete. Light, from the inside, spills outward.',
    },
  },
};
