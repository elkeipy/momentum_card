import React, { useState, useEffect } from 'react';
import styles from '../css/Clock.module.css';

const ClockTypes = {
  HourType12: 1, // 12 Hour Clock
  HourType24: 2, // 24 Hour Clock
} as const;
type ClockTypes = (typeof ClockTypes)[keyof typeof ClockTypes];
// 사용예
//const hourType: ClockTypes = ClockTypes.HourType12;

function Clock() {
  const CLOCK_TIMEOUT = 1000;
  const [time, setTime] = useState('');
  const [hourType, setHourType] = useState<ClockTypes>(ClockTypes.HourType12);
  const getCurrentTime = () => {
    if (hourType === ClockTypes.HourType24) {
      const date = new Date();
      const hour = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const sec = String(date.getSeconds()).padStart(2, '0');
      setTime(`${hour}:${min}:${sec}`);
    } else {
      setTime(new Date().toLocaleTimeString());
    }
  };
  useEffect(() => {
    getCurrentTime();
    const intervalId = setInterval(getCurrentTime, CLOCK_TIMEOUT);
    return () => clearInterval(intervalId);
  }, []);
  return (
    <div className={styles.rootDiv}>
      <span>
        <h2 className={styles.time}>{time}</h2>
      </span>
      <span>
        <button
          id="btnTimerSettings"
          className="imgOnlyButton infiniteLotateAnimation"
        >
          ⚙️
        </button>
      </span>
    </div>
  );
}

export default Clock;
