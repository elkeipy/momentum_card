import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import styles from '../css/Movie.module.css';

export interface MovieProps {
  id: number;
  title: string;
  year?: number;
  rating?: number;
  runtime?: number;
  summary?: string;
  genres?: string[];
  medium_cover_image?: string;
}
Movie.propsType = {
  id: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  year: PropTypes.number,
  rating: PropTypes.number,
  runtime: PropTypes.number,
  summary: PropTypes.string,
  genres: PropTypes.arrayOf(PropTypes.string),
  medium_cover_image: PropTypes.string,
};

function Movie(props: MovieProps) {
  return (
    <div className={styles.movie}>
      <img
        className={styles.movie__img}
        src={props.medium_cover_image}
        alt={props.title}
      />
      <div>
        <h2 className={styles.movie__title}>
          <Link to={`/detail/${props.id}`}>{props.title}</Link>
        </h2>
        <p>
          {props.summary && props.summary.length > 200
            ? `${props.summary.slice(0, 200)}...`
            : props.summary}
        </p>
        <p className={styles.movie__info}>Rating : {props.rating}</p>
        <p className={styles.movie__info}>Runtime : {props.runtime}(min)</p>
        <ul className={styles.movie__genres}>
          {props.genres?.map((genre) => (
            <li key={genre}>{genre}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Movie;
