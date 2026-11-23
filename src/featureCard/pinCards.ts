import {CARD_IDS, type CardId} from '../board/visibleCards';
import {parseCardLayout, type CardLayout} from './cardLayout';

export const PIN_CARDS_EVENT = 'momentum-pin-cards';

export function featureCardKey(id: string): string {
  return `feature-card:${id}`;
}

export function pinStoredCards(
  pinned: boolean,
  layouts: Record<CardId, CardLayout>
): void {
  for (const id of CARD_IDS) {
    const key = featureCardKey(id);
    const raw = localStorage.getItem(key);
    if (!raw && !pinned) {
      continue;
    }
    let placed = false;
    let layout = layouts[id];
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        layout = parseCardLayout(parsed, layouts[id]);
        placed =
          !!parsed &&
          typeof parsed === 'object' &&
          ('placed' in parsed ? Boolean((parsed as {placed?: unknown}).placed) : true);
      } catch {
        layout = layouts[id];
        placed = false;
      }
    }
    localStorage.setItem(key, JSON.stringify({...layout, pinned, placed}));
  }
  window.dispatchEvent(new CustomEvent(PIN_CARDS_EVENT, {detail: pinned}));
}
