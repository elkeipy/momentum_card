export const CARD_IDS = ['weather', 'clock', 'pomodoro', 'quote', 'words'] as const;

export type CardId = (typeof CARD_IDS)[number];

export const VISIBLE_CARDS_KEY = 'visible-cards';

export function isCardId(value: unknown): value is CardId {
  return typeof value === 'string' && CARD_IDS.some(id => id === value);
}

export function readVisibleCards(storage: {
  getItem(key: string): string | null;
}): CardId[] {
  const raw = storage.getItem(VISIBLE_CARDS_KEY);
  if (!raw) {
    return [...CARD_IDS];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [...CARD_IDS];
    }
    return parsed.filter(isCardId);
  } catch {
    return [...CARD_IDS];
  }
}

export function hideCard(visible: CardId[], id: CardId): CardId[] {
  return visible.filter(cardId => cardId !== id);
}

export function showCard(visible: CardId[], id: CardId): CardId[] {
  if (visible.includes(id)) {
    return visible;
  }
  return [...visible, id];
}
