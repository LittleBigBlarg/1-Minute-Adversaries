const MODULE_ID = "one-minute-adversaries";

// BP costs sourced from CONFIG.DH.ENCOUNTER.adversaryTypeCostBrackets (Daggerheart v1.7.2)
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

// Base budget from CONFIG.DH.ENCOUNTER.BaseBPPerEncounter: 1→5, 2→8, 3→11... (3n+2)
function calcBudget(players) {
  return Math.max(1, players) * 3 + 2;
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class AdversaryBudgetCalculator extends HandlebarsApplicationMixin(ApplicationV2) {
  _players = 4;
  _counts = Object.fromEntries(Object.keys(ROLE_COSTS).map(r => [r, 0]));

  static DEFAULT_OPTIONS = {
    id: "dhac-budget-calculator",
    window: { title: "Adversary Budget Calculator", icon: "fas fa-scale-balanced", resizable: false },
    position: { width: 300, height: "auto" },
    actions: {
      increment: AdversaryBudgetCalculator._onIncrement,
      decrement: AdversaryBudgetCalculator._onDecrement,
      reset: AdversaryBudgetCalculator._onReset,
    },
  };

  static PARTS = {
    form: { template: `modules/${MODULE_ID}/templates/budget-calculator.hbs` },
  };

  async _prepareContext() {
    const budget = calcBudget(this._players);
    const spent = Object.entries(this._counts)
      .reduce((sum, [role, count]) => sum + count * ROLE_COSTS[role], 0);
    const remaining = budget - spent;
    const percentUsed = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

    return {
      players: this._players,
      budget,
      spent,
      remaining,
      remainingAbs: Math.abs(remaining),
      isOver: remaining < 0,
      percentUsed,
      roles: Object.entries(ROLE_COSTS).map(([role, cost]) => ({
        role,
        label: role.charAt(0).toUpperCase() + role.slice(1),
        cost,
        count: this._counts[role],
      })),
    };
  }

  _onRender(context, options) {
    const html = this.element;
    if (!html) return;
    const playersInput = html.querySelector("[name='players']");
    if (playersInput) {
      playersInput.addEventListener("input", () => {
        const val = Math.max(1, Math.min(10, Number(playersInput.value) || 1));
        this._players = val;
        this._updateDisplay();
      });
    }
  }

  _updateDisplay() {
    const html = this.element;
    if (!html) return;
    const budget = calcBudget(this._players);
    const spent = Object.entries(this._counts)
      .reduce((sum, [role, count]) => sum + count * ROLE_COSTS[role], 0);
    const remaining = budget - spent;
    const percentUsed = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
    const isOver = remaining < 0;

    const el = (sel) => html.querySelector(sel);
    if (el(".dhac-bc-budget")) el(".dhac-bc-budget").textContent = budget;
    if (el(".dhac-bc-spent")) el(".dhac-bc-spent").textContent = spent;
    if (el(".dhac-bc-remaining")) el(".dhac-bc-remaining").textContent = Math.abs(remaining);

    const statusRow = el(".dhac-bc-status");
    if (statusRow) {
      statusRow.classList.toggle("is-over", isOver);
      const icon = statusRow.querySelector("i");
      if (icon) {
        icon.className = isOver ? "fas fa-triangle-exclamation" : "fas fa-check-circle";
      }
      const label = statusRow.querySelector(".dhac-bc-status-label");
      if (label) label.textContent = isOver ? "Over budget by" : "Remaining";
    }

    const fill = el(".dhac-bc-fill");
    if (fill) {
      fill.style.width = percentUsed + "%";
      fill.classList.toggle("is-over", isOver);
    }
  }

  static _onIncrement(event, target) {
    const role = target.dataset.role;
    if (!role) return;
    this._counts[role] = (this._counts[role] || 0) + 1;
    const countEl = this.element?.querySelector(`[data-count-role="${role}"]`);
    if (countEl) countEl.textContent = this._counts[role];
    // Enable the decrement button now that count > 0
    const decBtn = this.element?.querySelector(`.dhac-bc-dec[data-role="${role}"]`);
    if (decBtn) decBtn.disabled = false;
    this._updateDisplay();
  }

  static _onDecrement(event, target) {
    const role = target.dataset.role;
    if (!role) return;
    this._counts[role] = Math.max(0, (this._counts[role] || 0) - 1);
    const countEl = this.element?.querySelector(`[data-count-role="${role}"]`);
    if (countEl) countEl.textContent = this._counts[role];
    // Disable the decrement button when count reaches 0
    if (this._counts[role] === 0) target.disabled = true;
    this._updateDisplay();
  }

  static _onReset() {
    this._counts = Object.fromEntries(Object.keys(ROLE_COSTS).map(r => [r, 0]));
    this.render();
  }
}
