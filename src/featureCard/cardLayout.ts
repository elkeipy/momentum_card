export const CARD_MIN_WIDTH = 220;
export const CARD_MIN_HEIGHT = 140;
export const CARD_TOP_INSET = 80;

export type CardLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
};

export type ViewportSize = {
  width: number;
  height: number;
};

export function clampCardLayout(
  layout: CardLayout,
  viewport: ViewportSize,
  minY = 0
): CardLayout {
  const top = Math.max(0, minY);
  const width = Math.min(
    Math.max(layout.width, CARD_MIN_WIDTH),
    Math.max(viewport.width, CARD_MIN_WIDTH)
  );
  const height = Math.min(
    Math.max(layout.height, CARD_MIN_HEIGHT),
    Math.max(viewport.height - top, CARD_MIN_HEIGHT)
  );
  const maxX = Math.max(0, viewport.width - width);
  const maxY = Math.max(top, viewport.height - height);
  return {
    x: Math.min(Math.max(layout.x, 0), maxX),
    y: Math.min(Math.max(layout.y, top), maxY),
    width,
    height,
    pinned: layout.pinned
  };
}

export function parseCardLayout(value: unknown, fallback: CardLayout): CardLayout {
  if (!value || typeof value !== 'object') {
    return fallback;
  }
  const raw = value as Partial<CardLayout>;
  if (
    typeof raw.x !== 'number' ||
    !Number.isFinite(raw.x) ||
    typeof raw.y !== 'number' ||
    !Number.isFinite(raw.y) ||
    typeof raw.width !== 'number' ||
    !Number.isFinite(raw.width) ||
    typeof raw.height !== 'number' ||
    !Number.isFinite(raw.height) ||
    typeof raw.pinned !== 'boolean'
  ) {
    return fallback;
  }
  return {
    x: raw.x,
    y: raw.y,
    width: raw.width,
    height: raw.height,
    pinned: raw.pinned
  };
}
