import React, {useEffect, useState} from 'react';
import styles from '../css/Clock.module.css';

const CLOCK_TIMEOUT_MS = 1000;

function formatCurrentTime(): string {
  return new Date().toLocaleTimeString();
}

function Clock() {
  const [time, setTime] = useState(formatCurrentTime);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTime(formatCurrentTime());
    }, CLOCK_TIMEOUT_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className={styles.rootDiv}>
      <span>
        <h2 className={styles.time}>{time}</h2>
      </span>
    </div>
  );
}

export default Clock;
