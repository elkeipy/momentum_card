import React, { useState, useEffect } from 'react';
import Movie, {MovieProps} from '../components/Movie';
//import { Button, Input, Typography } from '@mui/material';
import styles from '../css/Home.module.css';

function isMovie(value: unknown): value is MovieProps {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const movie = value as MovieProps;
  return typeof movie.id === 'number' && Number.isFinite(movie.id) && typeof movie.title === 'string';
}

function Home() {
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<MovieProps[]>([]);
  useEffect(() => {
    const getMovies = async () => {
      try {
        const response = await fetch(
          'https://yts.mx/api/v2/list_movies.json?minimum_rating=8.8&sort_by=rating'
        );
        if (!response.ok) {
          return;
        }
        const json: unknown = await response.json();
        const movies =
          json &&
          typeof json === 'object' &&
          'data' in json &&
          (json as {data?: {movies?: unknown}}).data?.movies;
        setMovies(Array.isArray(movies) ? movies.filter(isMovie) : []);
      } catch {
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };
    void getMovies();
  }, []);

  return (
    <div className={styles.container}>
      {loading ? (
        <div className={styles.loader}>
          <span>Loading...</span>
        </div>
      ) : (
        <div className={styles.movies}>
          {movies.map((movie) => (
            <Movie
              key={movie.id}
              medium_cover_image={movie.medium_cover_image}
              id={movie.id}
              title={movie.title}
              summary={movie.summary}
              rating={movie.rating}
              runtime={movie.runtime}
              genres={movie.genres}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
