import React from "react";
import ReactDOM from "react-dom";
import styles from "../css/PomodoroOptionModal.module.css"

type PomodoroOptionModalPropsType = {
  children: React.ReactNode;
  onSave: () => void;
  onClose: () => void;
};

export default function PomodoroOptionModal({ children, onSave, onClose }: PomodoroOptionModalPropsType) {
  return ReactDOM.createPortal(
    <div className={styles.rootDiv}>
      <div className={styles.containerDiv}>
        {children}
        <div className={styles.buttonDiv}>
          <button className={styles.btn__primary} onClick={onSave}>
            Save
          </button>
          <button className={styles.btn__secondary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}