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

export const CARD_SNAP_DISTANCE = 8;

export type CardRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// 다른 카드의 변과 그 변에서 간격만큼 떨어진 선이 붙을 자리다.
function snapLines(others: CardRect[], axis: 'x' | 'y', gap: number): number[] {
  const size = axis === 'x' ? 'width' : 'height';
  return others.flatMap(other => {
    const start = other[axis];
    const end = start + other[size];
    return [start, end, end + gap, start - gap];
  });
}

function snapDelta(edges: number[], lines: number[], distance: number): number {
  let best = 0;
  let bestGap = distance + 1;
  for (const edge of edges) {
    for (const line of lines) {
      const gap = Math.abs(line - edge);
      if (gap <= distance && gap < bestGap) {
        best = line - edge;
        bestGap = gap;
      }
    }
  }
  return best;
}

// 옮기면 위치를, 크기를 바꾸면 오른쪽·아래 변을 주위 카드 선에 맞춘다.
export function snapCardRect(
  rect: CardRect,
  others: CardRect[],
  mode: 'move' | 'resize',
  gap: number,
  distance = CARD_SNAP_DISTANCE
): CardRect {
  const linesX = snapLines(others, 'x', gap);
  const linesY = snapLines(others, 'y', gap);
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;
  if (mode === 'move') {
    return {
      ...rect,
      x: rect.x + snapDelta([rect.x, right], linesX, distance),
      y: rect.y + snapDelta([rect.y, bottom], linesY, distance)
    };
  }
  return {
    ...rect,
    width: rect.width + snapDelta([right], linesX, distance),
    height: rect.height + snapDelta([bottom], linesY, distance)
  };
}
