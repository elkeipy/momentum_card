import React, {useEffect, useRef, useState, ChangeEvent} from 'react';
import PomodoroTimer, {TimerSettings} from '../PomodoroTimer';
import styles from '../css/Pomodoro.module.css';
import PomodoroOptionModal from './PomodoroOptionModal';

const LIMITS = {
  focusTime: {min: 1, max: 60},
  shortBreak: {min: 1, max: 30},
  longBreak: {min: 1, max: 30},
  longBreakInterval: {min: 1, max: 10}
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

function Pomodoro() {
  const timerRef = useRef<PomodoroTimer | null>(null);
  const [timerText, setTimerText] = useState('25:00');
  const [currentStateText, setCurrentStateText] = useState('[Focus] #1');
  const [startStopButtonText, setStartStopButtonText] = useState('Start');
  const [timerTextColor, setTimerTextColor] = useState('black');
  const [showTimerOption, setShowTimerOption] = useState(false);
  const [focusTime, setFocusTime] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);

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

  const updateSetting =
    (min: number, max: number, apply: (value: number) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = readBoundedInteger(event.target.value, min, max);
      if (nextValue !== null) {
        apply(nextValue);
      }
    };

  return (
    <div className={styles.rootDiv}>
      <div className={styles.roundedCardDiv}>
        <h1 className={styles.timer} style={{color: timerTextColor}}>
          {timerText}
        </h1>
        <div className={styles.focusIndex}>
          <h3>{currentStateText}</h3>
          <button className={styles.hover_spin} type="button" onClick={openTimerOption}>
            ⚙️
          </button>
        </div>
        {showTimerOption && (
          <PomodoroOptionModal onSave={saveTimerOption} onClose={closeTimerOption}>
            <div>
              <h2 className={styles.title}>Timer Setting</h2>
            </div>
            <div className={styles.horizontalLine}></div>
            <div className={styles.optionDiv}>
              <label htmlFor="focusTime" className={styles.optionLabel}>
                Focus Time
              </label>
              <input
                name="focusTime"
                id="focusTime"
                className={styles.optionValue}
                type="number"
                min={LIMITS.focusTime.min}
                max={LIMITS.focusTime.max}
                step="1"
                value={focusTime}
                onChange={updateSetting(LIMITS.focusTime.min, LIMITS.focusTime.max, setFocusTime)}
              />
            </div>
            <div className={styles.optionDiv}>
              <label htmlFor="shortBreak" className={styles.optionLabel}>
                Short Break
              </label>
              <input
                name="shortBreak"
                id="shortBreak"
                className={styles.optionValue}
                type="number"
                min={LIMITS.shortBreak.min}
                max={LIMITS.shortBreak.max}
                step="1"
                value={shortBreak}
                onChange={updateSetting(LIMITS.shortBreak.min, LIMITS.shortBreak.max, setShortBreak)}
              />
            </div>
            <div className={styles.optionDiv}>
              <label htmlFor="longBreak" className={styles.optionLabel}>
                Long Break
              </label>
              <input
                name="longBreak"
                id="longBreak"
                className={styles.optionValue}
                type="number"
                min={LIMITS.longBreak.min}
                max={LIMITS.longBreak.max}
                step="1"
                value={longBreak}
                onChange={updateSetting(LIMITS.longBreak.min, LIMITS.longBreak.max, setLongBreak)}
              />
            </div>
            <div className={styles.optionDiv}>
              <label htmlFor="longBreakInterval" className={styles.optionLabel}>
                Long Break Interval
              </label>
              <input
                name="longBreakInterval"
                id="longBreakInterval"
                className={styles.optionValue}
                type="number"
                min={LIMITS.longBreakInterval.min}
                max={LIMITS.longBreakInterval.max}
                step="1"
                value={longBreakInterval}
                onChange={updateSetting(
                  LIMITS.longBreakInterval.min,
                  LIMITS.longBreakInterval.max,
                  setLongBreakInterval
                )}
              />
            </div>
          </PomodoroOptionModal>
        )}
        <div className={styles.timerButtonDiv}>
          <span>
            <button
              className={styles.btn__primary}
              type="button"
              onClick={() => timerRef.current?.startStop()}
            >
              {startStopButtonText}
            </button>
          </span>
          <span>
            <button
              className={styles.btn__secondary}
              type="button"
              onClick={() => timerRef.current?.stopAudio()}
            >
              Stop Alarm
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

export default Pomodoro;
