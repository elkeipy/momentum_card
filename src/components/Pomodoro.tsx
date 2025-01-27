import React, {useState, useEffect, ChangeEvent} from 'react';
import PomodoroTimer, { TimerSettings } from '../PomodoroTimer';
import styles from '../css/Pomodoro.module.css';
import PomodoroOptionModal from './PomodoroOptionModal';

function Pomodoro() {
  const [timerText, setTimerText] = useState('00:00');
  const [focusIndex, setFocusIndex] = useState(1);
  const [startStopButtonText, setStartStopButtonText] = useState('Start');
  const [pomodoroTimer, setPomodoroTimer] = useState<PomodoroTimer | null>(null);
  const [timerTextColor, setTimerTextColor] = useState('black');
  const [showTimerOption, setShowTimerOption] = useState(false);

  const [focusTime, setFocusTime] = useState(30);
  const [shortBreak, setShortBreak] = useState(10);
  const [longBreak, setLongBreak] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);

  const openTimerOption = () => {
    setShowTimerOption(true);
  };
  const saveTimerOption = () => {
    // 설정값 저장
    let settings: TimerSettings = { 
      focusTime: focusTime,
      shortBreak: shortBreak,
      longBreak: longBreak,
      longBreakInterval: longBreakInterval
    };
    pomodoroTimer?.saveLocalStorageSettings(settings);
    setShowTimerOption(false);
  };
  const closeTimerOption = () => {
    if (pomodoroTimer) {
      const settings: TimerSettings = pomodoroTimer.getSettings();
      setFocusTime(settings.focusTime);
      setShortBreak(settings.shortBreak);
      setLongBreak(settings.longBreak);
      setLongBreakInterval(settings.longBreakInterval);
    }
    setShowTimerOption(false);
  };
  useEffect(() => {
    if (!pomodoroTimer) {
      const pomodoroTimer = new PomodoroTimer({
        setTimerText,
        setFocusIndex,
        setStartStopButtonText,
        setTimerTextColor
      });
      setPomodoroTimer(pomodoroTimer);
      const settings: TimerSettings = pomodoroTimer.getSettings();
      setFocusTime(settings.focusTime);
      setShortBreak(settings.shortBreak);
      setLongBreak(settings.longBreak);
      setLongBreakInterval(settings.longBreakInterval);
    }
  }, [pomodoroTimer]);

  return (
    <div className={styles.rootDiv}>
      <div className={styles.roundedCardDiv}>
        <h1
          className={styles.timer}
          style={{color: timerTextColor}}
        >
          {timerText}
        </h1>
        <div className={styles.focusIndex}>
          <h3 >#{focusIndex}</h3>
          <button 
            className={styles.hover_spin}
            onClick={openTimerOption}
          >⚙️</button>
        </div>
        {showTimerOption && (
          <PomodoroOptionModal onSave={saveTimerOption} onClose={closeTimerOption}>
            <div>
              <h2 className={styles.title}>Timer Setting</h2>
            </div>
            <div className={styles.horizontalLine}></div>
            <div className={styles.optionDiv}>
              <label htmlFor="focusTime" className={styles.optionLabel}>Focus Time</label>
              <input name="focusTime" id="focusTime" className={styles.optionValue} 
                type="number" min="10" max="60" step="1" value={focusTime} 
                onChange={(e:ChangeEvent<HTMLInputElement>) => setFocusTime(parseInt(e.target.value))}/>
            </div>
            <div className={styles.optionDiv}>
              <label htmlFor="shortBreak" className={styles.optionLabel}>Short Break</label>
              <input name="shortBreak" id="shortBreak" className={styles.optionValue} 
                type="number" min="1" max="30" step="1" value={shortBreak} 
                onChange={(e:ChangeEvent<HTMLInputElement>) => setShortBreak(parseInt(e.target.value))}/>
            </div>
            <div className={styles.optionDiv}>
              <label htmlFor="longBreak" className={styles.optionLabel}>Long Break</label>
              <input name="longBreak" id="longBreak" className={styles.optionValue} 
                type="number" min="1" max="30" step="1" value={longBreak}
                onChange={(e:ChangeEvent<HTMLInputElement>) => setLongBreak(parseInt(e.target.value))}/>
            </div>
            <div className={styles.optionDiv}>
              <label htmlFor="longBreakInterval" className={styles.optionLabel}>Long Break Interval</label>
              <input name="longBreakInterval" id="longBreakInterval" className={styles.optionValue} 
                type="number" min="1" max="10" step="1" value={longBreakInterval}
                onChange={(e:ChangeEvent<HTMLInputElement>) => setLongBreakInterval(parseInt(e.target.value))}/>
            </div>
          </PomodoroOptionModal>
        )}
        <div className={styles.timerButtonDiv}>
          <span>
            <button
              className={styles.btn__primary}
              onClick={() => pomodoroTimer?.startStop()}
            >
              {startStopButtonText}
            </button>
          </span>
          <span>
            <button
              className={styles.btn__secondary}
              onClick={() => pomodoroTimer?.stopAudio()}
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
