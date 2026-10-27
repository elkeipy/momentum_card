import React, {useEffect, useRef, useState, ChangeEvent} from 'react';
import PomodoroTimer, {TimerSettings} from '../PomodoroTimer';
import {
  readTimerTextSize,
  TIMER_TEXT_SIZE_MAX,
  TIMER_TEXT_SIZE_MIN,
  writeTimerTextSize
} from '../pomodoro/timerTextSize';
import styles from '../css/Pomodoro.module.css';
import PomodoroOptionModal from './PomodoroOptionModal';
import FocusHistory from './FocusHistory';

const LIMITS = {
  focusTime: {min: 1, max: 60},
  shortBreak: {min: 1, max: 30},
  longBreak: {min: 1, max: 30},
  longBreakInterval: {min: 1, max: 10},
  timerTextSize: {min: TIMER_TEXT_SIZE_MIN, max: TIMER_TEXT_SIZE_MAX}
} as const;

function readBoundedInteger(value: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }
  return parsed;
}

function updateSetting(
  min: number,
  max: number,
  apply: (value: number) => void
) {
  return (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = readBoundedInteger(event.target.value, min, max);
    if (nextValue !== null) {
      apply(nextValue);
    }
  };
}

type OptionFieldProps = {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  onValue: (value: number) => void;
};

function OptionField({id, label, min, max, value, onValue}: OptionFieldProps) {
  return (
    <div className={styles.optionDiv}>
      <label htmlFor={id} className={styles.optionLabel}>
        {label}
      </label>
      <input
        name={id}
        id={id}
        className={styles.optionValue}
        type="number"
        min={min}
        max={max}
        step="1"
        value={value}
        onChange={updateSetting(min, max, onValue)}
      />
    </div>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.4 13a7.8 7.8 0 0 0 .1-1 7.8 7.8 0 0 0-.1-1l2.1-1.6a.5.5 0 0 0 .1-.6l-2-3.5a.5.5 0 0 0-.6-.2l-2.5 1a7.4 7.4 0 0 0-1.7-1l-.4-2.6a.5.5 0 0 0-.5-.4h-4a.5.5 0 0 0-.5.4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.2l-2 3.5a.5.5 0 0 0 .1.6L4.6 11a7.8 7.8 0 0 0-.1 1 7.8 7.8 0 0 0 .1 1l-2.1 1.6a.5.5 0 0 0-.1.6l2 3.5a.5.5 0 0 0 .6.2l2.5-1a7.4 7.4 0 0 0 1.7 1l.4 2.6a.5.5 0 0 0 .5.4h4a.5.5 0 0 0 .5-.4l.4-2.6a7.4 7.4 0 0 0 1.7-1l2.5 1a.5.5 0 0 0 .6-.2l2-3.5a.5.5 0 0 0-.1-.6L19.4 13zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"
      />
    </svg>
  );
}

function Pomodoro() {
  const timerRef = useRef<PomodoroTimer | null>(null);
  const [timerText, setTimerText] = useState('25:00');
  const [currentStateText, setCurrentStateText] = useState('[Focus] #1');
  const [startStopButtonText, setStartStopButtonText] = useState('Start');
  const [timerTextColor, setTimerTextColor] = useState('var(--card-fg)');
  const [showTimerOption, setShowTimerOption] = useState(false);
  const [focusTime, setFocusTime] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [timerTextSize, setTimerTextSize] = useState(() => readTimerTextSize(localStorage));

  const openTimerOption = () => {
    setShowTimerOption(true);
  };
  const saveTimerOption = () => {
    const settings: TimerSettings = {
      focusTime,
      shortBreak,
      longBreak,
      longBreakInterval
    };
    timerRef.current?.saveLocalStorageSettings(settings);
    writeTimerTextSize(localStorage, timerTextSize);
    setShowTimerOption(false);
  };
  const closeTimerOption = () => {
    const settings = timerRef.current?.getSettings();
    if (settings) {
      setFocusTime(settings.focusTime);
      setShortBreak(settings.shortBreak);
      setLongBreak(settings.longBreak);
      setLongBreakInterval(settings.longBreakInterval);
    }
    setTimerTextSize(readTimerTextSize(localStorage));
    setShowTimerOption(false);
  };

  useEffect(() => {
    const timer = new PomodoroTimer({
      setTimerText,
      setCurrentStateText,
      setStartStopButtonText,
      setTimerTextColor
    });
    timerRef.current = timer;
    const settings = timer.getSettings();
    setFocusTime(settings.focusTime);
    setShortBreak(settings.shortBreak);
    setLongBreak(settings.longBreak);
    setLongBreakInterval(settings.longBreakInterval);

    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (event.altKey && event.code === 'KeyA') {
        event.preventDefault();
        timer.stopAudio();
      } else if (event.altKey && event.code === 'KeyS') {
        event.preventDefault();
        timer.startStop();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      timer.dispose();
      timerRef.current = null;
    };
  }, []);

  return (
    <div className={styles.rootDiv}>
      <div className={styles.roundedCardDiv}>
        <p
          className={`${styles.timer} num`}
          style={{color: timerTextColor, fontSize: `${timerTextSize}px`}}
        >
          {timerText}
        </p>
        <div className={styles.focusIndex}>
          <h3>{currentStateText}</h3>
          <button
            className="icon-button"
            type="button"
            onClick={openTimerOption}
            aria-label="타이머 설정"
          >
            <GearIcon />
          </button>
        </div>
        {showTimerOption && (
          <PomodoroOptionModal onSave={saveTimerOption} onClose={closeTimerOption}>
            <h2 className={styles.title}>구간 길이</h2>
            <OptionField
              id="focusTime"
              label="Focus Time"
              min={LIMITS.focusTime.min}
              max={LIMITS.focusTime.max}
              value={focusTime}
              onValue={setFocusTime}
            />
            <OptionField
              id="shortBreak"
              label="Short Break"
              min={LIMITS.shortBreak.min}
              max={LIMITS.shortBreak.max}
              value={shortBreak}
              onValue={setShortBreak}
            />
            <OptionField
              id="longBreak"
              label="Long Break"
              min={LIMITS.longBreak.min}
              max={LIMITS.longBreak.max}
              value={longBreak}
              onValue={setLongBreak}
            />
            <OptionField
              id="longBreakInterval"
              label="Long Break Interval"
              min={LIMITS.longBreakInterval.min}
              max={LIMITS.longBreakInterval.max}
              value={longBreakInterval}
              onValue={setLongBreakInterval}
            />
            <OptionField
              id="timerTextSize"
              label="Timer Text"
              min={LIMITS.timerTextSize.min}
              max={LIMITS.timerTextSize.max}
              value={timerTextSize}
              onValue={setTimerTextSize}
            />
          </PomodoroOptionModal>
        )}
        <div className={styles.timerButtonDiv}>
          <span>
            <button
              className="btn-primary"
              type="button"
              onClick={() => timerRef.current?.startStop()}
            >
              {startStopButtonText}
            </button>
          </span>
          <span>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => timerRef.current?.stopAudio()}
            >
              Stop Alarm
            </button>
          </span>
        </div>
        <FocusHistory />
      </div>
    </div>
  );
}

export default Pomodoro;
