import { BENCHMARKS, ROLES, RANGES, EXPERIENCE_BY_TIER, mid, rangeStr, ROLE_TIPS, ROLE_FEATURES } from "./benchmarks.mjs";
import { ImageFavoritesPicker, getDefault } from "./image-favorites.mjs";

const MODULE_ID = "one-minute-adversaries";
const DEFAULT_FEATURE_ICON = "systems/daggerheart/assets/icons/documents/items/stars-stack.svg";
const DEFAULT_ACTOR_ICON = "icons/svg/skull.svg";
const DEFAULT_ATTACK_ICON = "icons/magic/death/skull-humanoid-white-blue.webp";
const FONT_SETTINGS_STORAGE_KEY = `${MODULE_ID}.fontSettings`;
const GLASS_OPACITY_STORAGE_KEY = `${MODULE_ID}.glassOpacity`;
const DEFAULT_GLASS_OPACITY = 65;
const DEFAULT_FONT_SETTINGS = Object.freeze({
  nameInput: 14,
  featureName: 13,
  featureType: 12,
  featureDescription: 13,
  featurePills: 11,
  labels: 10,
});
const EXPERIENCE_RANGE_LABEL_BY_TIER = {
  1: "+2",
  2: "+2-3",
  3: "+3-4",
  4: "+4",
};
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class AdversaryCreatorApp extends HandlebarsApplicationMixin(ApplicationV2) {
  _editingActorId = null;
  _featureDescParseTimers = new Map();
  _fontSettings = AdversaryCreatorApp._loadFontSettings();
  _fontSettingsPanelOpen = false;

  _state = {
    img: DEFAULT_ACTOR_ICON,
    rightTab: "features",
    name: "", tier: 1, role: "standard",
    description: "", motives: "",
    difficulty: 12, majorThreshold: 6, severeThreshold: 10,
    hp: 4, stress: 3, atk: 1,
    minionPassiveValue: 4,
    groupAttackDamage: 4, groupAttackType: "physical",
    weaponImg: getDefault("attack") || DEFAULT_ATTACK_ICON,
    weaponName: "", weaponRange: "melee",
    weaponDamageDice: "d8", weaponDamageCount: 1, weaponDamageBonus: 3,
    weaponDamageFlat: 4,
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
    hordeAutoHalve: true,
    hordeDamage: "",
  };

  static _parseMinionDice(diceStr) {
    if (!diceStr) return null;
    const m = String(diceStr).match(/^(\d+)\s*[–-]\s*(\d+)/);
    if (!m) return null;
    const min = parseInt(m[1]), max = parseInt(m[2]);
    return { rangeStr: `${min}-${max}`, mid: Math.round((min + max) / 2) };
  }

  static _computeHordeHalvedDice(s) {
    const count = s.weaponDamageCount || 1;
    const sides = parseInt((s.weaponDamageDice || "d8").replace("d", "")) || 8;
    const bonus = s.weaponDamageBonus || 0;
    const halfCount = Math.max(1, Math.floor(count / 2));
    const halfBonus = Math.floor(bonus / 2);
    return `${halfCount}d${sides}${halfBonus > 0 ? "+" + halfBonus : halfBonus < 0 ? halfBonus : ""}`;
  }

  static _newExperience() {
    return { id: foundry.utils.randomID(), name: "", bonus: 2 };
  }

  static _newFeature() {
    return {
      id: foundry.utils.randomID(), name: "", formType: "passive", description: "",
      img: getDefault("feature") || DEFAULT_FEATURE_ICON,
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

  static _sanitizeFontSettings(value = {}) {
    const parsed = (value && typeof value === "object") ? value : {};
    const out = {};
    for (const [key, fallback] of Object.entries(DEFAULT_FONT_SETTINGS)) {
      const n = Number(parsed[key]);
      out[key] = Number.isFinite(n) ? Math.max(9, Math.min(24, Math.round(n))) : fallback;
    }
    return out;
  }

  static _loadFontSettings() {
    try {
      const raw = globalThis.localStorage?.getItem(FONT_SETTINGS_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_FONT_SETTINGS };
      return AdversaryCreatorApp._sanitizeFontSettings(JSON.parse(raw));
    } catch {
      return { ...DEFAULT_FONT_SETTINGS };
    }
  }

  static DEFAULT_OPTIONS = {
    id: "one-minute-adversaries",
    tag: "form",
    window: { title: "1-Minute Adversaries", icon: "fas fa-skull-crossbones", resizable: true },
    position: { width: 820, height: 720 },
    actions: {
      autofill: AdversaryCreatorApp._onAutofill,
      addFeature: AdversaryCreatorApp._onAddFeature,
      removeFeature: AdversaryCreatorApp._onRemoveFeature,
      addExperience: AdversaryCreatorApp._onAddExperience,
      removeExperience: AdversaryCreatorApp._onRemoveExperience,
      pickActorImage: AdversaryCreatorApp._onPickActorImage,
      resetActorImage: AdversaryCreatorApp._onResetActorImage,
      pickFeatureImage: AdversaryCreatorApp._onPickFeatureImage,
      pickAttackImage: AdversaryCreatorApp._onPickAttackImage,
      resetFeatureImage: AdversaryCreatorApp._onResetFeatureImage,
      resetAttackImage: AdversaryCreatorApp._onResetAttackImage,
      switchRightTab: AdversaryCreatorApp._onSwitchRightTab,
      toggleEffectFlag: AdversaryCreatorApp._onToggleEffectFlag,
      createAdversary: AdversaryCreatorApp._onCreateAdversary,
      resetForm: AdversaryCreatorApp._onResetForm,
      toggleAction: AdversaryCreatorApp._onToggleAction,
      addCommonFeatures: AdversaryCreatorApp._onAddCommonFeatures,
      toggleGroupAttackType: AdversaryCreatorApp._onToggleGroupAttackType,
      toggleHordeAutoHalve: AdversaryCreatorApp._onToggleHordeAutoHalve,
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
      roleTip: ROLE_TIPS[s.role] ?? null,
      isMinionRole: s.role === "minion",
      minionDiceRangeStr: (() => {
        if (s.role !== "minion") return "";
        const parsed = AdversaryCreatorApp._parseMinionDice(BENCHMARKS.minion?.[s.tier]?.dice?.[0]);
        return parsed?.rangeStr ?? "";
      })(),
      minionPassiveValue: s.minionPassiveValue,
      isHordeRole: s.role === "horde",
      hordeAutoHalve: s.hordeAutoHalve ?? true,
      hordeHalvedAvg: AdversaryCreatorApp._computeHordeHalvedDice(s),
      hordeCurrentDamage: (s.hordeAutoHalve ?? true)
        ? String(AdversaryCreatorApp._computeHordeHalvedDice(s))
        : (s.hordeDamage || String(AdversaryCreatorApp._computeHordeHalvedDice(s))),
      hordeWeaponDamageType: s.weaponDamageType || "physical",
    };
  }

  _onRender(context, options) {
    const html = this.element;
    if (!html) return;
    this._applyFontSettingsCssVars();
    this._ensureHeaderFontSettingsControl();
    html.querySelector("[name='tier']")?.addEventListener("change", () => { this._readForm(); this.render(); });
    html.querySelector("[name='role']")?.addEventListener("change", () => {
      this._readForm();
      // When switching to minion, seed minionPassiveValue from the benchmark if not yet set
      if (this._state.role === "minion" && !this._state.minionPassiveValue) {
        const parsed = AdversaryCreatorApp._parseMinionDice(BENCHMARKS.minion?.[this._state.tier]?.dice?.[0]);
        if (parsed) {
          this._state.minionPassiveValue = parsed.mid;
          this._state.weaponDamageFlat = parsed.mid;
          this._state.groupAttackDamage = parsed.mid;
        }
      }
      this.render();
    });

    // Minion Passive Value: live-update pinned feature card name + description without full re-render
    const minionPassiveInput = html.querySelector("[name='minionPassiveValue']");
    if (minionPassiveInput) {
      minionPassiveInput.addEventListener("input", () => {
        const val = Math.max(0, Number(minionPassiveInput.value) || 0);
        this._state.minionPassiveValue = val;
        const xEl = html.querySelector(".dhac-pinned-x");
        if (xEl) xEl.textContent = `(${val})`;
        const midEl = html.querySelector(".dhac-pinned-passive-mid");
        if (midEl) midEl.textContent = val;
      });
    }

    // Group Attack: live-update pinned card when damage or type changes
    const groupDmgInput = html.querySelector("[name='groupAttackDamage']");
    const groupTypeSelect = html.querySelector("[name='groupAttackType']");
    const updateGroupAttackCard = () => {
      const dmg = Number(html.querySelector("[name='groupAttackDamage']")?.value) || 0;
      const type = html.querySelector("[name='groupAttackType']")?.value ?? "physical";
      this._state.groupAttackDamage = dmg;
      this._state.groupAttackType = type;
      const dmgEl = html.querySelector(".dhac-pinned-group-dmg");
      if (dmgEl) dmgEl.textContent = dmg;
      const typeEl = html.querySelector(".dhac-pinned-group-type");
      if (typeEl) typeEl.textContent = type;
    };
    groupDmgInput?.addEventListener("input", updateGroupAttackCard);
    groupTypeSelect?.addEventListener("change", updateGroupAttackCard);

    // Horde: live-update pinned card when custom damage changes
    const hordeDmgInput = html.querySelector("[name='hordeDamage']");
    if (hordeDmgInput) {
      hordeDmgInput.addEventListener("input", () => {
        const val = hordeDmgInput.value;
        this._state.hordeDamage = val;
        html.querySelectorAll(".dhac-horde-dmg").forEach(el => el.textContent = val || "0");
      });
    }

    // Horde: live-update suggested avg when weapon inputs change
    const updateHordeAvg = () => {
      if (!html.querySelector(".dhac-horde-avg")) return;
      this._readForm();
      const avg = AdversaryCreatorApp._computeHordeHalvedDice(this._state);
      html.querySelector(".dhac-horde-avg").textContent = avg;
      if (this._state.hordeAutoHalve) {
        html.querySelectorAll(".dhac-horde-dmg").forEach(el => el.textContent = avg);
      }
    };
    ["weaponDamageCount", "weaponDamageDice", "weaponDamageBonus"].forEach(name => {
      html.querySelector(`[name='${name}']`)?.addEventListener("change", updateHordeAvg);
    });
    html.querySelector("[name='weaponDamageType']")?.addEventListener("change", (e) => {
      html.querySelectorAll(".dhac-horde-type").forEach(el => el.textContent = e.target.value);
    });

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

    // Listen to feature description changes for auto-detection + auto-size
    const autosizeTextarea = (el) => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };

    html.querySelectorAll("[data-desc-index]").forEach(textarea => {
      // Defer initial sizing so the browser has finished layout before measuring scrollHeight
      requestAnimationFrame(() => autosizeTextarea(textarea));

      textarea.addEventListener("input", (ev) => {
        autosizeTextarea(ev.target);

        const idx = Number(ev.target.dataset.descIndex);
        this._state.features[idx].description = ev.target.value;
        const prevTimer = this._featureDescParseTimers.get(idx);
        if (prevTimer) clearTimeout(prevTimer);
        const timer = setTimeout(() => {
          this._featureDescParseTimers.delete(idx);
          this._autoDetectTags(idx);
          this._renderFeatureToggles(idx);
        }, 150);
        this._featureDescParseTimers.set(idx, timer);
      });
    });

    // Mouse-wheel to nudge number inputs — scroll up = +1, scroll down = −1
    html.querySelectorAll(
      ".dhac-stat input[type='number'], .dhac-field input[type='number'], .dhac-experience-row input[type='number']"
    ).forEach(input => {
      input.addEventListener("wheel", (ev) => {
        ev.preventDefault();
        const step = Number(input.step) || 1;
        const min  = input.min !== "" ? Number(input.min) : -Infinity;
        const delta = ev.deltaY < 0 ? step : -step;
        input.value = String(Math.max(min, Number(input.value || 0) + delta));
        input.dispatchEvent(new Event("input",  { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        // Brief expand-and-settle animation for visual feedback
        input.classList.remove("dhac-num-bump");
        void input.offsetWidth; // force reflow to restart animation
        input.classList.add("dhac-num-bump");
      }, { passive: false });
    });

    this._setupRoleTipPin(html);
  }

  /** Handle click-to-pin on role tip popup and external doc link. */
  _setupRoleTipPin(html) {
    // Remove previous document listener if re-rendering
    if (this._roleTipClickOutsideHandler) {
      document.removeEventListener("pointerdown", this._roleTipClickOutsideHandler);
      this._roleTipClickOutsideHandler = null;
    }

    const wrappers = html.querySelectorAll(".dhac-role-tip-wrapper");
    if (!wrappers.length) return;

    wrappers.forEach(wrapper => {
      const btn = wrapper.querySelector(".dhac-role-tip-btn");
      btn?.addEventListener("click", (e) => {
        e.stopPropagation();
        wrapper.classList.toggle("is-pinned");
      });
    });

    // Click outside closes pinned popups
    this._roleTipClickOutsideHandler = (e) => {
      wrappers.forEach(wrapper => {
        if (!wrapper.contains(e.target)) wrapper.classList.remove("is-pinned");
      });
    };
    document.addEventListener("pointerdown", this._roleTipClickOutsideHandler);

    // Open external doc link via window.open so Electron doesn't swallow it
    html.querySelectorAll(".dhac-role-tip-doc-link").forEach(a => {
      a.addEventListener("click", (e) => { e.preventDefault(); window.open(a.href, "_blank"); });
    });
  }

  _saveFontSettings() {
    try {
      globalThis.localStorage?.setItem(FONT_SETTINGS_STORAGE_KEY, JSON.stringify(this._fontSettings));
    } catch {
      // Ignore storage failures; live UI updates still work.
    }
  }

  _applyFontSettingsCssVars() {
    const el = this.element;
    if (!el) return;
    const target = el.querySelector(".dhac-layout") ?? el;
    target.style.setProperty("--dhac-font-name-input", `${this._fontSettings.nameInput}px`);
    target.style.setProperty("--dhac-font-feature-name", `${this._fontSettings.featureName}px`);
    target.style.setProperty("--dhac-font-feature-type", `${this._fontSettings.featureType}px`);
    target.style.setProperty("--dhac-font-feature-description", `${this._fontSettings.featureDescription}px`);
    target.style.setProperty("--dhac-font-feature-pills", `${this._fontSettings.featurePills}px`);
    target.style.setProperty("--dhac-font-labels", `${this._fontSettings.labels}px`);
    // Apply saved glass opacity
    try {
      const saved = globalThis.localStorage?.getItem(GLASS_OPACITY_STORAGE_KEY);
      const val = saved !== null ? Math.max(10, Math.min(100, Number(saved))) : DEFAULT_GLASS_OPACITY;
      el.style.setProperty("--dhac-glass-opacity", val / 100);
    } catch {}
  }

  _ensureHeaderFontSettingsControl() {
    const content = this.element;
    if (!content) return;
    const appWindow = content.closest(".application");
    const header = appWindow?.querySelector(".window-header");
    if (!header) return;

    let wrap = header.querySelector(".dhac-header-settings-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "dhac-header-settings-wrap";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "header-control dhac-header-settings-btn";
      button.title = "Font size settings";
      button.setAttribute("aria-label", "Font size settings");
      button.innerHTML = `<i class="fas fa-cog"></i>`;

      const panel = document.createElement("div");
      panel.className = "dhac-header-settings-panel";
      panel.innerHTML = `
        <div class="dhac-font-settings-title">Appearance</div>
        <div class="dhac-font-settings-grid">
          <label class="dhac-font-setting-row">
            <span>Glass Opacity</span>
            <input type="range" min="10" max="100" step="1" data-glass-key="opacity">
            <output data-glass-output="opacity"></output>
            <button type="button" class="dhac-setting-reset-btn" data-glass-reset="opacity" title="Reset to default"><i class="fas fa-rotate-left"></i></button>
          </label>
        </div>
        <div class="dhac-font-settings-title" style="margin-top:10px">Font Sizes</div>
        <div class="dhac-font-settings-grid">
          ${this._fontSettingRowHtml("Adversary Name", "nameInput")}
          ${this._fontSettingRowHtml("Feature Name", "featureName")}
          ${this._fontSettingRowHtml("Feature Type", "featureType")}
          ${this._fontSettingRowHtml("Feature Text", "featureDescription")}
          ${this._fontSettingRowHtml("Feature Buttons", "featurePills")}
          ${this._fontSettingRowHtml("Small Labels", "labels")}
        </div>
        <button type="button" class="dhac-font-settings-reset" data-font-action="reset">Reset All Defaults</button>
      `;

      button.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this._fontSettingsPanelOpen = !this._fontSettingsPanelOpen;
        this._syncFontSettingsPanel(wrap);
      });

      const stopHeaderDrag = (ev) => ev.stopPropagation();
      panel.addEventListener("click", stopHeaderDrag);
      panel.addEventListener("pointerdown", stopHeaderDrag, true);
      panel.addEventListener("mousedown", stopHeaderDrag, true);
      panel.addEventListener("input", (ev) => {
        const input = ev.target;
        if (!(input instanceof HTMLInputElement)) return;
        if (input.dataset.fontKey !== undefined) {
          this._fontSettings[input.dataset.fontKey] = Math.max(9, Math.min(24, Number(input.value) || 0));
          this._applyFontSettingsCssVars();
          this._saveFontSettings();
        } else if (input.dataset.glassKey !== undefined) {
          const val = Math.max(10, Math.min(100, Number(input.value) || DEFAULT_GLASS_OPACITY));
          this.element.style.setProperty("--dhac-glass-opacity", val / 100);
          try { globalThis.localStorage?.setItem(GLASS_OPACITY_STORAGE_KEY, String(val)); } catch {}
        }
        this._syncFontSettingsPanel(wrap);
      });
      panel.addEventListener("click", (ev) => {
        // Per-row font reset
        const fontReset = ev.target?.closest?.("[data-font-reset]");
        if (fontReset) {
          const key = fontReset.dataset.fontReset;
          if (key in DEFAULT_FONT_SETTINGS) {
            this._fontSettings[key] = DEFAULT_FONT_SETTINGS[key];
            this._applyFontSettingsCssVars();
            this._saveFontSettings();
            this._syncFontSettingsPanel(wrap);
          }
          return;
        }
        // Per-row glass opacity reset
        const glassReset = ev.target?.closest?.("[data-glass-reset]");
        if (glassReset) {
          this.element.style.setProperty("--dhac-glass-opacity", DEFAULT_GLASS_OPACITY / 100);
          try { globalThis.localStorage?.removeItem(GLASS_OPACITY_STORAGE_KEY); } catch {}
          this._syncFontSettingsPanel(wrap);
          return;
        }
        // Reset all defaults
        const resetAll = ev.target?.closest?.("[data-font-action='reset']");
        if (!resetAll) return;
        this._fontSettings = { ...DEFAULT_FONT_SETTINGS };
        this._applyFontSettingsCssVars();
        this._saveFontSettings();
        this.element.style.setProperty("--dhac-glass-opacity", DEFAULT_GLASS_OPACITY / 100);
        try { globalThis.localStorage?.removeItem(GLASS_OPACITY_STORAGE_KEY); } catch {}
        this._syncFontSettingsPanel(wrap);
      });

      const closePanel = (ev) => {
        if (!this._fontSettingsPanelOpen) return;
        if (!wrap.contains(ev.target)) {
          this._fontSettingsPanelOpen = false;
          this._syncFontSettingsPanel(wrap);
        }
      };
      document.addEventListener("pointerdown", closePanel);
      wrap._dhacClosePanelHandler = closePanel;

      wrap.append(button, panel);
      const closeBtn = header.querySelector(".header-control[data-action='close'], .header-control.close, [data-action='close'].header-control, .window-title + .header-control:last-child");
      if (closeBtn && closeBtn !== wrap) header.insertBefore(wrap, closeBtn);
      else header.append(wrap);
    }

    // Re-position on subsequent renders in case Foundry rebuilt/reordered header controls.
    const closeBtn = header.querySelector(".header-control[data-action='close'], .header-control.close, [data-action='close'].header-control");
    if (closeBtn && wrap.nextElementSibling !== closeBtn) {
      header.insertBefore(wrap, closeBtn);
    }
    this._syncFontSettingsPanel(wrap);
  }

  _fontSettingRowHtml(label, key) {
    return `
      <label class="dhac-font-setting-row">
        <span>${label}</span>
        <input type="range" min="9" max="24" step="1" data-font-key="${key}">
        <output data-font-output="${key}"></output>
        <button type="button" class="dhac-setting-reset-btn" data-font-reset="${key}" title="Reset to default"><i class="fas fa-rotate-left"></i></button>
      </label>
    `;
  }

  _syncFontSettingsPanel(wrap) {
    if (!wrap) return;
    wrap.classList.toggle("is-open", this._fontSettingsPanelOpen);
    const button = wrap.querySelector(".dhac-header-settings-btn");
    if (button) {
      button.classList.toggle("is-open", this._fontSettingsPanelOpen);
      button.setAttribute("aria-expanded", this._fontSettingsPanelOpen ? "true" : "false");
    }

    // Sync font sliders
    for (const [key, value] of Object.entries(this._fontSettings)) {
      const input = wrap.querySelector(`input[data-font-key='${key}']`);
      if (input && input.value !== String(value)) input.value = String(value);
      const output = wrap.querySelector(`[data-font-output='${key}']`);
      if (output) output.textContent = `${value}px`;
    }

    // Sync glass opacity slider
    let glassVal = DEFAULT_GLASS_OPACITY;
    try {
      const saved = globalThis.localStorage?.getItem(GLASS_OPACITY_STORAGE_KEY);
      if (saved !== null) glassVal = Math.max(10, Math.min(100, Number(saved)));
    } catch {}
    const glassInput = wrap.querySelector("input[data-glass-key='opacity']");
    if (glassInput && glassInput.value !== String(glassVal)) glassInput.value = String(glassVal);
    const glassOutput = wrap.querySelector("[data-glass-output='opacity']");
    if (glassOutput) glassOutput.textContent = `${glassVal}%`;
    // Apply to window on first open in case CSS default hasn't been overridden yet
    if (this.element) this.element.style.setProperty("--dhac-glass-opacity", glassVal / 100);
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
    const prevDamageByKey = new Map(prevDamageRolls.map(d => [`${d.formula}|${d.type}`, d]));
    const prevReactionByTrait = new Map(prevReactionRolls.map(r => [r.trait, r]));

    // Detect damage patterns:
    // Tag syntax:    damage:2d8+4 phy
    // Natural lang:  2d8+4 physical damage, 1d10+3 magic damage, deal 2d6 damage
    const damagePatterns = [
      // Tag syntax (backward compat)
      /damage:(\d+d\d+(?:[+-]\d+)?)(?:\s+(phy|mag|physical|magical))?/gi,
      // Natural language: "XdY+Z physical/magic damage" or "XdY+Z direct physical/magic damage"
      /(\d+d\d+(?:\s*[+-]\s*\d+)?)\s+(?:direct\s+)?(physical|magic(?:al)?)\s+damage/gi,
      // Plain: "XdY+Z damage" (no type = physical)
      /(\d+d\d+(?:\s*[+-]\s*\d+)?)\s+damage/gi,
    ];
    const newDamageRolls = [];
    const seenDamageKeys = new Set();
    for (const regex of damagePatterns) {
      let m;
      while ((m = regex.exec(desc)) !== null) {
        const formula = m[1].replace(/\s/g, "");
        const rawType = m[2] || "";
        const type = rawType.startsWith("mag") ? "mag" : "phy";
        const key = `${formula}|${type}`;
        if (seenDamageKeys.has(key)) continue;
        seenDamageKeys.add(key);
        const existing = prevDamageByKey.get(key);
        newDamageRolls.push({ formula, type, enabled: existing ? existing.enabled : true });
      }
    }
    if (mergeWithExisting) {
      for (const d of prevDamageRolls) {
        const key = `${d.formula}|${d.type}`;
        if (seenDamageKeys.has(key)) continue;
        seenDamageKeys.add(key);
        newDamageRolls.push(d);
      }
    }
    f.damageRolls = newDamageRolls;

    // Detect "<trait> reaction roll" natural language patterns
    const reactionRegex = /\b(strength|instinct|knowledge|finesse|presence|agility)\s+reaction(?:\s+rolls?)?\b/gi;
    const newReactionRolls = [];
    const seenReactionTraits = new Set();
    let m;
    while ((m = reactionRegex.exec(desc)) !== null) {
      const trait = m[1].toLowerCase();
      if (seenReactionTraits.has(trait)) continue;
      seenReactionTraits.add(trait);
      const existing = prevReactionByTrait.get(trait);
      newReactionRolls.push({ trait, enabled: existing ? existing.enabled : true });
    }
    if (mergeWithExisting) {
      for (const r of prevReactionRolls) {
        if (seenReactionTraits.has(r.trait)) continue;
        seenReactionTraits.add(r.trait);
        newReactionRolls.push(r);
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
    const minionPassiveEl = html.querySelector("[name='minionPassiveValue']");
    if (minionPassiveEl) s.minionPassiveValue = Math.max(0, Number(minionPassiveEl.value) || 0);
    s.stress = Number(html.querySelector("[name='stress']")?.value) || 0;
    s.atk = Number(html.querySelector("[name='atk']")?.value) || 0;
    s.weaponImg = html.querySelector("[name='weaponImg']")?.value ?? s.weaponImg;
    s.weaponName = html.querySelector("[name='weaponName']")?.value ?? s.weaponName;
    s.weaponRange = html.querySelector("[name='weaponRange']")?.value ?? s.weaponRange;
    s.weaponDamageDice = html.querySelector("[name='weaponDamageDice']")?.value ?? s.weaponDamageDice;
    s.weaponDamageCount = Number(html.querySelector("[name='weaponDamageCount']")?.value) || 1;
    s.weaponDamageBonus = Number(html.querySelector("[name='weaponDamageBonus']")?.value) || 0;
    const flatEl = html.querySelector("[name='weaponDamageFlat']");
    if (flatEl) s.weaponDamageFlat = Number(flatEl.value) || 0;
    s.weaponDamageType = html.querySelector("[name='weaponDamageType']")?.value ?? s.weaponDamageType;
    const groupDmgEl = html.querySelector("[name='groupAttackDamage']");
    if (groupDmgEl) s.groupAttackDamage = Number(groupDmgEl.value) || 0;
    const groupTypeEl = html.querySelector("[name='groupAttackType']");
    if (groupTypeEl) s.groupAttackType = groupTypeEl.value ?? s.groupAttackType;
    const hordeDmgEl = html.querySelector("[name='hordeDamage']");
    if (hordeDmgEl) s.hordeDamage = hordeDmgEl.value;
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
      const diceStr = benchmark.dice[0];
      const diceM = diceStr.match(/^(\d*)d(\d+)(?:\+(\d+))?$/);
      const flatM = diceStr.match(/^(\d+)\s*[–-]\s*(\d+)/);
      if (diceM) {
        s.weaponDamageCount = parseInt(diceM[1]) || 1;
        s.weaponDamageDice = `d${diceM[2]}`;
        s.weaponDamageBonus = parseInt(diceM[3]) || 0;
      } else if (flatM) {
        const mid = Math.round((parseInt(flatM[1]) + parseInt(flatM[2])) / 2);
        s.weaponDamageFlat = mid;
        s.minionPassiveValue = mid;
        s.groupAttackDamage = mid;
      }
    }
    this.render();
  }

  static _onAddFeature() {
    this._readForm();
    this._state.features.push(AdversaryCreatorApp._newFeature());
    this.render();
  }

  static _onAddCommonFeatures() {
    this._readForm();
    const role = this._state.role;
    const templates = ROLE_FEATURES[role];
    if (!templates || templates.length === 0) {
      ui.notifications.info(`No common features defined for role: ${role}`);
      return;
    }
    // Remove any empty placeholder features first
    this._state.features = this._state.features.filter(f => f.name.trim() || f.description.trim());
    // Add each common feature
    for (const tmpl of templates) {
      const f = AdversaryCreatorApp._newFeature();
      f.name = tmpl.name;
      f.formType = tmpl.formType;
      f.description = tmpl.description;
      f._mergeAutoDetectOnFirstRender = true;
      this._state.features.push(f);
    }
    // Ensure at least one feature exists
    if (this._state.features.length === 0) {
      this._state.features.push(AdversaryCreatorApp._newFeature());
    }
    this.render();
    ui.notifications.info(`Added ${templates.length} common ${role} feature(s).`);
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

  static _openImagePicker(current, onPick, slotType = "actor") {
    new ImageFavoritesPicker(current, onPick, slotType).render(true);
  }

  static _onPickActorImage() {
    this._readForm();
    const Picker = globalThis.FilePicker ?? foundry?.applications?.apps?.FilePicker;
    if (!Picker) return;
    new Picker({
      type: "imagevideo",
      current: this._state.img || DEFAULT_ACTOR_ICON,
      callback: (path) => {
        this._state.img = path || DEFAULT_ACTOR_ICON;
        this.render();
      },
    }).render(true);
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
    }, "feature");
  }

  static _onResetFeatureImage(event, target) {
    this._readForm();
    const fi = Number(target.dataset.featureIndex);
    const feature = this._state.features[fi];
    if (!feature) return;
    feature.img = getDefault("feature") || DEFAULT_FEATURE_ICON;
    this.render();
  }

  static _onPickAttackImage() {
    this._readForm();
    AdversaryCreatorApp._openImagePicker(this._state.weaponImg || DEFAULT_ATTACK_ICON, (path) => {
      this._state.weaponImg = path || DEFAULT_ATTACK_ICON;
      this.render();
    }, "attack");
  }

  static _onResetAttackImage() {
    this._readForm();
    this._state.weaponImg = getDefault("attack") || DEFAULT_ATTACK_ICON;
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

  static _onToggleHordeAutoHalve() {
    this._readForm();
    this._state.hordeAutoHalve = !this._state.hordeAutoHalve;
    if (this._state.hordeAutoHalve) this._state.hordeDamage = "";
    this.render();
  }

  static _onToggleGroupAttackType(event, target) {
    this._readForm();
    const type = target.dataset.type;
    if (!type) return;
    this._state.groupAttackType = type;
    // Update hidden input
    const hidden = this.element?.querySelector("[name='groupAttackType']");
    if (hidden) hidden.value = type;
    // Update type span in description
    const typeSpan = this.element?.querySelector(".dhac-pinned-group-type");
    if (typeSpan) typeSpan.textContent = type;
    // Swap button active states without full re-render
    this.element?.querySelectorAll(".dhac-type-toggle").forEach(btn => {
      btn.classList.toggle("is-on", btn.dataset.type === type);
    });
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
      minionPassiveValue: 4,
      groupAttackDamage: 4, groupAttackType: "physical",
      weaponImg: getDefault("attack") || DEFAULT_ATTACK_ICON,
    weaponName: "", weaponRange: "melee",
      weaponDamageDice: "d8", weaponDamageCount: 1, weaponDamageBonus: 3,
      weaponDamageFlat: 4,
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
      hordeAutoHalve: true,
      hordeDamage: "",
    };
    this.render();
  }

  // ==================================================================
  // Build Feature for Foundryborne
  // ==================================================================

  static _buildFeatureItem(feature, featureIndex) {
    const actions = {};
    let desc = feature.description;
    // Convert <name> placeholder to Foundry's @Lookup tag
    desc = desc.replace(/<name>/gi, "@Lookup[@name]");
    // Process markdown-style formatting: ***bold italic***, **italic**, *bold*
    // (Daggerheart SRD uses bold for dice, bold for game terms)
    desc = desc.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    desc = desc.replace(/\*\*(.+?)\*\*/g, '<em>$1</em>');
    desc = desc.replace(/\*(.+?)\*/g, '<strong>$1</strong>');

    // Replace damage: tag prefix with inline rolls
    desc = desc.replace(/damage:(\d+d\d+(?:[+-]\d+)?)/gi, (match, formula) => {
      return `[[/r ${formula}]]`;
    });

    // Wrap dice notation that appears before "damage" (natural language) as inline rolls
    // e.g. "2d8+4 physical damage" → "[[/r 2d8+4]] physical damage"
    desc = desc.replace(/\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\b(?=\s+(?:direct\s+)?(?:physical|magic(?:al)?)\s+damage)/gi, (match, formula) => {
      const clean = formula.replace(/\s/g, "");
      return `[[/r ${clean}]]`;
    });

    // Wrap any remaining bare dice not already in [[ ]]
    desc = desc.replace(/\b(\d+d\d+\s*[+-]\s*\d+)\b(?![^\[]*\]\])/g, (m, f) => `[[/r ${f.replace(/\s/g, "")}]]`);
    desc = desc.replace(/\b(\d+d\d+)\b(?!\s*[+-])(?![^\[]*\]\])/g, '[[/r $1]]');

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
        resources: { hitPoints: { max: s.role === "minion" ? 1 : s.hp }, stress: { max: s.stress } },
        attack: {
          name: s.weaponName, range: s.weaponRange,
          roll: { type: "attack", bonus: String(s.atk) },
          img: s.weaponImg || DEFAULT_ATTACK_ICON,
          damage: {
            parts: [{
              value: s.role === "minion"
                ? { custom: { enabled: true, formula: String(s.weaponDamageFlat) }, multiplier: "flat", flatMultiplier: 1, dice: "d6", bonus: null }
                : { custom: { enabled: false, formula: "" }, flatMultiplier: s.weaponDamageCount, dice: s.weaponDamageDice, bonus: s.weaponDamageBonus || null, multiplier: "flat" },
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

      const autoItems = [];
      if (s.role === "horde") {
        const hordeDmg = (s.hordeAutoHalve ?? true)
          ? AdversaryCreatorApp._computeHordeHalvedDice(s)
          : (s.hordeDamage || AdversaryCreatorApp._computeHordeHalvedDice(s));
        autoItems.push({
          name: "Horde",
          type: "feature",
          img: DEFAULT_FEATURE_ICON,
          flags: { [MODULE_ID]: { autoHorde: true } },
          system: {
            featureForm: "passive",
            description: `<p>When the @Lookup[@name] have marked half or more of their HP, their standard attack deals [[/r ${hordeDmg}]] ${s.weaponDamageType || "physical"} damage instead.</p>`,
          },
        });
      }
      if (s.role === "minion") {
        const passiveVal = s.minionPassiveValue || 1;
        const flatDmg = s.weaponDamageFlat;
        const groupDmg = s.groupAttackDamage ?? flatDmg;
        const groupType = s.groupAttackType ?? "physical";
        const fearId = foundry.utils.randomID(16);
        autoItems.push({
          name: `Minion(${passiveVal})`,
          type: "feature",
          img: DEFAULT_FEATURE_ICON,
          flags: { [MODULE_ID]: { autoMinion: true } },
          system: {
            featureForm: "passive",
            description: `<p>This adversary is defeated when they take any damage. For every <strong>${passiveVal}</strong> damage a PC deals to this adversary, defeat an additional Minion within range the attack would succeed against.</p>`,
          },
        });
        autoItems.push({
          name: "Group Attack",
          type: "feature",
          img: DEFAULT_FEATURE_ICON,
          flags: { [MODULE_ID]: { autoMinion: true } },
          system: {
            featureForm: "action",
            description: `<p>Spend a Fear to choose a target and spotlight all adversaries within Close range of them. Those Minions move into Melee range of the target and make one shared attack roll. On a success, they deal [[/r ${groupDmg}]] ${groupType} damage each. Combine this damage.</p>`,
            actions: {
              [fearId]: {
                type: "effect", _id: fearId, systemPath: "actions", baseAction: false,
                description: "", chatDisplay: true, originItem: { type: "itemCollection" },
                actionType: "action", triggers: [],
                cost: [{ scalable: false, key: "fear", value: 1, itemId: null, step: null, consumeOnSuccess: false }],
                uses: { value: null, max: "", recovery: null, consumeOnSuccess: false },
                effects: [], target: { type: "any", amount: null },
                name: "Spend Fear", range: "",
              },
            },
          },
        });
      }

      const items = [
        ...autoItems,
        ...s.features
          .filter(f => f.name.trim() || f.description.trim())
          .map((f, i) => AdversaryCreatorApp._buildFeatureItem(f, i)),
      ];

      const actorData = {
        name: s.name.trim(), type: "adversary",
        system: systemData, items, effects: AdversaryCreatorApp._buildResistanceEffects(s.effects), img: s.img || DEFAULT_ACTOR_ICON,
        ...(s.role === "minion" ? { flags: { [MODULE_ID]: { minionPassiveValue: s.minionPassiveValue, groupAttackDamage: s.groupAttackDamage, groupAttackType: s.groupAttackType } } } : {}),
        ...(s.role === "horde" ? { flags: { [MODULE_ID]: { hordeAutoHalve: s.hordeAutoHalve ?? true, hordeDamage: s.hordeDamage ?? "" } } } : {}),
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
          ...(s.role === "minion" ? {
            [`flags.${MODULE_ID}.minionPassiveValue`]: s.minionPassiveValue,
            [`flags.${MODULE_ID}.groupAttackDamage`]: s.groupAttackDamage,
            [`flags.${MODULE_ID}.groupAttackType`]: s.groupAttackType,
          } : {}),
          ...(s.role === "horde" ? {
            [`flags.${MODULE_ID}.hordeAutoHalve`]: s.hordeAutoHalve ?? true,
            [`flags.${MODULE_ID}.hordeDamage`]: s.hordeDamage ?? "",
          } : {}),
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
      .filter(item => item.type === "feature" && !item.flags?.[MODULE_ID]?.autoMinion && !item.flags?.[MODULE_ID]?.autoHorde)
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
      minionPassiveValue: Number(actor.flags?.[MODULE_ID]?.minionPassiveValue) || 4,
      groupAttackDamage: Number(actor.flags?.[MODULE_ID]?.groupAttackDamage) || 4,
      groupAttackType: actor.flags?.[MODULE_ID]?.groupAttackType ?? "physical",
      hordeAutoHalve: actor.flags?.[MODULE_ID]?.hordeAutoHalve ?? true,
      hordeDamage: actor.flags?.[MODULE_ID]?.hordeDamage ?? "",
      stress: Number(system.resources?.stress?.max) || 0,
      atk: Number.parseInt(attack.roll?.bonus, 10) || 0,
      weaponImg: attack.img ?? DEFAULT_ATTACK_ICON,
      weaponName: attack.name ?? "",
      weaponRange: attack.range ?? "melee",
      weaponDamageDice: damageValue.dice ?? "d8",
      weaponDamageCount: Number(damageValue.flatMultiplier) || 1,
      weaponDamageBonus: Number(damageValue.bonus) || 0,
      weaponDamageFlat: damageValue.custom?.enabled ? (Number(damageValue.custom.formula) || 0) : 4,
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

    for (const effect of actor.effects ?? []) {
      for (const change of (Array.isArray(effect.changes) ? effect.changes : [])) {
        const v = Number(change?.value);
        switch (change?.key) {
          case "system.rules.damageReduction.reduceSeverity.physical":
            if (v >= 1 && v <= 3) { state.physicalSeverityReductionEnabled = true; state.physicalSeverityReduction = v; }
            break;
          case "system.rules.damageReduction.reduceSeverity.magical":
            if (v >= 1 && v <= 3) { state.magicSeverityReductionEnabled = true; state.magicSeverityReduction = v; }
            break;
          case "system.resistance.physical.resistance":   if (v === 1) state.physicalResistance = true; break;
          case "system.resistance.magical.resistance":    if (v === 1) state.magicResistance = true; break;
          case "system.resistance.physical.immunity":     if (v === 1) state.physicalImmunity = true; break;
          case "system.resistance.magical.immunity":      if (v === 1) state.magicImmunity = true; break;
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

  async close(options) {
    const content = this.element;
    const headerWrap = content?.closest(".application")?.querySelector(".dhac-header-settings-wrap");
    const closePanel = headerWrap?._dhacClosePanelHandler;
    if (typeof closePanel === "function") {
      document.removeEventListener("pointerdown", closePanel);
    }
    if (this._roleTipClickOutsideHandler) {
      document.removeEventListener("pointerdown", this._roleTipClickOutsideHandler);
      this._roleTipClickOutsideHandler = null;
    }
    return super.close(options);
  }
}














