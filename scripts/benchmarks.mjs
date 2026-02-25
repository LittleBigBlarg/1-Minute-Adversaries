// Benchmark data from RightKnighttoFight's Guide to Making Custom Adversaries v1.6
export const BENCHMARKS = {
  bruiser: {
    1: { difficulty: [12, 14], major: [7, 9], severe: [13, 15], hp: [5, 7], stress: [3, 4], atk: [0, 2], dice: ["1d12+2", "1d10+4", "1d8+6"] },
    2: { difficulty: [14, 16], major: [12, 14], severe: [23, 26], hp: [5, 7], stress: [4, 6], atk: [2, 4], dice: ["2d12+3", "2d10+2", "2d8+6"] },
    3: { difficulty: [16, 18], major: [19, 22], severe: [35, 40], hp: [6, 8], stress: [4, 6], atk: [3, 5], dice: ["3d12+1", "3d10+4", "3d8+8"] },
    4: { difficulty: [18, 20], major: [30, 37], severe: [63, 70], hp: [7, 9], stress: [4, 6], atk: [5, 8], dice: ["4d12+15", "4d10+10", "4d8+12"] },
  },
  horde: {
    1: { difficulty: [10, 12], major: [5, 10], severe: [8, 12], hp: [4, 6], stress: [2, 3], atk: [-2, 0], dice: ["1d10+2", "1d8+3", "1d6+4"] },
    2: { difficulty: [12, 14], major: [10, 15], severe: [16, 20], hp: [5, 6], stress: [2, 3], atk: [-1, 1], dice: ["2d10+2", "2d8+6", "2d6+3"] },
    3: { difficulty: [14, 16], major: [15, 25], severe: [26, 32], hp: [6, 7], stress: [3, 4], atk: [0, 2], dice: ["3d10+2", "3d8+4", "3d6+6"] },
    4: { difficulty: [16, 18], major: [20, 30], severe: [35, 45], hp: [7, 8], stress: [4, 5], atk: [1, 3], dice: ["4d10+4", "4d8+8", "4d6+10"] },
  },
  leader: {
    1: { difficulty: [12, 14], major: [7, 9], severe: [13, 15], hp: [5, 7], stress: [3, 4], atk: [2, 4], dice: ["1d12+1", "1d10+3", "1d8+5"] },
    2: { difficulty: [14, 16], major: [12, 14], severe: [23, 26], hp: [5, 7], stress: [4, 5], atk: [3, 5], dice: ["2d12+1", "2d10+3", "2d8+6"] },
    3: { difficulty: [17, 19], major: [19, 22], severe: [35, 40], hp: [6, 8], stress: [5, 6], atk: [5, 7], dice: ["3d10+1", "3d8+8"] },
    4: { difficulty: [19, 21], major: [30, 37], severe: [63, 70], hp: [7, 9], stress: [6, 8], atk: [8, 10], dice: ["4d12+6", "4d10+8", "4d8+10"] },
  },
  minion: {
    1: { difficulty: [10, 12], major: null, severe: null, hp: [1, 1], stress: [1, 1], atk: [-2, 0], dice: ["3–5 phy"] },
    2: { difficulty: [12, 14], major: null, severe: null, hp: [1, 1], stress: [1, 1], atk: [-1, 1], dice: ["5–7 phy"] },
    3: { difficulty: [14, 16], major: null, severe: null, hp: [1, 1], stress: [1, 2], atk: [0, 2], dice: ["7–9 phy"] },
    4: { difficulty: [16, 18], major: null, severe: null, hp: [1, 1], stress: [1, 2], atk: [1, 3], dice: ["9–12 phy"] },
  },
  ranged: {
    1: { difficulty: [10, 12], major: [3, 5], severe: [6, 9], hp: [3, 4], stress: [2, 3], atk: [1, 2], dice: ["1d12+1", "1d10+3", "1d8+5"] },
    2: { difficulty: [13, 15], major: [5, 8], severe: [13, 18], hp: [3, 5], stress: [2, 3], atk: [2, 5], dice: ["2d12+1", "2d10+3", "2d8+6"] },
    3: { difficulty: [15, 17], major: [12, 15], severe: [25, 30], hp: [4, 6], stress: [3, 4], atk: [3, 4], dice: ["3d10+1", "3d8+8"] },
    4: { difficulty: [17, 19], major: [18, 25], severe: [30, 40], hp: [4, 6], stress: [4, 5], atk: [4, 6], dice: ["4d12+6", "4d10+8", "4d8+10"] },
  },
  skulk: {
    1: { difficulty: [10, 12], major: [5, 7], severe: [8, 12], hp: [3, 4], stress: [2, 3], atk: [1, 2], dice: ["1d8+3", "1d6+2", "1d4+4"] },
    2: { difficulty: [12, 14], major: [7, 9], severe: [16, 20], hp: [3, 5], stress: [3, 4], atk: [2, 5], dice: ["2d8+3", "2d6+3", "2d4+6"] },
    3: { difficulty: [14, 16], major: [15, 20], severe: [27, 32], hp: [4, 6], stress: [4, 5], atk: [3, 7], dice: ["3d8+4", "3d6+5", "3d4+10"] },
    4: { difficulty: [16, 18], major: [20, 30], severe: [35, 45], hp: [4, 6], stress: [4, 6], atk: [4, 8], dice: ["4d12+10", "4d10+4", "4d6+10"] },
  },
  solo: {
    1: { difficulty: [12, 14], major: [7, 9], severe: [13, 15], hp: [8, 10], stress: [3, 4], atk: [3, 3], dice: ["1d20", "1d12+2", "1d10+4"] },
    2: { difficulty: [14, 16], major: [12, 14], severe: [23, 26], hp: [8, 10], stress: [4, 5], atk: [3, 4], dice: ["2d20+3", "2d10+2", "2d8+6"] },
    3: { difficulty: [17, 19], major: [19, 22], severe: [35, 40], hp: [10, 12], stress: [5, 6], atk: [4, 7], dice: ["3d20", "3d12+6", "3d10+8"] },
    4: { difficulty: [19, 21], major: [30, 37], severe: [63, 70], hp: [10, 12], stress: [6, 8], atk: [7, 10], dice: ["4d12+15", "4d10+10", "4d8+12"] },
  },
  standard: {
    1: { difficulty: [11, 13], major: [5, 8], severe: [8, 12], hp: [4, 5], stress: [3, 4], atk: [0, 2], dice: ["1d8+1", "1d6+2", "1d4+4"] },
    2: { difficulty: [13, 15], major: [8, 12], severe: [16, 20], hp: [5, 6], stress: [3, 4], atk: [1, 3], dice: ["2d8+2", "2d6+3", "2d4+4"] },
    3: { difficulty: [15, 17], major: [15, 20], severe: [27, 32], hp: [5, 6], stress: [4, 5], atk: [2, 4], dice: ["3d8+2", "3d6+3", "2d12+2"] },
    4: { difficulty: [17, 19], major: [25, 35], severe: [35, 55], hp: [5, 6], stress: [4, 5], atk: [3, 5], dice: ["4d10+2", "4d8+4", "4d6+10"] },
  },
  social: {
    1: { difficulty: [10, 12], major: [3, 5], severe: [6, 9], hp: [3, 3], stress: [2, 3], atk: [-4, -1], dice: ["1d6+1", "1d4+1"] },
    2: { difficulty: [13, 15], major: [5, 8], severe: [13, 18], hp: [3, 3], stress: [2, 3], atk: [-3, 0], dice: ["2d6+2", "1d4+3"] },
    3: { difficulty: [15, 17], major: [15, 20], severe: [27, 32], hp: [4, 4], stress: [2, 3], atk: [-2, 2], dice: ["3d6+3", "3d4+6"] },
    4: { difficulty: [17, 19], major: [25, 35], severe: [35, 50], hp: [4, 4], stress: [2, 3], atk: [2, 6], dice: ["4d8+5", "4d6+4", "4d4+8"] },
  },
  support: {
    1: { difficulty: [12, 14], major: [5, 8], severe: [9, 12], hp: [3, 4], stress: [4, 5], atk: [0, 2], dice: ["1d8", "1d6+2", "1d4+4"] },
    2: { difficulty: [13, 15], major: [8, 12], severe: [16, 20], hp: [3, 5], stress: [4, 6], atk: [1, 3], dice: ["2d8+1", "2d6+2", "2d4+3"] },
    3: { difficulty: [15, 17], major: [15, 20], severe: [28, 35], hp: [4, 6], stress: [5, 6], atk: [2, 4], dice: ["3d8", "3d6+3", "2d12+1"] },
    4: { difficulty: [17, 19], major: [20, 30], severe: [35, 45], hp: [4, 6], stress: [5, 6], atk: [3, 5], dice: ["3d10+3", "4d8+4", "4d6+8"] },
  },
};

