import { AdversaryCreatorForm } from "./adversary-creator-form.mjs";

const MODULE_ID = "dh-adversary-creator";

/**
 * Discover the Foundryborne adversary data model by inspecting an existing actor
 * or by reading the system's registered data models. This ensures we create
 * adversaries with exactly the right field paths.
 */
async function discoverDataModel() {
  // Check if the system defines a data model for adversaries
  const dataModels = CONFIG.Actor?.dataModels;
  if (dataModels?.adversary) {
    console.log(`${MODULE_ID} | Found adversary DataModel in CONFIG.Actor.dataModels`);
    return;
  }

  // Try to find an existing adversary actor to inspect
  const sample = game.actors.find(a => a.type === "adversary");
  if (sample) {
    const obj = sample.toObject();
    console.log(`${MODULE_ID} | Sample adversary data:`, obj.system);
    // Store the discovered schema for reference
    game.modules.get(MODULE_ID).sampleSchema = obj.system;
  }
}

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing Quick Adversary Creator`);
});

Hooks.once("ready", async () => {
  console.log(`${MODULE_ID} | Ready`);

  // Only GMs should use this module
  if (!game.user.isGM) return;

  await discoverDataModel();

  // Register keybinding
  game.keybindings?.register(MODULE_ID, "openCreator", {
    name: "Open Adversary Creator",
    hint: "Opens the Quick Adversary Creator form",
    editable: [{ key: "KeyN", modifiers: ["Shift", "Control"] }],
    onDown: () => {
      new AdversaryCreatorForm().render(true);
    },
    restricted: true,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });
});

/**
 * Add the "Create Adversary" button to the Actor Directory header.
 */
Hooks.on("getActorDirectoryEntryContext", () => { /* no-op, just ensuring hook fires */ });

Hooks.on("renderActorDirectory", (app, html, data) => {
  if (!game.user.isGM) return;

  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("dhac-create-btn");
  button.innerHTML = `<i class="fas fa-skull-crossbones"></i> Create Adversary`;
  button.addEventListener("click", (ev) => {
    ev.preventDefault();
    new AdversaryCreatorForm().render(true);
  });

  // Insert into the action buttons area of the directory header
  const actionButtons = html[0]?.querySelector?.(".action-buttons")
    ?? html[0]?.querySelector?.(".directory-header .header-actions")
    ?? html[0]?.querySelector?.(".directory-header");

  if (actionButtons) {
    actionButtons.appendChild(button);
  } else {
    // Fallback: try jQuery style
    const header = html.find(".directory-header");
    if (header.length) {
      header.append(button);
    }
  }
});

/**
 * Also add to the Daggerheart system menu if it exists
 * (Foundryborne adds a custom sidebar tab)
 */
Hooks.on("renderSidebarTab", (app, html) => {
  if (!game.user.isGM) return;
  if (app.constructor.name !== "DaggerheartMenu" && app.tabName !== "daggerheart") return;

  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("dhac-create-btn", "dhac-system-menu-btn");
  button.innerHTML = `<i class="fas fa-skull-crossbones"></i> Quick Adversary Creator`;
  button.addEventListener("click", (ev) => {
    ev.preventDefault();
    new AdversaryCreatorForm().render(true);
  });

  const target = html[0]?.querySelector?.(".directory-list") ?? html[0];
  if (target) target.prepend(button);
});

// Expose API for macro use
Hooks.once("ready", () => {
  const mod = game.modules.get(MODULE_ID);
  if (mod) {
    mod.api = {
      open: () => new AdversaryCreatorForm().render(true),
    };
  }
});
