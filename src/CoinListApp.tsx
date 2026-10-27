import React, {useEffect, useState} from 'react';
import {Typography} from '@mui/material';

interface Coin {
  id: string;
  name: string;
  symbol: string;
  quotes: {
    USD: {
      price: number;
    };
  };
}
const MAX_VISIBLE_COINS = 100;

function isCoin(value: unknown): value is Coin {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const coin = value as Coin;
  return (
    typeof coin.id === 'string' &&
    typeof coin.name === 'string' &&
    typeof coin.symbol === 'string' &&
    typeof coin.quotes?.USD?.price === 'number' &&
    Number.isFinite(coin.quotes.USD.price)
  );
}

function CoinListApp() {
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState<Coin[]>([]);
  useEffect(() => {
    let isActive = true;
    fetch('https://api.coinpaprika.com/v1/tickers')
      .then(response => (response.ok ? response.json() : []))
      .then((json: unknown) => {
        if (!isActive) {
          return;
        }
        const nextCoins = Array.isArray(json) ? json.filter(isCoin).slice(0, MAX_VISIBLE_COINS) : [];
        setCoins(nextCoins);
        setLoading(false);
      })
      .catch(() => {
        if (isActive) {
          setCoins([]);
          setLoading(false);
        }
      });
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div>
      {/* <Typography variant="h3" component="h3">My To Dos ({toDos.length})</Typography> */}
      {/* <Button onClick={onClickAddToDo} variant="contained" color="primary">Add to do</Button> */}
      <Typography variant="h3" component="h3">
        The Coins!({coins.length})
      </Typography>
      {loading ? <strong>Loading</strong> : null}
      <ul>
        {coins.map(coin => (
          <li key={coin.id}>
            {coin.name}({coin.symbol}) : {coin.quotes.USD.price}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CoinListApp;
