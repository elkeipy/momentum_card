import React, { ChangeEvent } from 'react';
import ReactDOM from 'react-dom/client';
import './css/index.css';
import styles from './css/App.module.css';
import PropTypes from 'prop-types'

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
  //console.log(props.label + ' was rerendered');
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

function Hello() {
  React.useEffect(() => {
    console.log("Created 😊");
    return () => console.log("Destroyed 😭");
  }, []);

  const [value, setValue] = React.useState("Save Change");
  const changeValue = () => setValue("Revert Change");
  console.log("I run all the time");
  const iRunOnlyOnce = () => {
    console.log("I run only once");
  }
  React.useEffect(iRunOnlyOnce, []);

  return (
    <h1 className={styles.title}>Welcome back!!!</h1>
  );
}