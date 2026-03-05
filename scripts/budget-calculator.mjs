const MODULE_ID = "one-minute-adversaries";

const ROLE_COSTS = {
  minion:   1,
  social:   1,
  support:  1,
  horde:    2,
  ranged:   2,
  skulk:    2,
  standard: 2,
  leader:   3,
  bruiser:  4,
  solo:     5,
};

const ADJUSTMENTS = [
  { key: "lowerTier",      bp:  1, description: "Lower tier adversary in the encounter" },
  { key: "noToughies",     bp:  1, description: "No big boys: no Bruisers, Hordes, Leaders, or Solos" },
  { key: "moreDangerous",  bp:  2, description: "More dangerous: fight should be more dangerous or last longer" },
  { key: "lessDifficult",  bp: -1, description: "Less difficult: fight should be less difficult or shorter" },
  { key: "manySolos",      bp: -2, description: "Many solos: using 2 or more Solo adversaries" },
  { key: "increaseDamage", bp: -2, description: "Increase damage: add +1d4 (or static +2) to all adversaries' damage rolls" },
];

// Base budget: 1→5, 2→8, 3→11... (3n+2)
function calcBudget(players, adjustments, customBP) {
  const base = Math.max(1, players) * 3 + 2;
  const adjTotal = ADJUSTMENTS
    .filter(a => adjustments[a.key])
    .reduce((sum, a) => sum + a.bp, 0);
  return base + adjTotal + (customBP || 0);
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class AdversaryBudgetCalculator extends HandlebarsApplicationMixin(ApplicationV2) {
  _players = 4;
  _counts = Object.fromEntries(Object.keys(ROLE_COSTS).map(r => [r, 0]));
  _adjustments = Object.fromEntries(ADJUSTMENTS.map(a => [a.key, false]));
  _customBP = 0;

  static DEFAULT_OPTIONS = {
    id: "dhac-budget-calculator",
    window: { title: "Adversary Budget Calculator", icon: "fas fa-scale-balanced", resizable: true },
    position: { width: 500, height: "auto" },
    actions: {
      increment:            AdversaryBudgetCalculator._onIncrement,
      decrement:            AdversaryBudgetCalculator._onDecrement,
      incrementPlayers:     AdversaryBudgetCalculator._onIncrementPlayers,
      decrementPlayers:     AdversaryBudgetCalculator._onDecrementPlayers,
      incrementCustom:      AdversaryBudgetCalculator._onIncrementCustom,
      decrementCustom:      AdversaryBudgetCalculator._onDecrementCustom,
      reset:                AdversaryBudgetCalculator._onReset,
    },
  };

  static PARTS = {
    form: { template: `modules/${MODULE_ID}/templates/budget-calculator.hbs` },
  };

  async _prepareContext() {
    const budget = calcBudget(this._players, this._adjustments, this._customBP);
    const spent = Object.entries(this._counts)
      .reduce((sum, [role, count]) => sum + count * ROLE_COSTS[role], 0);
    const remaining = budget - spent;
    const percentUsed = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
    const overview = Object.entries(this._counts)
      .filter(([, count]) => count > 0)
      .map(([role, count]) => ({
        label: role.charAt(0).toUpperCase() + role.slice(1),
        count,
        total: count * ROLE_COSTS[role],
      }));

    return {
      players: this._players,
      budget,
      spent,
      remaining,
      remainingAbs: Math.abs(remaining),
      isOver: remaining < 0,
      percentUsed,
      customBP: this._customBP,
      customBPLabel: this._customBP > 0 ? `+${this._customBP}` : String(this._customBP),
      hasAny: overview.length > 0,
      overview,
      roles: Object.entries(ROLE_COSTS).map(([role, cost]) => ({
        role,
        label: role.charAt(0).toUpperCase() + role.slice(1),
        cost,
        count: this._counts[role],
      })),
      adjustments: ADJUSTMENTS.map(a => ({
        key: a.key,
        bp: a.bp,
        bpLabel: (a.bp > 0 ? "+" : "") + a.bp,
        positive: a.bp > 0,
        description: a.description,
        active: this._adjustments[a.key],
      })),
    };
  }

  _onRender(context, options) {
    const html = this.element;
    if (!html) return;
    // Wire checkboxes manually since data-action change events aren't auto-bound
    html.querySelectorAll("[data-action='toggleAdjustment']").forEach(cb => {
      cb.addEventListener("change", () => {
        this._adjustments[cb.dataset.key] = cb.checked;
        cb.closest(".dhac-bc-adj-row")?.classList.toggle("is-on", cb.checked);
        this._updateDisplay();
      });
    });
    // Apply gradient to fill on first render
    this._applyFillGradient();
  }

  _applyFillGradient() {
    const html = this.element;
    if (!html) return;
    const bar = html.querySelector(".dhac-bc-bar");
    const fill = html.querySelector(".dhac-bc-fill");
    if (!bar || !fill) return;
    const w = bar.offsetWidth || 300;
    fill.style.backgroundImage = "linear-gradient(to right, #f5c542 0%, #3b82f6 55%, #7c3aed 100%)";
    fill.style.backgroundSize = `${w}px 100%`;
    fill.style.backgroundPosition = "left center";
    fill.style.backgroundRepeat = "no-repeat";
  }

  _updateDisplay() {
    const html = this.element;
    if (!html) return;
    const budget = calcBudget(this._players, this._adjustments, this._customBP);
    const spent = Object.entries(this._counts)
      .reduce((sum, [role, count]) => sum + count * ROLE_COSTS[role], 0);
    const remaining = budget - spent;
    const percentUsed = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
    const isOver = remaining < 0;

    const el = sel => html.querySelector(sel);
    if (el(".dhac-bc-budget"))        el(".dhac-bc-budget").textContent        = budget;
    if (el(".dhac-bc-spent"))         el(".dhac-bc-spent").textContent         = spent;
    if (el(".dhac-bc-remaining"))     el(".dhac-bc-remaining").textContent     = Math.abs(remaining);
    if (el(".dhac-bc-player-count"))  el(".dhac-bc-player-count").textContent  = this._players;
    if (el(".dhac-bc-custom-val"))    el(".dhac-bc-custom-val").textContent    = this._customBP > 0 ? `+${this._customBP}` : String(this._customBP);

    const statusRow = el(".dhac-bc-status");
    if (statusRow) {
      statusRow.classList.toggle("is-over", isOver);
      const icon = statusRow.querySelector("i");
      if (icon) icon.className = isOver ? "fas fa-triangle-exclamation" : "fas fa-check-circle";
      const label = statusRow.querySelector(".dhac-bc-status-label");
      if (label) label.textContent = isOver ? "Over budget by" : "Remaining";
    }

    const fill = el(".dhac-bc-fill");
    if (fill) {
      fill.style.width = percentUsed + "%";
      if (isOver) {
        fill.style.backgroundImage = "";
        fill.style.background = "#dc2626";
      } else {
        fill.style.background = "";
        this._applyFillGradient();
      }
    }

    // Update overview
    const overviewList = el(".dhac-bc-overview-list");
    const overviewEmpty = el(".dhac-bc-ov-empty");
    const overview = Object.entries(this._counts)
      .filter(([, count]) => count > 0)
      .map(([role, count]) => ({ role, count, total: count * ROLE_COSTS[role] }));

    if (overviewList) {
      overviewList.style.display = overview.length ? "" : "none";
      overviewList.innerHTML = overview.map(({ role, count, total }) =>
        `<div class="dhac-bc-ov-row">
          <span class="dhac-bc-ov-label">${role.charAt(0).toUpperCase() + role.slice(1)}</span>
          <span class="dhac-bc-ov-count">×${count}</span>
          <span class="dhac-bc-ov-total">${total} BP</span>
        </div>`
      ).join("");
    }
    if (overviewEmpty) overviewEmpty.style.display = overview.length ? "none" : "";
  }

  static _onIncrement(event, target) {
    const role = target.dataset.role;
    if (!role) return;
    this._counts[role] = (this._counts[role] || 0) + 1;
    const countEl = this.element?.querySelector(`[data-count-role="${role}"]`);
    if (countEl) countEl.textContent = this._counts[role];
    this.element?.querySelector(`.dhac-bc-dec[data-role="${role}"]`)?.removeAttribute("disabled");
    target.closest(".dhac-bc-role-row")?.classList.add("has-count");
    this._updateDisplay();
  }

  static _onDecrement(event, target) {
    const role = target.dataset.role;
    if (!role) return;
    this._counts[role] = Math.max(0, (this._counts[role] || 0) - 1);
    const countEl = this.element?.querySelector(`[data-count-role="${role}"]`);
    if (countEl) countEl.textContent = this._counts[role];
    if (this._counts[role] === 0) {
      target.setAttribute("disabled", "");
      target.closest(".dhac-bc-role-row")?.classList.remove("has-count");
    }
    this._updateDisplay();
  }

  static _onIncrementPlayers()   { this._players = Math.min(10, this._players + 1); this._updateDisplay(); }
  static _onDecrementPlayers()   { this._players = Math.max(1, this._players - 1);  this._updateDisplay(); }
  static _onIncrementCustom()    { this._customBP += 1; this._updateDisplay(); }
  static _onDecrementCustom()    { this._customBP -= 1; this._updateDisplay(); }

  static _onReset() {
    this._counts      = Object.fromEntries(Object.keys(ROLE_COSTS).map(r => [r, 0]));
    this._adjustments = Object.fromEntries(ADJUSTMENTS.map(a => [a.key, false]));
    this._customBP    = 0;
    this.render();
  }
}
