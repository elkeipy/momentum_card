import React, {useState, useEffect} from 'react';
import PomodoroTimer from '../PomodoroTimer';
import styles from '../css/Pomodoro.module.css';

function Pomodoro() {
  const [timerText, setTimerText] = useState('00:00');
  const [focusIndex, setFocusIndex] = useState(1);
  const [startStopButtonText, setStartStopButtonText] = useState('Start');
  const [pomodoroTimer, setPomodoroTimer] = useState<PomodoroTimer | null>(null);
  const [timerTextColor, setTimerTextColor] = useState('black');
  useEffect(() => {
    if (!pomodoroTimer) {
      const pomodoroTimer = new PomodoroTimer({
        setTimerText,
        setFocusIndex,
        setStartStopButtonText,
        setTimerTextColor
      });
      setPomodoroTimer(pomodoroTimer);
      console.log('new pomodoroTimer');
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
        <h3 className={styles.focusIndex}>#{focusIndex}</h3>
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
