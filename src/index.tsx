import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/index.css';
import App from './App';
//import reportWebVitals from './reportWebVitals';

const Title = (
  <h3 id='title' onMouseDown={() => console.log('MouseDown')}>
    Hello React
  </h3>
);

const btn = (
  <button style={{backgroundColor: "tomato"}} onClick={() => console.log('Push Push Baby!')}>
    Push Me!
  </button>
)

const container = React.createElement('div', null, [Title, btn]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

function funcEnter() {
  console.log('Entering');
}

root.render(container);

//root.render(
//  <React.StrictMode>
//    <App />
//  </React.StrictMode>
//);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
