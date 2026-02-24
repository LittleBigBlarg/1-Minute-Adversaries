import { BENCHMARKS, ROLES, RANGES, EXPERIENCE_BY_TIER, mid, rangeStr } from "./benchmarks.mjs";

const MODULE_ID = "dh-adversary-creator";
const DEFAULT_FEATURE_ICON = "icons/magic/symbols/star-solid-gold.webp";
const DEFAULT_ACTOR_ICON = "icons/svg/skull.svg";
const EXPERIENCE_RANGE_LABEL_BY_TIER = {
  1: "+2",
  2: "+2-3",
  3: "+3-4",
  4: "+4",
};
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class AdversaryCreatorApp extends HandlebarsApplicationMixin(ApplicationV2) {
  _editingActorId = null;

  _state = {
    img: DEFAULT_ACTOR_ICON,
    rightTab: "features",
    name: "", tier: 1, role: "standard",
    description: "", motives: "",
    difficulty: 12, majorThreshold: 6, severeThreshold: 10,
    hp: 4, stress: 3, atk: 1,
    weaponName: "", weaponRange: "melee",
    weaponDamageDice: "d8", weaponDamageCount: 1, weaponDamageBonus: 3,
    weaponDamageType: "physical",
    effects: {
      physicalSeverityReductionEnabled: false,
      magicSeverityReductionEnabled: false,
      physicalSeverityReduction: 1,
      magicSeverityReduction: 1,
      physicalResistance: false,
      magicResistance: false,
      physicalImmunity: false,
      magicImmunity: false,
    },
    experiences: [AdversaryCreatorApp._newExperience()],
    features: [AdversaryCreatorApp._newFeature()],
  };

  static _newExperience() {
    return { id: foundry.utils.randomID(), name: "", bonus: 2 };
  }

  static _newFeature() {
    return {
      id: foundry.utils.randomID(), name: "", formType: "passive", description: "",
      img: DEFAULT_FEATURE_ICON,
      // Action toggles: null = not detected, false = detected but off (red), true = detected and on (green)
      toggles: {
        attackRoll: null,
        spendFear: null,
        spendStress: null,
      },
      // Auto-detected from description
      damageRolls: [],    // [{ formula: "2d8+4", type: "phy", enabled: true }]
      reactionRolls: [],  // [{ trait: "instinct", enabled: true }]
    };
  }

  static DEFAULT_OPTIONS = {
    id: "dh-adversary-creator",
    tag: "form",
    window: { title: "Quick Adversary Creator", icon: "fas fa-skull-crossbones", resizable: true },
    position: { width: 740, height: 660 },
    actions: {
      autofill: AdversaryCreatorApp._onAutofill,
      addFeature: AdversaryCreatorApp._onAddFeature,
      removeFeature: AdversaryCreatorApp._onRemoveFeature,
      addExperience: AdversaryCreatorApp._onAddExperience,
      removeExperience: AdversaryCreatorApp._onRemoveExperience,
      pickActorImage: AdversaryCreatorApp._onPickActorImage,
      resetActorImage: AdversaryCreatorApp._onResetActorImage,
      pickFeatureImage: AdversaryCreatorApp._onPickFeatureImage,
      resetFeatureImage: AdversaryCreatorApp._onResetFeatureImage,
      switchRightTab: AdversaryCreatorApp._onSwitchRightTab,
      toggleEffectFlag: AdversaryCreatorApp._onToggleEffectFlag,
      createAdversary: AdversaryCreatorApp._onCreateAdversary,
      resetForm: AdversaryCreatorApp._onResetForm,
      toggleAction: AdversaryCreatorApp._onToggleAction,
    },
  };

  static PARTS = {
    form: { template: `modules/${MODULE_ID}/templates/adversary-creator.hbs` },
  };

  static openForActor(actor) {
    const app = new AdversaryCreatorApp();
    app._populateFromActor(actor);
    app.render(true);
    return app;
  }

  async _prepareContext() {
    const s = this._state;
    const benchmark = BENCHMARKS[s.role]?.[s.tier];
    return {
      ...s,
      roles: ROLES,
      ranges: RANGES,
      benchmark,
      expRange: EXPERIENCE_RANGE_LABEL_BY_TIER[s.tier] ?? "+2",
      benchmarkStr: benchmark ? {
        difficulty: rangeStr(benchmark.difficulty),
        major: rangeStr(benchmark.major),
        severe: rangeStr(benchmark.severe),
        hp: rangeStr(benchmark.hp),
        stress: rangeStr(benchmark.stress),
        atk: rangeStr(benchmark.atk),
        dice: benchmark.dice?.join(", ") ?? "",
      } : null,
      isEditMode: Boolean(this._editingActorId),
      submitLabel: this._editingActorId ? "Save Changes" : "Create Adversary",
      isFeaturesTab: s.rightTab !== "effects",
      isEffectsTab: s.rightTab === "effects",
    };
  }

  _onRender(context, options) {
    const html = this.element;
    html.querySelector("[name='tier']")?.addEventListener("change", () => { this._readForm(); this.render(); });
    html.querySelector("[name='role']")?.addEventListener("change", () => { this._readForm(); this.render(); });

    // Render initial toggle pills for all features
    for (let i = 0; i < this._state.features.length; i++) {
      const feature = this._state.features[i];
      if (feature?._mergeAutoDetectOnFirstRender) {
        delete feature._mergeAutoDetectOnFirstRender;
        this._autoDetectTags(i, { mergeWithExisting: true });
      } else {
        this._autoDetectTags(i);
      }
      this._renderFeatureToggles(i);
    }

    // Listen to feature description changes for auto-detection
    html.querySelectorAll("[data-desc-index]").forEach(textarea => {
      textarea.addEventListener("input", (ev) => {
        const idx = Number(ev.target.dataset.descIndex);
        this._state.features[idx].description = ev.target.value;
        this._autoDetectTags(idx);
        this._renderFeatureToggles(idx);
      });
    });
  }

  /**
   * Scan a feature description for natural-language cues and damage tags.
   * `damage:` remains the only inline-description tag syntax.
   */
  _autoDetectTags(featureIndex, { mergeWithExisting = false } = {}) {
    const f = this._state.features[featureIndex];
    if (!f) return;
    const desc = f.description;
    const lowerDesc = desc.toLowerCase();
    const prevDamageRolls = Array.isArray(f.damageRolls) ? [...f.damageRolls] : [];
    const prevReactionRolls = Array.isArray(f.reactionRolls) ? [...f.reactionRolls] : [];
    const prevToggles = foundry.utils.deepClone(f.toggles ?? {});

    // Detect damage:XdY+Z [type] patterns (multiple supported)
    const damageRegex = /damage:(\d+d\d+(?:[+-]\d+)?)(?:\s+(phy|mag|physical|magical))?/gi;
    const newDamageRolls = [];
    let m;
    while ((m = damageRegex.exec(desc)) !== null) {
      const formula = m[1];
      const type = m[2] && m[2].startsWith("mag") ? "mag" : "phy";
      // Preserve enabled state if this exact roll/type already existed
      const existing = f.damageRolls.find(d => d.formula === formula && d.type === type);
      if (!newDamageRolls.some(d => d.formula === formula && d.type === type)) {
        newDamageRolls.push({ formula, type, enabled: existing ? existing.enabled : true });
      }
    }
    if (mergeWithExisting) {
      for (const d of prevDamageRolls) {
        if (!newDamageRolls.some(n => n.formula === d.formula && n.type === d.type)) {
          newDamageRolls.push(d);
        }
      }
    }
    f.damageRolls = newDamageRolls;

    // Detect "<trait> reaction roll" natural language patterns
    const traits = ["strength", "instinct", "knowledge", "finesse", "presence", "agility"];
    const reactionRegex = /\b(strength|instinct|knowledge|finesse|presence|agility)\s+reaction(?:\s+rolls?)?\b/gi;
    const newReactionRolls = [];
    while ((m = reactionRegex.exec(desc)) !== null) {
      const trait = m[1].toLowerCase();
      if (!traits.includes(trait)) continue;
      const existing = f.reactionRolls.find(r => r.trait === trait);
      if (!newReactionRolls.some(r => r.trait === trait)) {
        newReactionRolls.push({ trait, enabled: existing ? existing.enabled : true });
      }
    }
    if (mergeWithExisting) {
      for (const r of prevReactionRolls) {
        if (!newReactionRolls.some(n => n.trait === r.trait)) {
          newReactionRolls.push(r);
        }
      }
    }
    f.reactionRolls = newReactionRolls;

    const setToggleDetected = (key, detected) => {
      const current = f.toggles[key];
      if (!detected) {
        if (mergeWithExisting && prevToggles[key] === true) {
          f.toggles[key] = true;
          return;
        }
        f.toggles[key] = null;
        return;
      }
      if (current === null || current === undefined) f.toggles[key] = true;
    };

    setToggleDetected("attackRoll", /\battack(?:\s+roll)?\b/i.test(desc));
    setToggleDetected("spendFear", /\bspend(?:s|ing)?\s+(?:a\s+)?fear\b/i.test(lowerDesc));
    setToggleDetected("spendStress", /\b(?:mark(?:s|ed|ing)?|spend(?:s|ing)?)\s+(?:a\s+)?stress\b/i.test(lowerDesc));
  }

  /**
   * Re-render just the toggle pills area for a single feature (avoids full re-render)
   */
  _renderFeatureToggles(featureIndex) {
    const container = this.element?.querySelector(`[data-toggles-index="${featureIndex}"]`);
    if (!container) return;
    const f = this._state.features[featureIndex];
    container.innerHTML = this._buildToggleHTML(f, featureIndex);
  }

  _buildToggleHTML(feature, index) {
    const pills = [];

    // Core adversary actions are always visible (red until detected/enabled)
    pills.push(this._pill("Attack Roll", "attackRoll", index, feature.toggles.attackRoll === true));
    pills.push(this._pill("Spend Fear", "spendFear", index, feature.toggles.spendFear === true));
    pills.push(this._pill("Mark Stress", "spendStress", index, feature.toggles.spendStress === true));

    // Dynamic: detected damage rolls
    for (let di = 0; di < feature.damageRolls.length; di++) {
      const d = feature.damageRolls[di];
      const label = `Damage ${d.formula} (${d.type === "mag" ? "Magical" : "Physical"})`;
      pills.push(this._pill(label, `damage-${di}`, index, d.enabled, "damage"));
    }

    // Dynamic: detected reaction rolls
    for (let ri = 0; ri < feature.reactionRolls.length; ri++) {
      const r = feature.reactionRolls[ri];
      const tc = r.trait.charAt(0).toUpperCase() + r.trait.slice(1);
      pills.push(this._pill(`${tc} Reaction`, `reaction-${ri}`, index, r.enabled, "reaction"));
    }

    return pills.join("");
  }

  _pill(label, key, featureIndex, enabled, category = "toggle") {
    const cls = enabled ? "dhac-pill-on" : "dhac-pill-off";
    return `<button type="button" class="dhac-pill ${cls}" data-action="toggleAction" data-feature-index="${featureIndex}" data-toggle-key="${key}" data-toggle-category="${category}" title="Click to toggle">${label}</button>`;
  }

  _readForm() {
    const html = this.element;
    if (!html) return;
    const s = this._state;
    s.img = html.querySelector("[name='img']")?.value ?? s.img;
    s.rightTab = html.querySelector("[name='rightTab']")?.value ?? s.rightTab;
    s.name = html.querySelector("[name='name']")?.value ?? s.name;
    s.tier = Number(html.querySelector("[name='tier']")?.value) || s.tier;
    s.role = html.querySelector("[name='role']")?.value ?? s.role;
    s.description = html.querySelector("[name='description']")?.value ?? s.description;
    s.motives = html.querySelector("[name='motives']")?.value ?? s.motives;
    s.difficulty = Number(html.querySelector("[name='difficulty']")?.value) || 0;
    s.majorThreshold = Number(html.querySelector("[name='majorThreshold']")?.value) || 0;
    s.severeThreshold = Number(html.querySelector("[name='severeThreshold']")?.value) || 0;
    s.hp = Number(html.querySelector("[name='hp']")?.value) || 0;
    s.stress = Number(html.querySelector("[name='stress']")?.value) || 0;
    s.atk = Number(html.querySelector("[name='atk']")?.value) || 0;
    s.weaponName = html.querySelector("[name='weaponName']")?.value ?? s.weaponName;
    s.weaponRange = html.querySelector("[name='weaponRange']")?.value ?? s.weaponRange;
    s.weaponDamageDice = html.querySelector("[name='weaponDamageDice']")?.value ?? s.weaponDamageDice;
    s.weaponDamageCount = Number(html.querySelector("[name='weaponDamageCount']")?.value) || 1;
    s.weaponDamageBonus = Number(html.querySelector("[name='weaponDamageBonus']")?.value) || 0;
    s.weaponDamageType = html.querySelector("[name='weaponDamageType']")?.value ?? s.weaponDamageType;
    for (let i = 0; i < s.experiences.length; i++) {
      const e = s.experiences[i];
      e.name = html.querySelector(`[name='experience.${i}.name']`)?.value ?? e.name;
      e.bonus = Number(html.querySelector(`[name='experience.${i}.bonus']`)?.value) || 0;
    }
    for (let i = 0; i < s.features.length; i++) {
      const f = s.features[i];
      f.name = html.querySelector(`[name='feature.${i}.name']`)?.value ?? f.name;
      f.formType = html.querySelector(`[name='feature.${i}.formType']`)?.value ?? f.formType;
      f.description = html.querySelector(`[name='feature.${i}.description']`)?.value ?? f.description;
      f.img = html.querySelector(`[name='feature.${i}.img']`)?.value ?? f.img;
    }
    const psr = html.querySelector("[name='effect.physicalSeverityReduction']")?.value;
    const msr = html.querySelector("[name='effect.magicSeverityReduction']")?.value;
    if (psr !== undefined) s.effects.physicalSeverityReduction = Math.max(1, Math.min(3, Number(psr) || 1));
    if (msr !== undefined) s.effects.magicSeverityReduction = Math.max(1, Math.min(3, Number(msr) || 1));
  }

  // ---- Actions ----

  static _onAutofill() {
    this._readForm();
    const benchmark = BENCHMARKS[this._state.role]?.[this._state.tier];
    if (!benchmark) return;
    const s = this._state;
    s.difficulty = mid(benchmark.difficulty);
    s.majorThreshold = benchmark.major ? mid(benchmark.major) : 0;
    s.severeThreshold = benchmark.severe ? mid(benchmark.severe) : 0;
    s.hp = mid(benchmark.hp);
    s.stress = mid(benchmark.stress);
    s.atk = mid(benchmark.atk);
    for (const exp of s.experiences) exp.bonus = EXPERIENCE_BY_TIER[s.tier] || 2;
    if (benchmark.dice?.[0]) {
      const m = benchmark.dice[0].match(/^(\d*)d(\d+)(?:\+(\d+))?$/);
      if (m) {
        s.weaponDamageCount = parseInt(m[1]) || 1;
        s.weaponDamageDice = `d${m[2]}`;
        s.weaponDamageBonus = parseInt(m[3]) || 0;
      }
    }
    this.render();
  }

  static _onAddFeature() {
    this._readForm();
    this._state.features.push(AdversaryCreatorApp._newFeature());
    this.render();
  }

  static _onRemoveFeature(event, target) {
    this._readForm();
    const id = target.dataset.featureId;
    this._state.features = this._state.features.filter(f => f.id !== id);
    if (this._state.features.length === 0) {
      this._state.features.push(AdversaryCreatorApp._newFeature());
    }
    this.render();
  }

  static _onAddExperience() {
    this._readForm();
    const bonus = EXPERIENCE_BY_TIER[this._state.tier] || 2;
    const exp = AdversaryCreatorApp._newExperience();
    exp.bonus = bonus;
    this._state.experiences.push(exp);
    this.render();
  }

  static _onRemoveExperience(event, target) {
    this._readForm();
    const id = target.dataset.experienceId;
    this._state.experiences = this._state.experiences.filter(e => e.id !== id);
    if (this._state.experiences.length === 0) {
      const exp = AdversaryCreatorApp._newExperience();
      exp.bonus = EXPERIENCE_BY_TIER[this._state.tier] || 2;
      this._state.experiences.push(exp);
    }
    this.render();
  }

  static _onToggleAction(event, target) {
    const fi = Number(target.dataset.featureIndex);
    const key = target.dataset.toggleKey;
    const category = target.dataset.toggleCategory;
    const f = this._state.features[fi];
    if (!f) return;

    if (category === "damage") {
      const di = parseInt(key.replace("damage-", ""));
      if (f.damageRolls[di] !== undefined) f.damageRolls[di].enabled = !f.damageRolls[di].enabled;
    } else if (category === "reaction") {
      const ri = parseInt(key.replace("reaction-", ""));
      if (f.reactionRolls[ri] !== undefined) f.reactionRolls[ri].enabled = !f.reactionRolls[ri].enabled;
    } else {
      f.toggles[key] = !f.toggles[key];
    }

    this._renderFeatureToggles(fi);
  }

  static _openImagePicker(current, onPick) {
    const Picker = globalThis.FilePicker ?? foundry?.applications?.apps?.FilePicker;
    if (!Picker) {
      ui.notifications.warn("Foundry File Picker is not available.");
      return;
    }

    new Picker({
      type: "imagevideo",
      current,
      callback: onPick,
    }).render(true);
  }

  static _onPickActorImage() {
    this._readForm();
    AdversaryCreatorApp._openImagePicker(this._state.img || DEFAULT_ACTOR_ICON, (path) => {
      this._state.img = path || DEFAULT_ACTOR_ICON;
      this.render();
    });
  }

  static _onResetActorImage() {
    this._readForm();
    this._state.img = DEFAULT_ACTOR_ICON;
    this.render();
  }

  static _onPickFeatureImage(event, target) {
    this._readForm();
    const fi = Number(target.dataset.featureIndex);
    const feature = this._state.features[fi];
    if (!feature) return;

    AdversaryCreatorApp._openImagePicker(feature.img || DEFAULT_FEATURE_ICON, (path) => {
      feature.img = path || DEFAULT_FEATURE_ICON;
      this.render();
    });
  }

  static _onResetFeatureImage(event, target) {
    this._readForm();
    const fi = Number(target.dataset.featureIndex);
    const feature = this._state.features[fi];
    if (!feature) return;
    feature.img = DEFAULT_FEATURE_ICON;
    this.render();
  }

  static _onSwitchRightTab(event, target) {
    this._readForm();
    const tab = target.dataset.tab;
    if (!["features", "effects"].includes(tab)) return;
    this._state.rightTab = tab;
    this.render();
  }

  static _onToggleEffectFlag(event, target) {
    this._readForm();
    const key = target.dataset.effectKey;
    if (!(key in this._state.effects)) return;
    this._state.effects[key] = !this._state.effects[key];
    this.render();
  }

  static _onResetForm() {
    if (this._editingActorId) {
      const actor = game.actors?.get(this._editingActorId);
      if (actor) {
        this._populateFromActor(actor);
        this.render();
        return;
      }
    }

    this._editingActorId = null;
    this._state = {
      img: DEFAULT_ACTOR_ICON,
      rightTab: "features",
      name: "", tier: 1, role: "standard",
      description: "", motives: "",
      difficulty: 12, majorThreshold: 6, severeThreshold: 10,
      hp: 4, stress: 3, atk: 1,
      weaponName: "", weaponRange: "melee",
      weaponDamageDice: "d8", weaponDamageCount: 1, weaponDamageBonus: 3,
      weaponDamageType: "physical",
      effects: {
        physicalSeverityReductionEnabled: false,
        magicSeverityReductionEnabled: false,
        physicalSeverityReduction: 1,
        magicSeverityReduction: 1,
        physicalResistance: false,
        magicResistance: false,
        physicalImmunity: false,
        magicImmunity: false,
      },
      experiences: [AdversaryCreatorApp._newExperience()],
      features: [AdversaryCreatorApp._newFeature()],
    };
    this.render();
  }

  // ==================================================================
  // Build Feature for Foundryborne
  // ==================================================================

  static _buildFeatureItem(feature, featureIndex) {
    const actions = {};
    let desc = feature.description;

    // Process markdown-style formatting: ***bold italic***, **italic**, *bold*
    // (Daggerheart SRD uses bold for dice, bold for game terms)
    desc = desc.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    desc = desc.replace(/\*\*(.+?)\*\*/g, '<em>$1</em>');
    desc = desc.replace(/\*(.+?)\*/g, '<strong>$1</strong>');

    // Replace only the damage tag prefix with an inline roll; leave surrounding natural language intact.
    desc = desc.replace(/damage:(\d+d\d+(?:[+-]\d+)?)/gi, (match, formula) => {
      return `[[/r ${formula}]]`;
    });

    // Build enabled actions from toggles
    if (feature.toggles.attackRoll) {
      const id = foundry.utils.randomID(16);
      actions[id] = {
        type: "attack", _id: id, systemPath: "actions", baseAction: false,
        description: "", chatDisplay: true, originItem: { type: "itemCollection" },
        actionType: "action", triggers: [], cost: [],
        uses: { value: null, max: "", recovery: null, consumeOnSuccess: false },
        damage: { parts: [], includeBase: false, direct: false },
        target: { type: "any", amount: null }, effects: [],
        roll: { type: "attack", trait: null, difficulty: null, bonus: null, advState: "neutral",
          diceRolling: { multiplier: "prof", flatMultiplier: 1, dice: "d6", compare: null, treshold: null }, useDefault: false },
        save: { trait: null, difficulty: null, damageMod: "none" },
        name: "Attack", range: "",
      };
    }

    if (feature.toggles.spendFear) {
      const id = foundry.utils.randomID(16);
      actions[id] = {
        type: "effect", _id: id, systemPath: "actions", baseAction: false,
        description: "", chatDisplay: true, originItem: { type: "itemCollection" },
        actionType: "action", triggers: [],
        cost: [{ scalable: false, key: "fear", value: 1, itemId: null, step: null, consumeOnSuccess: false }],
        uses: { value: null, max: "", recovery: null, consumeOnSuccess: false },
        effects: [], target: { type: "any", amount: null },
        name: "Spend Fear", range: "",
      };
    }

    if (feature.toggles.spendStress) {
      const id = foundry.utils.randomID(16);
      actions[id] = {
        type: "effect", _id: id, systemPath: "actions", baseAction: false,
        description: "", chatDisplay: true, originItem: { type: "itemCollection" },
        actionType: "action", triggers: [],
        cost: [{ scalable: false, key: "stress", value: 1, itemId: null, step: null, consumeOnSuccess: false }],
        uses: { value: null, max: "", recovery: null, consumeOnSuccess: false },
        effects: [], target: { type: "any", amount: null },
        name: "Mark Stress", range: "",
      };
    }

    // Enabled damage rolls
    for (const d of feature.damageRolls) {
      if (!d.enabled) continue;
      const damageType = d.type === "mag" ? "magical" : "physical";
      const id = foundry.utils.randomID(16);
      actions[id] = {
        type: "damage", _id: id, systemPath: "actions", baseAction: false,
        description: "", chatDisplay: true, originItem: { type: "itemCollection" },
        actionType: "action", triggers: [], cost: [],
        uses: { value: null, max: "", recovery: null, consumeOnSuccess: false },
        damage: {
          parts: [{
            value: { custom: { enabled: true, formula: d.formula }, multiplier: "prof", flatMultiplier: 1, dice: "d6", bonus: null },
            applyTo: "hitPoints", type: [damageType], base: false, resultBased: false,
            valueAlt: { multiplier: "prof", flatMultiplier: 1, dice: "d6", bonus: null, custom: { enabled: false, formula: "" } },
          }],
          includeBase: false, direct: false,
        },
        target: { type: "any", amount: null }, effects: [],
        name: `Damage (${d.formula})`, range: "",
      };
    }

    // Enabled reaction rolls
    for (const r of feature.reactionRolls) {
      if (!r.enabled) continue;
      const tc = r.trait.charAt(0).toUpperCase() + r.trait.slice(1);
      const id = foundry.utils.randomID(16);
      actions[id] = {
        type: "attack", _id: id, systemPath: "actions", baseAction: false,
        description: "", chatDisplay: true, originItem: { type: "itemCollection" },
        actionType: "action", triggers: [], cost: [],
        uses: { value: null, max: "", recovery: null, consumeOnSuccess: false },
        damage: { parts: [], includeBase: false, direct: false },
        target: { type: "any", amount: null }, effects: [],
        roll: { type: null, trait: null, difficulty: null, bonus: null, advState: "neutral",
          diceRolling: { multiplier: "prof", flatMultiplier: 1, dice: "d6", compare: null, treshold: null }, useDefault: false },
        save: { trait: r.trait, difficulty: null, damageMod: "none" },
        name: `${tc} Reaction Roll`, range: "",
      };
    }

    // Auto-name: if name is empty, generate one
    let featureName = feature.name.trim();
    if (!featureName) {
      featureName = `Feature ${featureIndex + 1}`;
    }

    const item = {
      name: featureName, type: "feature",
      img: feature.img || DEFAULT_FEATURE_ICON,
      system: { featureForm: feature.formType, description: `<p>${desc}</p>` },
    };
    if (Object.keys(actions).length > 0) item.system.actions = actions;
    return item;
  }

  static _buildResistanceEffects(effectState) {
    const modeOverride = CONST?.ACTIVE_EFFECT_MODES?.OVERRIDE ?? 5;
    const defs = [
      {
        enabled: Boolean(effectState?.physicalSeverityReductionEnabled),
        key: "system.rules.damageReduction.reduceSeverity.physical",
        label: "Physical Severity Reduction",
        effectKey: "physicalSeverityReduction",
        value: String(Math.max(1, Math.min(3, Number(effectState?.physicalSeverityReduction) || 1))),
        img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
      },
      {
        enabled: Boolean(effectState?.magicSeverityReductionEnabled),
        key: "system.rules.damageReduction.reduceSeverity.magical",
        label: "Magic Severity Reduction",
        effectKey: "magicSeverityReduction",
        value: String(Math.max(1, Math.min(3, Number(effectState?.magicSeverityReduction) || 1))),
        img: "icons/magic/defensive/shield-barrier-glowing-triangle-blue.webp",
      },
      {
        enabled: Boolean(effectState?.physicalResistance),
        key: "system.resistance.physical.resistance",
        label: "Physical Resistance",
        effectKey: "physicalResistance",
        img: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
      },
      {
        enabled: Boolean(effectState?.magicResistance),
        key: "system.resistance.magical.resistance",
        label: "Magic Resistance",
        effectKey: "magicResistance",
        img: "icons/magic/defensive/shield-barrier-glowing-triangle-blue.webp",
      },
      {
        enabled: Boolean(effectState?.physicalImmunity),
        key: "system.resistance.physical.immunity",
        label: "Physical Immunity",
        effectKey: "physicalImmunity",
        img: "icons/magic/defensive/shield-barrier-flaming-diamond-blue.webp",
      },
      {
        enabled: Boolean(effectState?.magicImmunity),
        key: "system.resistance.magical.immunity",
        label: "Magic Immunity",
        effectKey: "magicImmunity",
        img: "icons/magic/defensive/shield-barrier-glowing-triangle-blue.webp",
      },
    ];

    return defs
      .filter(d => d.enabled)
      .map(d => ({
        name: d.label,
        img: d.img,
        disabled: false,
        transfer: false,
        flags: {
          [MODULE_ID]: {
            managedResistance: true,
            effectKey: d.effectKey,
          },
        },
        changes: [
          {
            key: d.key,
            mode: modeOverride,
            value: d.value ?? "1",
            priority: 50,
          },
        ],
      }));
  }

  // ==================================================================
  // Create Adversary
  // ==================================================================

  static async _onCreateAdversary() {
    this._readForm();
    const s = this._state;

    if (!s.name.trim()) {
      ui.notifications.warn("Please enter an adversary name.");
      return;
    }

    try {
      const systemData = {
        tier: s.tier, type: s.role,
        description: s.description,
        motivesAndTactics: s.motives,
        difficulty: s.difficulty,
        damageThresholds: { major: s.majorThreshold, severe: s.severeThreshold },
        resources: { hitPoints: { max: s.hp }, stress: { max: s.stress } },
        attack: {
          name: s.weaponName, range: s.weaponRange,
          roll: { type: "attack", bonus: String(s.atk) },
          img: "icons/magic/death/skull-humanoid-white-blue.webp",
          damage: {
            parts: [{
              value: { custom: { enabled: false, formula: "" }, flatMultiplier: s.weaponDamageCount,
                dice: s.weaponDamageDice, bonus: s.weaponDamageBonus || null, multiplier: "flat" },
              type: [s.weaponDamageType], applyTo: "hitPoints",
            }],
            includeBase: false, direct: false,
          },
        },
        experiences: {},
      };

      for (const exp of s.experiences) {
        if (!exp.name.trim()) continue;
        const expId = this._editingActorId && exp.id ? exp.id : foundry.utils.randomID();
        systemData.experiences[expId] = { name: exp.name.trim(), value: exp.bonus, description: "" };
      }

      const items = s.features
        .filter(f => f.name.trim() || f.description.trim()) // Include if they have name OR description
        .map((f, i) => AdversaryCreatorApp._buildFeatureItem(f, i));

      const actorData = {
        name: s.name.trim(), type: "adversary",
        system: systemData, items, effects: AdversaryCreatorApp._buildResistanceEffects(s.effects), img: s.img || DEFAULT_ACTOR_ICON,
      };

      if (this._editingActorId) {
        const actor = game.actors?.get(this._editingActorId);
        if (!actor) throw new Error("Adversary actor not found.");

        const oldExperienceIds = Object.keys(actor.system?.experiences ?? {});
        const newExperienceIds = new Set(Object.keys(systemData.experiences));
        const updateData = {
          name: actorData.name,
          type: actorData.type,
          system: actorData.system,
        };

        for (const expId of oldExperienceIds) {
          if (!newExperienceIds.has(expId)) {
            updateData[`system.experiences.-=${expId}`] = null;
          }
        }

        await actor.update(updateData);

        const featureItems = actor.items.filter(i => i.type === "feature");
        if (featureItems.length) {
          await actor.deleteEmbeddedDocuments("Item", featureItems.map(i => i.id));
        }
        if (items.length) {
          await actor.createEmbeddedDocuments("Item", items);
        }

        const managedResistanceEffects = actor.effects.filter(e => e.flags?.[MODULE_ID]?.managedResistance);
        if (managedResistanceEffects.length) {
          await actor.deleteEmbeddedDocuments("ActiveEffect", managedResistanceEffects.map(e => e.id));
        }
        if (actorData.effects?.length) {
          await actor.createEmbeddedDocuments("ActiveEffect", actorData.effects);
        }

        ui.notifications.info(`Updated adversary: ${actor.name}`);
        actor.sheet.render(true);
        return;
      }

      const newActor = await Actor.create(actorData);
      if (newActor) {
        ui.notifications.info(`Created adversary: ${newActor.name}`);
        newActor.sheet.render(true);
      }
      AdversaryCreatorApp._onResetForm.call(this);
    } catch (err) {
      console.error(`${MODULE_ID} | Error creating adversary:`, err);
      ui.notifications.error(`Error creating adversary: ${err.message}`);
    }
  }

  _populateFromActor(actor) {
    if (!actor || actor.type !== "adversary") {
      throw new Error("Quick edit only supports adversary actors.");
    }

    this._editingActorId = actor.id;

    const system = actor.system ?? {};
    const attack = system.attack ?? {};
    const damagePart = attack.damage?.parts?.[0] ?? {};
    const damageValue = damagePart.value ?? {};
    const experiences = Object.entries(system.experiences ?? {}).map(([id, exp]) => ({
      id,
      name: exp?.name ?? "",
      bonus: Number(exp?.value) || 0,
    }));

    const features = actor.items
      .filter(item => item.type === "feature")
      .map((item, index) => this._featureStateFromItem(item, index));

    this._state = {
      img: actor.img ?? DEFAULT_ACTOR_ICON,
      rightTab: "features",
      name: actor.name ?? "",
      tier: Number(system.tier) || 1,
      role: typeof system.type === "string" && ROLES.includes(system.type) ? system.type : "standard",
      description: system.description ?? "",
      motives: system.motivesAndTactics ?? "",
      difficulty: Number(system.difficulty) || 0,
      majorThreshold: Number(system.damageThresholds?.major) || 0,
      severeThreshold: Number(system.damageThresholds?.severe) || 0,
      hp: Number(system.resources?.hitPoints?.max) || 0,
      stress: Number(system.resources?.stress?.max) || 0,
      atk: Number.parseInt(attack.roll?.bonus, 10) || 0,
      weaponName: attack.name ?? "",
      weaponRange: attack.range ?? "melee",
      weaponDamageDice: damageValue.dice ?? "d8",
      weaponDamageCount: Number(damageValue.flatMultiplier) || 1,
      weaponDamageBonus: Number(damageValue.bonus) || 0,
      weaponDamageType: damagePart.type?.[0] ?? "physical",
      effects: this._readResistanceEffectsFromActor(actor),
      experiences: experiences.length ? experiences : [AdversaryCreatorApp._newExperience()],
      features: features.length ? features : [AdversaryCreatorApp._newFeature()],
    };
  }

  _readResistanceEffectsFromActor(actor) {
    const state = {
      physicalSeverityReductionEnabled: false,
      magicSeverityReductionEnabled: false,
      physicalSeverityReduction: 1,
      magicSeverityReduction: 1,
      physicalResistance: false,
      magicResistance: false,
      physicalImmunity: false,
      magicImmunity: false,
    };

    const effects = Array.from(actor.effects ?? []);
    for (const effect of effects) {
      const changes = Array.isArray(effect.changes) ? effect.changes : [];
      for (const change of changes) {
        if (change?.key === "system.rules.damageReduction.reduceSeverity.physical" && String(change?.value) === "1") {
          state.physicalSeverityReductionEnabled = true;
          state.physicalSeverityReduction = 1;
        }
        if (change?.key === "system.rules.damageReduction.reduceSeverity.physical" && ["2", "3"].includes(String(change?.value))) {
          state.physicalSeverityReductionEnabled = true;
          state.physicalSeverityReduction = Number(change.value);
        }
        if (change?.key === "system.rules.damageReduction.reduceSeverity.magical" && String(change?.value) === "1") {
          state.magicSeverityReductionEnabled = true;
          state.magicSeverityReduction = 1;
        }
        if (change?.key === "system.rules.damageReduction.reduceSeverity.magical" && ["2", "3"].includes(String(change?.value))) {
          state.magicSeverityReductionEnabled = true;
          state.magicSeverityReduction = Number(change.value);
        }
        if (change?.key === "system.resistance.physical.resistance" && String(change?.value) === "1") {
          state.physicalResistance = true;
        }
        if (change?.key === "system.resistance.magical.resistance" && String(change?.value) === "1") {
          state.magicResistance = true;
        }
        if (change?.key === "system.resistance.physical.immunity" && String(change?.value) === "1") {
          state.physicalImmunity = true;
        }
        if (change?.key === "system.resistance.magical.immunity" && String(change?.value) === "1") {
          state.magicImmunity = true;
        }
      }
    }
    return state;
  }

  _featureStateFromItem(item, index) {
    const feature = AdversaryCreatorApp._newFeature();
    const system = item.system ?? {};
    const actions = Object.values(system.actions ?? {});

    feature.id = item.id ?? feature.id;
    feature.name = item.name ?? "";
    feature.formType = system.featureForm ?? "passive";
    feature.img = item.img || DEFAULT_FEATURE_ICON;

    feature.toggles = {
      attackRoll: null,
      spendFear: null,
      spendStress: null,
    };
    feature.damageRolls = [];
    feature.reactionRolls = [];

    for (const action of actions) {
      if (!action) continue;
      if (action.type === "attack" && action.name === "Attack") {
        feature.toggles.attackRoll = true;
      }

      const costs = Array.isArray(action.cost) ? action.cost : [];
      if (costs.some(c => c?.key === "fear")) feature.toggles.spendFear = true;
      if (costs.some(c => c?.key === "stress")) feature.toggles.spendStress = true;

      if (action.type === "damage") {
        const parts = Array.isArray(action.damage?.parts) ? action.damage.parts : [];
        for (const part of parts) {
          const formula = part?.value?.custom?.formula;
          if (!formula) continue;
          const rawType = Array.isArray(part?.type) ? part.type[0] : "physical";
          const type = typeof rawType === "string" && rawType.startsWith("mag") ? "mag" : "phy";
          if (!feature.damageRolls.some(d => d.formula === formula && d.type === type)) {
            feature.damageRolls.push({ formula, type, enabled: true });
          }
        }
      }

      const trait = action.save?.trait;
      if (typeof trait === "string" && trait && !feature.reactionRolls.some(r => r.trait === trait)) {
        feature.reactionRolls.push({ trait, enabled: true });
      }
    }

    feature.description = this._featureDescriptionToFormText(system.description ?? "", feature.damageRolls);
    feature._mergeAutoDetectOnFirstRender = true;

    if (feature.toggles.attackRoll !== true) feature.toggles.attackRoll = null;
    if (feature.toggles.spendFear !== true) feature.toggles.spendFear = null;
    if (feature.toggles.spendStress !== true) feature.toggles.spendStress = null;

    if (!feature.name.trim() && !feature.description.trim()) {
      feature.name = `Feature ${index + 1}`;
    }

    return feature;
  }

  _featureDescriptionToFormText(html, damageRolls = []) {
    if (!html) return "";
    const damageByFormula = new Map();
    for (const d of damageRolls) {
      if (!damageByFormula.has(d.formula)) damageByFormula.set(d.formula, d);
    }

    const withTags = String(html).replace(/\[\[\/r\s+([^\]]+)\]\]/gi, (match, formula) => {
      const normalized = String(formula).trim();
      const roll = damageByFormula.get(normalized);
      if (!roll) return `damage:${normalized}`;
      return `damage:${normalized} ${roll.type === "mag" ? "magical" : "physical"}`;
    });

    const tmp = document.createElement("div");
    tmp.innerHTML = withTags
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n");

    return tmp.textContent?.replace(/\n{3,}/g, "\n\n").trim() ?? "";
  }
}
