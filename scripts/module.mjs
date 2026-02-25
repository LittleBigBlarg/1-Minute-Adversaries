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

Hooks.on("renderActorDirectory", (app, html) => {
  if (!game.user.isGM) return;
  const root = html instanceof HTMLElement ? html : (html[0] ?? html);
  if (!root || root.querySelector(".dhac-create-adversary-btn")) return;

  const target = root.querySelector(".action-buttons")
    ?? root.querySelector(".header-actions")
    ?? root.querySelector(".directory-header");
  if (!target) return;

  const exemplar = [...target.querySelectorAll("button, a")]
    .find(el => !el.classList.contains("dhac-create-btn"));

  const button = exemplar ? exemplar.cloneNode(true) : document.createElement("button");
  if (!(button instanceof HTMLElement)) return;

  button.replaceChildren();
  if (button instanceof HTMLButtonElement) button.type = "button";
  button.classList.add("dhac-create-adversary-btn");

  // Remove attrs that could interfere when cloning another module's control.
  for (const attr of ["data-action", "data-tooltip", "aria-controls", "id"]) {
    button.removeAttribute(attr);
  }

  const icon = document.createElement("i");
  icon.className = "fas fa-skull-crossbones";
  button.append(icon, document.createTextNode(" Create Adversary"));

  button.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    new AdversaryCreatorApp().render(true);
  });

  target.appendChild(button);
});

function getActorFromApp(app) {
  return app?.actor ?? app?.document ?? null;
}

function isAdversarySheetApp(app) {
  const actor = getActorFromApp(app);
  return Boolean(actor?.documentName === "Actor" && actor.type === "adversary");
}

function injectQuickEditButton(app, root) {
  if (!game.user.isGM) return;
  if (!isAdversarySheetApp(app) || !root) return;
  const actor = getActorFromApp(app);

  // If the standard header hook was ignored by a custom sheet implementation,
  // inject directly into the window header controls.
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
    btn.dataset.action = "dhac-quick-edit";
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

  // Last-resort fallback: inject a visible button at the top of the sheet content.
  const content = root.querySelector(".window-content") ?? root;
  if (!content || content.querySelector(".dhac-quick-edit-inline")) return;

  const wrap = document.createElement("div");
  wrap.className = "dhac-quick-edit-inline";
  wrap.style.display = "flex";
  wrap.style.justifyContent = "flex-end";
  wrap.style.padding = "0.5rem 0.75rem 0";

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

// Foundry V13+ / ApplicationV2 sheets
Hooks.on("getHeaderControlsApplicationV2", (app, controls) => {
  // Intentionally no-op for adversary sheets.
  // Foundryborne's header styling/ordering is more reliable when we mirror PopOut's
  // direct DOM insertion in renderApplicationV2.
  if (!game.user.isGM) return;
  if (!isAdversarySheetApp(app)) return;
});

Hooks.on("renderApplicationV2", (app, element) => {
  injectQuickEditButton(app, element instanceof HTMLElement ? element : app?.element);
});

// Legacy V1 fallback (if a sheet still uses ActorSheet v1 APIs)
Hooks.on("getActorSheetHeaderButtons", (app, buttons) => {
  if (!game.user.isGM) return;
  if (!isAdversarySheetApp(app)) return;

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


