import React, { useState, useEffect } from "react"
import Movie, { MovieProps } from "./components/Movie";
//import { Button, Input, Typography } from '@mui/material';

function MovieApp() {
    const [loading, setLoading] = useState(true);
    const [movies, setMovies] = useState<MovieProps[]>([]);
    const getMovies = async() => {
        const json = await (
            await fetch('https://yts.mx/api/v2/list_movies.json?minimum_rating=8.8&sort_by=rating')
        ).json();
        setMovies(json.data.movies);
        setLoading(false);
    }
    useEffect(() => {
        getMovies();
    }, []);

    console.log(movies);
    
    return (
        <div>
            <h1>The Movies!({movies.length})</h1>
            {loading ? <h1>Loading...</h1> : null}
        
            {movies.map((movie) => (
                <Movie medium_cover_image={movie.medium_cover_image} 
                    id={movie.id} 
                    title={movie.title}
                    summary={movie.summary}
                    rating={movie.rating}
                    runtime={movie.runtime} />
            ))}
        </div>
    );
}

export default MovieApp;