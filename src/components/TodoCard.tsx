import React, {useEffect, useState} from 'react';
import {
  FONT_SIZE_DEFAULT,
  REFRESH_SEC_DEFAULT
} from '../featureCard/cardSettings';
import {useDisplaySettings} from '../featureCard/useDisplaySettings';
import {
  addTodo,
  readTodoList,
  removeTodo,
  TODO_STORAGE_KEY,
  toggleTodo
} from '../todos/todos';
import DisplaySettingsFields from './DisplaySettingsFields';
import SettingsModal from './SettingsModal';
import styles from './TodoCard.module.css';

const TODO_DEFAULTS = {
  fontSize: FONT_SIZE_DEFAULT,
  refreshSec: REFRESH_SEC_DEFAULT
};

export default function TodoCard() {
  const settings = useDisplaySettings('todos', TODO_DEFAULTS);
  const [items, setItems] = useState(() => readTodoList(localStorage));
  const [draft, setDraft] = useState('');
  const remaining = items.filter(item => !item.done).length;

  useEffect(() => {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const saveItem = () => {
    const nextItems = addTodo(items, draft);
    if (nextItems === items) {
      return;
    }
    setItems(nextItems);
    setDraft('');
  };

  return (
    <div className={styles.root}>
      <p className={styles.summary}>남은 {remaining} · 전체 {items.length}</p>
      <form
        className={styles.form}
        onSubmit={event => {
          event.preventDefault();
          saveItem();
        }}
      >
        <label htmlFor="new-todo">할 일 추가</label>
        <div className={styles.join}>
          <input
            id="new-todo"
            value={draft}
            onChange={event => setDraft(event.target.value)}
            placeholder="오늘 끝낼 일"
          />
          <button className="app-button" type="submit">
            추가
          </button>
        </div>
      </form>
      {items.length === 0 ? (
        <p className={styles.empty}>할 일을 추가하면 여기에 쌓인다.</p>
      ) : (
        <ul className={styles.list} style={{fontSize: `${settings.saved.fontSize}px`}}>
          {items.map(item => (
            <li key={item.id}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => setItems(current => toggleTodo(current, item.id))}
                />
                <span className={item.done ? `${styles.label} ${styles.done}` : styles.label}>
                  {item.text}
                </span>
              </label>
              <button
                className="text-button"
                type="button"
                aria-label={`${item.text} 삭제`}
                onClick={() => setItems(current => removeTodo(current, item.id))}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
      {settings.isOpen ? (
        <SettingsModal title="할 일 설정" onSave={settings.save} onClose={settings.close}>
          <DisplaySettingsFields value={settings.draft} onChange={settings.setDraft} />
        </SettingsModal>
      ) : null}
    </div>
  );
}
