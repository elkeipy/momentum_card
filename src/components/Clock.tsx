import React, { useState, useEffect } from 'react';
import styles from '../css/Clock.module.css';
import PomodoroOptionModal from './PomodoroOptionModal';

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
  const [showTimerOption, setShowTimerOption] = useState(false);

  const openTimerOption = () => {
    setShowTimerOption(true);
  };
  const closeTimerOption = () => {
    setShowTimerOption(false);
  };
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
        className="py-2 px-2"
        onClick={openTimerOption}
        >⚙️</button>
      </span>

      {showTimerOption && (
        <PomodoroOptionModal onClose={closeTimerOption}>
          <h2>Modal Content</h2>
          <p>This is a modal example using createPortal.</p>
        </PomodoroOptionModal>
      )}
    </div>
  );
}

export default Clock;
