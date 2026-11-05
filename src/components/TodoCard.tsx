import React, {ChangeEvent, useEffect, useRef, useState} from 'react';
import {
  FONT_SIZE_DEFAULT,
  REFRESH_SEC_DEFAULT
} from '../featureCard/cardSettings';
import {useDisplaySettings} from '../featureCard/useDisplaySettings';
import {
  addTodo,
  calendarEventUrl,
  clampDueParts,
  currentExactMinutes,
  currentMinutes,
  dueProgress,
  dueTodos,
  formatDueMinutes,
  markAlarmed,
  minDueHour,
  minDueMinute,
  parseDueMinutes,
  readTodoList,
  removeTodo,
  renameTodo,
  TODO_STORAGE_KEY,
  toggleTodo,
  todayIso
} from '../todos/todos';
import AlarmDialog from './AlarmDialog';
import {TrashIcon} from './icons';
import DisplaySettingsFields from './DisplaySettingsFields';
import SettingsModal from './SettingsModal';
import styles from './TodoCard.module.css';

const TODO_DEFAULTS = {
  fontSize: FONT_SIZE_DEFAULT,
  refreshSec: REFRESH_SEC_DEFAULT
};
const ALARM_TICK_MS = 1000;

function readClockPart(value: string, max: number): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return parsed >= 0 && parsed <= max ? parsed : null;
}

