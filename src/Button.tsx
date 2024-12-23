import React from 'react';
import PropTypes from 'prop-types';
import styles from './css/Button.module.css';

interface ButtonProps {
    text?: string;
}
Button.propTypes = {
    text: PropTypes.string.isRequired,
}
function Button(props: ButtonProps) {
    return (
        <button className={styles.btn}>{props.text}</button>
    )
}

export default Button;