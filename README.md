# Daggerheart: Quick Adversary Creator

A FoundryVTT module for the **Foundryborne Daggerheart** system that provides a form-based UI for quickly creating adversary actors — directly inside Foundry. No exporting, no copy-pasting. Fill out the form, click Create, and the adversary appears in your world.

## Features

- **Form-based UI** with tabbed sections: Identity, Combat Stats, Attack, Features
- **Auto-fill from benchmarks** — select a Tier and Role, click one button, and all stats populate with midpoint values from the official Daggerheart SRD guidelines
- **Benchmark reference panels** showing recommended stat ranges for every Tier/Role combination
- **Feature builder** — add unlimited Passive, Action, and Reaction features, including Fear Features
- **Direct actor creation** — creates a real adversary Actor with embedded feature Items in your world
- **Auto-opens the new sheet** after creation so you can review and tweak
- **Accessible from the Actor Directory** via a "Create Adversary" button, or via Ctrl+Shift+N

## Installation

### Manual Install
1. Download or clone this module into your `{userData}/Data/modules/` directory
2. The folder should be named `dh-adversary-creator`
3. Restart Foundry and enable the module in your world

### File Structure
```
dh-adversary-creator/
├── module.json
├── scripts/
│   ├── module.mjs              # Entry point, hooks, button injection
│   ├── adversary-creator-form.mjs  # FormApplication class
│   └── benchmarks.mjs          # Stat benchmark data from the SRD
├── templates/
│   └── adversary-creator.hbs   # Handlebars form template
├── styles/
│   └── adversary-creator.css   # Styles matching Daggerheart aesthetic
└── lang/
    └── en.json                 # Localization
```

## Usage

1. **Enable the module** in your world's Module Management
2. Open the **Actor Directory** sidebar — you'll see a "Create Adversary" button
3. Or press **Ctrl+Shift+N** to open the creator
4. Fill in the form:
   - Set **Tier** and **Role**, then click **Auto-fill from Benchmarks** to populate stats
   - Customize any values as needed
   - Add features in the Features tab
5. Click **Create Adversary** — the actor is created and its sheet opens

### Macro Access
You can also open the creator from a macro:
```js
game.modules.get("dh-adversary-creator")?.api?.open();
```

## Calibrating Field Names

Since the Foundryborne system's internal data model is not publicly documented, this module makes its best effort to populate the correct field paths. If some fields aren't appearing on the adversary sheet after creation, you'll need to calibrate the field names:

### Step 1: Inspect an existing adversary
Open your browser's developer console (F12) and run:
```js
const adv = game.actors.find(a => a.type === "adversary");
console.log(JSON.stringify(adv.toObject(), null, 2));
```

### Step 2: Note the field paths
Look at the `system` object in the output. The key paths you need are:
- Difficulty (e.g., `system.difficulty.value` or `system.difficulty`)
- Thresholds (e.g., `system.thresholds.major` or `system.damageThresholds.major`)
- HP (e.g., `system.hp.value` / `system.hp.max`)
- Stress (e.g., `system.stress.value` / `system.stress.max`)
- Attack modifier, weapon data, experience, etc.
- Feature item type name (e.g., `"feature"`, `"adversaryFeature"`, `"action"`)

### Step 3: Update the module
Edit `scripts/adversary-creator-form.mjs` — in the `_buildSystemData()` and `_buildFeatureItems()` methods, adjust the `setPath()` calls to match the exact paths from your inspection.

## Supported Roles & Tiers

All 10 adversary roles across all 4 tiers with full benchmark data:

| Role | Battle Points | Description |
|------|:---:|-------------|
| Bruiser | 4 | Big hits, throw people around |
| Horde | 2 | Large groups of individually weak creatures |
| Leader | 3 | Command others, boost allies |
| Minion | 1/group | Defeated on any damage |
| Ranged | 2 | Far attacks, pressure the party |
| Skulk | 2 | Skirmisher, close quarters harrier |
| Solo | 5 | Formidable challenge for a whole party |
| Standard | 2 | Core forces, simple abilities |
| Social | 1 | Interpersonal encounters |
| Support | 1 | Debuffs, ally enhancement |

## Credits

- Benchmark data derived from the **Daggerheart SRD** (©Critical Role, LLC) under the Darrington Press Community Gaming License
- Adversary creation guide benchmarks from **RightKnighttoFight's Guide to Making Custom Adversaries**
- Built for the **Foundryborne** Daggerheart system for FoundryVTT

## License

MIT
