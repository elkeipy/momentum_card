import React, {useEffect, useRef, useState} from 'react';
import PomodoroTimer, {CardTone, TimerSettings} from '../PomodoroTimer';
import {DEFAULT_PERIOD_COLORS} from '../pomodoro/periodColors';
import {useCardSettings} from '../featureCard/cardSettingsContext';
import {
  readTimerTextSize,
  TIMER_TEXT_SIZE_MAX,
  TIMER_TEXT_SIZE_MIN,
  writeTimerTextSize
} from '../pomodoro/timerTextSize';
import styles from '../css/Pomodoro.module.css';
import modalStyles from '../css/SettingsModal.module.css';
import FocusHistory from './FocusHistory';
import OptionField from './OptionField';
import SettingsModal from './SettingsModal';

const LIMITS = {
  focusTime: {min: 1, max: 60},
  shortBreak: {min: 1, max: 30},
  longBreak: {min: 1, max: 30},
  longBreakInterval: {min: 1, max: 10},
  timerTextSize: {min: TIMER_TEXT_SIZE_MIN, max: TIMER_TEXT_SIZE_MAX}
} as const;

function ColorField({
  id,
  label,
  value,
  onValue
}: {
  id: string;
  label: string;
  value: string;
  onValue: (value: string) => void;
}) {
  return (
    <div className={modalStyles.optionDiv}>
      <label htmlFor={id} className={modalStyles.optionLabel}>
        {label}
      </label>
      <input
        id={id}
        className={modalStyles.colorValue}
        type="color"
        value={value}
        onChange={event => onValue(event.target.value)}
      />
    </div>
  );
}

function Pomodoro() {
  const timerRef = useRef<PomodoroTimer | null>(null);
  const [timerText, setTimerText] = useState('25:00');
  const [currentStateText, setCurrentStateText] = useState('[Focus] #1');
  const [startStopButtonText, setStartStopButtonText] = useState('Start');
  const [timerTextColor, setTimerTextColor] = useState('var(--card-fg)');
  const [focusTime, setFocusTime] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [focusColor, setFocusColor] = useState<string>(DEFAULT_PERIOD_COLORS.focusColor);
  const [breakColor, setBreakColor] = useState<string>(DEFAULT_PERIOD_COLORS.breakColor);
  const [pauseColor, setPauseColor] = useState<string>(DEFAULT_PERIOD_COLORS.pauseColor);
  const [timerTextSize, setTimerTextSize] = useState(() => readTimerTextSize(localStorage));
  const [tone, setTone] = useState<CardTone>('focus');
  const [progress, setProgress] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const settingsUi = useCardSettings();

  const saveTimerOption = () => {
    const settings: TimerSettings = {
      focusTime,
      shortBreak,
      longBreak,
      longBreakInterval,
      focusColor,
      breakColor,
      pauseColor
    };
    timerRef.current?.saveLocalStorageSettings(settings);
    writeTimerTextSize(localStorage, timerTextSize);
    settingsUi.close();
  };
  const closeTimerOption = () => {
    const settings = timerRef.current?.getSettings();
    if (settings) {
      setFocusTime(settings.focusTime);
      setShortBreak(settings.shortBreak);
      setLongBreak(settings.longBreak);
      setLongBreakInterval(settings.longBreakInterval);
      setFocusColor(settings.focusColor);
      setBreakColor(settings.breakColor);
      setPauseColor(settings.pauseColor);
    }
    setTimerTextSize(readTimerTextSize(localStorage));
    settingsUi.close();
  };

  useEffect(() => {
    const timer = new PomodoroTimer({
      setTimerText,
      setCurrentStateText,
      setStartStopButtonText,
      setTimerTextColor,
      setCardTone: setTone,
      setTimerProgress: setProgress
    });
    timerRef.current = timer;
    const settings = timer.getSettings();
    setFocusTime(settings.focusTime);
    setShortBreak(settings.shortBreak);
    setLongBreak(settings.longBreak);
    setLongBreakInterval(settings.longBreakInterval);
    setFocusColor(settings.focusColor);
    setBreakColor(settings.breakColor);
    setPauseColor(settings.pauseColor);

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

  useEffect(() => {
    const card = rootRef.current?.closest('section');
    if (!(card instanceof HTMLElement)) {
      return;
    }
    card.dataset.tone = tone;
    return () => {
      delete card.dataset.tone;
    };
  }, [tone]);

  return (
    <div className={styles.rootDiv} ref={rootRef}>
      <div className={styles.roundedCardDiv}>
        <div className={styles.timerStack}>
          <p
            className={`${styles.timer} num`}
            style={{color: timerTextColor, fontSize: `${timerTextSize}px`}}
          >
            {timerText}
          </p>
          <div
            className={styles.track}
            role="progressbar"
            aria-label="구간 진행"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <span
              className={styles.fill}
              style={{
                width: `${Math.round(progress * 100)}%`,
                background: timerTextColor
              }}
            />
          </div>
        </div>
        <div className={styles.focusIndex}>
          <h3>{currentStateText}</h3>
        </div>
        {settingsUi.isOpen ? (
          <SettingsModal title="구간 길이" onSave={saveTimerOption} onClose={closeTimerOption}>
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
            <ColorField id="focusColor" label="Focus 색" value={focusColor} onValue={setFocusColor} />
            <ColorField id="breakColor" label="Break 색" value={breakColor} onValue={setBreakColor} />
            <ColorField id="pauseColor" label="Pause 색" value={pauseColor} onValue={setPauseColor} />
          </SettingsModal>
        ) : null}
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