export const ROLES = ["bruiser", "horde", "leader", "minion", "ranged", "skulk", "solo", "standard", "social", "support"];
export const RANGES = { melee: "Melee", veryClose: "Very Close", close: "Close", far: "Far", veryFar: "Very Far" };
export const EXPERIENCE_BY_TIER = { 1: 2, 2: 3, 3: 3, 4: 4 };

export function mid(range) {
  if (!range) return 0;
  return Math.round((range[0] + range[1]) / 2);
}
export function rangeStr(range) {
  if (!range) return "None";
  return `${range[0]}–${range[1]}`;
}

/**
 * Role design tips from RightKnighttoFight's Guide to Making Custom Adversaries v1.6
 * Each entry: { summary, damage, features, common, experiences }
 */
export const ROLE_TIPS = {
  bruiser: {
    summary: "Throw people around and make big hits.",
    damage: "Attacks can hit Major usually and Severe when rolling well. Tend to use d10–d12 damage dice.",
    features: "Features include attacks that hit multiple enemies and move PCs around the battlefield.",
    common: "Ramp Up, Momentum",
    experiences: "Crusher, Charger, Intimidation, Throw",
    tip: "Use d8 (more consistent) with higher modifiers or d12 (heavier hits) with lower modifiers.",
  },
  horde: {
    summary: "A large group that fights as one, weakening as they take damage.",
    damage: "Attacks can hit Major and Severe when rolling well vs non-guardians until half HP. Use d6–d10.",
    features: "When splitting damage (Horde passive), aim for a dice pool that halves the average. (Ex. 2d10+2 → 1d10+1)",
    common: "Horde (X)",
    experiences: "Pack Tactics, Swarm, Overwhelm",
  },
  leader: {
    summary: "Command others to attack the PCs.",
    damage: "Attacks do slightly lower damage than a Bruiser, using d8–d10.",
    features: "Fear abilities that spotlight 1d4 allies at half damage are common.",
    common: "Momentum, Activate Allies, Relentless, Tactician",
    experiences: "Commander, Leadership, Backstabber, For the Realm!",
  },
  minion: {
    summary: "Individually weak creatures defeated in one hit.",
    damage: "Attacks increase by tier. No thresholds.",
    features: "Minion(X) passive determines how many are defeated per X damage. Group Attack spends Fear.",
    common: "Minion (X), Group Attack",
    experiences: "Most minions have simple or no experiences.",
  },
  ranged: {
    summary: "Attack from far away and keep pressure on the party.",
    damage: "Slightly lower average damage than a Bruiser, using d8–d10.",
    features: "Spend Fear to attack multiple targets. Mark Stress to increase damage of attacks.",
    common: "Opportunity Shot, Opportunist, Hit Multiple Targets",
    experiences: "Hunter, Survival, Tracker, Trapper",
  },
  skulk: {
    summary: "Harry the party as a skirmisher in close quarters.",
    damage: "Minor to Major damage on standard attacks, but features will usually do more. Use d6–d8.",
    features: "Features to disorient PCs (ambush features) or impart status effects are common.",
    common: "Ambush, Cloaked",
    experiences: "Camouflage, Stealth, Rabblerouser, Intrusion",
  },
  solo: {
    summary: "Present a formidable challenge to a whole party, with or without support.",
    damage: "Extremely high damage capacity using d10–d12, or even d20.",
    features: "Reactions and Countdowns are key. Solos using phases should have lower HP and thresholds.",
    common: "Relentless, Momentum, Countdowns",
    experiences: "Never Enough!, I See You, Vengeful",
    tip: "Solo is a deceptive name — they usually still need allies. See OneBoxyLlama's Single Adversary Encounter advice.",
  },
  standard: {
    summary: "Simple abilities; they make up the core of your forces.",
    damage: "Can usually hit Major thresholds on spellcasters. Use d6–d8 damage dice.",
    features: "Most features include a way to harry or distract a PC or augment ATK or Damage.",
    common: "Too Many to Handle, Pack Tactics",
    experiences: "Many standards don't have experiences, or share them with other forces.",
  },
  social: {
    summary: "Bespoke features — deviation from stat norms is expected.",
    damage: "Low combat damage. Numbers should represent the social role.",
    features: "Imagine their role in the fiction and what pressure they can put on a character. Consider a social phase and combat phase with a phase change.",
    common: "Mockery, Scapegoat, Bend Ears",
    experiences: "Socialite, Negotiator, Aristocrat, Administration",
    tip: "You do NOT need to be on-tier for social adversaries. Their tier should be tied to their place in the fiction.",
  },
  support: {
    summary: "Cause debuffs and aid allies. Essentially a weaker Leader.",
    damage: "Minor to Major damage, but features can do more. Stress is usually higher.",
    features: "Features to cause PCs to mark Stress or lose Hope are common, as well as features that change the environment or help other units.",
    common: "AOE Condition, Curse, Buff Allies",
    experiences: "Magical Knowledge, Lore",
  },
};


