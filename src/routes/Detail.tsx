import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MovieProps } from '../components/Movie';

function Detail() {
  const [movie, setMovie] = useState<MovieProps>();
  const { id } = useParams();
  console.log(id);
  const getMovie = async () => {
    const json = await (
      await fetch(`https://yts.mx/api/v2/movie_details.json?movie_id=${id}`)
    ).json();
    setMovie(json.data.movie);
    console.log(json.data.movie);
  };
  useEffect(() => {
    getMovie();
  }, []);
  return <h1>Detail</h1>;
}

export default Detail;