export default function TodoCard() {
  const settings = useDisplaySettings('todos', TODO_DEFAULTS);
  const [items, setItems] = useState(() => readTodoList(localStorage));
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const skipEditSave = useRef(false);
  const draftRef = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(() => new Date());
  const [dueHour, setDueHour] = useState(() => minDueHour(currentMinutes()));
  const [dueMinute, setDueMinute] = useState(
    () => minDueMinute(minDueHour(currentMinutes()), currentMinutes())
  );
  const nowMinutes = currentMinutes(now);
  const nowExact = currentExactMinutes(now);
  const remaining = items.filter(item => !item.done).length;
  const showEvent = draft.includes('#');
  const showDue = draft.includes('@') && !showEvent;
  const [eventDate, setEventDate] = useState(() => todayIso());
  const [eventTime, setEventTime] = useState('');
  const ringing = dueTodos(items, nowMinutes);
  const hourMin = minDueHour(nowMinutes);
  const minuteMin = minDueMinute(dueHour, nowMinutes);

  useEffect(() => {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (event.altKey && event.code === 'KeyT') {
        event.preventDefault();
        draftRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timerId = window.setInterval(tick, ALARM_TICK_MS);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!showDue) {
      return;
    }
    const next = clampDueParts(dueHour, dueMinute, nowMinutes);
    if (next.hour !== dueHour || next.minute !== dueMinute) {
      setDueHour(next.hour);
      setDueMinute(next.minute);
    }
  }, [showDue, dueHour, dueMinute, nowMinutes]);

  const onDraftChange = (value: string) => {
    if (!draft.includes('#') && value.includes('#')) {
      setEventDate(todayIso());
      setEventTime('');
    }
    if (!draft.includes('@') && value.includes('@')) {
      const now = currentMinutes();
      const next = clampDueParts(0, 0, now);
      setDueHour(next.hour);
      setDueMinute(next.minute);
    }
    setDraft(value);
  };

  const applyDuePart = (hour: number, minute: number) => {
    const next = clampDueParts(hour, minute, currentMinutes());
    setDueHour(next.hour);
    setDueMinute(next.minute);
  };

  const saveItem = () => {
    if (showEvent) {
      const url = calendarEventUrl(draft, eventDate, eventTime);
      if (url === null) {
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
      setDraft('');
      return;
    }
    const clamped = showDue
      ? clampDueParts(dueHour, dueMinute, currentMinutes())
      : null;
    const dueMinutes = clamped
      ? parseDueMinutes(clamped.hour, clamped.minute)
      : null;
    const nextItems = addTodo(
      items,
      draft,
      undefined,
      dueMinutes,
      dueMinutes === null ? null : currentMinutes()
    );
    if (nextItems === items) {
      return;
    }
    setItems(nextItems);
    setDraft('');
  };

  const ackAlarm = (id: string) => {
    setItems(current => markAlarmed(current, id));
  };

  const beginEdit = (id: string, text: string) => {
    skipEditSave.current = false;
    setEditingId(id);
    setEditDraft(text);
  };

  const cancelEdit = () => {
    skipEditSave.current = true;
    setEditingId(null);
  };

  const commitEdit = () => {
    if (skipEditSave.current) {
      skipEditSave.current = false;
      return;
    }
    if (editingId === null) {
      return;
    }
    const id = editingId;
    setItems(current => renameTodo(current, id, editDraft));
    setEditingId(null);
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
            ref={draftRef}
            value={draft}
            onChange={event => onDraftChange(event.target.value)}
            placeholder="오늘 끝낼 일 @시간 · 일정 #날짜"
          />
          <button className="app-button" type="submit">
            {showEvent ? '캘린더에 추가' : '추가'}
          </button>
        </div>
        {showEvent ? (
          <div className={styles.due}>
            <label>
              날짜
              <input
                type="date"
                min={todayIso(now)}
                value={eventDate}
                aria-label="일정 날짜"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setEventDate(event.target.value)
                }
              />
            </label>
            <label>
              시각
              <input
                type="time"
                value={eventTime}
                aria-label="일정 시각 (비우면 종일)"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setEventTime(event.target.value)
                }
              />
            </label>
          </div>
        ) : null}
        {showDue ? (
          <div className={styles.due}>
            <label>
              시
              <input
                type="number"
                min={hourMin}
                max={23}
                step={1}
                value={dueHour}
                aria-label="마감 시"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const next = readClockPart(event.target.value, 23);
                  if (next !== null) {
                    applyDuePart(next, dueMinute);
                  }
                }}
              />
            </label>
            <label>
              분
              <input
                type="number"
                min={minuteMin}
                max={59}
                step={1}
                value={dueMinute}
                aria-label="마감 분"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const next = readClockPart(event.target.value, 59);
                  if (next !== null) {
                    applyDuePart(dueHour, next);
                  }
                }}
              />
            </label>
          </div>
        ) : null}
      </form>
      {items.length === 0 ? (
        <p className={styles.empty}>할 일을 추가하면 여기에 쌓인다.</p>
      ) : (
        <ul className={styles.list} style={{fontSize: `${settings.shown.fontSize}px`}}>
          {items.map(item => {
            const due = item.dueMinutes;
            const ratio =
              due === null
                ? 0
                : dueProgress(item.startMinutes ?? 0, due, nowExact);
            const overdue = due !== null && !item.done && nowMinutes >= due;
            return (
              <li key={item.id}>
                <div className={styles.itemRow}>
                  <div className={styles.check}>
                    <input
                      type="checkbox"
                      aria-label={item.text}
                      checked={item.done}
                      onChange={() => setItems(current => toggleTodo(current, item.id))}
                    />
                    {editingId === item.id ? (
                      <input
                        className={styles.edit}
                        aria-label={`${item.text} 수정`}
                        value={editDraft}
                        autoFocus
                        onChange={event => setEditDraft(event.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={event => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            event.currentTarget.blur();
                          } else if (event.key === 'Escape') {
                            cancelEdit();
                          }
                        }}
                      />
                    ) : (
                      <span
                        className={item.done ? `${styles.label} ${styles.done}` : styles.label}
                        title={item.text}
                        onDoubleClick={() => beginEdit(item.id, item.text)}
                      >
                        {item.text}
                      </span>
                    )}
                    {due !== null ? (
                      <span className={styles.dueStamp}>{formatDueMinutes(due)}</span>
                    ) : null}
                  </div>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`${item.text} 삭제`}
                    onClick={() => setItems(current => removeTodo(current, item.id))}
                  >
                    <TrashIcon />
                  </button>
                </div>
                {due !== null ? (
                  <div
                    className={styles.track}
                    role="progressbar"
                    aria-label={`${item.text} 마감`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(ratio * 100)}
                  >
                    <span
                      className={styles.fill}
                      data-state={item.done ? 'done' : overdue ? 'over' : 'open'}
                      style={{width: `${ratio * 100}%`}}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <AlarmDialog
        items={ringing.map(item => ({
          id: item.id,
          message: item.text,
          detail:
            item.dueMinutes === null
              ? undefined
              : formatDueMinutes(item.dueMinutes)
        }))}
        onAck={ackAlarm}
      />
      {settings.isOpen ? (
        <SettingsModal title="할 일 설정" onSave={settings.save} onClose={settings.close}>
          <DisplaySettingsFields value={settings.draft} onChange={settings.setDraft} />
        </SettingsModal>
      ) : null}
    </div>
  );
}
