import React, { useState, useEffect } from "react"
import PropTypes from 'prop-types';

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
    mediumCoverImage: PropTypes.string,
}

function Movie(props: MovieProps) {
    return (
        <div>
            <img src={props.medium_cover_image} alt={props.title}/>
            <h2>{props.title}</h2>
            <p>{props.summary}</p>
            <p>Rating : {props.rating}</p>
            <p>Runtime : {props.runtime}(min)</p>
            {/* <ul>
                {Movies.genres.map(genre => <li key={genre}>{genre}</li>)}
            </ul> */}
            <hr/>
        </div>
    );
}

export default Movie;