import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/index.css';
import App from './App';
//import reportWebVitals from './reportWebVitals';

function TestApp() {
  const [counter, setCounter] = React.useState(0);
  const onClick = () => {
    setCounter(counter + 1);
    console.log(counter);
    //root.render(<TestApp/>);
  }
  
  return (
    <div>
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