/**
 * Common features per role from the Feature Library in Making Custom Adversaries v1.6.
 * @Lookup[@name] will be replaced with @Lookup[@name] at creation time.
 */
export const ROLE_FEATURES = {
  bruiser: [
    { name: "Momentum", formType: "reaction", description: "When the @Lookup[@name] makes a successful attack against a PC, you gain a Fear." },
    { name: "Ramp Up", formType: "passive", description: "You must spend a Fear to spotlight the @Lookup[@name]. While spotlighted, they can make their standard attack against all targets within range." },
    { name: "Slow", formType: "passive", description: "When you spotlight the @Lookup[@name] and they don't have a token on their stat block, they can't act yet. Place a token on their stat block and describe what they're preparing to do. When you spotlight the @Lookup[@name] and they have a token on their stat block, clear the token and they can act." },
    { name: "Terrifying", formType: "passive", description: "When the @Lookup[@name] makes a successful attack, all PCs within Far range lose a Hope and you gain a Fear." },
  ],
  horde: [
    { name: "Horde (<damage>)", formType: "passive", description: "When the @Lookup[@name] has marked half or more of their HP, their standard attack deals <damage> physical damage instead." },
  ],
  leader: [
    { name: "Terrifying", formType: "passive", description: "When the @Lookup[@name] makes a successful attack, all PCs within Far range lose a Hope and you gain a Fear." },
    { name: "Relentless (X)", formType: "passive", description: "The @Lookup[@name] can be spotlighted up to X times per GM turn. Spend Fear as usual to spotlight them." },
    { name: "Activate Allies", formType: "action", description: "Spend X Fear to spotlight 1d4 allies. Attacks they make while spotlighted in this way deal half damage." },
    { name: "Call Reinforcements", formType: "action", description: "Once per scene, mark a Stress to summon a <A different adversary>, which appears at <Range> range." },
    { name: "Tactician", formType: "action", description: "When you spotlight the @Lookup[@name], mark a Stress to also spotlight two allies within Close range." },
    { name: "Momentum", formType: "reaction", description: "When the @Lookup[@name] makes a successful attack against a PC, you gain a Fear." },
  ],
  minion: [
    { name: "Minion (X)", formType: "passive", description: "The @Lookup[@name] is defeated when they take any damage. For every X damage a PC deals to the @Lookup[@name], defeat an additional Minion within range the attack would succeed against." },
    { name: "Group Attack", formType: "action", description: "Spend a Fear to choose a target and spotlight all @Lookup[@name] within Close range of them. Those Minions move into Melee range of the target and make one shared attack roll. On a success, they deal <standard damage> physical damage each. Combine this damage." },
  ],
  ranged: [
    { name: "Opportunity Shot", formType: "reaction", description: "When another adversary deals damage to a target within Far range of the @Lookup[@name], you can mark a Stress to add the <extra damage> to the damage roll." },
    { name: "Opportunist", formType: "passive", description: "When two or more adversaries are within Very Close range of a creature, all damage the @Lookup[@name] deals to that creature is doubled." },
    { name: "Hit Multiple Targets", formType: "reaction", description: "Spend a Fear to make an attack against # targets within Far range. Targets the @Lookup[@name] succeeds against take <reduced damage>." },
  ],
  skulk: [
    { name: "Ambush", formType: "action", description: "While Hidden, make an attack against a target within <Range> range. On a success, deal <increased damage> physical damage." },
    { name: "Cloaked", formType: "action", description: "Become Hidden until after the @Lookup[@name]'s next attack. Attacks made while Hidden from this feature have advantage." },
  ],
  solo: [
    { name: "Relentless (X)", formType: "passive", description: "The @Lookup[@name] can be spotlighted up to X times per GM turn. Spend Fear as usual to spotlight them." },
    { name: "Countdown to Something Bad", formType: "reaction", description: "Countdown (Loop 1d6). When the <countdown activation condition>, activate the countdown. When it triggers, the @Lookup[@name] <does something powerful (make an attack, force a Reaction Roll)>. All targets that <it succeeds against/fail> have a negative outcome." },
    { name: "Momentum", formType: "reaction", description: "When the @Lookup[@name] makes a successful attack against a PC, you gain a Fear." },
  ],
  standard: [
    { name: "Too Many to Handle", formType: "passive", description: "When the @Lookup[@name] is within Melee range of a creature and at least one other @Lookup[@name] is within Close range, all attacks against that creature have advantage." },
    { name: "Pack Tactics", formType: "passive", description: "If the @Lookup[@name] makes a successful standard attack and another @Lookup[@name] is within Melee range of the target, deal <extra damage> physical damage instead of their standard damage and you gain a Fear." },
  ],
  social: [
    { name: "Mockery", formType: "action", description: "Mark a Stress to say something mocking and force a target within Close range to make a Presence Reaction Roll. On a failure, the target must mark 2 Stress and is Vulnerable until the scene ends." },
    { name: "Scapegoat", formType: "action", description: "Spend a Fear and target a PC. The @Lookup[@name] convinces a crowd or prominent individual that the target is the cause of their current conflict or misfortune." },
  ],
  support: [
    { name: "AOE Condition", formType: "action", description: "Spend a Fear to make an attack against all targets within Very Close range. Targets the @Lookup[@name] succeeds against become Restrained and Vulnerable. A target can break free, ending both conditions, with a successful Trait Roll." },
  ],
};

