import React, { ChangeEvent } from 'react';

function MinutesToHours() {
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
      <label htmlFor='minutes'>Minutes</label>
      <input value={flipped ? amount * 60 : amount} id='minutes' type="number" placeholder='Minutes' 
        disabled={flipped}
        onChange={onChange}/>
      <h4>You want to convert {amount}</h4>
      <label htmlFor='hours'>Hours</label>
      <input value={flipped ? amount : amount / 60} id='hours' type="number" placeholder='Hours' 
        disabled={!flipped}
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

function KmToMiles() {
  const [distance, setDistance ] = React.useState(0);
  const [flipped, setFlipped] = React.useState(true);

  return (
    <div>
      <h3>Km to Miles</h3>
      <label>Km</label>
      <input disabled={!flipped} 
        placeholder='Km' type='number'
        value={!flipped ? distance * 0.62 : distance}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setDistance(parseInt(event.target.value))}>
      </input>
      <hr/>
      <label>Miles</label> 
      <input disabled={flipped}
        placeholder='Mile' type='number'
        value={flipped ? distance * 1.61 : distance}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setDistance(parseInt(event.target.value))}>
      </input>
      <button onClick={() => setDistance(0)}>Reset</button>
      <button onClick={() => setFlipped(!flipped)}>flip</button>
    </div>
  )
}

function ConvertApp() {
  const [index, setIndex] = React.useState<undefined | string>();
  const onSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    console.log(event);
    setIndex(event.target.value);
  }
  return (
    <div>
      <h1>Multi Converter</h1>
      <select value={index} onChange={onSelect}>
        <option value="0">Minutes & Hours</option>
        <option value="1">Km & Miles</option>
      </select>
      <hr/>
      {index === "0" ? <MinutesToHours/> : null}
      {index === "1" ? <KmToMiles/> : null}
    </div>
  )
}

export default ConvertApp