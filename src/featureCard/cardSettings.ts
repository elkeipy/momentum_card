export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 72;
export const FONT_SIZE_DEFAULT = 16;
export const CLOCK_FONT_DEFAULT = 24;
export const WEATHER_FONT_DEFAULT = 24;
export const REFRESH_SEC_MIN = 5;
export const REFRESH_SEC_MAX = 600;
export const REFRESH_SEC_DEFAULT = 60;

export type DisplaySettings = {
  fontSize: number;
  refreshSec: number;
};

export function settingsKey(id: string): string {
  return `card-settings:${id}`;
}

function parseBoundedInteger(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    return fallback;
  }
  return value;
}

export function parseDisplaySettings(
  value: unknown,
  fallback: DisplaySettings
): DisplaySettings {
  if (!value || typeof value !== 'object') {
    return fallback;
  }
  const raw = value as Partial<DisplaySettings>;
  return {
    fontSize: parseBoundedInteger(
      raw.fontSize,
      FONT_SIZE_MIN,
      FONT_SIZE_MAX,
      fallback.fontSize
    ),
    refreshSec: parseBoundedInteger(
      raw.refreshSec,
      REFRESH_SEC_MIN,
      REFRESH_SEC_MAX,
      fallback.refreshSec
    )
  };
}

export function readDisplaySettings(
  storage: Pick<Storage, 'getItem'>,
  id: string,
  fallback: DisplaySettings
): DisplaySettings {
  const raw = storage.getItem(settingsKey(id));
  if (!raw) {
    return fallback;
  }
  try {
    return parseDisplaySettings(JSON.parse(raw), fallback);
  } catch {
    return fallback;
  }
}

export function writeDisplaySettings(
  storage: Pick<Storage, 'setItem'>,
  id: string,
  settings: DisplaySettings
): void {
  storage.setItem(settingsKey(id), JSON.stringify(parseDisplaySettings(settings, settings)));
}
