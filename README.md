# Daggerheart: 1-Minute Adversaries

A FoundryVTT module for the Foundryborne Daggerheart system that helps you create and edit adversaries quickly inside Foundry.

## Features

- Fast adversary builder UI inside Foundry
- Tier/role benchmark autofill for core combat stats
- Multiple experiences per adversary
- Unlimited features (passive, action, reaction)
- Natural-language feature detection for:
  - Attack Roll
  - Spend Fear
  - Mark Stress
  - Attribute reaction rolls (for example, Instinct Reaction)
  - Damage rolls (including multiple rolls in one description)
- Toggle detected feature actions on/off before creation (green enabled, red disabled)
- Inline damage roll generation from natural text (for example, `2d8+4 physical damage`)
- Create new adversaries or quick-edit existing ones
- Built-in support for common resistance/immunity effects

## Usage

1. Open `1-Minute Adversaries` from the Actor Directory or press `Ctrl+Shift+N`.
2. Set Tier and Role, then click `Auto-fill`.
3. Add details, experiences, and features.
4. Review detected action pills and toggle as needed.
5. Click `Create Adversary` (or save changes when editing).

## Feature Description Tips

- Write natural text for most behavior.
- Inline damage rolls are detected from natural text.
- Example: `The adversary attacks, dealing 2d8+4 physical damage and forcing an Instinct reaction roll.`

## Macro API

```js
game.modules.get("one-minute-adversaries")?.api?.open();
game.modules.get("one-minute-adversaries")?.api?.openForActor(actor);
```

## Installation

Use this manifest URL in Foundry's Install Module dialog:

`https://raw.githubusercontent.com/LittleBigBlarg/DH-Adversary-Builder/main/module.json`

## Acknowledgments

- Benchmark suggestions and custom adversary guidance in this project are based in part on RightKnightsToFight's work on making custom adversaries:
  - https://docs.google.com/document/d/12g-obIkdGJ_iLL19bS0oKPDDvPbPI9pWUiFqGw8ED88/edit?tab=t.0#heading=h.mdjo15f06zjv
## License

MIT





