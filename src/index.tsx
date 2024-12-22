import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/index.css';
import App from './App';
//import reportWebVitals from './reportWebVitals';
import PropTypes from 'prop-types'

import Button from './Button';

interface BtnProps {
  label: string;
  fontSize?: number;
  onClick?: () => void;
}

Btn.propsType = {
  label: PropTypes.string.isRequired,
  fontSize: PropTypes.number,
  onClick: PropTypes.func
};

function Btn(props: BtnProps) {
  console.log(props.label + ' was rerendered');
  return (
    <button style={{
      backgroundColor:"tomato",
      color: "white",
      padding: "20px 20px",
      border: 0,
      borderRadius: 10,
      fontSize: props.fontSize,
    }}
    onClick={props.onClick}>
      {props.label}
    </button>
  );
}

const MemorizedBtn = React.memo(Btn);

function TestApp() {
  const [value, setValue] = React.useState("Save Change");
  const changeValue = () => setValue("Revert Change");
  return (
    <div>
      <MemorizedBtn label={value} onClick={() => setValue("Revert Save Change")} fontSize={16} />
      <MemorizedBtn label={value} onClick={() => setValue("Revert Load Change")} />
      <Button text='Continue'></Button>
    </div>
  )
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(<TestApp/>);

//root.render(
//  <React.StrictMode>
//    <App />
//  </React.StrictMode>
//);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
