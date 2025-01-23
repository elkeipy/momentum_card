import React from "react";
import ReactDOM from "react-dom";

type PomodoroOptionModalPropsType = {
  children: React.ReactNode;
  onClose: () => void;
};

export default function PomodoroOptionModal({ children, onClose }: PomodoroOptionModalPropsType) {
  return ReactDOM.createPortal(
    <div className="w-full h-full fixed top-0 left-0 bg-black/20 flex justify-center items-center">
      <div className="bg-white p-[10px]">
        {children}
        <button className="bg-green-300 mt-[10px] p-[5px]" onClick={onClose}>
          Close
        </button>
      </div>
    </div>,
    document.body
  );
}