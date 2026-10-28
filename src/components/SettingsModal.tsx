import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';
import styles from '../css/SettingsModal.module.css';

type SettingsModalProps = {
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  onClose: () => void;
};

export default function SettingsModal({
  title,
  children,
  onSave,
  onClose
}: SettingsModalProps) {
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
      <div className={styles.containerDiv} role="dialog" aria-modal="true" aria-label={title}>
        <h2 className={styles.title}>{title}</h2>
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
