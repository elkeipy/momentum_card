import React, { useState, ChangeEvent, useEffect } from 'react';
import { Button, Input, Typography } from '@mui/material';

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
function CoinListApp() {
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

export default CoinListApp