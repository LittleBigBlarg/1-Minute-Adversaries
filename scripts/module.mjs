import { AdversaryCreatorApp } from "./adversary-creator-app.mjs";

const MODULE_ID = "one-minute-adversaries";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing 1-Minute Adversaries`);

  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("capitalize", (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  });
  Handlebars.registerHelper("increment", (val) => Number(val) + 1);

  game.keybindings.register(MODULE_ID, "openCreator", {
    name: "Open 1-Minute Adversaries",
    hint: "Opens the 1-Minute Adversaries form",
    editable: [{ key: "KeyN", modifiers: ["Shift", "Control"] }],
    onDown: () => { new AdversaryCreatorApp().render(true); },
    restricted: true,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });

  game.settings.register(MODULE_ID, "favoritedImages", {
    name: "Favorited Images",
    hint: "Image paths saved to the favorites picker (managed in-app).",
    scope: "client",
    config: false,
    type: Array,
    default: [],
  });

  game.settings.register(MODULE_ID, "imageDefaults", {
    name: "Image Defaults",
    hint: "Default image paths per slot type (actor, attack, feature), set via the favorites picker.",
    scope: "client",
    config: false,
    type: Object,
    default: {},
  });

  game.settings.register(MODULE_ID, "hideQuickEditButton", {
    name: "Hide 'Quick Edit' button on adversary sheet headers",
    hint: "When enabled, the Quick Edit button will not be injected into adversary sheet headers. The Quick Edit option in the '...' menu is always available regardless.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true,
  });
});

Hooks.once("ready", () => {
  if (!game.user.isGM) return;
  console.log(`${MODULE_ID} | Ready`);

  const mod = game.modules.get(MODULE_ID);
  if (mod) {
    mod.api = {
      open: () => new AdversaryCreatorApp().render(true),
      openForActor: (actor) => AdversaryCreatorApp.openForActor(actor),
    };
  }
});

// ---------------------------------------------------------------------------
// Actors tab sidebar button — always present
// ---------------------------------------------------------------------------

Hooks.on("renderActorDirectory", (_app, html) => {
  if (!game.user.isGM) return;
  const root = html instanceof HTMLElement ? html : (html?.[0] ?? html);
  if (!root || root.querySelector(".dhac-create-adversary-btn")) return;

  const target = root.querySelector(".action-buttons")
    ?? root.querySelector(".header-actions")
    ?? root.querySelector(".directory-header");
  if (!target) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "dhac-create-adversary-btn";
  btn.innerHTML = `<i class="fas fa-skull-crossbones"></i> Create Adversary`;
  btn.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    new AdversaryCreatorApp().render(true);
  });
  target.appendChild(btn);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getActorFromApp(app) {
  return app?.actor ?? app?.document ?? null;
}

function isAdversarySheetApp(app) {
  const actor = getActorFromApp(app);
  return Boolean(actor?.documentName === "Actor" && actor.type === "adversary");
}

// ---------------------------------------------------------------------------
// Direct header button injection — respects hideQuickEditButton setting
// ---------------------------------------------------------------------------

function injectQuickEditButton(app, root) {
  if (!game.user.isGM) return;
  if (!isAdversarySheetApp(app) || !root) return;
  if (game.settings.get(MODULE_ID, "hideQuickEditButton")) return;
  const actor = getActorFromApp(app);

  if (root.querySelector(".dhac-quick-edit-btn")) return;

  const headerControls = root.querySelector(".window-header .header-control")
    ? root.querySelector(".window-header")
    : root.closest?.(".app")?.querySelector?.(".window-header");

  if (headerControls) {
    const closeBtn = headerControls.querySelector('[data-action="close"]')
      ?? headerControls.querySelector(".header-control.close");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "header-control icon dhac-quick-edit-btn";
    btn.dataset.action = "dhac-quick-edit-direct";
    btn.innerHTML = `<i class="fas fa-pen-to-square"></i>`;
    btn.setAttribute("data-tooltip", "Quick Edit");
    btn.title = "Quick Edit";
    btn.setAttribute("aria-label", "Quick Edit");
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      AdversaryCreatorApp.openForActor(actor);
    });

    if (closeBtn) closeBtn.before(btn);
    else headerControls.appendChild(btn);
    return;
  }

  // Last-resort fallback: visible button at top of sheet content
  const content = root.querySelector(".window-content") ?? root;
  if (!content || content.querySelector(".dhac-quick-edit-inline")) return;

  const wrap = document.createElement("div");
  wrap.className = "dhac-quick-edit-inline";
  wrap.style.cssText = "display:flex;justify-content:flex-end;padding:0.5rem 0.75rem 0";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "dhac-btn-create";
  button.innerHTML = `<i class="fas fa-pen-to-square"></i>`;
  button.title = "Quick Edit";
  button.setAttribute("aria-label", "Quick Edit");
  button.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    AdversaryCreatorApp.openForActor(actor);
  });

  wrap.appendChild(button);
  content.prepend(wrap);
}

// ---------------------------------------------------------------------------
// Foundry V13+ ApplicationV2 — "…" header controls dropdown
// Always present regardless of the hideQuickEditButton setting.
// ---------------------------------------------------------------------------

Hooks.on("getHeaderControlsApplicationV2", (app, controls) => {
  if (!game.user.isGM) return;
  if (!isAdversarySheetApp(app)) return;
  controls.push({
    icon: "fas fa-pen-to-square",
    label: "Quick Edit",
    action: "dhac-quick-edit",
  });
});

// ApplicationV2 dispatches data-action clicks to methods on the app instance.
// Since the Daggerheart sheet has no dhac-quick-edit method we intercept via
// capture-phase event delegation on the sheet root.
Hooks.on("renderApplicationV2", (app, element) => {
  const root = element instanceof HTMLElement ? element : app?.element;
  if (!root) return;

  injectQuickEditButton(app, root);

  if (!game.user.isGM || !isAdversarySheetApp(app)) return;
  if (root._dhacQuickEditDelegated) return;
  root._dhacQuickEditDelegated = true;

  const actor = getActorFromApp(app);
  root.addEventListener("click", (ev) => {
    if (!ev.target.closest('[data-action="dhac-quick-edit"]')) return;
    ev.preventDefault();
    ev.stopPropagation();
    AdversaryCreatorApp.openForActor(actor);
  }, true);
});

// ---------------------------------------------------------------------------
// Legacy V1 fallback (ActorSheet v1 API) — respects hideQuickEditButton
// ---------------------------------------------------------------------------

Hooks.on("getActorSheetHeaderButtons", (app, buttons) => {
  if (!game.user.isGM) return;
  if (!isAdversarySheetApp(app)) return;
  if (game.settings.get(MODULE_ID, "hideQuickEditButton")) return;

  buttons.push({
    class: "dhac-quick-edit",
    icon: "fas fa-pen-to-square",
    label: "",
    title: "Quick Edit",
    onclick: () => AdversaryCreatorApp.openForActor(getActorFromApp(app)),
  });
});

Hooks.on("renderActorSheet", (app, html) => {
  const root = html instanceof HTMLElement ? html : (html?.[0] ?? app?.element);
  injectQuickEditButton(app, root);
});
