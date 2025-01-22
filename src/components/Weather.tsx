import React, { useState, useEffect } from 'react';
import styles from '../css/Weather.module.css';

interface WeatherItem {
  id: number;
  main: string;
  description?: string;
  icon?: string;
}
interface WeatherInfoMap {
  weather: WeatherItem[];
  main: {
    temp: number;
    feels_like?: number;
  };
  name: string;
}

function Weather() {
  const API_KEY = '5deab37ac2afff5af19c593f75eef9f1';
  const API_REFRESH_TIME = 60 * 60 * 1000;

  const [weatherInfo, setWeatherInfo] = useState<WeatherInfoMap | null>(null);

  const repeatObtainWeatherInfo = (position: any) => {
    onGeoOk(position);
    setInterval(onGeoOk, API_REFRESH_TIME, position);
  };
  const onGeoOk = (position: any) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    console.log(new Date());
    console.log('You live in ' + lat, lon);
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => setWeatherInfo(data));
  };
  const onGeoError = () => {
    alert('Error getCurrentPosition()');
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      repeatObtainWeatherInfo,
      onGeoError
    );
    console.log('Weather Repeat MSec : ' + API_REFRESH_TIME);
  }, []);

  useEffect(() => {
    if (weatherInfo) {
      console.log('WeatherInfo Changed');
      console.log(weatherInfo);
    }
  }, [weatherInfo]);

  return (
    <div className={styles.rootDiv}>
      <h3>{`🌡️${weatherInfo?.main.temp} `} @{weatherInfo?.name}</h3>
      <img
          src={`https://openweathermap.org/img/wn/${weatherInfo?.weather[0].icon}.png`}
        />
    </div>
  );
}

export default Weather;
