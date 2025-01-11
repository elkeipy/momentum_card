import React, { Component, useState } from 'react';
import logo from './asset/logo.svg';
import './css/App.css';
import { Button } from '@material-tailwind/react';
import DraggableResizeModal from './components/DraggableResizeModal.jsx';

function App() {
  const [open, setOpen] = useState(false);
  const [resizeOpen, setResizeOpen] = useState(false);

  const handleOpenToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(!open);
  };

  const handleOpenResizeToggle = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setResizeOpen(!resizeOpen);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <button color="blue" onClick={handleOpenToggle}>
          Open Draggable Modal
        </button>
        <button color="red" onClick={handleOpenResizeToggle}>
          Open Draggable(+resize) Modal
        </button>
        <DraggableResizeModal
          title={'모달 테스트1'}
          open={open}
          width={450}
          height={450}
          onClose={handleOpenToggle}
        >
          test1
        </DraggableResizeModal>
        <DraggableResizeModal
          title={'모달 테스트2'}
          open={resizeOpen}
          isResize={true}
          width={450}
          height={450}
          onClose={handleOpenResizeToggle}
        >
          test2
        </DraggableResizeModal>
      </header>
    </div>
  );
}

export default App;
