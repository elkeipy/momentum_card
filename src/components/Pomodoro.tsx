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
    <div id="timer-div">
      <h1
        id="timer"
        className="text-3xl font-bold underline"
        style={{color: timerTextColor}}
      >
        {timerText}
      </h1>
      <h3 id="focusIndex">#{focusIndex}</h3>
      <div>
        <span>
          <button className={styles.btn__primary} onClick={() => pomodoroTimer?.startStop()}>
            {startStopButtonText}
          </button>
        </span>
        <span>
          <button className={styles.btn__secondary} onClick={() => pomodoroTimer?.stopAudio()}>
            Stop Alarm
          </button>
        </span>
      </div>
    </div>
  );
}

export default Pomodoro;
