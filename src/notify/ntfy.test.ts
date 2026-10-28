import {
  NTFY_ORIGIN,
  NTFY_TOPIC_KEY,
  parseNtfyTopic,
  publishNtfy,
  readNtfyTopic,
  sanitizeNtfyTopicDraft,
  writeNtfyTopic
} from './ntfy';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = {...initial};
  return {
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    removeItem: (key: string) => {
      delete data[key];
    }
  };
}

test('keeps only a public ntfy topic name', () => {
  expect(sanitizeNtfyTopicDraft(' my board! ')).toBe('myboard');
  expect(parseNtfyTopic('')).toBeNull();
  expect(parseNtfyTopic('ab/cd')).toBeNull();
  expect(parseNtfyTopic('desk-42')).toBe('desk-42');
});

test('stores a topic and clears it when empty', () => {
  const storage = memoryStorage();
  writeNtfyTopic(storage, 'desk-42');
  expect(readNtfyTopic(storage)).toBe('desk-42');
  writeNtfyTopic(storage, '  ');
  expect(storage.getItem(NTFY_TOPIC_KEY)).toBeNull();
});

test('posts to ntfy when a topic is set', () => {
  const storage = memoryStorage({[NTFY_TOPIC_KEY]: 'desk-42'});
  const post = jest.fn(() => Promise.resolve({} as Response));
  publishNtfy('할 일', 'call (10:00)', storage, post);
  expect(post).toHaveBeenCalledWith(`${NTFY_ORIGIN}/desk-42`, {
    method: 'POST',
    body: '할 일: call (10:00)'
  });
});

test('does not post without a topic', () => {
  const post = jest.fn();
  publishNtfy('할 일', 'call', memoryStorage(), post);
  expect(post).not.toHaveBeenCalled();
});
