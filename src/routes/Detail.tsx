import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MovieProps } from '../components/Movie';

function Detail() {
  const [movie, setMovie] = useState<MovieProps>();
  const { id } = useParams();

  const getMovie = async () => {
    if (!id) {
      return;
    }

    const response = await fetch(`https://yts.mx/api/v2/movie_details.json?movie_id=${id}`);
    if (!response.ok) {
      return;
    }

    const json = await response.json();
    setMovie(json.data.movie);
  };

  useEffect(() => {
    getMovie();
  }, [id]);

  return <h1>Detail</h1>;
}

export default Detail;
