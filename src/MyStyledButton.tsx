import React from 'react';
import PropTypes from 'prop-types';
import styles from './css/MyStyledButton.module.css';

interface MyStyledButtonProps {
  text?: string;
}
MyStyledButton.propTypes = {
  text: PropTypes.string.isRequired,
};
function MyStyledButton(props: MyStyledButtonProps) {
  return <button className={styles.btn}>{props.text}</button>;
}

export default MyStyledButton;
