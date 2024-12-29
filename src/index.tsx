import React, { useState, ChangeEvent, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
//import './css/index.css';
//import App from './App';
//import styles from './css/App.module.css';
//import reportWebVitals from './reportWebVitals';
import { Button, Input, Typography } from '@mui/material';
//import { Typography } from '@material-tailwind/react';

interface Coin {
  id: string;
  name: string;
  symbol: string;
  quotes: {
    USD: {
      price: number;
    }
  }
}
function TestApp() {
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState<Coin[]>([]);
  useEffect(() => {
    fetch("https://api.coinpaprika.com/v1/tickers")
      .then((response) => response.json())
      .then((json) => {
        console.log(json);
        setCoins(json);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* <Typography variant="h3" component="h3">My To Dos ({toDos.length})</Typography> */}
      {/* <Button onClick={onClickAddToDo} variant="contained" color="primary">Add to do</Button> */}
      <Typography variant="h3" component="h3">The Coins!({coins.length})</Typography>
      {loading ? <strong>Loading</strong> : null}
      <ul>
        {coins.map((coin, id) => <li key={id}>{coin.name}({coin.symbol}) : {coin.quotes.USD.price}</li>)}
      </ul>
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
