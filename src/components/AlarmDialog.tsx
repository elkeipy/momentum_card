import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';
import styles from '../css/SettingsModal.module.css';

type AlarmDialogProps = {
  title: string;
  message: string;
  detail?: string;
  onAck: () => void;
};

export default function AlarmDialog({title, message, detail, onAck}: AlarmDialogProps) {
  useEffect(() => {
    const audio = new Audio(`${process.env.PUBLIC_URL}/alarmSound.mp3`);
    try {
      const played = audio.play();
      if (played && typeof played.catch === 'function') {
        void played.catch(() => undefined);
      }
    } catch {
      // jsdom has no media playback
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        onAck();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // jsdom has no media playback
      }
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onAck]);

  return ReactDOM.createPortal(
    <div className={styles.rootDiv} role="presentation">
      <div
        className={styles.containerDiv}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby="todo-alarm-text"
      >
        <h2 className={styles.title}>{title}</h2>
        <p id="todo-alarm-text">{message}</p>
        {detail ? <p>{detail}</p> : null}
        <div className={styles.buttonDiv}>
          <button className="btn-primary" type="button" onClick={onAck}>
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
