import { BENCHMARKS, ROLES, RANGES, mid, rangeStr } from "./benchmarks.mjs";

const MODULE_ID = "dh-adversary-creator";

/**
 * AdversaryCreatorForm - A FormApplication that provides a form-based UI
 * for creating Daggerheart adversary actors inside FoundryVTT.
 *
 * This directly creates Actor documents with embedded feature Items,
 * matching the Foundryborne daggerheart system's data model.
 */
export class AdversaryCreatorForm extends FormApplication {

  constructor(options = {}) {
    super({}, options);
    this._features = [this._emptyFeature()];
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "dhac-adversary-creator",
      title: game.i18n?.localize("DHAC.Title") ?? "Quick Adversary Creator",
      template: `modules/${MODULE_ID}/templates/adversary-creator.hbs`,
      classes: ["dhac-form", "daggerheart"],
      width: 680,
      height: "auto",
      resizable: true,
      tabs: [{ navSelector: ".dhac-tabs", contentSelector: ".dhac-tab-content", initial: "identity" }],
      closeOnSubmit: false,
      submitOnChange: false,
    });
  }

  _emptyFeature() {
    return {
      id: foundry.utils.randomID(),
      name: "",
      type: "passive",
      description: "",
      isFearFeature: false,
    };
  }

  getData() {
    const tier = this._tier ?? 1;
    const role = this._role ?? "standard";
    const benchmark = BENCHMARKS[role]?.[tier];

    return {
      // Form state
      name: this._name ?? "",
      tier,
      role,
      description: this._description ?? "",
      motives: this._motives ?? "",
      difficulty: this._difficulty ?? mid(benchmark?.difficulty),
      majorThreshold: this._majorThreshold ?? mid(benchmark?.major),
      severeThreshold: this._severeThreshold ?? mid(benchmark?.severe),
      hp: this._hp ?? mid(benchmark?.hp),
      stress: this._stress ?? mid(benchmark?.stress),
      atk: this._atk ?? mid(benchmark?.atk),
      weaponName: this._weaponName ?? "",
      weaponRange: this._weaponRange ?? "melee",
      weaponDamage: this._weaponDamage ?? (benchmark?.dice?.[0] ?? "1d8+3"),
      weaponDamageType: this._weaponDamageType ?? "phy",
      experienceName: this._experienceName ?? "",
      experienceBonus: this._experienceBonus ?? 2,
      features: this._features,

      // Reference data
      roles: ROLES,
      ranges: RANGES,
      featureTypes: ["passive", "action", "reaction"],
      benchmark,
      benchmarkStr: benchmark ? {
        difficulty: rangeStr(benchmark.difficulty),
        major: benchmark.major ? rangeStr(benchmark.major) : "None",
        severe: benchmark.severe ? rangeStr(benchmark.severe) : "None",
        hp: rangeStr(benchmark.hp),
        stress: rangeStr(benchmark.stress),
        atk: rangeStr(benchmark.atk),
        dice: benchmark.dice?.join(", ") ?? "",
      } : null,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Auto-fill button
    html.find(".dhac-autofill").on("click", (ev) => {
      ev.preventDefault();
      this._applyBenchmarks();
    });

    // Add feature
    html.find(".dhac-add-feature").on("click", (ev) => {
      ev.preventDefault();
      this._features.push(this._emptyFeature());
      this.render();
    });

    // Remove feature
    html.find(".dhac-remove-feature").on("click", (ev) => {
      ev.preventDefault();
      const id = ev.currentTarget.dataset.featureId;
      this._features = this._features.filter(f => f.id !== id);
      if (this._features.length === 0) this._features.push(this._emptyFeature());
      this.render();
    });

    // Tier/Role change -> update benchmarks display
    html.find("[name='tier'], [name='role']").on("change", (ev) => {
      this._saveFormState(html);
      this.render();
    });

    // Create button
    html.find(".dhac-create").on("click", async (ev) => {
      ev.preventDefault();
      this._saveFormState(html);
      await this._createAdversary();
    });

    // Reset button
    html.find(".dhac-reset").on("click", (ev) => {
      ev.preventDefault();
      this._resetForm();
      this.render();
    });
  }

  /**
   * Read all current form values into internal state.
   */
  _saveFormState(html) {
    const form = html[0]?.querySelector("form") ?? html.find("form")[0];
    if (!form) return;
    const fd = new FormDataExtended(form);
    const data = fd.object;

    this._name = data.name ?? "";
    this._tier = Number(data.tier) || 1;
    this._role = data.role ?? "standard";
    this._description = data.description ?? "";
    this._motives = data.motives ?? "";
    this._difficulty = Number(data.difficulty) || 0;
    this._majorThreshold = Number(data.majorThreshold) || 0;
    this._severeThreshold = Number(data.severeThreshold) || 0;
    this._hp = Number(data.hp) || 0;
    this._stress = Number(data.stress) || 0;
    this._atk = Number(data.atk) || 0;
    this._weaponName = data.weaponName ?? "";
    this._weaponRange = data.weaponRange ?? "melee";
    this._weaponDamage = data.weaponDamage ?? "";
    this._weaponDamageType = data.weaponDamageType ?? "phy";
    this._experienceName = data.experienceName ?? "";
    this._experienceBonus = Number(data.experienceBonus) || 0;

    // Features are stored as indexed fields: feature.0.name, feature.0.type, etc.
    const newFeatures = [];
    for (let i = 0; i < this._features.length; i++) {
      newFeatures.push({
        id: this._features[i].id,
        name: data[`feature.${i}.name`] ?? this._features[i].name,
        type: data[`feature.${i}.type`] ?? this._features[i].type,
        description: data[`feature.${i}.description`] ?? this._features[i].description,
        isFearFeature: !!data[`feature.${i}.isFearFeature`],
      });
    }
    this._features = newFeatures;
  }

  _applyBenchmarks() {
    const html = this.element;
    this._saveFormState(html);

    const benchmark = BENCHMARKS[this._role]?.[this._tier];
    if (!benchmark) return;

    this._difficulty = mid(benchmark.difficulty);
    this._majorThreshold = benchmark.major ? mid(benchmark.major) : 0;
    this._severeThreshold = benchmark.severe ? mid(benchmark.severe) : 0;
    this._hp = mid(benchmark.hp);
    this._stress = mid(benchmark.stress);
    this._atk = mid(benchmark.atk);
    this._weaponDamage = benchmark.dice?.[0] ?? this._weaponDamage;

    this.render();
  }

  _resetForm() {
    this._name = "";
    this._tier = 1;
    this._role = "standard";
    this._description = "";
    this._motives = "";
    this._difficulty = undefined;
    this._majorThreshold = undefined;
    this._severeThreshold = undefined;
    this._hp = undefined;
    this._stress = undefined;
    this._atk = undefined;
    this._weaponName = "";
    this._weaponRange = "melee";
    this._weaponDamage = undefined;
    this._weaponDamageType = "phy";
    this._experienceName = "";
    this._experienceBonus = 2;
    this._features = [this._emptyFeature()];
  }

  /**
   * Create the adversary actor in Foundry.
   * Uses introspection to adapt to the Foundryborne data model.
   */
  async _createAdversary() {
    if (!this._name?.trim()) {
      ui.notifications.warn(game.i18n.localize("DHAC.Notifications.NoName"));
      return;
    }

    try {
      // Build actor data. The exact field names depend on the Foundryborne system.
      // We try to match their data model as closely as possible.
      const actorData = {
        name: this._name.trim(),
        type: "adversary",
        img: "icons/svg/skull.svg",
        system: this._buildSystemData(),
      };

      // Create the actor
      const actor = await Actor.create(actorData);

      // Build embedded feature items
      const featureItems = this._buildFeatureItems();
      if (featureItems.length > 0) {
        await actor.createEmbeddedDocuments("Item", featureItems);
      }

      ui.notifications.info(
        game.i18n.format("DHAC.Notifications.Created", { name: actor.name })
      );

      // Open the new actor's sheet
      actor.sheet.render(true);

      // Reset form for next adversary
      this._resetForm();
      this.render();

    } catch (err) {
      console.error(`${MODULE_ID} | Error creating adversary:`, err);
      ui.notifications.error(
        game.i18n.format("DHAC.Notifications.Error", { error: err.message })
      );
    }
  }

  /**
   * Build the system data object for the adversary.
   * Foundryborne uses specific paths - we try to auto-detect the schema
   * and fall back to reasonable defaults.
   */
  _buildSystemData() {
    // Check if we have a sample schema from discovery
    const sampleSchema = game.modules.get(MODULE_ID)?.sampleSchema;

    // The Foundryborne system uses a DataModel; we construct the data object
    // using the field names the system expects. Based on inspecting the system's
    // compendium adversaries, the typical structure is:
    const data = {};

    // Helper: set nested path safely
    const setPath = (obj, path, val) => {
      const parts = path.split(".");
      let current = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in current)) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = val;
    };

    // We try multiple possible field mappings.
    // The Foundryborne system's adversary data model has evolved;
    // these cover the most common field paths.

    // --- Core identity ---
    setPath(data, "description", this._description);
    setPath(data, "tier", this._tier);

    // Role - might be stored as string or enum
    setPath(data, "role", this._role);
    setPath(data, "adversaryType", this._role); // alternate field name

    // Motives
    setPath(data, "motivesAndTactics", this._motives);
    setPath(data, "motives", this._motives); // alternate

    // --- Combat stats ---
    setPath(data, "difficulty.value", this._difficulty);

    // Thresholds
    setPath(data, "thresholds.major", this._majorThreshold);
    setPath(data, "thresholds.severe", this._severeThreshold);
    // Also try flat structure in case
    setPath(data, "majorThreshold", this._majorThreshold);
    setPath(data, "severeThreshold", this._severeThreshold);

    // HP & Stress
    setPath(data, "hp.value", this._hp);
    setPath(data, "hp.max", this._hp);
    setPath(data, "stress.value", 0);
    setPath(data, "stress.max", this._stress);

    // Attack
    setPath(data, "attack.modifier", this._atk);
    setPath(data, "attack.bonus", this._atk); // alternate

    // Standard attack weapon
    setPath(data, "attack.name", this._weaponName);
    setPath(data, "attack.range", this._weaponRange);
    setPath(data, "attack.damage", this._weaponDamage);
    setPath(data, "attack.damageType", this._weaponDamageType);

    // Experience
    if (this._experienceName) {
      setPath(data, "experience.name", this._experienceName);
      setPath(data, "experience.bonus", this._experienceBonus);
      setPath(data, "experience.value", this._experienceBonus); // alternate
    }

    return data;
  }

  /**
   * Build feature Item documents from the features list.
   */
  _buildFeatureItems() {
    return this._features
      .filter(f => f.name?.trim())
      .map(f => {
        // Determine the item type - Foundryborne may use different item types
        // for adversary features. Common ones: "feature", "adversaryFeature", "action"
        const typeLabel = f.type.charAt(0).toUpperCase() + f.type.slice(1);
        const fearPrefix = f.isFearFeature ? "Spend a Fear to " : "";
        const descriptionHtml = `<p><strong>${f.name}</strong> - ${typeLabel}: ${fearPrefix}${f.description}</p>`;

        return {
          name: f.name.trim(),
          type: "feature", // Foundryborne's primary item type for adversary features
          img: f.isFearFeature ? "icons/svg/terror.svg" : "icons/svg/sword.svg",
          system: {
            description: descriptionHtml,
            featureType: f.type,
            type: f.type, // alternate field
            isFearFeature: f.isFearFeature,
            fearFeature: f.isFearFeature, // alternate field
            // The action system in Foundryborne may use "actions" array
          },
        };
      });
  }

  /** Required by FormApplication but we handle submission manually */
  async _updateObject(event, formData) {
    // no-op — we use our own create button
  }
}
