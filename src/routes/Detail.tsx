import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MovieProps } from '../components/Movie';

function Detail() {
  const [movie, setMovie] = useState<MovieProps>();
  const { id } = useParams();

  useEffect(() => {
    const getMovie = async () => {
      if (!id || !/^\d+$/.test(id)) {
        return;
      }
      const response = await fetch(
        `https://yts.mx/api/v2/movie_details.json?movie_id=${id}`
      );
      if (!response.ok) {
        return;
      }
      const json: unknown = await response.json();
      if (!json || typeof json !== 'object' || !('data' in json)) {
        return;
      }
      const data = (json as {data?: {movie?: MovieProps}}).data;
      if (!data?.movie || typeof data.movie !== 'object') {
        return;
      }
      setMovie(data.movie);
    };
    void getMovie();
  }, [id]);

  const title = typeof movie?.title === 'string' ? movie.title : 'Detail';
  return <h1>{title}</h1>;
}

export default Detail;
