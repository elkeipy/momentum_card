import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';
import styles from '../css/PomodoroOptionModal.module.css';

type PomodoroOptionModalPropsType = {
  children: React.ReactNode;
  onSave: () => void;
  onClose: () => void;
};

export default function PomodoroOptionModal({
  children,
  onSave,
  onClose
}: PomodoroOptionModalPropsType) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className={styles.rootDiv} role="presentation">
      <div className={styles.containerDiv} role="dialog" aria-modal="true" aria-label="Timer Setting">
        {children}
        <div className={styles.buttonDiv}>
          <button className="btn-primary" type="button" onClick={onSave}>
            Save
          </button>
          <button className="btn-secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
