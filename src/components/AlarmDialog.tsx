import React, {useEffect, useRef} from 'react';
import ReactDOM from 'react-dom';
import {publishNtfy} from '../notify/ntfy';
import styles from './AlarmDialog.module.css';

export type AlarmToastItem = {
  id: string;
  message: string;
  detail?: string;
};

type AlarmDialogProps = {
  items: AlarmToastItem[];
  onAck: (id: string) => void;
};

const TODO_NOTIFY_SRC = `${process.env.PUBLIC_URL}/todoNotify.mp3`;

function playTodoNotify() {
  try {
    const audio = new Audio(TODO_NOTIFY_SRC);
    const played = audio.play();
    if (played && typeof played.catch === 'function') {
      void played.catch(() => undefined);
    }
  } catch {
    // jsdom has no media playback
  }
}

export default function AlarmDialog({items, onAck}: AlarmDialogProps) {
  const seenIds = useRef(new Set<string>());
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const ids = items.map(item => item.id).join(',');

  useEffect(() => {
    const nextIds = ids === '' ? [] : ids.split(',');
    const newIds = nextIds.filter(id => !seenIds.current.has(id));
    seenIds.current = new Set(nextIds);
    if (newIds.length === 0) {
      return;
    }
    playTodoNotify();
    for (const id of newIds) {
      const item = itemsRef.current.find(entry => entry.id === id);
      if (item) {
        const detail = item.detail ? ` (${item.detail})` : '';
        publishNtfy('할 일', `${item.message}${detail}`);
      }
    }
  }, [ids]);

  if (items.length === 0) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className={styles.stack} role="region" aria-label="할 일 알람">
      {items.map(item => (
        <article
          key={item.id}
          className={styles.toast}
          role="status"
          aria-label={`할 일 알람 ${item.message}`}
        >
          <h2 className={styles.title}>할 일 알람</h2>
          <p>{item.message}</p>
          {item.detail ? <p>{item.detail}</p> : null}
          <button
            className={`btn-primary ${styles.ack}`}
            type="button"
            onClick={() => onAck(item.id)}
          >
            확인
          </button>
        </article>
      ))}
    </div>,
    document.body
  );
}
