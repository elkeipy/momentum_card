import React, { ChangeEvent } from 'react';
import ReactDOM from 'react-dom/client';
import './css/index.css';
//import App from './App';
//import styles from './css/App.module.css';
import { Button, Input, Typography } from '@mui/material'

function ToDoList() {
  const [toDo, setToDo] = React.useState("");
  const [toDos, setToDos] = React.useState<string[]>([]);
  const onChange = (event: ChangeEvent<HTMLInputElement>) => setToDo(event.target.value)
  function addToDoList() {
    if (toDo === "") {
      return;
    }
  
    setToDos(current => [toDo, ...current]);
    setToDo("");
  }
  const onClickAddToDo = () => {
    addToDoList();
  };
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addToDoList();
  };

  console.log(toDos);

  return (
    <div>
      <Typography variant="h3" component="h3">My To Dos ({toDos.length})</Typography>
      <form onSubmit={onSubmit}>
        <Input onChange={onChange} value={toDo} type="text" placeholder="Write your todo..."/>
        <Button onClick={onClickAddToDo} variant="contained" color="primary">Add to do</Button>
        <hr/>
        <ul>
          {toDos.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      </form>
    </div>
  )
}

//root.render(
//  <React.StrictMode>
//    <App />
//  </React.StrictMode>
//);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
