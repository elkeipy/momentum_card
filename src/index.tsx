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

  const [amount, setAmount] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.value);
    setAmount(parseInt(event.target.value, 10));
  };
  const onFlip = () => {
    setAmount(0);
    setFlipped(current => !current);
  }
  
  return (
    <div>
      <h1>Time Converter</h1>
      <label htmlFor='minutes'>Minutes</label>
      <input value={flipped ? amount * 60 : amount} id='minutes' type="number" placeholder='Minutes' disabled={flipped}
        onChange={onChange}/>
      <h4>You want to convert {amount}</h4>
      <label htmlFor='hours'>Hours</label>
      <input value={flipped ? amount : amount / 60} id='hours' type="number" placeholder='Hours' disabled={!flipped}
        onChange={onChange}/>
      <button onClick={() => {setAmount(0)}}>Reset</button>
      <button onClick={onFlip}>Flip</button>
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
