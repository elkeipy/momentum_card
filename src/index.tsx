import React, { ChangeEvent } from 'react';
import ReactDOM from 'react-dom/client';
import './css/index.css';
import App from './App';
//import reportWebVitals from './reportWebVitals';

function TestApp() {
  const [counter, setCounter] = React.useState(0);
  const onClick = () => {
    //setCounter(counter + 1);
    setCounter((current) => current! + 1);
    console.log(counter);
  };

  const [minutes, setMinutes] = React.useState(0);
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.value);
    setMinutes(parseInt(event.target.value, 10));
  };
  
  return (
    <div>
      <h1>Time Converter</h1>
      <label htmlFor='minutes'>Minutes</label>
      <input value={minutes} id='minutes' type="number" placeholder='Minutes' 
      onChange={onChange}/>
      <h4>You want to convert {minutes}</h4>
      <label htmlFor='hours'>Hours</label>
      <input value={minutes / 60} id='hours' type="number" placeholder='Hours' />
      <button onClick={() => {setMinutes(0)}}>Reset</button>
      <h3 id='title' onMouseDown={() => console.log('MouseDown')}>
        Total Click: {counter}
      </h3>
      <button onClick={onClick}>Click Click</button>
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
