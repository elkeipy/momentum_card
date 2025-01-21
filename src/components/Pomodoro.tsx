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
    <div className="flex justify-center items-center w-screen">
      <div id="timer-div" className="space-y-4 h-60 w-80 bg-slate-300 shadow-lg rounded-2xl">
        <h1
          id="timer"
          className="flex justify-center text-8xl font-semibold font-sans"
          style={{color: timerTextColor}}
        >
          {timerText}
        </h1>
        <h3 id="focusIndex" className="flex justify-center text-2xl font-mono">#{focusIndex}</h3>
        <div className="flex justify-center space-x-1">
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
