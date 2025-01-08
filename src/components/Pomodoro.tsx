import React, { useState } from 'react';
import { PomodoroTimer } from '../PomodoroTimer';

function Pomodoro() {
    const [startStopButtonText, setStartStopButtonText] = useState("");
    const pomodoroTimer = new PomodoroTimer();

    return (
        <div id="timer-div">
            <h1 id="timer">00:00</h1>
            <h3 id="focusIndex">#1</h3>
            <div>
                <span>
                    <button id="btnStart"
                        onClick={() => console.log("onClick")} >Start</button>
                </span>
                <span>
                    <button id="btnStopAudio">Stop Alarm</button>
                </span>
            </div>
        </div>
    )
}

export default Pomodoro;