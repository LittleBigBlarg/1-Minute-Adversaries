const MODULE_ID = "one-minute-adversaries";
const FAVORITES_SETTING_KEY = "favoritedImages";
const DEFAULTS_SETTING_KEY = "imageDefaults";
const MAX_FAVORITES = 30;

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

export function getFavorites() {
  try {
    return game.settings.get(MODULE_ID, FAVORITES_SETTING_KEY) ?? [];
  } catch {
    return [];
  }
}

export function addFavorite(path) {
  if (!path) return;
  const favs = getFavorites().filter(p => p !== path);
  favs.unshift(path);
  game.settings.set(MODULE_ID, FAVORITES_SETTING_KEY, favs.slice(0, MAX_FAVORITES));
}

export function removeFavorite(path) {
  game.settings.set(MODULE_ID, FAVORITES_SETTING_KEY, getFavorites().filter(p => p !== path));
}

export function getDefault(slotType) {
  try {
    return game.settings.get(MODULE_ID, DEFAULTS_SETTING_KEY)?.[slotType] ?? null;
  } catch {
    return null;
  }
}

export function setDefault(slotType, path) {
  let defaults = {};
  try { defaults = game.settings.get(MODULE_ID, DEFAULTS_SETTING_KEY) ?? {}; } catch {}
  game.settings.set(MODULE_ID, DEFAULTS_SETTING_KEY, { ...defaults, [slotType]: path });
}

// ---------------------------------------------------------------------------
// ImageFavoritesPicker — two-panel ApplicationV2 popup
// ---------------------------------------------------------------------------

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ImageFavoritesPicker extends HandlebarsApplicationMixin(ApplicationV2) {
  _current;
  _callback;
  _slotType;

  constructor(current, callback, slotType = "actor", options = {}) {
    super(options);
    this._current = current;
    this._callback = callback;
    this._slotType = slotType;
  }

  static DEFAULT_OPTIONS = {
    id: "dhac-image-favorites",
    window: { title: "Image Favorites", icon: "fas fa-images", resizable: true },
    position: { width: 460, height: 400 },
    actions: {
      addToFavorites: ImageFavoritesPicker._onAddToFavorites,
      pickFavorite: ImageFavoritesPicker._onPickFavorite,
      removeFavorite: ImageFavoritesPicker._onRemoveFavorite,
      setFavDefault: ImageFavoritesPicker._onSetFavDefault,
      clearDefault: ImageFavoritesPicker._onClearDefault,
      browseFiles: ImageFavoritesPicker._onBrowseFiles,
    },
  };

  static PARTS = {
    form: { template: `modules/${MODULE_ID}/templates/image-favorites-picker.hbs` },
  };

  async _prepareContext() {
    const favs = getFavorites();
    const defaultPath = getDefault(this._slotType);
    return {
      current: this._current,
      isAlreadyFavorite: favs.includes(this._current),
      favorites: favs.map(path => ({ path, isDefault: path === defaultPath })),
      defaultPath,
      slotType: this._slotType,
    };
  }

  // Star button for the selected image — toggles favorite status
  static _onAddToFavorites() {
    const favs = getFavorites();
    if (favs.includes(this._current)) {
      removeFavorite(this._current);
    } else {
      addFavorite(this._current);
    }
    this.render();
  }

  // Click a thumbnail to pick it
  static _onPickFavorite(event, target) {
    const path = target.closest("[data-path]").dataset.path;
    addFavorite(path); // bumps to top of MRU
    this._callback(path);
    this.close();
  }

  // X button on a thumbnail
  static _onRemoveFavorite(event, target) {
    event.stopPropagation();
    removeFavorite(target.dataset.path);
    this.render();
  }

  // Crown button — set/unset as default for this slot
  static _onSetFavDefault(event, target) {
    event.stopPropagation();
    const path = target.dataset.path;
    const current = getDefault(this._slotType);
    setDefault(this._slotType, current === path ? null : path);
    this.render();
  }

  // Remove Default button in the left panel
  static _onClearDefault() {
    setDefault(this._slotType, null);
    this.render();
  }

  // Browse Files fallback
  static _onBrowseFiles() {
    const Picker = globalThis.FilePicker ?? foundry?.applications?.apps?.FilePicker;
    if (!Picker) {
      ui.notifications.warn("Foundry File Picker is not available.");
      return;
    }
    new Picker({
      type: "imagevideo",
      current: this._current,
      callback: (path) => {
        if (path) {
          this._callback(path);
          this.close();
        }
      },
    }).render(true);
  }
}
