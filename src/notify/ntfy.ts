export const NTFY_TOPIC_KEY = 'ntfy-topic';
export const NTFY_ORIGIN = 'https://ntfy.sh';

const TOPIC_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_TOPIC_LENGTH = 64;
const MAX_MESSAGE_LENGTH = 4000;

export function sanitizeNtfyTopicDraft(raw: string): string {
  return raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, MAX_TOPIC_LENGTH);
}

export function parseNtfyTopic(raw: string): string | null {
  const topic = raw.trim();
  if (topic === '') {
    return null;
  }
  return TOPIC_PATTERN.test(topic) ? topic : null;
}

export function readNtfyTopic(storage: Pick<Storage, 'getItem'>): string {
  return parseNtfyTopic(storage.getItem(NTFY_TOPIC_KEY) ?? '') ?? '';
}

export function writeNtfyTopic(
  storage: Pick<Storage, 'setItem' | 'removeItem'>,
  raw: string
): void {
  const topic = parseNtfyTopic(raw);
  if (topic === null) {
    storage.removeItem(NTFY_TOPIC_KEY);
    return;
  }
  storage.setItem(NTFY_TOPIC_KEY, topic);
}

export function publishNtfy(
  title: string,
  message: string,
  storage: Pick<Storage, 'getItem'> = localStorage,
  post: typeof fetch = fetch
): void {
  const topic = parseNtfyTopic(storage.getItem(NTFY_TOPIC_KEY) ?? '');
  if (topic === null) {
    return;
  }
  const body = `${title}: ${message}`.slice(0, MAX_MESSAGE_LENGTH);
  try {
    const sent = post(`${NTFY_ORIGIN}/${topic}`, {
      method: 'POST',
      body
    });
    if (sent && typeof sent.catch === 'function') {
      void sent.catch(() => undefined);
    }
  } catch {
    // jsdom and locked-down browsers have no fetch
  }
}
