import React, {useState, useEffect} from 'react';
import {PomodoroTimer} from '../PomodoroTimer';

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
      <h1 id="timer" style={{color: timerTextColor}}>{timerText}</h1>
      <h3 id="focusIndex">#{focusIndex}</h3>
      <div>
        <span>
          <button id="btnStart" onClick={() => pomodoroTimer?.startStop()}>
            {startStopButtonText}
          </button>
        </span>
        <span>
          <button id="btnStopAudio">Stop Alarm</button>
        </span>
      </div>
    </div>
  );
}

export default Pomodoro;
