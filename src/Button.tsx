import React from 'react';
import styled from './css/Button.module.css';

interface ButtonProps {
    text?: string;
}
function Button(props: ButtonProps) {
    return (
        <button className={styled.btn}>{props.text}</button>
    )
}

export default Button;