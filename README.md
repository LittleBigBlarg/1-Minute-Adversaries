# Daggerheart: 1-Minute Adversaries

A FoundryVTT module for the Foundryborne Daggerheart system that helps you build adversaries fast inside Foundry.

Create or edit adversary actors with benchmark autofill, feature generation helpers, inline damage roll tagging, and one-click item/action creation.

## What It Does

- Build adversaries from a focused form UI inside Foundry
- Auto-fill combat stats from Daggerheart benchmark ranges by tier and role
- Add multiple experiences
- Build unlimited features (passive/action/reaction) with optional custom images
- Auto-detect feature actions from natural language (Attack Roll, Spend Fear, Mark Stress)
- Auto-detect reaction rolls (for example, Instinct Reaction)
- Auto-detect damage rolls and generate damage action buttons
- Support multiple damage rolls in a single feature description
- Convert `damage:2d8+4 physical` style tags into inline rolls in feature text
- Toggle generated action buttons on/off before creation (green enabled, red disabled)
- Create new adversaries or quick-edit existing adversary actors
- Manage common resistance/immunity effects from the UI (physical/magical)

## Highlights

### Natural-language feature detection
Type plain text in a feature description and the app suggests actions automatically.

Examples:
- `The adversary makes an attack...` -> Attack Roll pill
- `...spend Fear to...` -> Spend Fear pill
- `...mark Stress to...` -> Mark Stress pill
- `...make an Instinct reaction roll...` -> Instinct Reaction pill

Core adversary pills (Attack Roll, Spend Fear, Mark Stress) are always shown and start red until detected/enabled.
Dynamic pills (damage/reaction) appear only when detected.

### Damage roll tagging
`damage:` is the primary inline damage tag syntax and supports multiple rolls/types in one description.

Examples:
- `Enemy attacks dealing damage:2d8+4 physical.`
- `On a hit, deal damage:1d10+2 magical and damage:1d6 physical.`

These are converted into Foundry inline rolls in the feature description and corresponding damage actions can be generated.

## Usage

1. Enable the module in your world.
2. Open the Actor Directory and click `Create Adversary`.
3. Or press `Ctrl+Shift+N` to open 1-Minute Adversaries.
4. Set tier/role and click `Auto-fill`.
5. Add details, experiences, and features.
6. Review generated pills (green = enabled, red = disabled).
7. Click `Create Adversary`.

### Quick Edit Existing Adversaries
Use the module's quick edit entry point on adversary sheets (when available) to reopen the same builder with current actor data loaded.

## Macro API

```js
game.modules.get("dh-adversary-creator")?.api?.open();
```

Open for an existing adversary actor:

```js
game.modules.get("dh-adversary-creator")?.api?.openForActor(actor);
```

## Installation

### Manual Install
1. Download or clone this repo into `{Foundry User Data}/Data/modules/`
2. Ensure the folder is named `dh-adversary-creator`
3. Restart Foundry and enable the module in your world

### Manifest Install (if using your hosted manifest)
Use the `module.json` manifest URL from this repository's release branch.

## Notes

- Benchmark templates in `scripts/benchmarks.mjs` now use `@Lookup[@name]` directly.
- Feature descriptions preserve natural text and only rely on explicit `damage:` tagging for inline damage insertion.
- Default generated feature icon uses the Daggerheart stars-stack icon.

## Supported Roles & Tiers

Includes benchmark data for the standard Daggerheart adversary role/tier combinations used by the builder.

## Credits

- Daggerheart SRD benchmark guidance (Critical Role / Darrington Press licensing applies)
- Foundryborne Daggerheart system for FoundryVTT

## License

MIT
